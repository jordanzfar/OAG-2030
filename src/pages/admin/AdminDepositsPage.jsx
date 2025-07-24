import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAdminData } from '@/hooks/useAdminData';

// --- Componentes de UI y Otros ---
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // ✅ Select para el filtro de estado
import { StatusBadge } from '@/components/ui/StatusBadge';

// --- Iconos ---
import { MoreHorizontal, Eye, CheckCircle, AlertCircle, Loader2, ArrowUpDown, Search } from 'lucide-react';

/**
 * @description Formatea un número como moneda USD (ej: $11,000.00)
 */
const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericAmount);
};

/**
 * @description Fila de la tabla que representa un único depósito.
 */
const DepositRow = React.memo(({ deposit, onViewReceipt, onActionRequest }) => (
    <TableRow>
      <TableCell>
        <div className="font-medium">{deposit.full_name || 'N/A'}</div>
        <div className="text-sm text-muted-foreground">{deposit.email || 'N/A'}</div>
        <div className="text-xs text-gray-500 mt-1">ID: {deposit.short_id || 'N/A'}</div>
      </TableCell>
      <TableCell className="font-bold">{formatCurrency(deposit.amount)}</TableCell>
      <TableCell>{deposit.moneda || 'N/A'}</TableCell>
      <TableCell>{deposit.reference}</TableCell>
      <TableCell className="hidden md:table-cell">{new Date(deposit.updated_at).toLocaleDateString()}</TableCell>
      <TableCell><StatusBadge status={deposit.status} /></TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onViewReceipt(deposit.receipt_file_path)}><Eye className="mr-2 h-4 w-4" />Ver Comprobante</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onActionRequest('approved', deposit)}><CheckCircle className="mr-2 h-4 w-4" />Aprobar</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onActionRequest('rejected', deposit)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><AlertCircle className="mr-2 h-4 w-4" />Rechazar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
));

/**
 * @description Modal de confirmación para aprobar o rechazar un depósito.
 */
const ConfirmationModal = ({ confirmation, onClose, onConfirm, isLoading }) => {
  if (!confirmation) return null;

  const { action, deposit } = confirmation;
  const actionText = action === 'approved' ? 'APROBAR' : 'RECHAZAR';
  const actionClass = action === 'rejected' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : '';

  return (
    <AlertDialog open={!!confirmation} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de {actionText} el depósito de {formatCurrency(deposit.amount)} del usuario {deposit.full_name || 'N/A'}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={actionClass} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


/**
 * @description Página de administración para ver y gestionar los depósitos de los usuarios.
 */
export const AdminDepositsPage = () => {
  // --- Hooks ---
  const { loading, fetchAllDeposits, updateDepositStatus } = useAdminData();
  const supabase = useSupabaseClient();
  const [deposits, setDeposits] = useState([]);
  const [confirmation, setConfirmation] = useState(null);

  // --- Estados para Filtro y Ordenamiento ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'updated_at', direction: 'descending' });
  const [statusFilter, setStatusFilter] = useState('all'); // ✅ Estado para el filtro de estado

  // --- Lógica de Datos ---
  const loadDeposits = useCallback(async () => {
    const { success, data } = await fetchAllDeposits();
    if (success) setDeposits(data || []);
  }, [fetchAllDeposits]);

  useEffect(() => { loadDeposits(); }, [loadDeposits]);

  // ✅ --- Lógica optimizada para procesar datos (con filtro de estado añadido) ---
  const processedDeposits = useMemo(() => {
    let processableItems = [...deposits];

    // 1. Filtrado por estado
    if (statusFilter !== 'all') {
      processableItems = processableItems.filter(item => item.status === statusFilter);
    }

    // 2. Filtrado por término de búsqueda
    if (searchTerm) {
      const lowercasedFilter = searchTerm.toLowerCase();
      processableItems = processableItems.filter(item =>
        item.full_name?.toLowerCase().includes(lowercasedFilter) ||
        item.email?.toLowerCase().includes(lowercasedFilter) ||
        item.short_id?.toLowerCase().includes(lowercasedFilter)
      );
    }

    // 3. Ordenamiento
    if (sortConfig.key) {
      processableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'updated_at') {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return processableItems;
  }, [deposits, searchTerm, statusFilter, sortConfig]); // ✅ statusFilter añadido a las dependencias

  // --- Manejador para cambiar el orden ---
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- Manejadores de Acciones ---
  const handleUpdateConfirm = async () => {
    if (!confirmation) return;
    const { success } = await updateDepositStatus(confirmation.deposit.id, confirmation.action);
    if (success) {
      setDeposits(prev => prev.map(d =>
        d.id === confirmation.deposit.id ? { ...d, status: confirmation.action } : d
      ));
    }
    setConfirmation(null);
  };

  const viewReceipt = async (filePath) => {
    if (!filePath) return;
    const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 60);
    if (error) {
      console.error("Error al crear la URL firmada:", error);
      alert("No se pudo obtener el comprobante. Revisa la consola.");
      return;
    }
    if (data.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  // --- Renderizado ---
  const renderTableContent = () => {
    if (loading && deposits.length === 0) {
      return (<TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>);
    }
    if (processedDeposits.length === 0) {
      return (<TableRow><TableCell colSpan={7} className="h-24 text-center">{searchTerm || statusFilter !== 'all' ? 'No se encontraron resultados.' : 'No hay depósitos registrados.'}</TableCell></TableRow>);
    }
    return processedDeposits.map((deposit) => (
      <DepositRow key={deposit.id} deposit={deposit} onViewReceipt={viewReceipt} onActionRequest={(action, d) => setConfirmation({ action, deposit: d })}/>
    ));
  };

  return (
    <>
      <motion.div className="p-4 md:p-6 space-y-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <header>
          <h1 className="text-3xl font-bold text-foreground">Administración de Depósitos</h1>
          <p className="text-muted-foreground">Revisa, aprueba o rechaza los depósitos enviados por los usuarios.</p>
        </header>

        <Card className="shadow-lg border-border">
          <CardHeader>
            <CardTitle>Todos los Depósitos</CardTitle>
            <CardDescription>Mostrando {processedDeposits.length} de {deposits.length} registros.</CardDescription>
            {/* ✅ --- Controles de filtro (Búsqueda y Estado) --- */}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Buscar por usuario, ID o email..." className="w-full pl-9" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead><Button variant="ghost" onClick={() => handleSort('moneda')}>Moneda<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="hidden md:table-cell"><Button variant="ghost" onClick={() => handleSort('updated_at')}>Fecha de Creación<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {renderTableContent()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <ConfirmationModal confirmation={confirmation} onClose={() => setConfirmation(null)} onConfirm={handleUpdateConfirm} isLoading={loading} />
    </>
  );
};

export default AdminDepositsPage;