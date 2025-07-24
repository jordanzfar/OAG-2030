import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminData } from '@/hooks/useAdminData';
import { useAdminActions } from '@/hooks/useAdminActions';
import { Download, Loader2, Save } from 'lucide-react';

// DocumentCard sub-component
const DocumentCard = ({ doc, onStatusChange, onSaveStatus, onViewOrDownload }) => (
  <div className="space-y-4 pt-2">
    {doc.previewUrl ? (
      <>
        {doc.mime_type?.startsWith('image/') && (
          <img 
            src={doc.previewUrl}
            alt={`Vista previa de ${doc.document_type}`} 
            className="rounded-md max-h-80 w-full object-contain border bg-muted" 
          />
        )}
        {doc.mime_type === 'application/pdf' && (
          <iframe
            src={doc.previewUrl}
            title={`Vista previa de ${doc.document_type}`}
            className="rounded-md w-full h-80 border bg-muted"
          />
        )}
      </>
    ) : (
      <div className="text-center p-8 bg-muted rounded-md">
        <p className="text-muted-foreground">Vista previa no disponible.</p>
      </div>
    )}
    <div className="flex items-center justify-between gap-2 p-2 border rounded-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <Label htmlFor={`status-${doc.id}`} className="text-xs">Estado:</Label>
        <Select value={doc.status} onValueChange={(newStatus) => onStatusChange(doc.id, newStatus)}>
          <SelectTrigger id={`status-${doc.id}`} className="h-8 w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="approved">Aprobado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onSaveStatus(doc.id, doc.status)}>
          <Save className="h-4 w-4" />
        </Button>
      </div>
      <Button variant="outline" size="sm" onClick={() => onViewOrDownload(doc.file_path)}>
        <Download className="mr-2 h-4 w-4"/> Ver/Descargar
      </Button>
    </div>
  </div>
);


