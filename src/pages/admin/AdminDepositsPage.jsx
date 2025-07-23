import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSupabaseClient } from '@supabase/auth-helpers-react'; // Necesario para la función de ver comprobante
import { useAdminData } from '@/hooks/useAdminData'; // Asegúrate que la ruta a tu hook sea correcta

// --- Componentes de UI ---
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

// --- Iconos ---
import { MoreHorizontal, Clock, CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';

/**
 * @description Componente de badge para mostrar el estado de un depósito con íconos y colores.
 * @param {{ status: 'pending' | 'approved' | 'rejected' }} props
 */
const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { text: 'Pendiente', variant: 'secondary', icon: <Clock className="h-4 w-4 mr-1" /> },
    approved: { text: 'Aprobado', variant: 'success', icon: <CheckCircle className="h-4 w-4 mr-1" /> },
    rejected: { text: 'Rechazado', variant: 'destructive', icon: <AlertCircle className="h-4 w-4 mr-1" /> },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant={config.variant} className="flex items-center w-fit">
      {config.icon}
      <span>{config.text}</span>
    </Badge>
  );
};

/**
 * @description Página de administración para ver y gestionar los depósitos de los usuarios.
 */
export const AdminDepositsPage = () => {
  // --- Hooks ---
  const { loading, fetchAllDeposits, updateDepositStatus } = useAdminData();
  const supabase = useSupabaseClient(); // Se usa solo para la URL del comprobante
  const [deposits, setDeposits] = useState([]);
  const [confirmation, setConfirmation] = useState(null); // Guarda el estado para el modal: { action, deposit }

  // --- Lógica de Datos ---
  const loadDeposits = useCallback(async () => {
    const { success, data } = await fetchAllDeposits();
    if (success) {
      setDeposits(data);
    }
  }, [fetchAllDeposits]);

  useEffect(() => {
    loadDeposits();
  }, [loadDeposits]);

  // --- Manejadores de Acciones ---
  const handleUpdateConfirm = async () => {
    if (!confirmation) return;
    
    const { success } = await updateDepositStatus(confirmation.deposit.id, confirmation.action);
    
    if (success) {
      // Actualiza el estado local para reflejar el cambio en la UI inmediatamente
      setDeposits(prevDeposits => prevDeposits.map(d =>
        d.id === confirmation.deposit.id ? { ...d, status: confirmation.action } : d
      ));
    }
    setConfirmation(null); // Cierra el modal de confirmación
  };

  const requestConfirmation = (action, deposit) => {
    setConfirmation({ action, deposit });
  };
  
   const viewReceipt = async (filePath) => { // <-- Añade async aquí
    if (!filePath) return;

    // Cambiamos getPublicUrl por createSignedUrl
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 60); // <-- 60 son los segundos de validez

    if (error) {
      console.error("Error al crear la URL firmada:", error);
      alert("No se pudo obtener el comprobante. Revisa la consola.");
      return;
    }

    if (data.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // --- Renderizado del Componente ---
  return (
    <>
      <motion.div
        className="p-4 md:p-6 space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <header>
          <h1 className="text-3xl font-bold text-foreground">Administración de Depósitos</h1>
          <p className="text-muted-foreground">Revisa, aprueba o rechaza los depósitos enviados por los usuarios.</p>
        </header>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle>Todos los Depósitos</CardTitle>
            <CardDescription>Mostrando {deposits.length} registros encontrados.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Monto (USD)</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha de Pago</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                     <TableRow><TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                  ) : deposits.length > 0 ? (
                    deposits.map((deposit) => (
                      <TableRow key={deposit.id}>
                        <TableCell>
                          <div className="font-medium">{deposit.user_profile?.full_name || 'N/A'}</div>
                          <div className="text-sm text-muted-foreground">{deposit.user_profile?.email || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="font-bold">${parseFloat(deposit.amount).toFixed(2)}</TableCell>
                        <TableCell>{deposit.reference}</TableCell>
                        <TableCell className="hidden md:table-cell">{new Date(deposit.payment_date).toLocaleDateString()}</TableCell>
                        <TableCell><StatusBadge status={deposit.status} /></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => viewReceipt(deposit.receipt_file_path)}><Eye className="mr-2 h-4 w-4" />Ver Comprobante</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => requestConfirmation('approved', deposit)}><CheckCircle className="mr-2 h-4 w-4" />Aprobar</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => requestConfirmation('rejected', deposit)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><AlertCircle className="mr-2 h-4 w-4" />Rechazar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={6} className="h-24 text-center">No hay depósitos registrados.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Confirmación */}
      <AlertDialog open={!!confirmation} onOpenChange={(isOpen) => !isOpen && setConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmation && `Estás a punto de ${confirmation.action === 'approved' ? 'APROBAR' : 'RECHAZAR'} el depósito de $${parseFloat(confirmation.deposit.amount).toFixed(2)} del usuario ${confirmation.deposit.user_profile?.full_name || 'N/A'}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateConfirm}
              className={confirmation?.action === 'rejected' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminDepositsPage;