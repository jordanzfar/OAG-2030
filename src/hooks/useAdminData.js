import { useCallback, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from '@/components/ui/use-toast';

export const useAdminData = () => {
    const supabase = useSupabaseClient();
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

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
                    // ✅ CORREGIDO: La consulta ahora filtra para obtener solo los 3 tipos de documentos KYC.
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
            toast({ variant: "destructive", title: "❌ Error al actualizar documento", description: `Razón: ${error.message}. Asegúrate de tener permisos de UPDATE (RLS) en la tabla 'documents'.` });
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const getDocumentDownloadUrl = useCallback(async (filePath) => {
        const BUCKET_NAME = 'kycdocuments';
        const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(filePath, 60 * 5);
        if (error) {
            console.error('Error creating signed URL:', error);
            return { success: false, url: null, error };
        }
        return { success: true, url: data.signedUrl };
    }, [supabase]);

    // --- Funciones Adicionales (Placeholder/Existentes) ---
    const getDashboardStats = useCallback(async () => { /* ... */ return { success: true, data: {} }; }, [supabase]);
    const fetchAllRequests = useCallback(async () => ({ success: true, data: [] }), []);
    const fetchAllDocuments = useCallback(async () => ({ success: true, data: [] }), []);
    const fetchAllDeposits = useCallback(async () => ({ success: true, data: [] }), []);
    const updateRequestStatus = useCallback(async () => ({ success: true }), []);
    const updateDepositStatus = useCallback(async () => ({ success: true }), []);
    const fetchUsersByRole = useCallback(async (role) => ({ success: !false, data: [], error: null }), [supabase]);
    const createNotification = useCallback(async (notificationData) => ({ success: !false, data: {}, error: null }), [supabase]);
    const sendAdminMessage = useCallback(async (clientId, content) => ({ success: !false, data: {}, error: null }), [user, supabase]);
    const updateChatStatus = useCallback(async (clientId, newStatus) => ({ success: !false }), [supabase, toast]);

    return {
        loading,
        fetchAllUsers,
        updateUserVerification,
        updateDocumentStatus,
        getDocumentDownloadUrl,
        getDashboardStats,
        fetchAllRequests,
        fetchAllDocuments,
        fetchAllDeposits,
        updateRequestStatus,
        updateDepositStatus,
        fetchUsersByRole,
        createNotification,
        sendAdminMessage,
        updateChatStatus,
    };
};
