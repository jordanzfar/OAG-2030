import React, { useState, useEffect, useCallback } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import RealtimeUsersTable from '@/components/admin/RealtimeUsersTable';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const AdminUsersPage = () => {
      const supabase = useSupabaseClient();
  
  const { 
    fetchAllUsers, 
    updateUserVerification, 
    loading,
    getDocumentDownloadUrl,
    updateDocumentStatus
  } = useAdminData();
  const [users, setUsers] = useState([]);

  // ✅ Se envuelve en useCallback para optimización
  const loadUsers = useCallback(async () => {
    const result = await fetchAllUsers();
    if (result.success) {
      setUsers(result.data);
    }
  }, [fetchAllUsers]);

  // ✅ useEffect ahora también maneja las suscripciones en tiempo real
  useEffect(() => {
    // Carga inicial de datos
    loadUsers();

    // Configuración del canal de Supabase para escuchar cambios
    const channel = supabase
      .channel('realtime-admin-users-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users_profile' },
        (payload) => {
          console.log('Cambio detectado en perfiles de usuario, recargando datos...');
          loadUsers();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'documents' },
        (payload) => {
          console.log('Cambio detectado en documentos, recargando datos...');
          loadUsers();
        }
      )
      .subscribe();

    // Función de limpieza para eliminar la suscripción cuando el componente se desmonte
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadUsers]);

  const handleVerificationUpdate = async (userId, verificationStatus) => {
    // Ya no es necesario recargar manualmente, la suscripción lo hará
    await updateUserVerification(userId, verificationStatus);
  };

  const handleDocumentStatusUpdate = async (documentId, newStatus, rejectionReason = null) => {
    // Ya no es necesario recargar manualmente, la suscripción lo hará
    await updateDocumentStatus(documentId, newStatus, rejectionReason);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona verificaciones y consulta los documentos de los usuarios en tiempo real.
        </p>
      </div>

      <RealtimeUsersTable 
        users={users}
        loading={loading}
        onVerificationUpdate={handleVerificationUpdate}
        onDocumentViewRequest={getDocumentDownloadUrl}
        onDocumentStatusUpdate={handleDocumentStatusUpdate}
      />
    </div>
  );
};

export default AdminUsersPage;
