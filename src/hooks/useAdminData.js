import { useCallback, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from '@/components/ui/use-toast';

export const useAdminData = () => {
    const supabase = useSupabaseClient();
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // --- Funciones para Gestión de Usuarios y Verificación (KYC) ---

    const fetchAllUsers = useCallback(async () => {
        setLoading(true);
        try {
            const { data: profiles, error: profilesError } = await supabase
                .from('users_profile')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            const usersWithDocs = await Promise.all(
                profiles.map(async (profile) => {
                    const { data: documentsData, error: docsError } = await supabase
                        .from('documents')
                        .select('id, file_path, status, rejection_reason')
                        .eq('user_id', profile.user_id)
                        .or('file_path.like.%/id_front/%,file_path.like.%/id_back/%,file_path.like.%/selfie/%');
                    
                    let documents = [];
                    if (!docsError && documentsData) {
                        documents = documentsData.map(doc => {
                            const BUCKET_NAME = 'kycdocuments';
                            const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(doc.file_path);
                            const type = doc.file_path.includes('id_front') ? 'id_front' : doc.file_path.includes('id_back') ? 'id_back' : 'selfie';
                            return { ...doc, url: publicUrl, type };
                        });
                    }
                    
                    return { ...profile, id: profile.user_id, documents };
                })
            );
            return { success: true, data: usersWithDocs, error: null };
        } catch (error) {
            console.error('Error crítico en fetchAllUsers:', error);
            toast({ variant: "destructive", title: "❌ Error al cargar usuarios", description: error.message });
            return { success: false, error, data: [] };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const updateUserVerification = useCallback(async (userId, verificationStatus) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('users_profile')
                .update({ verification_status: verificationStatus })
                .eq('user_id', userId);

            if (error) throw error;
            
            toast({ title: "✅ Verificación de usuario actualizada", description: `El estado del usuario ahora es "${verificationStatus}".` });
            return { success: true };
        } catch (error) {
            console.error('Error en updateUserVerification:', error);
            toast({ variant: "destructive", title: "❌ Error al verificar usuario", description: error.message });
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const updateDocumentStatus = useCallback(async (documentId, newStatus, rejectionReason = null) => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('documents')
                .update({ status: newStatus, rejection_reason: rejectionReason })
                .eq('id', documentId);
            
            if (error) throw error;

            toast({ title: "✅ Documento actualizado", description: `El estado del documento ahora es "${newStatus}".` });
            return { success: true };
        } catch (error) {
            console.error('Error en updateDocumentStatus:', error);
            toast({ variant: "destructive", title: "❌ Error al actualizar documento", description: `Razón: ${error.message}.` });
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    // --- Funciones para Gestión de Legalizaciones ---

    const fetchAllLegalizations = useCallback(async (filters) => {
        setLoading(true);
        try {
            // Nota: Asegúrate que tu función RPC se llama 'get_all_legalizations_with_filters' y acepta estos parámetros.
               const { data, error } = await supabase.rpc('get_all_legalizations', {
            p_status: filters?.status,
            p_start_date: filters?.startDate,
            p_end_date: filters?.endDate,
        });
            if (error) throw error;
            return { success: true, data, error: null };
        } catch (error) {
            console.error('Error fetching all legalizations:', error);
            toast({ variant: "destructive", title: "❌ Error al cargar legalizaciones", description: error.message });
            return { success: false, data: null, error };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const getDocumentsForLegalization = useCallback(async (legalizationId) => {
        if (!legalizationId) return { success: false, data: null, error: 'No ID provided' };
        
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('legalization_id', legalizationId);

        if (error) {
            console.error('Error fetching documents for legalization:', error);
            return { success: false, data: null, error };
        }
        return { success: true, data, error: null };
    }, [supabase]);

    const getDocumentDownloadUrl = useCallback(async (filePath, bucketName = 'kycdocuments') => {
        try {
            const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 60 * 5); // 5 min de validez
            if (error) throw error;
            return { success: true, url: data.signedUrl };
        } catch(error) {
            console.error('Error creating signed URL:', error);
            return { success: false, url: null, error };
        }
    }, [supabase]);

    // --- Funciones Generales y de Dashboard ---

    const getDashboardStats = useCallback(async () => {
        // Implementación completa del primer archivo
        try {
            const [
                inspectionsResult, legalizationsResult, powerBuyingResult, vinCheckResult,
                documentsResult, messagesResult, usersResult, depositsResult
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

            const pendingRequests = (inspectionsResult.count || 0) + (legalizationsResult.count || 0) + (powerBuyingResult.count || 0) + (vinCheckResult.count || 0);
            return { success: true, data: {
                pendingRequests,
                totalUsers: usersResult.count || 0,
                pendingDocuments: documentsResult.count || 0,
                unreadMessages: messagesResult.count || 0,
                pendingDeposits: depositsResult.count || 0,
            }};
        } catch (error) {
            console.error("Error al obtener estadísticas:", error);
            return { success: false, error };
        }
    }, [supabase]);

    const createNotification = useCallback(async (notificationData) => {
        try {
            const { data, error } = await supabase.from('notifications').insert(notificationData).select();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error al crear notificación:', error);
            return { success: false, error };
        }
    }, [supabase]);

    const sendAdminMessage = useCallback(async (clientId, content) => {
        if (!user || !clientId || !content) return { success: false, error: new Error("Datos insuficientes.") };
        try {
            const { data, error } = await supabase.from('chat_messages').insert({
                sender_id: user.id,
                receiver_id: clientId,
                content: content,
            }).select().single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error("Error al enviar mensaje de admin:", error);
            return { success: false, error };
        }
    }, [supabase, user]);
    
    // ... aquí irían otras funciones si las tuvieras (fetchUsersByRole, updateChatStatus, etc.)


    // --- EXPORTACIONES DEL HOOK UNIFICADO ---
    
    return {
        loading,
        // KYC & Users
        fetchAllUsers,
        updateUserVerification,
        updateDocumentStatus,
        // Legalizations
        fetchAllLegalizations,
        getDocumentsForLegalization,
        getDocumentDownloadUrl,
        // Dashboard & Comms
        getDashboardStats,
        createNotification,
        sendAdminMessage,
    };
};