import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@15.8.0";

const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") as string, {
  apiVersion: "2024-06-20",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let receivedEvent;
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!
    );
  } catch (err) {
    console.error("Error en la verificación del webhook:", err.message);
    return new Response(err.message, { status: 400 });
  }

  console.log(`Evento de Stripe recibido: ${receivedEvent.type}`);

  // ===================================================================
  // --- LÓGICA EXISTENTE PARA INSPECCIONES (SIN CAMBIOS) ---
  // ===================================================================
  if (receivedEvent.type === "checkout.session.completed") {
    const session = receivedEvent.data.object;
    const stockNumber = session.metadata?.stock_number;
    
    if (!stockNumber) {
      console.error("Error: 'stock_number' no encontrado en los metadatos de la sesión de Stripe.");
      return new Response("Metadatos no encontrados", { status: 400 });
    }

    try {
      const { data: inspection, error: queryError } = await supabaseAdmin
        .from("inspections")
        .select("id")
        .eq("stock_number", stockNumber)
        .eq("status", "pending_payment")
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (queryError || !inspection) {
        throw new Error(`Inspección no encontrada para stock# ${stockNumber} con pago pendiente.`);
      }

      const { error: updateError } = await supabaseAdmin
        .from("inspections")
        .update({ status: "pending" })
        .eq("id", inspection.id);

      if (updateError) {
        throw new Error(`Fallo al actualizar el estado de la inspección: ${updateError.message}`);
      }

      console.log(`Inspección ID ${inspection.id} actualizada a 'pending' exitosamente.`);

    } catch (error) {
      console.error(error.message);
      return new Response(error.message, { status: 500 });
    }
  } 
  // ===================================================================
  // --- LÓGICA PARA POWER BUYING (CON DEPURACIÓN AÑADIDA) ---
  // ===================================================================
  else if (receivedEvent.type === "payment_intent.succeeded") {
    const paymentIntent = receivedEvent.data.object;
    
    try {
      // ================== INICIO DEL CÓDIGO DE DEPURACIÓN ==================
      console.log("--- INICIO DEPURACIÓN ---");
      console.log(`Buscando el Payment Intent específico: ${paymentIntent.id}`);
      
      const { data: allRequests, error: allError } = await supabaseAdmin
        .from('power_buying_requests')
        .select('*'); // Leemos TODA la tabla sin filtros

      if (allError) {
          console.error("Error al intentar leer TODOS los registros:", allError.message);
      } else {
          console.log(`Se encontraron ${allRequests.length} registros en total en la tabla.`);
          console.log("Contenido de la tabla:", JSON.stringify(allRequests, null, 2));
      }
      console.log("--- FIN DEPURACIÓN ---");
      // =================== FIN DEL CÓDIGO DE DEPURACIÓN ===================

      const { data: request, error: findError } = await supabaseAdmin
        .from('power_buying_requests')
        .select('id, user_id, amount, status')
        .eq('payment_intent_id', paymentIntent.id)
        .single();

      if (findError || !request) {
        console.log(`(Resultado de la lógica original) PaymentIntent ${paymentIntent.id} no corresponde a una solicitud.`);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }
      
      if (request.status === 'approved') {
        console.log(`La solicitud para PaymentIntent ${paymentIntent.id} ya fue aprobada.`);
        return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
      }

      const { error: updateError } = await supabaseAdmin
        .from('power_buying_requests')
        .update({ status: 'approved' })
        .eq('id', request.id);

      if (updateError) {
        throw new Error(`Fallo al actualizar estado para request ID ${request.id}: ${updateError.message}`);
      }

      const { error: rpcError } = await supabaseAdmin.rpc('increment_buying_power', {
        user_id_param: request.user_id,
        amount_to_add: request.amount
      });

      if (rpcError) {
        throw new Error(`Fallo al llamar RPC para user ID ${request.user_id}: ${rpcError.message}`);
      }

      console.log(`✅ Power Buying aprobado para user ${request.user_id}. Monto: ${request.amount}`);

    } catch(error) {
      console.error("Error procesando 'payment_intent.succeeded' para Power Buying:", error.message);
      return new Response(error.message, { status: 500 });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});