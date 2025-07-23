import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    if (!user) {
        // Si no hay usuario, sí es un error de cliente.
        return new Response(JSON.stringify({ error: "Usuario no autenticado." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 });
    }
    const clientId = user.id;

    // Buscamos una conversación existente
    let { data: conversation } = await supabaseClient
      .from('chat_conversations')
      .select('agent_id, status, support_agents!agent_id(display_name)')
      .eq('client_id', clientId)
      .single();

    if (conversation && conversation.agent_id) {
      // Si ya tiene agente, devolvemos los datos.
      return new Response(JSON.stringify({
        status: 'agent_assigned',
        agent_id: conversation.agent_id,
        display_name: conversation.support_agents?.display_name || 'Soporte'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }
    
    // Si no hay conversación o no tiene agente, intentamos asignar uno.
    const { data: agentId, error: rpcError } = await supabaseClient.rpc('get_least_busy_agent');
    if (rpcError) throw new Error(`Error en RPC: ${rpcError.message}`);

    // ====================================================================
    // --- INICIO DE LA CORRECCIÓN ---
    // En lugar de lanzar un error si no hay agentes, devolvemos un estado específico.
    // ====================================================================
    if (!agentId) {
      return new Response(JSON.stringify({
        status: 'no_agents_available',
        message: 'No hay agentes de soporte disponibles en este momento.'
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Si encontramos un agente, lo asignamos (o actualizamos la conversación existente)
    const { data: upsertedConversation, error: upsertError } = await supabaseClient
      .from('chat_conversations')
      .upsert({ client_id: clientId, agent_id: agentId, status: 'pendiente' }, { onConflict: 'client_id' })
      .select('*, support_agents!agent_id(display_name)')
      .single();
      
    if (upsertError) throw new Error(`Error en upsert: ${upsertError.message}`);

    return new Response(JSON.stringify({
      status: 'agent_assigned',
      agent_id: upsertedConversation.agent_id,
      display_name: upsertedConversation.support_agents?.display_name || 'Soporte'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });

  } catch (error) {
    console.error('--- ERROR EN EL BLOQUE CATCH ---:', error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
  }
});
