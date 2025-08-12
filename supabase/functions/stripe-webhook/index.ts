import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@15.8.0";

// Utiliza el nombre de tu variable de entorno para la llave de Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
  apiVersion: "2024-06-20",
});

// Este "secreto" verifica que las llamadas vienen de Stripe
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!;

// Cliente de Supabase con permisos de administrador para saltarse RLS
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event;
  try {
    // Verifica que la solicitud es genuina y viene de Stripe
    event = await stripe.webhooks.constructEventAsync(body, signature!, stripeWebhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return new Response(err.message, { status: 400 });
  }

  console.log(`Stripe event received: ${event.type}`);

  try {
    // Procesa únicamente el evento cuando una sesión de pago se completa
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      
      // Busca el ID de la inspección en los metadatos
      const inspectionId = session.metadata?.inspection_id;
      
      if (inspectionId) {
        console.log(`Processing successful payment for inspection ID: ${inspectionId}`);
        
        // Actualiza el estado de la inspección a 'scheduled'
        const { error: updateError } = await supabaseAdmin
          .from("inspections")
          .update({ status: "scheduled" })
          .eq("id", inspectionId);

        if (updateError) {
          throw new Error(`Failed to update status for inspection ID ${inspectionId}: ${updateError.message}`);
        }
        console.log(`✅ Inspection ID ${inspectionId} updated to 'scheduled' successfully.`);
      } else {
        console.log("Event 'checkout.session.completed' received without 'inspection_id' in metadata. Ignoring.");
      }
    }
  } catch (error) {
    console.error("Error processing webhook event:", error.message);
    return new Response(error.message, { status: 500 });
  }

  // Responde a Stripe que todo salió bien
  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});