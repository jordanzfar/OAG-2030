import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const RealtimeRequestsTable = ({ requests, loading, onStatusUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'text-yellow-900', bg: 'bg-yellow-300', label: 'Pendiente' },
      processing: { icon: Clock, color: 'text-blue-900', bg: 'bg-blue-300', label: 'Procesando' },
      completed: { icon: CheckCircle, color: 'text-green-900', bg: 'bg-green-300', label: 'Completado' },
      approved: { icon: CheckCircle, color: 'text-green-900', bg: 'bg-green-300', label: 'Aprobado' },
      rejected: { icon: XCircle, color: 'text-red-900', bg: 'bg-red-300', label: 'Rechazado' },
      cancelled: { icon: XCircle, color: 'text-gray-900', bg: 'bg-gray-300', label: 'Cancelado' }
    };
    const config = statusConfig[status] || { icon: AlertTriangle, color: 'text-gray-900', bg: 'bg-gray-300', label: status };
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      // CORRECCIÓN: Apuntar a request.user para la búsqueda
      const user = request.user || {};
      const matchesSearch = searchTerm === '' ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      // CORRECCIÓN: Usar type_key para el filtro de tipo
      const matchesType = typeFilter === 'all' || request.type_key === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchTerm, statusFilter, typeFilter]);

  const handleStatusChange = (requestId, typeKey, newStatus) => {
    // CORRECCIÓN: Asegurarse de que typeKey se pasa a la función onStatusUpdate
    onStatusUpdate(requestId, typeKey, newStatus);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solicitudes en Tiempo Real</CardTitle>
        <CardDescription>Gestiona todas las solicitudes de los clientes</CardDescription>
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <Input
            placeholder="Buscar por cliente, email o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {/* CORRECCIÓN: Valores coinciden con type_key del hook */}
              <SelectItem value="inspections">Inspección</SelectItem>
              <SelectItem value="legalizations">Legalización</SelectItem>
              <SelectItem value="power_buying_requests">Power Buying</SelectItem>
              <SelectItem value="vin_check_logs">VIN Check</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="processing">Procesando</SelectItem>
              <SelectItem value="completed">Completado</SelectItem>
              <SelectItem value="approved">Aprobado</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length > 0 ? filteredRequests.map((request, index) => (
              <motion.tr
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <TableCell className="font-medium font-mono text-xs">
                  {String(request.id).slice(0, 8)}...
                </TableCell>
                <TableCell>
                  <div>
                    {/* CORRECCIÓN: Usar request.user.full_name y request.user.email */}
                    <div className="font-medium">{request.user?.full_name || 'N/A'}</div>
                    <div className="text-sm text-muted-foreground">{request.user?.email || ''}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                    {/* CORRECCIÓN: Usar request.type directamente, ya no se necesita getTypeLabel */}
                    {request.type}
                  </span>
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalles
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {/* CORRECCIÓN: Pasar request.type_key a la función de actualización */}
                      <DropdownMenuItem onClick={() => handleStatusChange(request.id, request.type_key, 'processing')}>
                        <Clock className="w-4 h-4 mr-2 text-blue-600" />
                        Marcar Procesando
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(request.id, request.type_key, 'completed')}>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Marcar Completado
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(request.id, request.type_key, 'rejected')}>
                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                        Rechazar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron solicitudes con los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RealtimeRequestsTable;