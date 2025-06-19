
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderOpen, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { requiredDocuments } from '@/components/legalization/constants';

const LegalizationHistory = ({ legalizations, onOpenDocumentModal }) => {
  const { user } = useSupabaseAuth();
  const { fetchRecords } = useSupabaseData();
  const [documentsData, setDocumentsData] = useState({});

  useEffect(() => {
    if (user && legalizations.length > 0) {
      loadDocumentsForLegalizations();
    }
  }, [user, legalizations]);

  const loadDocumentsForLegalizations = async () => {
    if (!user) return;

    const documentsPromises = legalizations.map(async (legalization) => {
      const result = await fetchRecords('documents', { 
        user_id: user.id, 
        legalization_id: legalization.id 
      });
      return {
        legalizationId: legalization.id,
        documents: result.success ? result.data || [] : []
      };
    });

    const results = await Promise.all(documentsPromises);
    const documentsMap = {};
    results.forEach(({ legalizationId, documents }) => {
      documentsMap[legalizationId] = documents;
    });
    setDocumentsData(documentsMap);
  };

  const getDocumentStats = (legalizationId) => {
    const documents = documentsData[legalizationId] || [];
    const totalRequired = requiredDocuments.length;
    const uploaded = documents.length;
    const approved = documents.filter(doc => doc.status === 'approved').length;
    const rejected = documents.filter(doc => doc.status === 'rejected').length;
    const pending = documents.filter(doc => doc.status === 'pending').length;

    return {
      total: totalRequired,
      uploaded,
      approved,
      rejected,
      pending,
      missing: totalRequired - uploaded,
      completionPercentage: Math.round((uploaded / totalRequired) * 100)
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Aprobado' },
      in_review: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Revisión' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazado' },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pendiente' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`px-2 py-1 rounded text-xs ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const DocumentProgressBar = ({ stats }) => (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span>Documentos</span>
        <span>{stats.uploaded}/{stats.total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${stats.completionPercentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
        <span className="flex items-center">
          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
          {stats.approved} aprobados
        </span>
        {stats.rejected > 0 && (
          <span className="flex items-center">
            <AlertCircle className="w-3 h-3 mr-1 text-red-500" />
            {stats.rejected} rechazados
          </span>
        )}
        {stats.pending > 0 && (
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1 text-yellow-500" />
            {stats.pending} en revisión
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Historial de Legalizaciones</CardTitle>
        <CardDescription>Estado de solicitudes anteriores y progreso de documentos.</CardDescription>
      </CardHeader>
      <CardContent>
        {legalizations.length > 0 ? (
          <div className="space-y-4">
            {legalizations.map((legalization) => {
              const stats = getDocumentStats(legalization.id);
              
              return (
                <div key={legalization.id} className="p-4 border border-border rounded-lg bg-secondary">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">VIN: {legalization.vin}</h4>
                      <p className="text-sm text-muted-foreground">
                        {legalization.vehicle_info.marca} {legalization.vehicle_info.modelo} {legalization.vehicle_info.ano}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Creado: {new Date(legalization.created_at).toLocaleDateString()}
                      </p>
                      
                      {/* Document Progress */}
                      <DocumentProgressBar stats={stats} />
                      
                      {/* Missing Documents Alert */}
                      {stats.missing > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                          <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Faltan {stats.missing} documento(s) por subir
                          </p>
                        </div>
                      )}
                      
                      {/* Rejected Documents Alert */}
                      {stats.rejected > 0 && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                          <p className="text-xs text-red-800 dark:text-red-200">
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            {stats.rejected} documento(s) rechazado(s) - requieren nueva subida
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      {(legalization.status === 'pending' || legalization.status === 'in_review') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onOpenDocumentModal(legalization)}
                          className="text-xs"
                        >
                          <FolderOpen className="w-3 h-3 mr-1" />
                          {stats.missing > 0 || stats.rejected > 0 ? 'Subir Documentos' : 'Ver Documentos'}
                        </Button>
                      )}
                      {getStatusBadge(legalization.status)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-muted-foreground italic">No hay historial disponible.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default LegalizationHistory;
