import { useState, useCallback } from 'react'; // 1. Importa useCallback
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useSupabaseData = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // ====================================================================
    // --- INICIO DE LA CORRECCIÓN ---
    // Envolvemos TODAS las funciones que se exportan en useCallback.
    // ====================================================================

    const createRecord = useCallback(async (table, data) => {
        setLoading(true);
        try {
            const { data: result, error } = await supabase.from(table).insert(data).select().single();
            if (error) throw error;
            return { success: true, data: result };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al crear registro", description: error.message });
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [toast]); // Dependencia estable

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
    }, [toast]);

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
    }, [toast]);

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
    }, [toast]);

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
    }, [toast]);

    const getFileUrl = useCallback((bucket, path) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }, []);

    const deleteFile = useCallback(async (bucket, path) => {
        try {
            const { error } = await supabase.storage.from(bucket).remove([path]);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al eliminar archivo", description: error.message });
            return { success: false, error: error.message };
        }
    }, [toast]);

    // Las funciones específicas también deben estar envueltas para que sean estables
    const createNotification = useCallback((...args) => createRecord('notifications', ...args), [createRecord]);
    const markNotificationAsRead = useCallback((...args) => updateRecord('notifications', ...args), [updateRecord]);
    const createVinCheck = useCallback((...args) => createRecord('vin_check_logs', ...args), [createRecord]);
    const createInspection = useCallback((...args) => createRecord('inspections', ...args), [createRecord]);
    const createLegalization = useCallback((...args) => createRecord('legalizations', ...args), [createRecord]);
    const createDocument = useCallback((...args) => createRecord('documents', ...args), [createRecord]);
    const createChatMessage = useCallback((...args) => createRecord('chat_messages', ...args), [createRecord]);
    const createPowerBuyingRequest = useCallback((...args) => createRecord('power_buying_requests', ...args), [createRecord]);
    const createDeposit = useCallback((...args) => createRecord('deposits', ...args), [createRecord]);


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