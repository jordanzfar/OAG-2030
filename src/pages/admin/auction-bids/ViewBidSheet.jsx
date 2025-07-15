import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Loader2, Download } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Formateador de moneda para consistencia
const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function ViewBidSheet({ bid, isOpen, onClose, onUpdateSuccess }) {
  const { toast } = useToast();
  const [newStatus, setNewStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  useEffect(() => {
    if (bid) {
      setNewStatus(bid.status);
    }
  }, [bid]);

  if (!bid) {
    return null;
  }
  
  const handleDownloadPdf = async () => {
      if (!bid.receipt_pdf_path) {
        toast({ title: "Error", description: "No se encontró la ruta del PDF.", variant: "destructive" });
        return;
      }
      setIsDownloading(true);
      try {
          const { data, error } = await supabase.storage
              .from('auction-receipts') // Asegúrate que el nombre del bucket sea correcto
              .createSignedUrl(bid.receipt_pdf_path, 60); 

          if (error) throw error;
          
          window.open(data.signedUrl, '_blank');
      } catch (error) {
          console.error("Error downloading PDF:", error.message);
          toast({ title: "Error de Descarga", description: "No se pudo generar el enlace. Revisa los permisos (RLS) del bucket.", variant: "destructive" });
      } finally {
          setIsDownloading(false);
      }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        const { error } = await supabase
            .from('auction_bids')
            .update({ status: newStatus })
            .eq('id', bid.id);

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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl w-full">
        <SheetHeader>
          <SheetTitle>Detalles de la Puja #{bid.id}</SheetTitle>
          <SheetDescription>
            {bid.year} {bid.make} {bid.model} (VIN: {bid.vin})
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4 overflow-y-auto max-h-[calc(100vh-150px)] pr-6">
            <div className="space-y-1">
              <h4 className="font-semibold text-lg">Información del Cliente</h4>
              <p><strong>Nombre:</strong> {bid.user_full_name}</p>
              <p><strong>Email:</strong> {bid.user_email}</p>
            </div>
            
            {/* --- SECCIÓN AÑADIDA CON MÁS DETALLES --- */}
            <div className="space-y-1 pt-4 border-t">
              <h4 className="font-semibold text-lg">Detalles de Subasta y Vehículo</h4>
              <p><strong>Lote/Stock #:</strong> {bid.lot_number}</p>
              <p><strong>Casa de Subasta:</strong> {bid.auction_type}</p>
              <p><strong>Ubicación:</strong> {bid.auction_location_id}</p>
              <p><strong>Fecha de Subasta:</strong> {format(new Date(bid.auction_date.replace(/-/g, '/')), "PPP", { locale: es })}</p>
              <p><strong>URL:</strong> <a href={bid.vehicle_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver en sitio de subasta</a></p>
            </div>

            <div className="space-y-1 pt-4 border-t">
              <h4 className="font-semibold text-lg">Detalles de la Puja</h4>
              <p><strong>Puja Máxima:</strong> <span className="font-bold text-primary">{currencyFormatter.format(bid.max_bid)}</span></p>
              <p><strong>Total Estimado (en solicitud):</strong> {currencyFormatter.format(bid.fees_detail?.total)}</p>
              <p><strong>Comentarios del Cliente:</strong> <em className="text-muted-foreground">{bid.comments || "Ninguno"}</em></p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-lg">Firma de Autorización</h4>
              <div className="mt-2 border rounded-md p-2 bg-background flex justify-center">
                  <img src={bid.signature_image_base64} alt="Firma del cliente" className="max-w-full h-auto bg-black" />
              </div>
            </div>

             {bid.receipt_pdf_path && (
                <div className="pt-4">
                    <Button onClick={handleDownloadPdf} disabled={isDownloading} className="w-full">
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Comprobante PDF
                    </Button>
                </div>
             )}

            <div className="space-y-2 pt-6 border-t">
              <Label htmlFor="status" className="text-lg font-semibold">Actualizar Estado de la Puja</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processed">Procesada</SelectItem>
                  <SelectItem value="won">Ganada</SelectItem>
                  <SelectItem value="outbid">Superada</SelectItem>
                  <SelectItem value="lost">Perdida</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
        <SheetFooter>
          <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
          <Button onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}