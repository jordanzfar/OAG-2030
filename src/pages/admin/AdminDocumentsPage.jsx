import React, { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import RealtimeDocumentsTable from '@/components/admin/RealtimeDocumentsTable';

const AdminDocumentsPage = () => {
  const { fetchAllDocuments, updateDocumentStatus, loading } = useAdminData();
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    const result = await fetchAllDocuments();
    if (result.success) {
      setDocuments(result.data);
    }
  };

  const handleStatusUpdate = async (documentId, newStatus, rejectionReason = null) => {
    const result = await updateDocumentStatus(documentId, newStatus, rejectionReason);
    if (result.success) {
      // Refresh the documents list
      await loadDocuments();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Validación de Documentos</h1>
        <p className="text-muted-foreground">
          Revisa y valida documentos subidos por los clientes en tiempo real
        </p>
      </div>

      <RealtimeDocumentsTable 
        documents={documents}
        loading={loading}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default AdminDocumentsPage;