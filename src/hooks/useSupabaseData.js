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
            toast({ variant: "destructive", title: "Error al crear registro", description: error.message });
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]); // NOVA UI: Añadido supabase como dependencia

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
    }, [supabase, toast]); // NOVA UI: Añadido supabase como dependencia

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
    }, [supabase, toast]); // NOVA UI: Añadido supabase como dependencia

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
    }, [supabase, toast]); // NOVA UI: Añadido supabase como dependencia

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
    }, [supabase, toast]); // NOVA UI: Añadido supabase como dependencia

    const getFileUrl = useCallback((bucket, path) => {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    }, [supabase]); // NOVA UI: Añadido supabase como dependencia

    const deleteFile = useCallback(async (bucket, path) => {
        try {
            const { error } = await supabase.storage.from(bucket).remove([path]);
            if (error) throw error;
            return { success: true };
        } catch (error) {
            toast({ variant: "destructive", title: "Error al eliminar archivo", description: error.message });
            return { success: false, error: error.message };
        }
    }, [supabase, toast]); // NOVA UI: Añadido supabase como dependencia

    // --- Funciones específicas ---
    const createNotification = useCallback((data) => createRecord('notifications', data), [createRecord]);
    const markNotificationAsRead = useCallback((id, data) => updateRecord('notifications', id, data), [updateRecord]);
    const createVinCheck = useCallback((data) => createRecord('vin_check_logs', data), [createRecord]);
    const createInspection = useCallback((data) => createRecord('inspections', data), [createRecord]);
    const createLegalization = useCallback((data) => createRecord('legalizations', data), [createRecord]);
    const createDocument = useCallback((data) => createRecord('documents', data), [createRecord]);
    const createChatMessage = useCallback((data) => createRecord('chat_messages', data), [createRecord]);
    const createPowerBuyingRequest = useCallback((data) => createRecord('power_buying_requests', data), [createRecord]);
    
    // ====================================================================
    // --- INICIO DE LA CORRECCIÓN ---
    // Esta es la función que corregimos.
    // ====================================================================
    const createDeposit = useCallback(
        (userId, depositData) => {
            // 1. Combinamos el ID del usuario con el resto de los datos del depósito
            const fullDepositData = {
                ...depositData,
                user_id: userId,
            };
            // 2. Llamamos a createRecord con el nombre de la tabla y el objeto de datos COMPLETO
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
        createLegalization,
        createDocument,
        createChatMessage,
        createPowerBuyingRequest,
        createDeposit // Exportamos la función corregida
    };
};