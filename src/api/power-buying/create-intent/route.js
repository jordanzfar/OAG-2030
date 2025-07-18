// Ruta: src/app/api/power-buying/create-intent/route.js
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

// Inicializar Stripe con tu clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export async function POST(req) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  try {
    // 1. OBTENER USUARIO Y DATOS DE LA SOLICITUD
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const user = session.user;

    const { amount: requestedPowerAmount } = await req.json();
    if (!requestedPowerAmount || requestedPowerAmount < 6000) {
      return new NextResponse(JSON.stringify({ error: 'Invalid amount provided.' }), { status: 400 });
    }
    
    // 2. CALCULAR DEPÓSITO DE FORMA SEGURA EN EL BACKEND
    const depositAmount = Math.round(requestedPowerAmount * 0.10); // 10% deposit
    const depositAmountInCents = depositAmount * 100;

    // 3. BUSCAR O CREAR CLIENTE DE STRIPE
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('stripe_customer_id')
      .eq('user_id', user.id) // <-- CORREGIDO
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 = 'No rows found'
        throw new Error(`Error fetching user profile: ${profileError.message}`);
    }

    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
        name: user.user_metadata.full_name || user.email,
      });
      stripeCustomerId = customer.id;

      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', user.id); // <-- CORREGIDO
      
      if (updateError) {
        throw new Error(`Failed to update user profile with Stripe customer ID: ${updateError.message}`);
      }
    }

    // 4. CREAR EL PAYMENT INTENT EN STRIPE
    const paymentIntent = await stripe.paymentIntents.create({
        amount: depositAmountInCents,
        currency: 'usd',
        customer: stripeCustomerId,
        capture_method: 'manual',
        metadata: {
            supabase_user_id: user.id,
            power_buying_amount: requestedPowerAmount,
        }
    });

    if (!paymentIntent.client_secret) {
        throw new Error('Failed to create Payment Intent.');
    }

    // 5. GUARDAR LA SOLICITUD EN TU TABLA DE SUPABASE
    const { error: insertError } = await supabase
        .from('power_buying_requests')
        .insert({
            user_id: user.id,
            amount: requestedPowerAmount,
            deposit: depositAmount,
            status: 'pending_payment',
            payment_intent_id: paymentIntent.id
        });

    if (insertError) {
        throw new Error(`Failed to create power buying request record: ${insertError.message}`);
    }

    // 6. DEVOLVER EL CLIENT SECRET AL FRONTEND
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Error creating Payment Intent:', error);
    const errorMessage = error.message ? error.message : 'Internal Server Error';
    return new NextResponse(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
}