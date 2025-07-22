import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

; // O la ruta correcta a tu cliente de Supabase
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from "@/components/ui/sheet";
import { Loader2 } from "lucide-react";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


export function EditInspectionSheet({ inspection, isOpen, onClose, onUpdateSuccess }) {
  const supabase = useSupabaseClient(); 
  const { updateRecord } = useSupabaseData();
  const { toast } = useToast();
  
  const [newStatus, setNewStatus] = useState('');
  const [reportFile, setReportFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Este Effect actualiza el estado del 'Select' cuando abres un nuevo item
  React.useEffect(() => {
    if (inspection) {
      setNewStatus(inspection.status);
    }
  }, [inspection]);

  // Si no hay una inspección seleccionada, no renderizamos nada
  if (!inspection) {
    return null;
  }

  // Maneja la selección de un archivo desde el input
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setReportFile(e.target.files[0]);
    }
  };

  // Lógica principal para guardar los cambios
  const handleSave = async () => {
    setIsSaving(true);
    // 'report_url' ahora contiene la ruta del archivo, no una URL completa
    let reportPath = inspection.report_url; 

    try {
      // Si el admin seleccionó un nuevo archivo para subir...
      if (reportFile) {
        const fileExt = reportFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        // Creamos una ruta única para el archivo
        const filePath = `${inspection.user_id}/${inspection.id}/${fileName}`;
        
        const bucketName = 'inspection-reports'; 

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, reportFile);

        if (uploadError) {
          // Si la subida falla, lanzamos el error para que lo capture el 'catch'
          throw uploadError;
        }

        // Si la subida es exitosa, guardamos solo la ruta del archivo
        reportPath = uploadData.path; 
      }
       let completedTimestamp = inspection.completed_at;
    // Si el nuevo estado es 'completed' y no había una fecha de finalización previa, la establecemos.
    if (newStatus === 'completed' && !inspection.completed_at) {
      completedTimestamp = new Date().toISOString();
    }
      // Preparamos los datos para actualizar la tabla 'inspections'
      const updateData = {
        status: newStatus,
        report_url: reportPath,
        completed_at: completedTimestamp,
      };

      const { success, error: updateError } = await updateRecord('inspections', inspection.id, updateData);

      if (!success) {
        throw updateError;
      }
      
      toast({
        title: "Éxito",
        description: "La inspección ha sido actualizada.",
      });
      onUpdateSuccess(); // Llama a la función para cerrar el panel y recargar la lista

    } catch (error) {
      console.error("Error saving inspection:", error);
      toast({
        variant: "destructive",
        title: "Error al guardar",
        description: error.message,
      });
    } finally {
      setIsSaving(false); // Nos aseguramos de que el botón se reactive
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg w-full">
        <SheetHeader>
          <SheetTitle>Detalles de la Inspección</SheetTitle>
          <SheetDescription>
            Stock #: <span className="font-semibold text-primary">{inspection.stock_number}</span>
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-4 overflow-y-auto max-h-[calc(100vh-150px)] pr-6">
          {/* Detalles de la inspección */}
          <h4 className="font-semibold">Información del Cliente</h4>
          <p className="text-sm"><strong>Nombre:</strong> {inspection.user_full_name || 'N/A'}</p>
          <p className="text-sm"><strong>Email:</strong> {inspection.user_email}</p>
          
          <h4 className="font-semibold mt-4">Detalles del Vehículo y Subasta</h4>
          <p className="text-sm"><strong>URL:</strong> <a href={inspection.vehicle_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{inspection.vehicle_url}</a></p>
          <p className="text-sm"><strong>Fecha Subasta:</strong> {format(new Date(inspection.auction_date), "PPP", { locale: es })}</p>
          <p className="text-sm"><strong>Fecha Inspección:</strong> {format(new Date(inspection.inspection_date), "PPP", { locale: es })}</p>

          <h4 className="font-semibold mt-4">Ubicación</h4>
          <p className="text-sm"><strong>Tipo:</strong> {inspection.location_type?.toUpperCase()}</p>
          <p className="text-sm"><strong>Dirección:</strong> {inspection.location_details?.address || inspection.location_details?.name || 'N/A'}</p>
          {inspection.exact_location_details && <p className="text-sm"><strong>Detalles extra:</strong> {inspection.exact_location_details}</p>}

          <h4 className="font-semibold mt-4">Comentarios del Cliente</h4>
          <p className="text-sm italic text-muted-foreground">{inspection.comments || "Sin comentarios."}</p>

          {/* Formulario de Edición */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="font-semibold text-lg">Actualizar Estado</h3>
            <div className="space-y-2">
              <Label htmlFor="status">Estado de la Inspección</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_payment">Pago Pendiente</SelectItem>
                  <SelectItem value="scheduled">Programada</SelectItem>
                  <SelectItem value="on_hold">En Espera</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report">Subir Reporte de Inspección (PDF)</Label>
              <Input id="report" type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" />
              {inspection.report_url && !reportFile && (
                <p className="text-xs text-muted-foreground">
                    Ya existe un reporte cargado. Subir uno nuevo lo reemplazará.
                </p>
              )}
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button variant="outline">Cancelar</Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Si estás exportando por defecto, asegúrate que el archivo lo haga
export default EditInspectionSheet;