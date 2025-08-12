
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

// Nota: Asegúrate de que estos sean los IDs de PRECIO ('price_...'), no de producto.
const planPriceIds = {
 explorador: 'price_1Rv2s02LjLpO3yFTiJ3f767s', // Pega aquí el ID de PRECIO del plan Explorador
  comercial: 'price_1Rv2sh2LjLpO3yFT4NkYlRvq',   // Pega aquí el ID de PRECIO del plan Comercial
  socio_pro: 'price_1Rv2sx2LjLpO3yFTQijgwe8E',     // Pega aquí el ID de PRECIO del plan Socio PRO
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { planId, successUrl, cancelUrl } = await req.json()

    // Validaciones iniciales
    if (!planId || !successUrl || !cancelUrl) {
      throw new Error('planId, successUrl, and cancelUrl are required.')
    }
    const priceId = planPriceIds[planId]
    if (!priceId || priceId.includes('_REEMPLAZAR')) {
      throw new Error(`The plan '${planId}' does not have a valid Stripe Price ID configured.`)
    }
    
    // Crear el cliente de Supabase para actuar en nombre del usuario
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not found.' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }})
    }
    
    // --- LA CORRECCIÓN CLAVE ESTÁ AQUÍ ---
    // QUÉ CAMBIÓ: Buscamos en 'user_id' en lugar de 'id'.
    // POR QUÉ: Para que la búsqueda en el servidor coincida con la búsqueda en el cliente y la estructura de tu BD.
    const { data: profile, error: profileError } = await supabaseClient
      .from('users_profile')
      .select('stripe_customer_id')
      .eq('user_id', user.id) // <-- ¡LA CORRECCIÓN!
      .single()

    if (profileError) throw profileError;

    let stripeCustomerId = profile.stripe_customer_id

    // Si el cliente de Stripe no existe, se crea uno nuevo.
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      stripeCustomerId = customer.id

      // Actualizamos el perfil del usuario con el nuevo ID de cliente de Stripe
      await supabaseClient
        .from('users_profile')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('user_id', user.id) // <-- También corregido aquí para consistencia
    }

    // Crear la sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    return new Response(JSON.stringify({ checkoutUrl: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error("Error in create-checkout-session:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})