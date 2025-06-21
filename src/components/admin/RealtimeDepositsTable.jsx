
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, Clock, Eye, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const RealtimeDepositsTable = ({ deposits, loading, onStatusUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { icon: CheckCircle, color: 'text-green-900', bg: 'bg-green-300', label: 'Confirmado' },
      pending: { icon: Clock, color: 'text-yellow-900', bg: 'bg-yellow-300', label: 'Pendiente' },
      rejected: { icon: XCircle, color: 'text-red-900', bg: 'bg-red-300', label: 'Rechazado' }
    };

    const config = statusConfig[status] || { icon: Clock, color: 'text-gray-900', bg: 'bg-gray-300', label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredDeposits = deposits.filter(deposit => {
    const matchesSearch = searchTerm === '' ||
      deposit.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deposit.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || deposit.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (depositId, newStatus) => {
    onStatusUpdate(depositId, newStatus);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Depósitos en Tiempo Real</CardTitle>
          <CardDescription>Cargando depósitos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Depósitos en Tiempo Real</CardTitle>
        <CardDescription>Gestiona y confirma depósitos de clientes</CardDescription>
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <Input
            placeholder="Buscar por cliente o referencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="confirmed">Confirmado</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Fecha Pago</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDeposits.length > 0 ? filteredDeposits.map((deposit, index) => (
              <motion.tr
                key={deposit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{deposit.client_name}</div>
                    <div className="text-sm text-muted-foreground">{deposit.client_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-green-900" />
                    <span className="font-semibold text-green-900">
                      {parseFloat(deposit.amount).toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-sm">{deposit.reference}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(deposit.payment_date).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell>
                  {getStatusBadge(deposit.status)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(deposit.created_at).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      {deposit.receipt_file_path && (
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Comprobante
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(deposit.id, 'confirmed')}
                        disabled={deposit.status === 'confirmed'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-900" />
                        Confirmar Depósito
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(deposit.id, 'rejected')}
                        disabled={deposit.status === 'rejected'}
                      >
                        <XCircle className="w-4 h-4 mr-2 text-red-900" />
                        Rechazar Depósito
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron depósitos con los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RealtimeDepositsTable;
