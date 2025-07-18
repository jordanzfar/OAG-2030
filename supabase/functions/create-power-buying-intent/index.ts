// Ruta: supabase/functions/create-power-buying-intent/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@15.8.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
  apiVersion: "2024-06-20",
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Función invocada. Procesando solicitud...");

    // 1. OBTENER TOKEN DE AUTORIZACIÓN
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) {
      throw new Error("Missing Authorization header!");
    }
    const token = authHeader.replace('Bearer ', '');
    console.log("Token recibido.");

    // 2. CREAR CLIENTE Y OBTENER USUARIO
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) throw userError;
    if (!user) throw new Error("User not found for the provided token.");
    console.log(`Usuario autenticado: ${user.id}`);
    
    // 3. OBTENER DATOS DEL BODY
    const { amount: requestedPowerAmount } = await req.json();
    if (!requestedPowerAmount || requestedPowerAmount < 6000) {
      throw new Error("Monto inválido proporcionado.");
    }
    console.log(`Monto solicitado: ${requestedPowerAmount}`);

    // El resto de la lógica (crear cliente de Stripe, PaymentIntent, etc.)
    // ... (esta parte ya debería funcionar)
    const depositAmount = Math.round(requestedPowerAmount * 0.10);
    const depositAmountInCents = depositAmount * 100;

    const { data: profile } = await supabaseAdmin.from('users_profile').select('stripe_customer_id').eq('user_id', user.id).single();
    let stripeCustomerId = profile?.stripe_customer_id;

    if (!stripeCustomerId) {
      console.log("Creando nuevo cliente de Stripe...");
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } });
      stripeCustomerId = customer.id;
      await supabaseAdmin.from('users_profile').update({ stripe_customer_id: stripeCustomerId }).eq('user_id', user.id);
    }
    console.log(`Cliente de Stripe ID: ${stripeCustomerId}`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmountInCents,
      currency: 'usd',
      customer: stripeCustomerId,
      capture_method: 'manual',
      metadata: { supabase_user_id: user.id, power_buying_amount: requestedPowerAmount }
    });
    console.log(`PaymentIntent creado: ${paymentIntent.id}`);

    await supabaseAdmin.from('power_buying_requests').insert({
      user_id: user.id,
      amount: requestedPowerAmount,
      deposit: depositAmount,
      status: 'pending_payment',
      payment_intent_id: paymentIntent.id
    });
    console.log("Registro guardado en la base de datos.");

    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("¡ERROR DENTRO DE LA FUNCIÓN!", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});

