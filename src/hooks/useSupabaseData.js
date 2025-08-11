import { useState, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

export const useSupabaseData = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const supabase = useSupabaseClient();

    const createRecord = useCallback(async (table, data) => {
        setLoading(true);
        try {
            const { data: result, error } = await supabase.from(table).insert(data).select().single();
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            console.error(`Error creating record in ${table}:`, error); // Log para más detalles
            toast({ variant: "destructive", title: "Error al crear registro", description: error.message });
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const updateRecord = useCallback(async (table, id, data) => {
        setLoading(true);
        try {
            const { data: result, error } = await supabase.from(table).update(data).eq('id', id).select().single();
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al actualizar", description: error.message });
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const deleteRecord = useCallback(async (table, id) => {
        setLoading(true);
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al eliminar", description: error.message });
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const fetchRecords = useCallback(async (table, filters = {}, options = {}) => {
        setLoading(true);
        try {
            let query = supabase.from(table).select(options.select || '*');
            Object.entries(filters).forEach(([key, value]) => { query = query.eq(key, value); });
            if (options.orderBy) { query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending !== false }); }
            if (options.limit) { query = query.limit(options.limit); }
            const { data, error } = await query;
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al obtener datos", description: error.message });
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const uploadFile = useCallback(async (bucket, path, file) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al subir archivo", description: error.message });
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const getFileUrl = useCallback((bucket, path) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }, [supabase]);

    const deleteFile = useCallback(async (bucket, path) => {
        try {
            const { error } = await supabase.storage.from(bucket).remove([path]);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al eliminar archivo", description: error.message });
            return { success: false, error: error.message };
        }
    }, [supabase, toast]);

    // --- Funciones específicas ---
    const createNotification = useCallback((data) => createRecord('notifications', data), [createRecord]);
    const markNotificationAsRead = useCallback((id, data) => updateRecord('notifications', id, data), [updateRecord]);
    const createVinCheck = useCallback((data) => createRecord('vin_check_logs', data), [createRecord]);
    const createInspection = useCallback((data) => createRecord('inspections', data), [createRecord]);
    const createChatMessage = useCallback((data) => createRecord('chat_messages', data), [createRecord]);
    const createPowerBuyingRequest = useCallback((data) => createRecord('power_buying_requests', data), [createRecord]);
    
    // ====================================================================
    // --- INICIO DE LA CORRECCIÓN ---
    // ====================================================================

    // CORREGIDO: Acepta userId y legalizationData, los combina y luego llama a createRecord.
    const createLegalization = useCallback(
        (userId, legalizationData) => {
            const dataToInsert = {
                ...legalizationData,
                user_id: userId, // Se añade el user_id al objeto a insertar
            };
            return createRecord('legalizations', dataToInsert);
        },
        [createRecord]
    );

    // CORREGIDO: Acepta userId y documentData, los combina y luego llama a createRecord.
    const createDocument = useCallback(
    (documentData) => {
        // ✅ CORRECTO: Pasa el objeto de datos directamente, sin anidarlo.
        return createRecord('documents', documentData);
    },
    [createRecord]
);

const updateDocument = async (documentId, updates) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId) // Actualiza la fila con este ID específico
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error updating document:', error);
    return { success: false, error };
  }
};

    // Esta función ya tenía el patrón correcto, se deja como referencia.
    const createDeposit = useCallback(
        (userId, depositData) => {
            const fullDepositData = {
                ...depositData,
                user_id: userId,
            };
            return createRecord('deposits', fullDepositData);
        },
        [createRecord]
    );

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
        createLegalization, // Exporta la función corregida
        createDocument,     // Exporta la función corregida
        createChatMessage,
        createPowerBuyingRequest,
        createDeposit,
        updateDocument
    };
};
