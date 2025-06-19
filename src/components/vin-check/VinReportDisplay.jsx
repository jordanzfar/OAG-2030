import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const VinReportDisplay = ({ reportData }) => {
  if (!reportData) return null;
  
  return (
    <Card className="bg-card border-border shadow-lg animate-in fade-in duration-500">
      <CardHeader>
        <CardTitle>Reporte del Vehículo (VIN: {reportData.vin})</CardTitle>
        <CardDescription>Resultados de la verificación. Este reporte se guardará automáticamente en tu sección de 'Documentos'.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong className="text-foreground">Marca:</strong> {reportData.marca}</p>
        <p><strong className="text-foreground">Modelo:</strong> {reportData.modelo}</p>
        <p><strong className="text-foreground">Año:</strong> {reportData.año}</p>
        <p><strong className="text-foreground">Tipo de Título:</strong> {reportData.titulo}</p>
        <p><strong className="text-foreground">Historial de Accidentes:</strong> {reportData.accidentes}</p>
        <p><strong className="text-foreground">Millaje Estimado:</strong> {reportData.millaje}</p>
        <p><strong className="text-foreground">Número de Propietarios:</strong> {reportData.propietarios}</p>
      </CardContent>
    </Card>
  );
};

export default VinReportDisplay;
