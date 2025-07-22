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
    if (!user) throw new Error("Usuario no autenticado.");
    const clientId = user.id;

    // Paso 1: Buscar si ya existe una conversación para este cliente.
    let { data: conversation } = await supabaseClient
      .from('chat_conversations')
      .select('agent_id, status, support_agents!agent_id(display_name)')
      .eq('client_id', clientId)
      .single();

    // Paso 2: Decidir qué hacer basado en la conversación encontrada.
    
    // CASO A: Ya existe una conversación.
    if (conversation) {
      // Si está solucionada, no hacemos nada, solo devolvemos los datos.
      if (conversation.status === 'solucionado') {
        return new Response(JSON.stringify({
          agent_id: conversation.agent_id,
          display_name: conversation.support_agents?.display_name || 'Soporte'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
      
      // Si está activa y con agente, tampoco hacemos nada.
      if (conversation.agent_id) {
         return new Response(JSON.stringify({
          agent_id: conversation.agent_id,
          display_name: conversation.support_agents?.display_name || 'Soporte'
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
      }
    }
    
    // CASO B: Es una conversación nueva o una existente sin agente asignado.
    // En este caso, procedemos a asignar el agente menos ocupado.
    const { data: agentId, error: rpcError } = await supabaseClient.rpc('get_least_busy_agent');
    if (rpcError) throw new Error(`Error en RPC: ${rpcError.message}`);
    if (!agentId) throw new Error("No hay agentes de soporte disponibles.");

    // Usamos UPSERT para crearla si no existe, o actualizarla si le faltaba el agente.
    const { data: upsertedConversation, error: upsertError } = await supabaseClient
      .from('chat_conversations')
      .upsert({ client_id: clientId, agent_id: agentId, status: 'pendiente' }, { onConflict: 'client_id' })
      .select('*, support_agents!agent_id(display_name)')
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