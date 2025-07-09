import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import LegalizationForm from '@/components/legalization/LegalizationForm';
import LegalizationHistory from '@/components/legalization/LegalizationHistory';
import DocumentUploadModal from '@/components/legalization/DocumentUploadModal';
import { Loader2 } from 'lucide-react';

const LegalizationPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { createLegalization, createDocument, uploadFile, fetchRecords } = useSupabaseData();
    const [legalizations, setLegalizations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLegalization, setSelectedLegalization] = useState(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    // ====================================================================
    // --- INICIO DE LA CORRECCIÓN ---
    // ====================================================================

    // 1. Estabilizamos la función de carga con useCallback
    const loadLegalizations = useCallback(async () => {
        if (!user) {
            setLegalizations([]);
            return;
        }

        const result = await fetchRecords('legalizations', { user_id: user.id }, {
            orderBy: { column: 'created_at', ascending: false }
        });

        if (result.success) {
            setLegalizations(result.data || []);
        }
    }, [user, fetchRecords]);

    // 2. Creamos un useEffect robusto que controla el estado de carga
    useEffect(() => {
        const runLoad = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            
            setLoading(true);
            await loadLegalizations();
            setLoading(false);
        };
        runLoad();
    }, [user, loadLegalizations]);


  const handleSubmit = async (data, uploadedFiles) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Create legalization record
      const legalizationData = {
        vin: data.vin,
        vehicle_info: {
          vin: data.vin,
          color: data.color,
          marca: data.marca,
          modelo: data.modelo,
          ano: data.ano,
          motor: data.motor,
          cilindraje: data.cilindraje
        },
        owner_info: {
          name: data.ownerName,
          phone: data.ownerPhone
        },
        title_info: {
          issue_date: data.titleIssueDate,
          origin_state: data.originState,
          legalization_type: data.legalizationType
        },
        status: 'pending'
      };

      const legalizationResult = await createLegalization(user.id, legalizationData);

      if (legalizationResult.success) {
        // Upload documents if any
        if (Object.keys(uploadedFiles).length > 0) {
          const uploadPromises = Object.entries(uploadedFiles).map(async ([key, file]) => {
            const filePath = `${user.id}/legalizations/${legalizationResult.data.id}/${key}_${file.name}`;
            const uploadResult = await uploadFile('documents', filePath, file);
            
            if (uploadResult.success) {
              return createDocument(user.id, {
                legalization_id: legalizationResult.data.id,
                document_type: key,
                file_name: file.name,
                file_path: filePath,
                file_size: file.size,
                mime_type: file.type,
                status: 'pending'
              });
            }
            return null;
          });

          await Promise.all(uploadPromises);
        }

        toast({
          title: "Solicitud Enviada",
          description: "Tu solicitud de legalización ha sido recibida. Los documentos faltantes pueden subirse posteriormente.",
        });
        
        loadLegalizations();
      }
    } catch (error) {
      console.error('Error submitting legalization:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDocumentModal = (legalization) => {
    setSelectedLegalization(legalization);
    setShowDocumentModal(true);
  };

  const handleCloseDocumentModal = () => {
    setSelectedLegalization(null);
    setShowDocumentModal(false);
  };

  const handleDocumentsUploaded = () => {
    loadLegalizations();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Legalización de Autos</h1>
        <div className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">Cargando legalizaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Legalización de Autos</h1>
      <p className="text-muted-foreground">
        Inicia el proceso para legalizar tu vehículo importado desde Estados Unidos.
      </p>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Nueva Solicitud de Legalización</CardTitle>
          <CardDescription>Completa los pasos a continuación.</CardDescription>
        </CardHeader>
        <CardContent>
          <LegalizationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </CardContent>
      </Card>

      <LegalizationHistory 
        legalizations={legalizations} 
        onOpenDocumentModal={handleOpenDocumentModal} 
      />

      <DocumentUploadModal
        isOpen={showDocumentModal}
        onClose={handleCloseDocumentModal}
        legalization={selectedLegalization}
        onDocumentsUploaded={handleDocumentsUploaded}
      />
    </div>
  );
};

export default LegalizationPage;
