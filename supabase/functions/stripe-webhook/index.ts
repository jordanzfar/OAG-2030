import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno";

// Inicializa Stripe con tu clave secreta. La leeremos de los "secretos" de Supabase.
const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY") as string, {
  apiVersion: "2022-11-15",
  httpClient: Stripe.createFetchHttpClient(),
});

// Inicializa el cliente de Supabase con permisos de administrador.
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let receivedEvent;
  try {
    // Verificación de seguridad: Asegura que la solicitud venga de Stripe.
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

  // Escuchamos el evento que se dispara cuando un pago se completa.
  if (receivedEvent.type === "checkout.session.completed") {
    const session = receivedEvent.data.object;
    
    // Necesitamos una forma de saber qué inspección pagar.
    // Asumiremos que el stock_number se pasa en los metadatos de la sesión de Stripe.
    const stockNumber = session.metadata?.stock_number;
    
    if (!stockNumber) {
      console.error("Error: 'stock_number' no encontrado en los metadatos de la sesión de Stripe.");
      return new Response("Metadatos no encontrados", { status: 400 });
    }

    try {
      // Buscamos la inspección más reciente con ese stock_number y estado 'pending_payment'.
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

      // Actualizamos el estado de la inspección a 'pending'.
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

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
});