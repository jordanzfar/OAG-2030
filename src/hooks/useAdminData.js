import { useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

; // Asegúrate que la ruta es correcta
import { useSupabaseAuth } from './useSupabaseAuth'; // Necesitamos el usuario admin
import { useAdminQueries } from '@/hooks/useAdminQueries';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useToast } from '@/components/ui/use-toast'; // ✅ Importación añadida

export const useAdminData = () => {
    const supabase = useSupabaseClient(); 
    const { user } = useSupabaseAuth();
    const queries = useAdminQueries();
    const actions = useAdminActions();
    const { toast } = useToast(); 

    const fetchAllUsers = useCallback(async () => {
        const { data, error } = await supabase
            .from('users_profile')
            .select('*')
            .order('created_at', { ascending: false });
        return { success: !error, data, error };
    }, []);

    const getDashboardStats = useCallback(async () => {
        try {
            const [
                inspectionsResult,
                legalizationsResult,
                powerBuyingResult,
                vinCheckResult,
                documentsResult,
                messagesResult,
                usersResult,
                depositsResult
            ] = await Promise.all([
                supabase.from('inspections').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('legalizations').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('power_buying_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('vin_check_logs').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('documents').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('chat_messages').select('id', { count: 'exact' }).eq('is_read', false),
                supabase.from('users_profile').select('id', { count: 'exact' }),
                supabase.from('deposits').select('id', { count: 'exact' }).eq('status', 'pending'),
            ]);

            if (inspectionsResult.error) throw inspectionsResult.error;
            // ... (resto de tus verificaciones de error)

            const pendingRequests = (inspectionsResult.count || 0) + (legalizationsResult.count || 0) + (powerBuyingResult.count || 0) + (vinCheckResult.count || 0);
            const statsData = {
                pendingRequests,
                totalUsers: usersResult.count || 0,
                pendingDocuments: documentsResult.count || 0,
                unreadMessages: messagesResult.count || 0,
                pendingDeposits: depositsResult.count || 0,
            };
            return { success: true, data: statsData };
        } catch (error) {
            console.error("Error al obtener y procesar estadísticas:", error);
            return { success: false, error };
        }
    }, []);

    const fetchUsersByRole = useCallback(async (role) => {
        const { data, error } = await supabase.from('users_profile').select('id').eq('role', role);
        return { success: !error, data, error };
    }, []);

    const createNotification = useCallback(async (notificationData) => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert(notificationData)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al crear notificación:', error);
            return { success: false, error };
        }
    }, []);

    const sendAdminMessage = useCallback(async (clientId, content) => {
        if (!user || !clientId || !content) {
            console.error("Faltan datos para enviar el mensaje: admin, cliente o contenido.");
            return { success: false, error: new Error("Faltan datos para enviar el mensaje.") };
        }

        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: clientId,
                    content: content,
                    is_read: false,
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error("Error al enviar el mensaje de admin:", error);
            return { success: false, error };
        }
    }, [user]);

    // ✅ FUNCIÓN NUEVA PARA ACTUALIZAR ESTADO
    const updateChatStatus = useCallback(async (clientId, newStatus) => {
        try {
            const { error } = await supabase.rpc('update_chat_status', {
                p_client_id: clientId,
                p_new_status: newStatus,
            });

            if (error) throw error;

            toast({
                title: "✅ Estado Actualizado",
                description: `La conversación ahora es "${newStatus}".`,
            });
            return { success: true };
        } catch (error) {
            console.error('Error al actualizar estado del chat:', error);
            toast({
                variant: "destructive",
                title: "❌ Error al Actualizar",
                description: error.message,
            });
            return { success: false, error };
        }
    }, [toast]);

    const loading = queries.loading || actions.loading;

    const fetchAllLegalizations = useCallback(async () => {
    setLoading(true); // Asumo que tienes un estado de loading en este hook
    const { data, error } = await supabase.rpc('get_all_legalizations');
    setLoading(false);

    if (error) {
        console.error('Error fetching all legalizations:', error);
        // Aquí podrías usar un toast si lo tienes configurado en este hook
        return { success: false, data: null, error };
    }
    return { success: true, data, error: null };
}, []);

const getDocumentsForLegalization = useCallback(async (legalizationId) => {
    if (!legalizationId) return { success: false, data: null, error: 'No ID provided' };
    
    const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('legalization_id', legalizationId);

    if (error) {
        console.error('Error fetching documents:', error);
        return { success: false, data: null, error };
    }
    return { success: true, data, error: null };
}, []);

/**
 * Genera una URL de descarga segura para un documento en Supabase Storage.
 */
const getDocumentDownloadUrl = useCallback(async (filePath) => {
    const { data, error } = await supabase
        .storage
        .from('documents') // Asegúrate que este es el nombre de tu bucket
        .createSignedUrl(filePath, 60 * 5); // URL válida por 5 minutos

    if (error) {
        console.error('Error creating signed URL:', error);
        return { success: false, url: null };
    }
    return { success: true, url: data.signedUrl };
}, []);

    return {
        loading,
        fetchAllRequests: queries.fetchAllRequests,
        fetchAllDocuments: queries.fetchAllDocuments,
        fetchAllLegalizations: queries.fetchAllLegalizations,
        getDocumentsForLegalization,
        getDocumentDownloadUrl,
        fetchAllUsers,
        fetchAllDeposits: queries.fetchAllDeposits,
        updateRequestStatus: actions.updateRequestStatus,
        updateDocumentStatus: actions.updateDocumentStatus,
        updateDepositStatus: actions.updateDepositStatus,
        updateUserVerification: actions.updateUserVerification,
        getDashboardStats,
        fetchUsersByRole,
        createNotification,
        sendAdminMessage,
        updateChatStatus, // ✅ Se exporta la nueva función
        
    };
};