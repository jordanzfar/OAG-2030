
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Download, CheckCircle, XCircle, AlertTriangle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const RealtimeDocumentsTable = ({ documents, loading, onStatusUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: AlertTriangle, color: 'text-yellow-900', bg: 'bg-yellow-300', label: 'Pendiente' },
      approved: { icon: CheckCircle, color: 'text-green-900', bg: 'bg-green-300', label: 'Aprobado' },
      rejected: { icon: XCircle, color: 'text-red-900', bg: 'bg-red-300', label: 'Rechazado' }
    };

    const config = statusConfig[status] || { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-100', label: status };
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = searchTerm === '' ||
      doc.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (documentId, newStatus, rejectionReason = null) => {
    onStatusUpdate(documentId, newStatus, rejectionReason);
  };

  const promptRejectReason = (documentId) => {
    const reason = prompt("Por favor, ingresa el motivo del rechazo:");
    if (reason !== null && reason.trim() !== "") {
      handleStatusChange(documentId, 'rejected', reason);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos en Tiempo Real</CardTitle>
          <CardDescription>Cargando documentos...</CardDescription>
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
        <CardTitle>Documentos en Tiempo Real</CardTitle>
        <CardDescription>Revisa y valida documentos subidos por los clientes</CardDescription>
        <div className="flex flex-col md:flex-row gap-4 pt-2">
          <Input
            placeholder="Buscar por cliente, archivo o tipo..."
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
              <TableHead>Cliente</TableHead>
              <TableHead>Archivo</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Tamaño</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDocuments.length > 0 ? filteredDocuments.map((doc, index) => (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b transition-colors hover:bg-muted/50"
              >
                <TableCell>
                  <div>
                    <div className="font-medium">{doc.client_name}</div>
                    <div className="text-sm text-muted-foreground">{doc.client_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="max-w-[200px] truncate">{doc.file_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                    {doc.document_type}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
                </TableCell>
                <TableCell>
                  <div>
                    {getStatusBadge(doc.status)}
                    {doc.status === 'rejected' && doc.rejection_reason && (
                      <div className="text-xs text-red-600 mt-1">
                        Motivo: {doc.rejection_reason}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(doc.created_at).toLocaleDateString('es-ES')}
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
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Documento
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Descargar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleStatusChange(doc.id, 'approved')}
                        disabled={doc.status === 'approved'}
                      >
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Aprobar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => promptRejectReason(doc.id)}
                        disabled={doc.status === 'rejected'}
                      >
                        <XCircle className="w-4 h-4 mr-2 text-red-600" />
                        Rechazar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </motion.tr>
            )) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No se encontraron documentos con los filtros actuales.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RealtimeDocumentsTable;
