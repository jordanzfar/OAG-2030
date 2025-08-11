import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Gavel, FileDown, XCircle, CheckCircle, Clock, Award, CreditCard,
  FileSearch, Tag, ThumbsDown, Ban, TimerOff, AlertTriangle, Cog, CheckCheck, CircleSlash
} from 'lucide-react';

/**
 * Muestra el historial de pujas de un usuario con filtros y paginación.
 */
const AuctionBidsHistory = ({
  bids,
  onDownloadReceipt,
  // --- NUEVAS PROPS PARA FILTROS Y PAGINACIÓN ---
  statusOptions = [], // Valor por defecto para evitar errores
  selectedStatus,
  onStatusChange,
  currentPage,
  totalPages,
  onPageChange,
  totalBids,
  bidsPerPage,
}) => {

  const getStatusBadge = (status) => {
    const statusConfig = {
      won: { bg: 'bg-green-100', text: 'text-green-800', label: 'Ganada', Icon: Award },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado', Icon: CheckCheck },
      approved: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Aprobada', Icon: CheckCircle },
      offered: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Ofertado', Icon: Tag },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente', Icon: Clock },
      pending_payment: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente de Pago', Icon: CreditCard },
      reviewing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Revisión', Icon: FileSearch },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Procesando', Icon: Cog },
      lost: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Perdida', Icon: ThumbsDown },
      outbid: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Puja Superada', Icon: XCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rechazada', Icon: XCircle },
      error: { bg: 'bg-red-100', text: 'text-red-800', label: 'Error', Icon: AlertTriangle },
      cancelled: { bg: 'bg-gray-200', text: 'text-gray-800', label: 'Cancelado', Icon: Ban },
      expired: { bg: 'bg-gray-200', text: 'text-gray-800', label: 'Expirado', Icon: TimerOff },
      default: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'No Definido', Icon: CircleSlash }
    };
    const config = statusConfig[status] || statusConfig.default;
    const Icon = config.Icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3 mr-1.5" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const startItem = totalBids > 0 ? (currentPage - 1) * bidsPerPage + 1 : 0;
  const endItem = startItem + bids.length - 1;

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
          <div>
            <CardTitle>Historial de Pujas</CardTitle>
            <CardDescription>Revisa, filtra y navega por tus solicitudes de puja.</CardDescription>
          </div>
          {/* --- NUEVO: Dropdown de Filtros --- */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Label htmlFor="status-filter" className="text-sm shrink-0">Filtrar:</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {bids && bids.length > 0 ? (
          <div className="space-y-4">
            {/* --- Tu estructura de item se respeta 100% --- */}
            {bids.map((bid) => (
              <div key={bid.id} className="p-4 border border-border rounded-lg bg-secondary/50 transition-all hover:bg-secondary">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">Stock Number: {bid.lot_number || 'N/A'}</h4>
                    <h4 className="text-sm text-muted-foreground">VIN: {bid.vin}</h4>
                    <p className="text-sm text-muted-foreground">{bid.make} {bid.model} {bid.year}</p>
                    <p className="text-xs text-muted-foreground mt-1">Enviada: {new Date(bid.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">Subasta: {new Date(bid.auction_date).toLocaleDateString()}</p>
                    <div className="mt-3 border-t border-border/50 pt-3 space-y-1">
                      <p className="text-sm flex justify-start"></p>
                      <p className="text-sm justify-start flex gap-1">
                        <span className="text-mono-foreground">Puja Máxima:</span>
                        <span className="font-bold text-green-400">{formatCurrency(bid.max_bid)}</span>
                      </p>
                    </div>
                    {(bid.status === 'lost' || bid.status === 'outbid') && bid.lost_reason && (
                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-800 dark:text-red-200 flex items-start">
                          <XCircle className="w-3 h-3 inline mr-2 mt-0.5 flex-shrink-0" />
                          <strong>Motivo:</strong>&nbsp;{bid.lost_reason}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center space-y-2 flex-shrink-0 w-[150px]">
                    {getStatusBadge(bid.status)}
                    {bid.invoice_pdf_path && (
                      <Button variant="outline" size="sm" onClick={() => onDownloadReceipt(bid.invoice_pdf_path)} className="text-xs w-full">
                        <FileDown className="w-3 h-3 mr-1" />
                        Invoice
                      </Button>
                    )}
                    {bid.receipt_pdf_path && (
                      <Button variant="outline" size="sm" onClick={() => onDownloadReceipt(bid.receipt_pdf_path)} className="text-xs w-full">
                        <FileDown className="w-3 h-3 mr-1" />
                        Autorización
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Gavel className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No se encontraron pujas</h3>
            <p className="mt-1 text-sm text-muted-foreground">Prueba con otro filtro o crea una nueva puja.</p>
          </div>
        )}
      </CardContent>
      {/* --- NUEVO: Footer con Paginación --- */}
      {totalBids > bidsPerPage && (
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t pt-4 gap-4">
          <div className="text-xs text-muted-foreground">
            Mostrando {startItem} - {endItem} de {totalBids} pujas
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
              Anterior
            </Button>
            <span className="text-sm font-medium">
              Página {currentPage} de {totalPages}
            </span>
            <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
              Siguiente
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default AuctionBidsHistory;