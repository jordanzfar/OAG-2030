import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAdminQueries } from '@/hooks/useAdminQueries';
import { useAdminActions } from '@/hooks/useAdminActions';

export const useAdminData = () => {
    const queries = useAdminQueries();
    const actions = useAdminActions();

    const fetchAllUsers = useCallback(async () => {
        const { data, error } = await supabase
            .from('users_profile')
            .select('*')
            .order('created_at', { ascending: false });
        return { success: !error, data, error };
    }, []);

    // --- INICIO DE LA CORRECCIÓN FINAL ---
    const getDashboardStats = useCallback(async () => {
        try {
            // Se añaden las consultas para usuarios y depósitos al Promise.all
            const [
                inspectionsResult,
                legalizationsResult,
                powerBuyingResult,
                vinCheckResult,
                documentsResult,
                messagesResult,
                usersResult,      // <-- AÑADIDO
                depositsResult    // <-- AÑADIDO
            ] = await Promise.all([
                supabase.from('inspections').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('legalizations').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('power_buying_requests').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('vin_check_logs').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('documents').select('id', { count: 'exact' }).eq('status', 'pending'),
                supabase.from('chat_messages').select('id', { count: 'exact' }).eq('is_read', false),
                // Se añaden las consultas para las métricas restantes
                supabase.from('users_profile').select('id', { count: 'exact' }),
                supabase.from('deposits').select('id', { count: 'exact' }).eq('status', 'pending'),
            ]);

            // Verificamos si hubo algún error en las consultas
            if (inspectionsResult.error) throw inspectionsResult.error;
            if (legalizationsResult.error) throw legalizationsResult.error;
            if (powerBuyingResult.error) throw powerBuyingResult.error;
            if (vinCheckResult.error) throw vinCheckResult.error;
            if (documentsResult.error) throw documentsResult.error;
            if (messagesResult.error) throw messagesResult.error;
            if (usersResult.error) throw usersResult.error;
            if (depositsResult.error) throw depositsResult.error;

            // Sumamos los conteos para las solicitudes pendientes
            const pendingRequests = (inspectionsResult.count || 0) +
                                    (legalizationsResult.count || 0) +
                                    (powerBuyingResult.count || 0) +
                                    (vinCheckResult.count || 0);

            // Construimos el objeto de estadísticas con TODOS los datos reales
            const statsData = {
                pendingRequests: pendingRequests,
                pendingDocuments: documentsResult.count || 0,
                unreadMessages: messagesResult.count || 0,
                totalUsers: usersResult.count || 0,
                pendingDeposits: depositsResult.count || 0,
            };

            return { success: true, data: statsData };

        } catch (error) {
            console.error("Error al obtener y procesar estadísticas:", error);
            return { success: false, error };
        }
    }, []);
    // --- FIN DE LA CORRECCIÓN FINAL ---

    const loading = queries.loading || actions.loading;

    return {
        loading,
        fetchAllRequests: queries.fetchAllRequests,
        fetchAllDocuments: queries.fetchAllDocuments,
        fetchAllUsers,
        fetchAllDeposits: queries.fetchAllDeposits,
        updateRequestStatus: actions.updateRequestStatus,
        updateDocumentStatus: actions.updateDocumentStatus,
        updateDepositStatus: actions.updateDepositStatus,
        updateUserVerification: actions.updateUserVerification,
        getDashboardStats,
    };
};