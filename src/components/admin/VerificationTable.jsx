import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, FileText, AlertTriangle } from 'lucide-react';

const VerificationTable = ({ 
  clients, 
  searchTerm, 
  setSearchTerm, 
  statusFilter, 
  setStatusFilter, 
  onReviewClient 
}) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-300">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verificado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-800 text-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pendiente
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-900 text-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Rechazado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-800 text-gray-300">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Sin verificar
          </span>
        );
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.verification_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Clientes</CardTitle>
        <CardDescription>Revisa y actualiza el estado de verificación de los clientes</CardDescription>
        <div className="flex gap-4 pt-2">
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendientes</SelectItem>
              <SelectItem value="verified">Verificados</SelectItem>
              <SelectItem value="rejected">Rechazados</SelectItem>
              <SelectItem value="not_verified">Sin verificar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Envío</TableHead>
              <TableHead>Poder de Compra</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.full_name}</TableCell>
                <TableCell>{client.email}</TableCell>
                <TableCell>{getStatusBadge(client.verification_status)}</TableCell>
                <TableCell>
                  {client.verification_submitted_at 
                    ? new Date(client.verification_submitted_at).toLocaleDateString('es-ES')
                    : 'No enviado'
                  }
                </TableCell>
                <TableCell>
                  <span className={`font-semibold ${client.buying_power > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                    ${(client.buying_power || 0).toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReviewClient(client)}
                    disabled={!client.verification_document_path && client.verification_status !== 'verified' && client.verification_status !== 'rejected'}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {client.verification_status === 'pending' ? 'Revisar' : 'Ver Detalles'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default VerificationTable;
