import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, AlertCircle } from 'lucide-react';

const DepositsTable = ({ deposits, onStatusChange }) => {
  const getDepositStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Confirmado</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Pendiente</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Rechazado</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Desconocido</span>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Depósitos</CardTitle>
        <CardDescription>Confirma y gestiona los depósitos de los clientes</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deposits.map((deposit) => (
              <TableRow key={deposit.id}>
                <TableCell className="font-medium">{deposit.client_name}</TableCell>
                <TableCell>
                  <span className="font-semibold">${deposit.amount.toLocaleString()}</span>
                </TableCell>
                <TableCell>{deposit.method}</TableCell>
                <TableCell>
                  {new Date(deposit.created_at).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell>{getDepositStatusBadge(deposit.status)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(deposit.id, 'confirmed')}
                        disabled={deposit.status === 'confirmed'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Confirmar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onStatusChange(deposit.id, 'rejected')}
                        disabled={deposit.status === 'rejected'}
                      >
                        <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                        Rechazar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DepositsTable;