// Componente Principal del Modal
export function LegalizationDetailsModal({ isOpen, onClose, legalization, onUpdate }) {
  const { getDocumentsForLegalization, getDocumentDownloadUrl } = useAdminData();
  const { updateLegalization, updateDocumentStatus, loading: isActionLoading } = useAdminActions();
  
  const [mainStatus, setMainStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [missingInfoDetails, setMissingInfoDetails] = useState('');
  
  const [documents, setDocuments] = useState([]);
  const [isFetchingDocs, setIsFetchingDocs] = useState(false);
  const [documentStatusFilter, setDocumentStatusFilter] = useState('all');
  const [filteredDocuments, setFilteredDocuments] = useState([]);

  useEffect(() => {
    if (isOpen && legalization) {
      setMainStatus(legalization.status || 'pending');
      setAdminNotes(legalization.admin_notes || '');
      setMissingInfoDetails(legalization.missing_information_details || '');
      setDocumentStatusFilter('all'); 

      const fetchDocs = async () => {
        setIsFetchingDocs(true);
        const result = await getDocumentsForLegalization(legalization.id);
        
        if (result.success && result.data) {
          const BUCKET_LEGALIZACIONES = 'documents';
          const docsWithUrls = await Promise.all(result.data.map(async (doc) => {
            if (doc.mime_type?.startsWith('image/') || doc.mime_type === 'application/pdf') {
              const urlResult = await getDocumentDownloadUrl(doc.file_path, BUCKET_LEGALIZACIONES);
              return { ...doc, previewUrl: urlResult.success ? urlResult.url : null };
            }
            return doc;
          }));
          setDocuments(docsWithUrls);
        } else {
          setDocuments([]);
        }
        setIsFetchingDocs(false);
      };
      fetchDocs();
    }
  }, [isOpen, legalization, getDocumentsForLegalization, getDocumentDownloadUrl]);
  
  useEffect(() => {
    const newFilteredDocs = documentStatusFilter === 'all'
      ? documents
      : documents.filter(doc => doc.status === documentStatusFilter);
    setFilteredDocuments(newFilteredDocs);
  }, [documentStatusFilter, documents]);

  const handleDownload = async (filePath) => {
    const BUCKET_NAME = 'documents'; 
    const result = await getDocumentDownloadUrl(filePath, BUCKET_NAME);
    if (result.success && result.url) {
        window.open(result.url, '_blank');
    }
  };

  const handleDocumentStatusChange = (docId, newStatus) => {
    setDocuments(docs => docs.map(doc => doc.id === docId ? { ...doc, status: newStatus } : doc));
  };

  const handleSaveDocumentStatus = async (docId, newStatus) => {
    await updateDocumentStatus(docId, newStatus);
  };
  
  const handleSaveChanges = async () => {
    if (!legalization) return;

    const payload = {
      status: mainStatus,
      admin_notes: adminNotes,
      missing_information_details: mainStatus === 'missing_information' ? missingInfoDetails : null
    };
    
    const result = await updateLegalization(legalization.id, payload);
    if (result.success) {
      onUpdate();
      onClose();
    }
  };

  if (!legalization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Solicitud</DialogTitle>
          <DialogDescription>VIN: {legalization.vin} - Solicitado por: {legalization.user_profile?.email || 'N/A'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[75vh] overflow-y-auto pr-4">
          
          {/* Columna Izquierda: Información y Acciones */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Información General</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                  <p><strong>Marca/Modelo:</strong> {legalization.vehicle_info?.marca} {legalization.vehicle_info?.modelo} ({legalization.vehicle_info?.ano})</p>
                  <p><strong>Propietario:</strong> {legalization.owner_info?.name} ({legalization.owner_info?.phone})</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg">Acciones de Legalización</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Estado General de la Solicitud</Label>
                  <Select value={mainStatus} onValueChange={setMainStatus}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="missing_documents">Documentos faltantes</SelectItem>
                      <SelectItem value="missing_information">Información faltante</SelectItem>
                      <SelectItem value="deposit_required">Depósito requerido</SelectItem>
                      <SelectItem value="processing">Procesando</SelectItem>
                      <SelectItem value="final_payment_required">Pago final requerido</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {mainStatus === 'missing_information' && (
                  <div>
                    <Label htmlFor="missing-info-details">Detallar Información Faltante</Label>
                    <Textarea
                      id="missing-info-details"
                      placeholder="Ej: Falta el número de licencia, la dirección del propietario es incorrecta..."
                      value={missingInfoDetails}
                      onChange={(e) => setMissingInfoDetails(e.target.value)}
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="admin-notes">Notas Internas (visibles solo para administradores)</Label>
                  <Textarea id="admin-notes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha: Pestañas de Documentos */}
          <div className="space-y-4">
              <Card className="h-full">
                <CardHeader><CardTitle className="text-lg">Documentos Adjuntos</CardTitle></CardHeader>
                <CardContent>
                  {isFetchingDocs ? <Loader2 className="animate-spin mx-auto" /> : 
                    documents.length > 0 ? (
                      <>
                        <div className="mb-4 flex items-center gap-2">
                          <Label htmlFor="doc-status-filter" className="text-sm">Filtrar:</Label>
                          <Select value={documentStatusFilter} onValueChange={setDocumentStatusFilter}>
                            <SelectTrigger id="doc-status-filter" className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos</SelectItem>
                              <SelectItem value="pending">Pendiente</SelectItem>
                              <SelectItem value="approved">Aprobado</SelectItem>
                              <SelectItem value="rejected">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {filteredDocuments.length > 0 ? (
                            <Tabs defaultValue={filteredDocuments[0].id} className="w-full">
                              <TabsList className="h-auto flex-wrap justify-start">
                                {filteredDocuments.map(doc => <TabsTrigger key={doc.id} value={doc.id} className="flex-shrink-0">{doc.document_type}</TabsTrigger>)}
                              </TabsList>
                              {filteredDocuments.map(doc => (
                                <TabsContent key={doc.id} value={doc.id}>
                                  <DocumentCard doc={doc} onStatusChange={handleDocumentStatusChange} onSaveStatus={handleSaveDocumentStatus} onViewOrDownload={handleDownload}/>
                                </TabsContent>
                              ))}
                            </Tabs>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-4">No hay documentos que coincidan con el estado seleccionado.</p>
                        )}
                      </>
                    ) : <p className="text-muted-foreground text-sm text-center py-4">No hay documentos para esta solicitud.</p>
                  }
                </CardContent>
              </Card>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSaveChanges} disabled={isActionLoading}>
            {isActionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios Generales
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}