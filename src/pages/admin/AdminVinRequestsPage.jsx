import React, { useState, useMemo } from 'react';
import { useAdminVinRequests } from '@/hooks/useAdminVinRequests';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, UploadCloud } from 'lucide-react';

// --- Sub-Componentes (Diálogo y Acciones) no necesitan cambios ---
const UploadReportDialog = ({ isOpen, onOpenChange, onSubmit, request }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    setIsUploading(true);
    await onSubmit(request.id, file);
    setIsUploading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir Reporte para {request?.vin}</DialogTitle>
          <DialogDescription>Selecciona el archivo PDF para marcar esta solicitud como completada.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="pdf-file">Archivo PDF</Label>
            <Input id="pdf-file" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files[0])} />
          </div>
          <Button type="submit" disabled={!file || isUploading} className="w-full">
            {isUploading ? "Subiendo..." : "Subir y Completar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const RequestActions = ({ request, onUpdateStatus, onUpload }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onUpdateStatus(request.id, 'processing')} disabled={request.status === 'processing'}>
          Marcar como Procesando
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onUpload(request)}>
          <UploadCloud className="mr-2 h-4 w-4" />
          Subir Reporte
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


// --- Componente Principal de la Página de Admin ---
const AdminVinRequestsPage = () => {
  const { requests: allRequests, isLoading, updateRequestStatus, uploadAndLinkReport } = useAdminVinRequests();
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const ITEMS_PER_PAGE = 10;

  const filteredRequests = useMemo(() => {
    if (!filter) return allRequests;
    return allRequests.filter(req =>
      (req.vin && req.vin.toLowerCase().includes(filter.toLowerCase())) ||
      (req.user_full_name && req.user_full_name.toLowerCase().includes(filter.toLowerCase()))
    );
  }, [allRequests, filter]);

  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredRequests, currentPage]);
  
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);

  const handleUploadClick = (request) => {
    setSelectedRequest(request);
    setIsUploadDialogOpen(true);
  };

  const getStatusVariant = (status) => {
    if (status === 'completed') return 'success';
    if (status === 'processing') return 'default';
    if (status === 'pending') return 'secondary';
    return 'destructive';
  };
  
  if (isLoading) {
    // ... (código del loader sin cambios)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Administrar Solicitudes VIN</h1>
        <p className="text-muted-foreground">Gestiona y actualiza el estado de las verificaciones solicitadas.</p>
      </div>

      {/* ✅ INICIO DE CAMBIOS: Card principal que envuelve todo */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <Input
            placeholder="Filtrar por VIN o usuario..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
      
          <Card className="border">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] pl-6">VIN</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Fecha Solicitud</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right pr-6">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.length > 0 ? (
                    paginatedRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="pl-6 font-mono font-medium">{request.vin}</TableCell>
                        <TableCell>{request.user_full_name || 'N/A'}</TableCell>
                        <TableCell>
                          {new Date(request.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(request.status)} className="capitalize">{request.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <RequestActions request={request} onUpdateStatus={updateRequestStatus} onUpload={handleUploadClick} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No se encontraron solicitudes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {/* ✅ FIN DE CAMBIOS */}

      {selectedRequest && (
        <UploadReportDialog
            isOpen={isUploadDialogOpen}
            onOpenChange={setIsUploadDialogOpen}
            onSubmit={uploadAndLinkReport}
            request={selectedRequest}
        />
      )}
    </div>
  );
};

export default AdminVinRequestsPage;