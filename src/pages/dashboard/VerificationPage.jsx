import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileText, Camera, UserCheck, CheckCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// --- Componente Reutilizable para la Zona de Carga (Sin cambios) ---
const FileUploader = ({ onFileSelect, documentType, isUploading }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0], documentType);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0], documentType);
    }
    e.target.value = ''; // Reset input
  };

  return (
    <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} className="w-full">
      <label 
        htmlFor={`dropzone-file-${documentType}`} 
        className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-border bg-secondary hover:bg-muted/50"}`}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
          <p className="mb-2 text-sm text-muted-foreground">
            <span className="font-semibold">Haz clic o arrastra</span>
          </p>
          <p className="text-xs text-muted-foreground">PNG, JPG, PDF (MAX. 5MB)</p>
        </div>
        <input 
          id={`dropzone-file-${documentType}`} 
          type="file" 
          className="hidden" 
          accept="image/png, image/jpeg, application/pdf"
          onChange={handleChange}
          disabled={isUploading}
        />
      </label>
      {isUploading && <p className="text-sm text-muted-foreground mt-2 text-center">Procesando...</p>}
    </form>
  );
};

// --- Componente Reutilizable para cada Documento (Sin cambios) ---
const DocumentSlot = ({ icon, title, documentType, doc, onFileUpload, onFileDelete, isUploading }) => {
  const getStatusInfo = (status) => {
    switch (status) {
      case 'approved': return { Icon: CheckCircle, color: 'text-green-500', text: 'Aprobado' };
      case 'pending': return { Icon: RefreshCw, color: 'text-yellow-500', text: 'En Revisión' };
      case 'rejected': return { Icon: AlertCircle, color: 'text-red-500', text: 'Rechazado' };
      default: return { Icon: null, color: '', text: '' };
    }
  };

  const statusInfo = doc ? getStatusInfo(doc.status) : null;

  return (
    <div className="p-4 border rounded-lg bg-background">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          {icon}
          <div>
            <p className="font-semibold text-foreground">{title}</p>
            {doc ? (
              <div className="mt-1">
                <p className="text-sm text-muted-foreground truncate max-w-[200px]">{doc.file_name}</p>
                <div className={`flex items-center text-sm font-medium ${statusInfo.color}`}>
                  {statusInfo.Icon && <statusInfo.Icon className="h-4 w-4 mr-1.5" />}
                  {statusInfo.text}
                </div>
              </div>
            ) : (
               <p className="text-sm text-muted-foreground">Aún no has subido este documento.</p>
            )}
          </div>
        </div>

        <div className="mt-4 md:mt-0 md:ml-4 flex-shrink-0 w-full md:w-auto">
          {doc ? (
            <div className="flex items-center justify-end space-x-2">
               {(doc.status === 'pending' || doc.status === 'rejected') && (
                 <Button variant="destructive" size="sm" onClick={() => onFileDelete(doc)} disabled={isUploading}>
                  <Trash2 className="h-4 w-4 mr-1" /> Borrar
                </Button>
               )}
            </div>
          ) : (
            <FileUploader onFileSelect={onFileUpload} documentType={documentType} isUploading={isUploading} />
          )}
        </div>
      </div>
       {doc && doc.status === 'rejected' && doc.rejection_reason && (
        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
          <strong>Motivo del rechazo:</strong> {doc.rejection_reason}
        </div>
      )}
    </div>
  );
};


