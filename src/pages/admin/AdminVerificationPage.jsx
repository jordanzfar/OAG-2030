import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getLocalData, updateLocalArrayItem, localStorageKeys } from '@/lib/localStorage';
import VerificationStatsCards from '@/components/admin/VerificationStatsCards';
import VerificationTable from '@/components/admin/VerificationTable';

const AdminVerificationPage = () => {
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Demo data
  const demoClients = [
    {
      id: 'demo-1',
      full_name: 'Juan Cliente',
      email: 'juan@email.com',
      verification_status: 'pending',
      verification_submitted_at: new Date().toISOString(),
      verification_document_path: 'demo-document.pdf',
      verification_notes: null,
      buying_power: 0
    },
    {
      id: 'demo-2',
      full_name: 'Ana Gómez',
      email: 'ana@email.com',
      verification_status: 'verified',
      verification_submitted_at: new Date(Date.now() - 86400000).toISOString(),
      verification_document_path: 'demo-document-2.pdf',
      verification_notes: 'Documentos correctos, verificación aprobada.',
      verification_reviewed_at: new Date(Date.now() - 43200000).toISOString(),
      buying_power: 12000
    },
    {
      id: 'demo-3',
      full_name: 'Carlos Ruiz',
      email: 'carlos@email.com',
      verification_status: 'rejected',
      verification_submitted_at: new Date(Date.now() - 172800000).toISOString(),
      verification_document_path: 'demo-document-3.pdf',
      verification_notes: 'Documento ilegible, solicitar nueva carga.',
      verification_reviewed_at: new Date(Date.now() - 86400000).toISOString(),
      buying_power: 0
    },
    {
      id: 'demo-4',
      full_name: 'María López',
      email: 'maria@email.com',
      verification_status: 'not_verified',
      verification_submitted_at: null,
      verification_document_path: null,
      verification_notes: null,
      buying_power: 0
    },
  ];

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    const clientsData = getLocalData(localStorageKeys.CLIENTS) || demoClients;
    setClients(clientsData);
    setLoading(false);
  };

  const handleReviewSubmit = () => {
    if (!selectedClient || !reviewDecision) return;

    updateLocalArrayItem(localStorageKeys.CLIENTS, selectedClient.id, (client) => ({
      ...client,
      verification_status: reviewDecision,
      verification_notes: reviewNotes,
      verification_reviewed_at: new Date().toISOString()
    }));

    setClients(prev => prev.map(client => 
      client.id === selectedClient.id 
        ? { 
            ...client, 
            verification_status: reviewDecision,
            verification_notes: reviewNotes,
            verification_reviewed_at: new Date().toISOString()
          }
        : client
    ));

    toast({
      title: "Verificación Actualizada (Demo)",
      description: `Cliente ${reviewDecision === 'verified' ? 'verificado' : 'rechazado'} exitosamente.`,
    });

    setIsReviewModalOpen(false);
    resetReviewForm();
  };

  const resetReviewForm = () => {
    setSelectedClient(null);
    setReviewNotes('');
    setReviewDecision('');
  };

  const openReviewModal = (client) => {
    setSelectedClient(client);
    setReviewNotes(client.verification_notes || '');
    setReviewDecision(client.verification_status === 'pending' ? '' : client.verification_status);
    setIsReviewModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verificado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Sin verificar
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando verificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Verificación de Clientes</h1>
          <p className="text-muted-foreground">Gestiona el estado de verificación de los clientes.</p>
        </div>
      </div>

      <VerificationStatsCards clients={clients} />

      <VerificationTable 
        clients={clients}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onReviewClient={openReviewModal}
      />

      {/* Review Modal */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revisar Verificación - {selectedClient?.full_name}</DialogTitle>
            <DialogDescription>
              Revisa los documentos y actualiza el estado de verificación del cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Cliente:</Label>
              <div className="col-span-3 font-medium">{selectedClient?.full_name}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Email:</Label>
              <div className="col-span-3">{selectedClient?.email}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Estado Actual:</Label>
              <div className="col-span-3">{selectedClient && getStatusBadge(selectedClient.verification_status)}</div>
            </div>
            {selectedClient?.verification_document_path && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Documento:</Label>
                <div className="col-span-3">
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Ver Documento
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="decision" className="text-right">Decisión:</Label>
              <Select value={reviewDecision} onValueChange={setReviewDecision}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecciona una decisión" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verified">Verificar Cliente</SelectItem>
                  <SelectItem value="rejected">Rechazar Verificación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="notes" className="text-right">Notas:</Label>
              <Textarea
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Agrega comentarios sobre la verificación..."
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleReviewSubmit} disabled={!reviewDecision}>
              Guardar Decisión
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerificationPage;
