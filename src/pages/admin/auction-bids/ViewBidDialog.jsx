import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ViewBidDialog({ bid, isOpen, onClose, onUpdateSuccess }) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const supabase = useSupabaseClient();

  useEffect(() => {
    if (bid) {
      setNewStatus(bid.status);
      setLostReason(bid.lost_reason || '');
    }
  }, [bid]);

  if (!bid) {
    return null;
  }

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatePayload = {
        status: newStatus,
        lost_reason: newStatus === 'lost' ? lostReason : null 
      };

      const { error } = await supabase.from('auction_bids').update(updatePayload).eq('id', bid.id);
      if (error) throw error;

      toast({ title: "Éxito", description: "El estado de la puja ha sido actualizado." });
      onUpdateSuccess();
    } catch (error) {
      console.error("Error updating bid status:", error.message);
      toast({ title: "Error al Actualizar", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Puja para el Lote #{bid.lot_number}</DialogTitle>
          <DialogDescription>{bid.year} {bid.make} {bid.model} (VIN: {bid.vin})</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Columna Izquierda: Información */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="font-semibold">Información del Cliente</h4>
              <p><strong>Nombre:</strong> {bid.user_full_name}</p>
              <p><strong>Email:</strong> {bid.user_email}</p>
            </div>
            <div className="space-y-1 pt-4 border-t">
              <h4 className="font-semibold">Detalles de Subasta</h4>
              <p><strong>Casa de Subasta:</strong> {bid.auction_type}</p>
              <p><strong>Ubicación:</strong> {bid.auction_location_id}</p>
              <p><strong>Fecha:</strong> {format(new Date(bid.auction_date.replace(/-/g, '/')), "PPP", { locale: es })}</p>
              <p><strong>URL:</strong> <a href={bid.vehicle_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver Lote</a></p>
            </div>
             <div className="space-y-1 pt-4 border-t">
              <h4 className="font-semibold">Firma de Autorización</h4>
              <div className="mt-2 border rounded-md p-2 bg-muted flex justify-center"><img src={bid.signature_image_base64} alt="Firma del cliente" className="max-w-full h-auto bg-black" /></div>
            </div>
          </div>

          {/* Columna Derecha: Finanzas y Acciones */}
          <div className="space-y-6">
             <div className="space-y-2 p-4 rounded-lg bg-muted border">
                <h4 className="font-semibold text-lg">Detalles de la Puja</h4>
                <p><strong>Puja Máxima:</strong> <span className="font-bold text-xl text-primary">{currencyFormatter.format(bid.max_bid)}</span></p>
                <p><strong>Total Estimado (solicitud):</strong> {currencyFormatter.format(bid.fees_detail?.total)}</p>
                <p className="pt-2"><strong>Comentarios del Cliente:</strong></p>
                <blockquote className="border-l-2 pl-4 italic text-muted-foreground">{bid.comments || "Ninguno"}</blockquote>
             </div>
             <div className="space-y-2">
              <Label htmlFor="status" className="font-semibold">Actualizar Estado</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status"><SelectValue placeholder="Selecciona un estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="won">Ganada</SelectItem>
                  <SelectItem value="lost">Perdida</SelectItem>
                  <SelectItem value="pending_payment">Pendiente de Pago</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newStatus === 'lost' && (
              <div className="space-y-2">
                <Label htmlFor="lost_reason">Motivo de la Pérdida</Label>
                <Textarea
                  id="lost_reason"
                  placeholder="Ej: La puja superó el presupuesto, el cliente canceló, etc."
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}