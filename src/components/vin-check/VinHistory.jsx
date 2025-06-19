import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Loader2, Eye, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import StatusBadge from './StatusBadge';

const VinHistory = ({ vinHistory, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Historial de Verificaciones VIN
          </CardTitle>
          <CardDescription>Tus solicitudes de verificación anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Cargando historial...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Historial de Verificaciones VIN
            </CardTitle>
            <CardDescription>Tus solicitudes de verificación anteriores</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {vinHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay verificaciones anteriores</p>
            <p className="text-sm">Tus solicitudes aparecerán aquí una vez que las envíes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>VIN</TableHead>
                  <TableHead>Fecha Solicitud</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Créditos Usados</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vinHistory.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-sm">{record.vin}</TableCell>
                    <TableCell>
                      {format(new Date(record.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                    <TableCell>{record.credits_used || 1}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {record.status === 'completed' && record.result ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ver reporte</TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" disabled>
                                <Clock className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {record.status === 'pending' ? 'Esperando procesamiento' : 'En proceso'}
                            </TooltipContent>
                          </Tooltip>
                        )}
                        {record.status === 'completed' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Descargar PDF</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VinHistory;
