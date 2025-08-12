import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('User not found.');

    const { data: profile, error: profileError } = await supabaseClient
      .from('users_profile')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile.stripe_customer_id) throw new Error('No Stripe customer ID found for this user.');

    const { stripe_customer_id } = profile;

    // IMPORTANTE: Asegúrate de que esta URL coincida con la ruta a tu página de perfil.
    const returnUrl = `http://localhost:5173/dashboard/profile`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripe_customer_id,
      return_url: returnUrl,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
})