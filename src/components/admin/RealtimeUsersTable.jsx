
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, CheckCircle, XCircle, Clock, AlertTriangle, DollarSign, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const RealtimeUsersTable = ({ users, loading, onVerificationUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status) => {
    const statusConfig = {
      verified: { icon: CheckCircle, color: 'text-green-900', bg: 'bg-green-300', label: 'Verificado' },
      pending: { icon: Clock, color: 'text-yellow-900', bg: 'bg-yellow-300', label: 'Pendiente' },
      rejected: { icon: XCircle, color: 'text-red-900', bg: 'bg-red-300', label: 'Rechazado' },
      not_verified: { icon: AlertTriangle, color: 'text-gray-900', bg: 'bg-gray-300', label: 'Sin verificar' }
    };

    const config = statusConfig[status] || statusConfig.not_verified;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'text-purple-900', bg: 'bg-purple-300', label: 'Admin' },
      client: { color: 'text-blue-900', bg: 'bg-blue-300', label: 'Cliente' },
      support: { color: 'text-green-900', bg: 'bg-green-300', label: 'Soporte' },
      validation: { color: 'text-orange-900', bg: 'bg-orange-300', label: 'Validación' },
      finance: { color: 'text-emerald-900', bg: 'bg-emerald-300', label: 'Finanzas' }
    };

    const config = roleConfig[role] || { color: 'text-gray-900', bg: 'bg-gray-300', label: role };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Shield className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.verification_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleVerificationUpdate = (userId, newStatus, buyingPower = null) => {
    onVerificationUpdate(userId, newStatus, buyingPower);
  };

  const promptBuyingPower = (user, newStatus) => {
    if (newStatus === 'verified') {
      const amount = prompt(`Asignar poder de compra para ${user.full_name}:`, user.buying_power || '0');
      if (amount !== null) {
        const buyingPower = parseFloat(amount) || 0;
        handleVerificationUpdate(user.id, newStatus, buyingPower);
      }
    } else {
      handleVerificationUpdate(user.id, newStatus);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuarios en Tiempo Real</CardTitle>
          <CardDescription>Cargando usuarios...</CardDescription>
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
        <CardTitle>Usuarios en Tiempo Real</CardTitle>
        <CardDescription>Gestiona verificaciones y poder de compra de usuarios</CardDescription>
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <Input
            placeholder="Buscar por nombre o email..."
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
              <SelectItem value="verified">Verificado</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
              <SelectItem value="not_verified">Sin verificar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado Verificación</TableHead>
              <TableHead>Poder de Compra</TableHead>
              <TableHead>Fecha Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{user.full_name || 'Sin nombre'}</div>
                    <div className="text-sm text-muted-foreground">{user.email || 'Sin email'}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(user.verification_status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {(user.buying_power || 0).toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Verificación</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => promptBuyingPower(user, 'verified')}
                        disabled={user.verification_status === 'verified'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-900" />
                        Verificar Usuario
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleVerificationUpdate(user.id, 'rejected')}
                        disabled={user.verification_status === 'rejected'}
                      >
                        <XCircle className="w-4 h-4 mr-2 text-red-900" />
                        Rechazar Verificación
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Poder de Compra</DropdownMenuLabel>
                      <DropdownMenuItem 
                        onClick={() => promptBuyingPower(user, user.verification_status)}
                      >
                        <DollarSign className="w-4 h-4 mr-2 text-blue-900" />
                        Modificar Poder de Compra
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            )) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No se encontraron usuarios con los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RealtimeUsersTable;
