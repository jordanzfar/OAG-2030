import React, { useState, useEffect, useCallback } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import RealtimeRequestsTable from '@/components/admin/RealtimeRequestsTable';
import { Skeleton } from '@/components/ui/skeleton'; // Asumo que tienes un componente Skeleton

const AdminRequestsPage = () => {
  const { fetchAllRequests, updateRequestStatus, loading } = useAdminData();
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState(null);

  const loadRequests = useCallback(async () => {
    setError(null);
    const result = await fetchAllRequests();
    if (result.success) {
      setRequests(result.data);
    } else {
      console.error("Error al cargar solicitudes:", result.error);
      setError("No se pudieron cargar las solicitudes. Inténtalo de nuevo más tarde.");
    }
  }, [fetchAllRequests]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleStatusUpdate = async (requestId, typeKey, newStatus) => {
    const result = await updateRequestStatus(requestId, typeKey, newStatus);
    if (result.success) {
      // Opcional: Para una UX más rápida, podríamos actualizar el estado localmente
      // en lugar de recargar todo. Por ahora, recargar es más simple y seguro.
      await loadRequests();
    }
    // El hook useAdminData ya muestra un toast en caso de error.
  };

  const renderContent = () => {
    // 1. Estado de carga inicial (cuando aún no hay datos)
    if (loading && requests.length === 0) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="border rounded-md p-4">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      );
    }
    
    // 2. Estado de error
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-md">
          <p className="text-xl font-semibold text-destructive">😕 {error}</p>
        </div>
      );
    }
    
    // 3. Estado vacío (después de cargar, si no hay solicitudes)
    if (!loading && requests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-md">
          <p className="text-xl font-semibold text-muted-foreground">🎉 ¡Todo en orden!</p>
          <p className="text-muted-foreground">No hay solicitudes pendientes por gestionar.</p>
        </div>
      );
    }
    
    // 4. Contenido principal
    return (
      <RealtimeRequestsTable 
        requests={requests}
        loading={loading} // Pasamos el loading para que la tabla pueda mostrar un spinner en recargas
        onStatusUpdate={handleStatusUpdate}
      />
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Solicitudes</h1>
        <p className="text-muted-foreground">
          Gestiona todas las solicitudes de clientes en tiempo real.
        </p>
      </div>
      {renderContent()}
    </div>
  );
};

export default AdminRequestsPage;