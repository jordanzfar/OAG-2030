import { useState, useCallback, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

export const useAdminVinRequests = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabaseClient();
  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_vin_requests');
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching VIN requests:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudieron cargar las solicitudes." });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateRequestStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('vin_check_logs')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Éxito", description: `El estado de la solicitud ha sido actualizado a ${status}.` });
      fetchRequests(); // Recargar la lista para mostrar el cambio
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar el estado." });
    }
  };

  const uploadAndLinkReport = async (id, file) => {
    if (!file) return;
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      // 1. Subir el archivo
      const { error: uploadError } = await supabase.storage
        .from('vin-reports') // Nombre correcto del bucket
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // 2. Obtener la URL pública del archivo subido
      const { data: urlData } = supabase.storage
        .from('vin-reports') // Nombre correcto del bucket
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;

      // 3. Actualizar la base de datos con la URL del PDF y cambiar el estado
      const { error: updateError } = await supabase
        .from('vin_check_logs')
        .update({ pdf_url: publicUrl, status: 'completed' })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      toast({ title: "Éxito", description: "Reporte subido y enlazado correctamente." });
      fetchRequests(); // Recargar la lista
    } catch (error) {
      console.error("Error uploading report:", error);
      toast({ variant: "destructive", title: "Error", description: `No se pudo subir el reporte: ${error.message}` });
    }
  };

  return { requests, isLoading, fetchRequests, updateRequestStatus, uploadAndLinkReport };
};