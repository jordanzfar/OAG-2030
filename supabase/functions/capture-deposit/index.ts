// supabase/functions/capture-deposit/index.ts

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
    console.log("Función 'capture-deposit' invocada.");
    
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const authHeader = req.headers.get('Authorization')!
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user) throw new Error("Usuario no autenticado.");

    const { data: profile } = await supabaseAdmin.from('users_profile').select('role').eq('user_id', user.id).single()
    if (profile?.role !== 'admin') {
      throw new Error("Acceso no autorizado. Se requiere rol de administrador.");
    }
    
    const { payment_intent_id } = await req.json()
    if (!payment_intent_id) {
      throw new Error("Falta el 'payment_intent_id'.")
    }
    console.log(`Intentando capturar Payment Intent: ${payment_intent_id}`);

    await stripe.paymentIntents.capture(payment_intent_id)
    console.log("Payment Intent capturado en Stripe.");

    await supabaseAdmin
      .from('power_buying_requests')
      .update({ status: 'charged_for_debt' })
      .eq('payment_intent_id', payment_intent_id)
    console.log("Estado actualizado en la base de datos.");

    return new Response(JSON.stringify({ message: "Depósito capturado con éxito." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error("¡ERROR EN capture-deposit!", error); // <-- LÍNEA CLAVE AÑADIDA
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
