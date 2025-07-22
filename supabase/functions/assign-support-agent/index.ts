import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Usuario no autenticado.");
    const clientId = user.id;

    const { data: existingConv } = await supabaseClient
      .from('chat_conversations')
      .select('agent_id, status, support_agents(display_name)')
      .eq('client_id', clientId)
      .maybeSingle();

    if (existingConv && existingConv.agent_id && ['pendiente', 'en revisión'].includes(existingConv.status)) {
      return new Response(JSON.stringify({
        agent_id: existingConv.agent_id,
        display_name: existingConv.support_agents?.display_name || 'Soporte'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    const { data: agentId, error: rpcError } = await supabaseClient.rpc('get_least_busy_agent');
    if (rpcError) throw new Error(`Error en RPC: ${rpcError.message}`);
    if (!agentId) throw new Error("No hay agentes de soporte disponibles.");

    // --- CAMBIO CLAVE: Usamos UPSERT en lugar de INSERT ---
    // Intenta insertar. Si ya existe un registro con ese 'client_id', lo actualiza.
    const { data: upsertedConversation, error: upsertError } = await supabaseClient
      .from('chat_conversations')
      .upsert({
        client_id: clientId, // La columna que causa el conflicto
        agent_id: agentId,   // El valor a actualizar/insertar
        status: 'pendiente'  // El valor a actualizar/insertar
      }, {
        onConflict: 'client_id' // Le decimos a Supabase qué columna monitorear para conflictos
      })
      .select('*, support_agents(display_name)')
      .single();

    if (upsertError) throw new Error(`Error en upsert: ${upsertError.message}`);

    return new Response(JSON.stringify({
      agent_id: upsertedConversation.agent_id,
      display_name: upsertedConversation.support_agents?.display_name || 'Soporte'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('--- ERROR EN EL BLOQUE CATCH ---:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
  }
});