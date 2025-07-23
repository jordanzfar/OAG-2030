import { useCallback, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from '@/components/ui/use-toast';

export const useAdminData = () => {
    const supabase = useSupabaseClient();
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // --- Funciones para Gestión de Solicitudes ---

    const fetchAllRequests = useCallback(async () => {
        setLoading(true);
        try {
            // --- PASO 1: OBTENER TODAS LAS SOLICITUDES SIN JOINS ---
            const [inspectionsRes, legalizationsRes, powerBuyingRes, vinCheckRes] = await Promise.all([
                supabase.from('inspections').select('*').order('created_at', { ascending: false }),
                supabase.from('legalizations').select('*').order('created_at', { ascending: false }),
                supabase.from('power_buying_requests').select('*').order('created_at', { ascending: false }),
                supabase.from('vin_check_logs').select('*').order('created_at', { ascending: false })
            ]);

            // Manejo de errores de las consultas iniciales
            const errors = [inspectionsRes.error, legalizationsRes.error, powerBuyingRes.error, vinCheckRes.error].filter(Boolean);
            if (errors.length > 0) {
                const errorMessages = errors.map(e => e.message).join(', ');
                throw new Error(errorMessages);
            }

            const allRawRequests = [
                ...inspectionsRes.data.map(r => ({ ...r, type: 'Inspección', type_key: 'inspections' })),
                ...legalizationsRes.data.map(r => ({ ...r, type: 'Legalización', type_key: 'legalizations' })),
                ...powerBuyingRes.data.map(r => ({ ...r, type: 'Power Buying', type_key: 'power_buying_requests' })),
                ...vinCheckRes.data.map(r => ({ ...r, type: 'Chequeo VIN', type_key: 'vin_check_logs' }))
            ];
            
            if (allRawRequests.length === 0) {
                return { success: true, data: [] };
            }

            // --- PASO 2: OBTENER IDs DE USUARIO ÚNICOS Y BUSCAR SUS PERFILES ---
            const userIds = [...new Set(allRawRequests.map(r => r.user_id).filter(Boolean))];
            
            const { data: profiles, error: profilesError } = await supabase
                .from('users_profile')
                .select('id, full_name, email')
                .in('id', userIds);

            if (profilesError) throw profilesError;

            // --- PASO 3: UNIR LOS DATOS EN JAVASCRIPT ---
            const profilesMap = new Map(profiles.map(p => [p.id, p]));

            const allRequestsWithUsers = allRawRequests.map(request => {
                const userProfile = profilesMap.get(request.user_id) || { full_name: 'Usuario no encontrado', email: '' };
                return { ...request, user: userProfile };
            });

            // Ordenar finalmente por fecha de creación
            const sortedRequests = allRequestsWithUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return { success: true, data: sortedRequests };

        } catch (error) {
            console.error('Error fetching all requests:', error);
            toast({ variant: "destructive", title: "❌ Error al cargar solicitudes", description: error.message });
            return { success: false, data: [] };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const updateRequestStatus = useCallback(async (requestId, typeKey, newStatus) => {
        setLoading(true);
        const tableMap = {
            'inspections': 'inspections',
            'legalizations': 'legalizations',
            'power_buying_requests': 'power_buying_requests',
            'vin_check_logs': 'vin_check_logs'
        };

        const tableName = tableMap[typeKey];
        if (!tableName) {
            toast({ variant: "destructive", title: "❌ Error", description: "Tipo de solicitud inválido." });
            setLoading(false);
            return { success: false, error: { message: "Tipo de solicitud inválido." }};
        }

        try {
            const { error } = await supabase
                .from(tableName)
                .update({ status: newStatus })
                .eq('id', requestId);

            if (error) throw error;

            toast({ title: "✅ Estado actualizado", description: `La solicitud ha sido actualizada a "${newStatus}".` });
            return { success: true };
        } catch (error) {
            console.error(`Error updating status for ${typeKey}:`, error);
            toast({ variant: "destructive", title: "❌ Error al actualizar estado", description: error.message });
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

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
                        .eq('user_id', profile.id)
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

                    return { ...profile, documents };
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
                .eq('id', userId);

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
            const { data, error } = await supabase.storage.from(bucketName).createSignedUrl(filePath, 60 * 5); // 5 minutes validity
            if (error) throw error;
            return { success: true, url: data.signedUrl };
        } catch(error) {
            console.error('Error creating signed URL:', error);
            return { success: false, url: null, error };
        }
    }, [supabase]);

const fetchAllDeposits = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_all_deposits_with_user_details');
            if (error) throw error;
            return { success: true, data: data || [], error: null };
        } catch (error) {
            console.error('Error fetching all deposits:', error);
            toast({ variant: "destructive", title: "❌ Error al cargar depósitos", description: error.message });
            return { success: false, data: [], error };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);

    const updateDepositStatus = useCallback(async (depositId, newStatus) => {
        setLoading(true);
        try {
            const { error } = await supabase.rpc('update_deposit_status', {
                deposit_id_to_update: depositId,
                new_status: newStatus
            });

            if (error) throw error;

            toast({ title: "✅ Estado de depósito actualizado", description: `El depósito ha sido marcado como "${newStatus}".` });
            return { success: true, error: null };
        } catch (error) {
            console.error('Error updating deposit status:', error);
            toast({ variant: "destructive", title: "❌ Error al actualizar depósito", description: error.message });
            return { success: false, error };
        } finally {
            setLoading(false);
        }
    }, [supabase, toast]);



    // --- Funciones Generales y de Dashboard ---

    const getDashboardStats = useCallback(async () => {
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

    // --- Funciones de Chat ---

    const sendAdminMessage = useCallback(async (clientId, content, file = null) => {
        if (!user) return { data: null, error: { message: "Usuario no autenticado." } };

        let filePath = null;
        let fileType = null;

        try {
            if (file) {
                const uniquePath = `${user.id}/${Date.now()}_${file.name}`;
                const { error: uploadError } = await supabase.storage
                    .from('chatdocuments')
                    .upload(uniquePath, file);

                if (uploadError) throw uploadError;
                filePath = uniquePath;
                fileType = file.type;
            }

            if (!content && !file) {
                 return { data: null, error: { message: "No se puede enviar un mensaje vacío." } };
            }

            const messageToInsert = {
                sender_id: user.id,
                receiver_id: clientId,
                content: content || null,
                file_path: filePath,
                file_type: fileType,
                is_read: false,
            };

            const { data, error } = await supabase
                .from('chat_messages')
                .insert(messageToInsert)
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };

        } catch (error) {
            console.error("Error al enviar mensaje de admin:", error);
            return { data: null, error };
        }
    }, [supabase, user]);

    const updateChatStatus = useCallback(async (clientId, newStatus) => {
        if (!user) return { error: { message: 'Usuario no autenticado.' } };

        try {
            const updateData = { status: newStatus };

            if (newStatus === 'solucionado') {
                updateData.closed_at = new Date().toISOString();
                updateData.closed_by = user.id;
            }
            else {
                updateData.closed_at = null;
                updateData.closed_by = null;
            }

            const { data, error } = await supabase
                .from('chat_conversations')
                .update(updateData)
                .eq('client_id', clientId)
                .select()
                .single();

            if (error) throw error;

            toast({ title: "✅ Estado actualizado", description: `La conversación ahora está "${newStatus}".` });
            return { data, error: null };

        } catch (error) {
            console.error('Error en updateChatStatus:', error);
            toast({ variant: "destructive", title: "❌ Error al actualizar estado", description: error.message });
            return { data: null, error };
        }
    }, [supabase, user, toast]);

    const fetchAllDocuments = async () => {
  // 1. Obtener documentos
  const { data: documents, error: docError } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (docError) {
    console.error('Error al obtener los documentos:', docError);
    return { success: false, data: [], error: docError };
  }

  // 2. Obtener todos los perfiles (alternativamente, puedes optimizar por IDs únicos)
  const { data: profiles, error: profileError } = await supabase
    .from('users_profile')
    .select('id, full_name, email');

  if (profileError) {
    console.error('Error al obtener perfiles:', profileError);
    return { success: false, data: [], error: profileError };
  }

  // 3. Combinar los datos manualmente
  const documentsWithUserData = documents.map((doc) => {
    const userProfile = profiles.find((p) => p.id === doc.user_id);
    return {
      ...doc,
      user_profile: userProfile || null,
    };
  });

  return { success: true, data: documentsWithUserData, error: null };
};

    // --- EXPORTACIONES DEL HOOK UNIFICADO ---

    return {
        loading,
        fetchAllRequests,
        updateRequestStatus,
        fetchAllUsers,
        updateUserVerification,
        updateDocumentStatus,
        fetchAllLegalizations,
        getDocumentsForLegalization,
        getDocumentDownloadUrl,
        getDashboardStats,
        createNotification,
        sendAdminMessage,
        updateChatStatus,
        fetchAllDeposits,
        updateDepositStatus,
        fetchAllDocuments,
};
};