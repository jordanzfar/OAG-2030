
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Upload, File, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const DocumentsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createDocument, fetchRecords, deleteRecord, uploadFile } = useSupabaseData();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

    const loadDocuments = useCallback(async () => {
        if (!user) {
            setDocuments([]); 
            return;
        }

        const result = await fetchRecords('documents', { user_id: user.id }, {
            orderBy: { column: 'created_at', ascending: false }
        });

        if (result.success) {
            setDocuments(result.data || []);
        }
    }, [user, fetchRecords]);


    useEffect(() => {
        const runLoad = async () => {
          
            if (!user) {
                setLoading(false);
                setDocuments([]);
                return;
            }
            
            setLoading(true);
            await loadDocuments();
            setLoading(false); 
        }

        runLoad();
    }, [user, loadDocuments]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target);
      const description = formData.get('description') || "Sin descripción";
      const fileInput = e.target.querySelector('input[type="file"]');

      if (fileInput.files.length === 0) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: "Selecciona un archivo para subir." 
        });
        setIsSubmitting(false);
        return;
      }

      const file = fileInput.files[0];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast({ 
          variant: "destructive", 
          title: "Error", 
          description: "El archivo es demasiado grande. Máximo 10MB." 
        });
        setIsSubmitting(false);
        return;
      }

      // Upload file to Supabase Storage
      const filePath = `${user.id}/documents/${Date.now()}_${file.name}`;
      const uploadResult = await uploadFile('documents', filePath, file);

      if (uploadResult.success) {
        // Create document record in database
        const documentResult = await createDocument(user.id, {
          document_type: description,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type,
          status: 'pending'
        });

        if (documentResult.success) {
          toast({
            title: "Documento Subido Exitosamente",
            description: `${file.name} ha sido subido y está pendiente de revisión.`,
          });
          
          // Refresh documents list
          loadDocuments();
          e.target.reset();
          const fileLabel = document.getElementById('doc-file-label');
          if (fileLabel) fileLabel.textContent = 'Seleccionar archivo';
        }
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        variant: "destructive",
        title: "Error al Subir Documento",
        description: "No se pudo subir el documento. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteRecord('documents', id);
    if (result.success) {
      toast({
        title: "Documento Eliminado",
        description: "El documento ha sido eliminado exitosamente.",
      });
      loadDocuments();
    }
  };

  const handleFileChange = (e) => {
    const fileLabel = document.getElementById('doc-file-label');
    if (fileLabel && e.target.files.length > 0) {
      const file = e.target.files[0];
      fileLabel.textContent = file.name;
      
      // Show file size
      const fileSize = (file.size / 1024 / 1024).toFixed(2);
      const sizeInfo = document.getElementById('file-size-info');
      if (sizeInfo) {
        sizeInfo.textContent = `Tamaño: ${fileSize} MB`;
        sizeInfo.className = file.size > 10 * 1024 * 1024 ? 'text-xs text-destructive' : 'text-xs text-muted-foreground';
      }
    } else if (fileLabel) {
      fileLabel.textContent = 'Seleccionar archivo';
      const sizeInfo = document.getElementById('file-size-info');
      if (sizeInfo) {
        sizeInfo.textContent = '';
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'rejected': return <AlertCircle className="h-5 w-5 text-destructive" />;
      default: return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'rejected': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Carga de Documentos</h1>
        <div className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">Cargando documentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Carga de Documentos</h1>
      <p className="text-muted-foreground">
        Sube y gestiona los documentos requeridos para tus trámites (identificación, títulos de vehículos, etc.).
      </p>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Subir Nuevo Documento</CardTitle>
          <CardDescription>Selecciona el archivo y añade una breve descripción.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label htmlFor="description">Descripción del Documento (Opcional)</Label>
              <Input 
                id="description" 
                name="description" 
                placeholder="Ej: Título Ford F-150, INE Lado Frontal, Comprobante de Domicilio" 
                className="mt-1" 
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="documentFile">Archivo</Label>
              <div className="mt-1 flex items-center justify-center w-full">
                <label htmlFor="doc-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p id="doc-file-label" className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG, JPEG (MAX. 10MB)</p>
                    <p id="file-size-info" className="text-xs text-muted-foreground mt-1"></p>
                  </div>
                  <Input 
                    id="doc-upload" 
                    name="documentFile" 
                    type="file" 
                    className="hidden" 
                    required 
                    accept=".pdf,.png,.jpg,.jpeg" 
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
            <Button type="submit" className="mt-4" disabled={isSubmitting}>
              {isSubmitting ? 'Subiendo Documento...' : 'Subir Documento'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Mis Documentos</CardTitle>
          <CardDescription>Listado de documentos subidos y su estado.</CardDescription>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <ul className="space-y-3">
              {documents.map(doc => (
                <li key={doc.id} className="flex items-center justify-between p-3 bg-secondary rounded-md border border-border">
                  <div className="flex items-center space-x-3">
                    <File className="h-6 w-6 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{doc.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.document_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Subido: {new Date(doc.created_at).toLocaleDateString()} • 
                        Tamaño: {(doc.file_size / 1024 / 1024).toFixed(2)} MB • 
                        Estado: <span className={`capitalize font-medium ml-1 ${getStatusColor(doc.status)}`}>
                          {getStatusText(doc.status)}
                        </span>
                      </p>
                      {doc.status === 'rejected' && doc.rejection_reason && (
                        <p className="text-xs text-destructive mt-1">
                          <strong>Motivo del rechazo:</strong> {doc.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(doc.status)}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10 h-8 w-8" 
                      onClick={() => handleDelete(doc.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground italic">No has subido ningún documento todavía.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentsPage;
