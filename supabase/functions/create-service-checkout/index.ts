import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const servicePriceMapping = {
  'inspection': {
    'explorador': 'price_1Rv6q82LjLpO3yFT17fD4FEW',
    'comercial': 'price_1Rv6qa2LjLpO3yFTwoZYNrQQ',
    'socio_pro': 'price_1Rv6qa2LjLpO3yFTwxBvemJE',
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { serviceId, successUrl, cancelUrl, inspectionId } = await req.json();
    if (!serviceId || !successUrl || !cancelUrl || !inspectionId) {
      throw new Error("Faltan parámetros requeridos: serviceId, successUrl, cancelUrl, inspectionId.");
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Usuario no encontrado.');

    const { data: profile, error: profileError } = await supabaseClient
      .from('users_profile')
      .select('membership_plan, stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;

    let stripeCustomerId = profile.stripe_customer_id;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
      await supabaseClient
        .from('users_profile')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', user.id);
    }

    const userPlan = profile.membership_plan || 'free';
    const priceId = servicePriceMapping[serviceId]?.[userPlan];

    if (!priceId) {
      throw new Error(`Precio no configurado para el servicio '${serviceId}' en el plan '${userPlan}'.`);
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // ESTA ES LA PARTE QUE NO ESTABA FUNCIONANDO CORRECTAMENTE ANTES
      metadata: {
        inspection_id: inspectionId,
      },
    });

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in create-service-checkout:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})