import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function EditInspectionDialog({ inspection, isOpen, onClose, onUpdateSuccess }) {
  const supabase = useSupabaseClient(); 
  const { toast } = useToast();
  
  const [newStatus, setNewStatus] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (inspection) {
      setNewStatus(inspection.status);
      setReportFile(null);
    }
  }, [inspection]);

  if (!inspection) {
    return null;
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setReportFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    let reportPath = inspection.report_url; 

    try {
      if (reportFile) {
        const fileExt = reportFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${inspection.user_id}/${inspection.id}/${fileName}`;
        const bucketName = 'inspection-reports'; 

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, reportFile, {
            upsert: true,
          });

        if (uploadError) throw uploadError;
        reportPath = uploadData.path; 
      }
      
      let completedTimestamp = inspection.completed_at;
      if (newStatus === 'completed' && !inspection.completed_at) {
        completedTimestamp = new Date().toISOString();
      }
      
      const { error: updateError } = await supabase
        .from('inspections')
        .update({
          status: newStatus,
          report_url: reportPath,
          completed_at: completedTimestamp,
        })
        .eq('id', inspection.id);

      if (updateError) throw updateError;
      
      toast({
        title: "Éxito",
        description: "La inspección ha sido actualizada.",
      });
      onUpdateSuccess();

    } catch (error) {
      console.error("Error saving inspection:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalles de la Inspección</DialogTitle>
          <DialogDescription>
            Stock #: <span className="font-semibold text-primary">{inspection.stock_number}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          
          {/* Columna de Información */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold">Información del Cliente</h4>
              <p className="text-sm"><strong>Nombre:</strong> {inspection.user_full_name || 'N/A'}</p>
              <p className="text-sm"><strong>Email:</strong> {inspection.user_email}</p>
            </div>
             <div>
              <h4 className="font-semibold">Detalles del Vehículo y Subasta</h4>
              <p className="text-sm"><strong>URL:</strong> <a href={inspection.vehicle_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Abrir enlace</a></p>
              <p className="text-sm"><strong>Fecha Subasta:</strong> {format(new Date(inspection.auction_date), "PPP", { locale: es })}</p>
              <p className="text-sm"><strong>Fecha Inspección:</strong> {format(new Date(inspection.inspection_date), "PPP", { locale: es })}</p>
            </div>
            <div>
              <h4 className="font-semibold">Ubicación</h4>
              <p className="text-sm"><strong>Tipo:</strong> {inspection.location_type?.toUpperCase()}</p>
              <p className="text-sm"><strong>Dirección:</strong> {inspection.location_details?.address || inspection.location_details?.name || 'N/A'}</p>
              {inspection.exact_location_details && <p className="text-sm"><strong>Detalles extra:</strong> {inspection.exact_location_details}</p>}
            </div>
             <div>
                <h4 className="font-semibold">Comentarios del Cliente</h4>
                <p className="text-sm italic text-muted-foreground">{inspection.comments || "Sin comentarios."}</p>
            </div>
          </div>

          {/* Columna de Formulario */}
          <div className="space-y-6 pt-2">
            <h3 className="font-semibold text-lg border-b pb-2">Actualizar Estado</h3>
            
            {/* ========================================================== */}
            {/* AQUÍ ESTÁ LA SECCIÓN PARA CAMBIAR EL ESTADO QUE FALTABA    */}
            {/* ========================================================== */}
            <div className="space-y-2">
              <Label htmlFor="status">Estado de la Inspección</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_payment">Pago Pendiente</SelectItem>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report">Subir Reporte (PDF)</Label>
              <Input id="report" type="file" onChange={handleFileChange} accept=".pdf" />
              {inspection.report_url && !reportFile && (
                <p className="text-xs text-muted-foreground">
                  Ya existe un reporte. Subir uno nuevo lo reemplazará.
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditInspectionDialog;