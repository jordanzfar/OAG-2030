
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Upload, X, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { requiredDocuments } from '@/components/legalization/constants';

const DocumentUploadModal = ({ isOpen, onClose, legalization, onDocumentsUploaded }) => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { createDocument, uploadFile, fetchRecords } = useSupabaseData();
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [loadingDocuments, setLoadingDocuments] = useState(true);

  useEffect(() => {
    if (legalization && user) {
      loadExistingDocuments();
    }
  }, [legalization, user]);

  const loadExistingDocuments = async () => {
    if (!user || !legalization) return;

    setLoadingDocuments(true);
    const result = await fetchRecords('documents', { 
      user_id: user.id, 
      legalization_id: legalization.id 
    });

    if (result.success) {
      setExistingDocuments(result.data || []);
    }
    setLoadingDocuments(false);
  };

  const getDocumentStatus = (documentKey) => {
    const existing = existingDocuments.find(doc => doc.document_type === documentKey);
    if (existing) {
      return {
        exists: true,
        fileName: existing.file_name,
        status: existing.status,
        uploadedAt: existing.created_at
      };
    }
    return { exists: false };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      case 'pending': return 'En revisión';
      default: return 'Desconocido';
    }
  };

  const handleFileChange = (fieldName, e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedFiles(prev => ({ ...prev, [fieldName]: file }));
      // Update the label
      const label = document.getElementById(`modal-${fieldName}-label`);
      if (label) {
        label.textContent = file.name;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !legalization) return;

    if (Object.keys(uploadedFiles).length === 0) {
      toast({
        variant: "destructive",
        title: "Sin documentos",
        description: "Selecciona al menos un documento para subir.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadPromises = Object.entries(uploadedFiles).map(async ([key, file]) => {
        const filePath = `${user.id}/legalizations/${legalization.id}/${key}_${file.name}`;
        const uploadResult = await uploadFile('documents', filePath, file);
        
        if (uploadResult.success) {
          return createDocument(user.id, {
            legalization_id: legalization.id,
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

      const results = await Promise.all(uploadPromises);
      const successCount = results.filter(result => result && result.success).length;

      if (successCount > 0) {
        toast({
          title: "Documentos Subidos",
          description: `Se han subido ${successCount} documento(s) exitosamente.`,
        });
        
        setUploadedFiles({});
        await loadExistingDocuments(); // Reload documents
        onDocumentsUploaded();
        onClose();
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron subir algunos documentos. Inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const DocumentUploadField = ({ id, label, description, required = false }) => {
    const docStatus = getDocumentStatus(id);
    
    return (
      <div className="space-y-2">
        <Label htmlFor={`modal-${id}`} className="flex items-center">
          <Upload className="w-4 h-4 mr-2" />
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
          {docStatus.exists && (
            <CheckCircle className="w-4 h-4 ml-2 text-green-500" />
          )}
        </Label>
        
        {/* Show existing document status */}
        {docStatus.exists && (
          <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded border text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Documento actual:</span>
              <span className={`text-xs px-2 py-1 rounded ${getStatusColor(docStatus.status)}`}>
                {getStatusText(docStatus.status)}
              </span>
            </div>
            <p className="text-muted-foreground mt-1">{docStatus.fileName}</p>
            <p className="text-xs text-muted-foreground">
              Subido: {new Date(docStatus.uploadedAt).toLocaleDateString()}
            </p>
            {docStatus.status === 'rejected' && (
              <p className="text-xs text-red-600 mt-1">
                Este documento fue rechazado. Sube una nueva versión.
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-center w-full">
          <label htmlFor={`modal-${id}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted/80 border-border">
            <div className="flex flex-col items-center justify-center pt-3 pb-4 text-muted-foreground">
              <Upload className="w-5 h-5 mb-1" />
              <p id={`modal-${id}-label`} className="text-xs">
                <span className="font-semibold">
                  {docStatus.exists ? 'Reemplazar archivo' : 'Subir archivo'}
                </span>
              </p>
              <p className="text-xs text-center px-2">{description}</p>
            </div>
            <Input 
              id={`modal-${id}`} 
              type="file" 
              className="hidden" 
              accept=".pdf,.jpg,.jpeg,.png" 
              onChange={(e) => handleFileChange(id, e)}
            />
          </label>
        </div>
        {uploadedFiles[id] && (
          <p className="text-sm text-green-600 flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            Archivo seleccionado: {uploadedFiles[id].name}
          </p>
        )}
      </div>
    );
  };

  if (!legalization) return null;

  // Calculate document statistics
  const totalDocuments = requiredDocuments.length;
  const uploadedCount = existingDocuments.length;
  const approvedCount = existingDocuments.filter(doc => doc.status === 'approved').length;
  const rejectedCount = existingDocuments.filter(doc => doc.status === 'rejected').length;
  const pendingCount = existingDocuments.filter(doc => doc.status === 'pending').length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Subir Documentos Faltantes</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Sube los documentos faltantes para la legalización del VIN: {legalization.vin}
          </DialogDescription>
        </DialogHeader>

        {/* Document Status Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
            <div className="text-2xl font-bold text-blue-600">{uploadedCount}</div>
            <div className="text-sm text-blue-800 dark:text-blue-200">Subidos</div>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800 text-center">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-sm text-green-800 dark:text-green-200">Aprobados</div>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-yellow-800 dark:text-yellow-200">En Revisión</div>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800 text-center">
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <div className="text-sm text-red-800 dark:text-red-200">Rechazados</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso de documentos</span>
            <span>{uploadedCount}/{totalDocuments} documentos</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(uploadedCount / totalDocuments) * 100}%` }}
            ></div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información sobre documentos */}
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Estado de Documentos</h4>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Puedes subir documentos nuevos o reemplazar los existentes. Los documentos rechazados necesitan ser resubidos.
            </p>
          </div>

          {/* Document upload sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Documentos de Identificación</h4>
              <DocumentUploadField 
                id="identificationFront" 
                label="Identificación (Frontal)" 
                description="INE, Pasaporte o Cédula - Lado frontal"
                required={true}
              />
              <DocumentUploadField 
                id="identificationBack" 
                label="Identificación (Trasero)" 
                description="INE, Pasaporte o Cédula - Lado trasero"
                required={true}
              />
              <DocumentUploadField 
                id="proofOfAddress" 
                label="Comprobante de Domicilio" 
                description="Recibo de luz, agua o teléfono (máx. 3 meses)"
                required={true}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-foreground">Documentos del Vehículo</h4>
              <DocumentUploadField 
                id="titleFront" 
                label="Título de Propiedad (Frontal)" 
                description="Title del vehículo - Lado frontal"
                required={true}
              />
              <DocumentUploadField 
                id="titleBack" 
                label="Título de Propiedad (Trasero)" 
                description="Title del vehículo - Lado trasero"
                required={true}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Fotografías del Vehículo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DocumentUploadField 
                id="vehiclePhoto1" 
                label="Foto Frontal" 
                description="Vista frontal completa del vehículo"
              />
              <DocumentUploadField 
                id="vehiclePhoto2" 
                label="Foto Trasera" 
                description="Vista trasera completa del vehículo"
              />
              <DocumentUploadField 
                id="vehiclePhoto3" 
                label="Foto Lateral Izquierda" 
                description="Vista lateral izquierda completa"
              />
              <DocumentUploadField 
                id="vehiclePhoto4" 
                label="Foto Lateral Derecha" 
                description="Vista lateral derecha completa"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Detalles del Vehículo</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentUploadField 
                id="windshieldSerial" 
                label="Número de Serie del Parabrisas" 
                description="Foto clara del número en el parabrisas"
              />
              <DocumentUploadField 
                id="doorSticker" 
                label="Sticker de la Puerta" 
                description="Etiqueta de información en el marco de la puerta"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Subiendo...' : 'Subir Documentos'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentUploadModal;
