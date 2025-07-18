// supabase/functions/cancel-deposit/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "https://esm.sh/stripe@15.8.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
  apiVersion: "2024-06-20",
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Autenticación y validación de admin
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) throw new Error("Usuario no autenticado.");

    const { data: profile } = await supabaseAdmin.from('users_profile').select('role').eq('user_id', user.id).single()
    if (profile?.role !== 'admin') throw new Error("Acceso no autorizado.");
    
    const { payment_intent_id } = await req.json()
    if (!payment_intent_id) throw new Error("Falta el 'payment_intent_id'.")

    // 2. Obtener la solicitud original para saber cuánto poder de compra restar
    const { data: request, error: requestError } = await supabaseAdmin
      .from('power_buying_requests')
      .select('user_id, amount')
      .eq('payment_intent_id', payment_intent_id)
      .single();
    
    if (requestError || !request) throw new Error("No se encontró la solicitud de compra original.");

    // 3. Cancelar o reembolsar en Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    let finalStatus = 'cancelled';

    if (paymentIntent.status === 'succeeded') {
      await stripe.refunds.create({ charge: paymentIntent.latest_charge });
      finalStatus = 'refunded';
    } else if (paymentIntent.status === 'requires_capture') {
      await stripe.paymentIntents.cancel(payment_intent_id);
    } else {
      throw new Error(`El pago no se puede cancelar/reembolsar porque su estado es '${paymentIntent.status}'.`);
    }

    // 4. Restar el poder de compra del perfil del usuario
    await supabaseAdmin.rpc('subtract_buying_power', {
      user_id_param: request.user_id,
      amount_to_subtract: request.amount
    });

    // 5. Actualizar el estado de la solicitud
    await supabaseAdmin
      .from('power_buying_requests')
      .update({ status: finalStatus })
      .eq('payment_intent_id', payment_intent_id)

    return new Response(JSON.stringify({ message: "Operación completada y poder de compra actualizado." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("¡ERROR EN cancel-deposit!", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
