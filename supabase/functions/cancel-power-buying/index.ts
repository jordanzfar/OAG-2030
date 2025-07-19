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
    // 1. AUTENTICAR AL USUARIO
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError) throw userError;
    if (!user) throw new Error("User not found for the provided token.");

    // 2. OBTENER EL ID DE LA SOLICITUD DEL BODY
    const { request_id } = await req.json();
    if (!request_id) {
      throw new Error("Se requiere el ID de la solicitud (request_id).");
    }

    // 3. BUSCAR LA SOLICITUD Y VERIFICAR PERTENENCIA Y ESTADO
    const { data: request, error: findError } = await supabaseAdmin
      .from('power_buying_requests')
      .select('id, user_id, status, payment_intent_id')
      .eq('id', request_id)
      .eq('user_id', user.id) // ¡Seguridad! Solo el dueño puede cancelar.
      .single();

    if (findError) throw new Error("Solicitud no encontrada o no te pertenece.");
    if (request.status !== 'pending_payment') {
      throw new Error("Esta solicitud no se puede cancelar porque no está pendiente de pago.");
    }

    // 4. CANCELAR EL PAYMENT INTENT EN STRIPE
    await stripe.paymentIntents.cancel(request.payment_intent_id);

    // 5. ACTUALIZAR EL ESTADO EN SUPABASE
    const { data: updatedRequest, error: updateError } = await supabaseAdmin
      .from('power_buying_requests')
      .update({ status: 'cancelled' })
      .eq('id', request.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, cancelledRequest: updatedRequest }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error al cancelar la solicitud:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});