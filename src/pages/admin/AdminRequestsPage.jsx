import React, { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import RealtimeRequestsTable from '@/components/admin/RealtimeRequestsTable';

const AdminRequestsPage = () => {
  const { fetchAllRequests, updateRequestStatus, loading } = useAdminData();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    const result = await fetchAllRequests();
    if (result.success) {
      setRequests(result.data);
    }
  };

  const handleStatusUpdate = async (requestId, type, newStatus) => {
    const result = await updateRequestStatus(requestId, type, newStatus);
    if (result.success) {
      // Refresh the requests list
      await loadRequests();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Solicitudes</h1>
        <p className="text-muted-foreground">
          Gestiona todas las solicitudes de clientes en tiempo real con Supabase
        </p>
      </div>

      <RealtimeRequestsTable 
        requests={requests}
        loading={loading}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default AdminRequestsPage;