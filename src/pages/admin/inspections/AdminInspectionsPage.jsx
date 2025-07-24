import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

import { columns } from './columns';
import { DataTable } from './data-table';
import { EditInspectionDialog } from './EditInspectionDialog'; // <-- CAMBIO: Importamos el nuevo Dialog

const AdminInspectionsPage = () => {
  const supabase = useSupabaseClient();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingInspection, setEditingInspection] = useState(null);

  const loadInspections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('inspections-proxy');

    if (error) {
      try {
        const errorDetails = await error.context.json();
        console.error("‼️ ERROR DETALLADO DESDE LA EDGE FUNCTION:", errorDetails);
      } catch (e) {
        console.error("Error al invocar la Edge Function:", error.message);
      }
      setInspections([]);
    } else {
      const formattedData = data.map(item => ({
        ...item,
        user_full_name: item.users_profile?.full_name || 'N/A',
        user_email: item.users_profile?.email || 'N/A',
      }));
      setInspections(formattedData);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleEdit = (inspection) => {
    setEditingInspection(inspection);
  };

  const handleCloseDialog = () => {
    setEditingInspection(null);
  };

  const handleUpdateSuccess = () => {
    handleCloseDialog();
    loadInspections();
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Solicitudes de Inspección</CardTitle>
          <CardDescription>
            Visualiza, actualiza el estado y sube los reportes de las inspecciones solicitadas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <DataTable 
              columns={columns({ onEdit: handleEdit })} 
              data={inspections} 
              filterColumn="stock_number" 
            />
          )}
        </CardContent>
      </Card>
      
      {/* --- CAMBIO CLAVE --- */}
      {/* Reemplazamos el Sheet por el nuevo Dialog */}
      <EditInspectionDialog
        inspection={editingInspection}
        isOpen={!!editingInspection}
        onClose={handleCloseDialog}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default AdminInspectionsPage;