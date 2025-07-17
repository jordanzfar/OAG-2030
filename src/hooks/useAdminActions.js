import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const useAdminActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  /**
   * Actualiza el estado para varios tipos de solicitudes.
   * Nota: Se ha removido el caso 'legalization' para usar la función más específica 'updateLegalization'.
   */
  const updateRequestStatus = useCallback(async (requestId, type, newStatus) => {
    setLoading(true);
    try {
      let tableName;
      switch (type) {
        case 'inspection':
          tableName = 'inspections';
          break;
        case 'power_buying':
          tableName = 'power_buying_requests';
          break;
        case 'vin_check':
          tableName = 'vin_check_logs';
          break;
        default:
          throw new Error('Tipo de solicitud no válido o manejado por otra función.');
      }

      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `La solicitud ha sido marcada como ${newStatus}.`,
      });
      return { success: true };

    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        variant: "destructive",
        title: "Error al actualizar estado",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Actualiza el estado y la razón de rechazo de un documento.
   */
  const updateDocumentStatus = useCallback(async (documentId, newStatus, rejectionReason = null) => {
    setLoading(true);
    try {
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;

      toast({
        title: "Documento actualizado",
        description: `El documento ha sido ${newStatus === 'approved' ? 'aprobado' : 'rechazado'}.`,
      });
      return { success: true };

    } catch (error) {
      console.error('Error updating document status:', error);
      toast({
        variant: "destructive",
        title: "Error al actualizar documento",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Actualiza el estado de un depósito.
   */
  const updateDepositStatus = useCallback(async (depositId, newStatus) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('deposits')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', depositId);

      if (error) throw error;

      toast({
        title: "Depósito actualizado",
        description: `El depósito ha sido marcado como ${newStatus}.`,
      });
      return { success: true };

    } catch (error) {
      console.error('Error updating deposit status:', error);
      toast({
        variant: "destructive",
        title: "Error al actualizar depósito",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Actualiza el estado de verificación y el poder de compra de un usuario.
   */
  const updateUserVerification = useCallback(async (userId, verificationStatus, buyingPower = null) => {
    setLoading(true);
    try {
      const updateData = {
        verification_status: verificationStatus,
        updated_at: new Date().toISOString()
      };

      if (buyingPower !== null) {
        updateData.buying_power = buyingPower;
      }

      const { error } = await supabase
        .from('users_profile')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Usuario actualizado",
        description: `El estado de verificación ha sido actualizado.`,
      });
      return { success: true };

    } catch (error) {
      console.error('Error updating user verification:', error);
      toast({
        variant: "destructive",
        title: "Error al actualizar usuario",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Envía un mensaje desde el administrador a un cliente.
   */
  const sendAdminMessage = useCallback(async (receiverId, content) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content,
          is_read: false
        });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "El mensaje ha sido enviado correctamente.",
      });
      return { success: true };

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error al enviar mensaje",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [user, toast]);
  
  /**
   * Actualiza una solicitud de legalización (estado, notas de admin, etc.).
   */
  const updateLegalization = useCallback(async (id, updates) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legalizations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Legalización actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
      return { success: true, data };

    } catch (error) {
      console.error('Error updating legalization:', error);
      toast({
        variant: "destructive",
        title: "Error al actualizar",
        description: "No se pudieron guardar los cambios en la legalización.",
      });
      return { success: false, data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  

  return {
    loading,
    updateRequestStatus,
    updateDocumentStatus,
    updateDepositStatus,
    updateUserVerification,
    sendAdminMessage,
    updateLegalization,
  };
};