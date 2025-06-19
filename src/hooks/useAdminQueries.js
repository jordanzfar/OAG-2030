import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useAdminQueries = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all requests with user details using separate queries
  const fetchAllRequests = async () => {
    setLoading(true);
    try {
      // Fetch all user profiles first
      const { data: userProfiles, error: userError } = await supabase
        .from('users_profile')
        .select('user_id, full_name, email');

      if (userError) {
        console.error('Error fetching user profiles:', userError);
        throw userError;
      }

      // Create a map for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.user_id, profile);
      });

      // Fetch inspections
      const { data: inspections, error: inspError } = await supabase
        .from('inspections')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch legalizations
      const { data: legalizations, error: legalError } = await supabase
        .from('legalizations')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch power buying requests
      const { data: powerBuying, error: powerError } = await supabase
        .from('power_buying_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch VIN checks
      const { data: vinChecks, error: vinError } = await supabase
        .from('vin_check_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (inspError || legalError || powerError || vinError) {
        console.error('Fetch errors:', { inspError, legalError, powerError, vinError });
        throw new Error('Error fetching requests');
      }

      // Combine all requests with user information
      const allRequests = [
        ...(inspections || []).map(item => {
          const userProfile = userMap.get(item.user_id);
          return {
            ...item,
            type: 'inspection',
            client_name: userProfile?.full_name || 'Usuario Desconocido',
            client_email: userProfile?.email || 'Email no disponible'
          };
        }),
        ...(legalizations || []).map(item => {
          const userProfile = userMap.get(item.user_id);
          return {
            ...item,
            type: 'legalization',
            client_name: userProfile?.full_name || 'Usuario Desconocido',
            client_email: userProfile?.email || 'Email no disponible'
          };
        }),
        ...(powerBuying || []).map(item => {
          const userProfile = userMap.get(item.user_id);
          return {
            ...item,
            type: 'power_buying',
            client_name: userProfile?.full_name || 'Usuario Desconocido',
            client_email: userProfile?.email || 'Email no disponible'
          };
        }),
        ...(vinChecks || []).map(item => {
          const userProfile = userMap.get(item.user_id);
          return {
            ...item,
            type: 'vin_check',
            client_name: userProfile?.full_name || 'Usuario Desconocido',
            client_email: userProfile?.email || 'Email no disponible'
          };
        })
      ];

      // Sort by created_at descending
      allRequests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      return { success: true, data: allRequests };
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar solicitudes",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch all documents with user details
  const fetchAllDocuments = async () => {
    setLoading(true);
    try {
      // Fetch user profiles first
      const { data: userProfiles, error: userError } = await supabase
        .from('users_profile')
        .select('user_id, full_name, email');

      if (userError) {
        console.error('Error fetching user profiles:', userError);
        throw userError;
      }

      // Create a map for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.user_id, profile);
      });

      // Fetch documents
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (docError) throw docError;

      const documentsWithClient = (documents || []).map(doc => {
        const userProfile = userMap.get(doc.user_id);
        return {
          ...doc,
          client_name: userProfile?.full_name || 'Usuario Desconocido',
          client_email: userProfile?.email || 'Email no disponible'
        };
      });

      return { success: true, data: documentsWithClient };
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar documentos",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch all deposits with user details
  const fetchAllDeposits = async () => {
    setLoading(true);
    try {
      // Fetch user profiles first
      const { data: userProfiles, error: userError } = await supabase
        .from('users_profile')
        .select('user_id, full_name, email');

      if (userError) {
        console.error('Error fetching user profiles:', userError);
        throw userError;
      }

      // Create a map for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.user_id, profile);
      });

      // Fetch deposits
      const { data: deposits, error: depositError } = await supabase
        .from('deposits')
        .select('*')
        .order('created_at', { ascending: false });

      if (depositError) throw depositError;

      const depositsWithClient = (deposits || []).map(deposit => {
        const userProfile = userMap.get(deposit.user_id);
        return {
          ...deposit,
          client_name: userProfile?.full_name || 'Usuario Desconocido',
          client_email: userProfile?.email || 'Email no disponible'
        };
      });

      return { success: true, data: depositsWithClient };
    } catch (error) {
      console.error('Error fetching deposits:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar depósitos",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fetch chat messages with user details
  const fetchChatMessages = async () => {
    setLoading(true);
    try {
      // Fetch user profiles first
      const { data: userProfiles, error: userError } = await supabase
        .from('users_profile')
        .select('user_id, full_name, email');

      if (userError) {
        console.error('Error fetching user profiles:', userError);
        throw userError;
      }

      // Create a map for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.user_id, profile);
      });

      // Fetch chat messages
      const { data: messages, error: messageError } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messageError) throw messageError;

      const messagesWithUsers = (messages || []).map(message => {
        const senderProfile = userMap.get(message.sender_id);
        const receiverProfile = userMap.get(message.receiver_id);
        
        return {
          ...message,
          sender: {
            full_name: senderProfile?.full_name || 'Usuario Desconocido',
            email: senderProfile?.email || 'Email no disponible'
          },
          receiver: {
            full_name: receiverProfile?.full_name || 'Usuario Desconocido',
            email: receiverProfile?.email || 'Email no disponible'
          }
        };
      });

      return { success: true, data: messagesWithUsers };
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar mensajes",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchAllRequests,
    fetchAllDocuments,
    fetchAllDeposits,
    fetchChatMessages
  };
};