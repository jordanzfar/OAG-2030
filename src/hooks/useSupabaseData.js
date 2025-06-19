import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useSupabaseData = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Generic CRUD operations
  const createRecord = async (table, data) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error al crear registro",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const updateRecord = async (table, id, data) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error al actualizar registro",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true, data: result };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (table, id) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error al eliminar registro",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (table, filters = {}, options = {}) => {
    setLoading(true);
    try {
      let query = supabase.from(table).select(options.select || '*');
      
      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          variant: "destructive",
          title: "Error al obtener registros",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // File upload to Supabase Storage
  const uploadFile = async (bucket, path, file) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error al subir archivo",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Get public URL for file
  const getFileUrl = (bucket, path) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  };

  // Delete file from storage
  const deleteFile = async (bucket, path) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error al eliminar archivo",
          description: error.message,
        });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message,
      });
      return { success: false, error: error.message };
    }
  };

  // Specific methods for different entities
  const createNotification = async (userId, type, message) => {
    return await createRecord('notifications', {
      user_id: userId,
      type,
      message
    });
  };

  const markNotificationAsRead = async (notificationId) => {
    return await updateRecord('notifications', notificationId, {
      is_read: true
    });
  };

  const createVinCheck = async (userId, vin) => {
    return await createRecord('vin_check_logs', {
      user_id: userId,
      vin,
      status: 'pending'
    });
  };

  const createInspection = async (userId, inspectionData) => {
    return await createRecord('inspections', {
      user_id: userId,
      ...inspectionData
    });
  };

  const createLegalization = async (userId, legalizationData) => {
    return await createRecord('legalizations', {
      user_id: userId,
      ...legalizationData
    });
  };

  const createDocument = async (userId, documentData) => {
    return await createRecord('documents', {
      user_id: userId,
      ...documentData
    });
  };

  const createChatMessage = async (senderId, receiverId, content) => {
    return await createRecord('chat_messages', {
      sender_id: senderId,
      receiver_id: receiverId,
      content
    });
  };

  const createPowerBuyingRequest = async (userId, amount, deposit) => {
    return await createRecord('power_buying_requests', {
      user_id: userId,
      amount,
      deposit
    });
  };

  const createDeposit = async (userId, depositData) => {
    return await createRecord('deposits', {
      user_id: userId,
      ...depositData
    });
  };

  return {
    loading,
    createRecord,
    updateRecord,
    deleteRecord,
    fetchRecords,
    uploadFile,
    getFileUrl,
    deleteFile,
    createNotification,
    markNotificationAsRead,
    createVinCheck,
    createInspection,
    createLegalization,
    createDocument,
    createChatMessage,
    createPowerBuyingRequest,
    createDeposit
  };
};