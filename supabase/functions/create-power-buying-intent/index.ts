// Ruta: supabase/functions/create-power-buying-intent/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@15.8.0";

// Define las cabeceras CORS para permitir solicitudes desde cualquier origen.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Inicializa el cliente de Stripe con la clave secreta desde las variables de entorno.
const stripe = new Stripe(Deno.env.get("STRIPE_API_KEY")!, {
  apiVersion: "2024-06-20",
});

// Inicia el servidor de la función.
serve(async (req) => {
  // Maneja la solicitud pre-vuelo (preflight) de CORS.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Función invocada. Procesando solicitud...");

    // 1. OBTENER TOKEN DE AUTORIZACIÓN Y VERIFICARLO
    const authHeader = req.headers.get('Authorization')!;
    if (!authHeader) {
      throw new Error("Missing Authorization header!");
    }
    const token = authHeader.replace('Bearer ', '');
    console.log("Token de autorización recibido.");

    // 2. CREAR CLIENTE ADMIN DE SUPABASE Y OBTENER USUARIO
    // Se usa la SERVICE_ROLE_KEY para tener permisos de administrador.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) throw userError;
    if (!user) throw new Error("User not found for the provided token.");
    console.log(`Usuario autenticado con éxito: ${user.id}`);
    
    // 3. OBTENER DATOS DEL BODY DE LA SOLICITUD
    const { amount: requestedPowerAmount } = await req.json();
    if (!requestedPowerAmount || requestedPowerAmount < 6000) {
      throw new Error("Monto inválido proporcionado. El mínimo es 6000.");
    }
    console.log(`Monto de poder de compra solicitado: ${requestedPowerAmount}`);

    // 4. LÓGICA DE STRIPE Y BASE DE DATOS
    const depositAmount = Math.round(requestedPowerAmount * 0.10);
    const depositAmountInCents = depositAmount * 100;

    // Busca si el usuario ya tiene un ID de cliente de Stripe.
    const { data: profile } = await supabaseAdmin.from('users_profile').select('stripe_customer_id').eq('user_id', user.id).single();
    let stripeCustomerId = profile?.stripe_customer_id;

    // Si no existe, crea uno nuevo en Stripe y lo guarda en el perfil del usuario.
    if (!stripeCustomerId) {
      console.log("Cliente de Stripe no encontrado. Creando uno nuevo...");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id }
      });
      stripeCustomerId = customer.id;
      await supabaseAdmin.from('users_profile').update({ stripe_customer_id: stripeCustomerId }).eq('user_id', user.id);
      console.log(`Nuevo cliente de Stripe creado y guardado: ${stripeCustomerId}`);
    } else {
      console.log(`Cliente de Stripe encontrado: ${stripeCustomerId}`);
    }

    // Crea la Intención de Pago (PaymentIntent) en Stripe.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmountInCents,
      currency: 'usd',
      customer: stripeCustomerId,
      capture_method: 'manual', // Solo autoriza el monto, no lo cobra.
      metadata: {
        supabase_user_id: user.id,
        power_buying_amount: requestedPowerAmount
      }
    });
    console.log(`PaymentIntent creado en Stripe: ${paymentIntent.id}`);

    // 5. GUARDAR EL REGISTRO EN LA BASE DE DATOS (PUNTO CRÍTICO DE DEPURACIÓN)
    const insertData = {
      user_id: user.id,
      amount: requestedPowerAmount,
      deposit: depositAmount,
      status: 'pending_payment',
      payment_intent_id: paymentIntent.id
    };

    console.log("Intentando insertar el siguiente objeto en 'power_buying_requests':", JSON.stringify(insertData, null, 2));

    const { error: dbError } = await supabaseAdmin.from('power_buying_requests').insert(insertData);

    // Si hay un error al insertar, lo capturamos y lo lanzamos para que se muestre en los logs.
    if (dbError) {
      console.error('¡ERROR AL INSERTAR EN LA BASE DE DATOS!', dbError);
      throw new Error(`Error en la base deatos: ${dbError.message} (Hint: ${dbError.hint})`);
    }

    console.log("Registro guardado en 'power_buying_requests' con éxito.");

    // 6. DEVOLVER RESPUESTA AL CLIENTE
    return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    // Captura cualquier error que ocurra en el proceso y lo muestra en los logs.
    console.error("¡ERROR FATAL DENTRO DE LA FUNCIÓN!", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});