// --- Página Principal de Verificación (Lógica Final) ---
const VerificationPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { fetchRecords, uploadFile, createRecord, deleteRecord, deleteFile } = useSupabaseData(); 

  const [documents, setDocuments] = useState({ id_front: null, id_back: null, selfie: null });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const documentTypes = ['id_front', 'id_back', 'selfie'];

  const loadUserDocuments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { success, data } = await fetchRecords('documents', { user_id: user.id }, {
      filter: { column: 'document_type', operator: 'in', value: documentTypes }
    });
    
    if (success) {
        const userDocs = { id_front: null, id_back: null, selfie: null }; // Reset state
        if (data) {
            data.forEach(doc => {
                if (documentTypes.includes(doc.document_type)) {
                    userDocs[doc.document_type] = doc;
                }
            });
        }
        setDocuments(userDocs);
    }
    setLoading(false);
  }, [user, fetchRecords]);

  useEffect(() => {
    loadUserDocuments();
  }, [loadUserDocuments]);

  const handleFileUpload = async (file, documentType) => {
    if (!user || !file) return;

    // 1. Validar archivo
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxFileSize) {
      toast({ variant: "destructive", title: "Archivo muy grande", description: "El archivo no debe superar los 5MB." });
      return;
    }
    
    setIsUploading(true);
    try {
      // 2. Si existe un documento, borrar el anterior (lógica de reemplazo)
      const existingDoc = documents[documentType];
      if (existingDoc) {
        await deleteFile('kycdocuments', existingDoc.file_path);
        await deleteRecord('documents', existingDoc.id);
      }

      // 3. Subir el nuevo archivo
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${documentType}/${Date.now()}.${fileExt}`;
      const uploadResult = await uploadFile('kycdocuments', filePath, file);

      if (!uploadResult.success) throw new Error(uploadResult.error?.message || 'Error al subir el archivo.');
      
      // 4. Crear nuevo registro en la base de datos
      const newDocumentData = {
        user_id: user.id,
        document_type: documentType,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending',
      };
      const createResult = await createRecord('documents', newDocumentData);

      if (!createResult.success) throw new Error(createResult.error?.message || 'Error al guardar el registro.');

      toast({ title: "Éxito", description: `"${file.name}" se subió y está en revisión.` });
      await loadUserDocuments(); // Recargar datos para actualizar la UI

    } catch (error) {
      console.error("Error en la carga:", error);
      toast({ variant: "destructive", title: "Error en la carga", description: error.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (doc) => {
    // 1. Añadimos una validación más estricta para depurar.
    if (!doc || !doc.id || !doc.file_path) {
      console.error("Intento de borrado inválido. El objeto 'doc' está incompleto:", doc);
      toast({ 
        variant: "destructive", 
        title: "Error Interno", 
        description: "Faltan datos para poder borrar el documento." 
      });
      return;
    }
    
    // 2. Añadimos un log para confirmar que la función se está ejecutando.
    console.log("Iniciando borrado para el documento:", doc);
    setIsUploading(true);
    try {
      // El resto de la lógica permanece igual.
      await deleteFile('kycdocuments', doc.file_path);
      const { success, error } = await deleteRecord('documents', doc.id);

      if (!success) {
        throw new Error(error?.message || "No se pudo borrar el registro de la base de datos.");
      }
      
      toast({ title: "Documento Eliminado", description: "Puedes subir uno nuevo." });
      await loadUserDocuments();

    } catch (error) {
       console.error("Error detallado al eliminar:", error);
       toast({ 
         variant: "destructive", 
         title: "Error al Eliminar", 
         description: error.message 
        });
    } finally {
        setIsUploading(false);
    }
  };
  
  if (loading) {
      return <div className="flex justify-center items-center h-64">Cargando datos de verificación...</div>;
  }

  const allDocsApproved = documentTypes.every(type => documents[type]?.status === 'approved');

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Verificación de Identidad</h1>
        <p className="text-muted-foreground mt-1">
          Para tu seguridad, necesitamos verificar tu identidad. Por favor, sube los siguientes documentos.
        </p>
      </div>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center"><UserCheck className="mr-2 h-5 w-5" />Documentos Requeridos</CardTitle>
          <CardDescription>Sube una foto clara de cada documento. Los archivos serán revisados por nuestro equipo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DocumentSlot icon={<FileText className="h-8 w-8 text-primary" />} title="Frente de tu Identificación Oficial" documentType="id_front" doc={documents.id_front} onFileUpload={handleFileUpload} onFileDelete={handleFileDelete} isUploading={isUploading} />
          <DocumentSlot icon={<FileText className="h-8 w-8 text-primary" />} title="Reverso de tu Identificación Oficial" documentType="id_back" doc={documents.id_back} onFileUpload={handleFileUpload} onFileDelete={handleFileDelete} isUploading={isUploading} />
          <DocumentSlot icon={<Camera className="h-8 w-8 text-primary" />} title="Selfie sosteniendo tu Identificación" documentType="selfie" doc={documents.selfie} onFileUpload={handleFileUpload} onFileDelete={handleFileDelete} isUploading={isUploading} />
        </CardContent>
      </Card>
      
      {allDocsApproved && (
         <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
            <h3 className="text-lg font-semibold text-green-600">¡Identidad Verificada!</h3>
            <p className="text-green-700">Todos tus documentos han sido aprobados. Ya tienes acceso completo a la plataforma.</p>
        </div>
      )}
    </div>
  );
};

export default VerificationPage;