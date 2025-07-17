import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useAdminQueries = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // --- FUNCIONES ORIGINALES (AHORA ESTABILIZADAS) ---

  const fetchAllRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userProfiles, error: userError } = await supabase
        .from('users_profile')
        .select('user_id, full_name, email');
      if (userError) throw userError;

      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.user_id, profile);
      });

      const { data: inspections, error: inspError } = await supabase.from('inspections').select('*').order('created_at', { ascending: false });
      const { data: legalizations, error: legalError } = await supabase.from('legalizations').select('*').order('created_at', { ascending: false });
      const { data: powerBuying, error: powerError } = await supabase.from('power_buying_requests').select('*').order('created_at', { ascending: false });
      const { data: vinChecks, error: vinError } = await supabase.from('vin_check_logs').select('*').order('created_at', { ascending: false });

      if (inspError || legalError || powerError || vinError) {
        console.error('Fetch errors:', { inspError, legalError, powerError, vinError });
        throw new Error('Error al obtener las solicitudes');
      }

      const allRequests = [
        ...(inspections || []).map(item => ({ ...item, type: 'inspection', client_name: userMap.get(item.user_id)?.full_name || 'N/A', client_email: userMap.get(item.user_id)?.email || 'N/A' })),
        ...(legalizations || []).map(item => ({ ...item, type: 'legalization', client_name: userMap.get(item.user_id)?.full_name || 'N/A', client_email: userMap.get(item.user_id)?.email || 'N/A' })),
        ...(powerBuying || []).map(item => ({ ...item, type: 'power_buying', client_name: userMap.get(item.user_id)?.full_name || 'N/A', client_email: userMap.get(item.user_id)?.email || 'N/A' })),
        ...(vinChecks || []).map(item => ({ ...item, type: 'vin_check', client_name: userMap.get(item.user_id)?.full_name || 'N/A', client_email: userMap.get(item.user_id)?.email || 'N/A' }))
      ];

      allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { success: true, data: allRequests };
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({ variant: "destructive", title: "Error al cargar solicitudes", description: error.message });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAllDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userProfiles, error: userError } = await supabase.from('users_profile').select('user_id, full_name, email');
      if (userError) throw userError;

      const userMap = new Map();
      (userProfiles || []).forEach(profile => userMap.set(profile.user_id, profile));

      const { data: documents, error: docError } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
      if (docError) throw docError;

      const documentsWithClient = (documents || []).map(doc => ({ ...doc, client_name: userMap.get(doc.user_id)?.full_name || 'N/A', client_email: userMap.get(doc.user_id)?.email || 'N/A' }));
      return { success: true, data: documentsWithClient };
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({ variant: "destructive", title: "Error al cargar documentos", description: error.message });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAllDeposits = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userProfiles, error: userError } = await supabase.from('users_profile').select('user_id, full_name, email');
      if (userError) throw userError;

      const userMap = new Map();
      (userProfiles || []).forEach(profile => userMap.set(profile.user_id, profile));

      const { data: deposits, error: depositError } = await supabase.from('deposits').select('*').order('created_at', { ascending: false });
      if (depositError) throw depositError;

      const depositsWithClient = (deposits || []).map(deposit => ({ ...deposit, client_name: userMap.get(deposit.user_id)?.full_name || 'N/A', client_email: userMap.get(deposit.user_id)?.email || 'N/A' }));
      return { success: true, data: depositsWithClient };
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({ variant: "destructive", title: "Error al cargar depósitos", description: error.message });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchChatMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userProfiles, error: userError } = await supabase.from('users_profile').select('user_id, full_name, email');
      if (userError) throw userError;

      const userMap = new Map();
      (userProfiles || []).forEach(profile => userMap.set(profile.user_id, profile));

      const { data: messages, error: messageError } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false });
      if (messageError) throw messageError;

      const messagesWithUsers = (messages || []).map(message => ({
        ...message,
        sender: { full_name: userMap.get(message.sender_id)?.full_name || 'N/A', email: userMap.get(message.sender_id)?.email || 'N/A' },
        receiver: { full_name: userMap.get(message.receiver_id)?.full_name || 'N/A', email: userMap.get(message.receiver_id)?.email || 'N/A' }
      }));
      return { success: true, data: messagesWithUsers };
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      toast({ variant: "destructive", title: "Error al cargar mensajes", description: error.message });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // --- NUEVAS FUNCIONES PARA LA GESTIÓN DE LEGALIZACIONES ---

  const fetchAllLegalizations = useCallback(async (filters = {}) => {
  setLoading(true);
  try {
    // Pasa los filtros a la función RPC. Si un filtro no se define, Supabase lo trata como NULL.
    const { data, error } = await supabase.rpc('get_all_legalizations', {
      p_status: filters.status || null,
      p_start_date: filters.startDate || null,
      p_end_date: filters.endDate || null
    });
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching all legalizations via RPC:', error);
    toast({ variant: "destructive", title: "Error al cargar legalizaciones", description: error.message });
    return { success: false, error: error.message };
  } finally {
    setLoading(false);
  }
}, [toast]);

  const getDocumentsForLegalization = useCallback(async (legalizationId) => {
    if (!legalizationId) return { success: false, data: null, error: 'No ID provided' };
    
    setLoading(true);
    try {
      const { data, error } = await supabase.from('documents').select('*').eq('legalization_id', legalizationId);
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({ variant: "destructive", title: "Error al cargar documentos", description: error.message });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getDocumentDownloadUrl = useCallback(async (filePath) => {
    try {
      const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60 * 5);
      if (error) throw error;
      return { success: true, url: data.signedUrl };
    } catch (error) {
      console.error('Error creating signed URL:', error);
      toast({ variant: "destructive", title: "Error al generar link de descarga", description: error.message });
      return { success: false, url: null };
    }
  }, [toast]);

  return {
    loading,
    fetchAllRequests,
    fetchAllDocuments,
    fetchAllDeposits,
    fetchChatMessages,
    fetchAllLegalizations,
    getDocumentsForLegalization,
    getDocumentDownloadUrl,
  };
};