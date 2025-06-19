import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info, AlertTriangle, CheckCircle, Clock, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useVinCheck } from '@/hooks/useVinCheck'; // Importa tu hook aquí

// Zod Schema
const vinSchema = z.object({
  vin: z.string().length(17, "El VIN debe tener exactamente 17 caracteres").regex(/^[a-zA-Z0-9]+$/, "Solo caracteres alfanuméricos"),
});

const VinCheckPage = () => {
  const { toast } = useToast();
  const {
    vinCredits,
    isLoading,
    reportData,
    handleCheckVin,
    vinHistory,
    historyLoading,
    showLowCreditAlert,
    setShowLowCreditAlert,
    showWelcomeModal,
    setShowWelcomeModal,
  } = useVinCheck();

  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm({
    resolver: zodResolver(vinSchema),
  });
  const vinValue = watch('vin');

  const handleFormSubmit = handleSubmit(async (data) => {
    await handleCheckVin(data.vin);
    reset();
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing': return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completado';
      case 'processing': return 'Procesando';
      case 'pending': return 'Pendiente';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-500';
      case 'processing': return 'text-blue-500';
      case 'pending': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Modal */}
      <Dialog open={showWelcomeModal} onOpenChange={setShowWelcomeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Info className="w-5 h-5 mr-2 text-primary" /> 
              Verificaciones VIN
            </DialogTitle>
            <DialogDescription>
              Las solicitudes de verificación VIN son procesadas manualmente por nuestro equipo especializado en 1-24 horas.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowWelcomeModal(false)}>Entendido</Button>
        </DialogContent>
      </Dialog>

      <h1 className="text-3xl font-bold text-foreground">Verificación de VIN</h1>

      {/* Créditos restantes */}
      <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 text-sm text-emerald-800 dark:text-emerald-100">
        <strong>Verificaciones disponibles:</strong> {vinCredits}
      </div>

      {/* Alerta créditos bajos */}
      {showLowCreditAlert && (
        <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-100">
          <strong>¡Atención!</strong> Te quedan pocas verificaciones disponibles. Considera adquirir más pronto.
        </div>
      )}

      <p className="text-muted-foreground">
        Solicita verificaciones VIN procesadas manualmente por nuestro equipo especializado.
      </p>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Solicitar Verificación VIN</CardTitle>
          <CardDescription>
            Ingresa el VIN de 17 dígitos. Nuestro equipo procesará tu solicitud manualmente en 1-24 horas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="vin">Número VIN (17 caracteres)</Label>
              <Input
                id="vin"
                placeholder="Ej: 1HGBH41JXMN109186"
                {...register("vin")}
                className={`mt-1 uppercase ${errors.vin ? 'border-destructive' : ''}`}
                maxLength={17}
                disabled={isLoading}
                style={{ textTransform: 'uppercase' }}
              />
              {errors.vin && <p className="text-sm text-destructive mt-1">{errors.vin.message}</p>}
              {vinValue && vinValue.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Caracteres: {vinValue.length}/17
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Información Importante</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Las verificaciones son procesadas manualmente por expertos</li>
                <li>• Tiempo de procesamiento: 1-24 horas</li>
                <li>• Recibirás una notificación y un correo cuando esté listo</li>
                <li>• El reporte incluye historial completo del vehículo</li>
              </ul>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || !vinValue || vinValue.length !== 17}>
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? 'Enviando Solicitud...' : 'Solicitar Verificación VIN'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* VIN History */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Historial de Verificaciones</CardTitle>
          <CardDescription>Estado de tus solicitudes de verificación VIN.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center items-center py-8">
              <p className="text-muted-foreground">Cargando historial...</p>
            </div>
          ) : vinHistory.length > 0 ? (
            <div className="space-y-3">
              {vinHistory.map((check) => (
                <div key={check.id} className="p-4 border border-border rounded-lg bg-secondary">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium font-mono">{check.vin}</h4>
                      <p className="text-sm text-muted-foreground">
                        Solicitado: {new Date(check.created_at).toLocaleDateString()}
                      </p>
                      {check.result && (
                        <p className="text-sm text-muted-foreground">
                          Reporte disponible
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(check.status)}
                      <span className={`text-sm font-medium ${getStatusColor(check.status)}`}>
                        {getStatusText(check.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No hay verificaciones anteriores registradas.</p>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>¿Qué incluye la verificación VIN?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">Información del Vehículo</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Marca, modelo y año</li>
                <li>• Especificaciones técnicas</li>
                <li>• Color y características</li>
                <li>• Tipo de combustible</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Historial</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Historial de accidentes</li>
                <li>• Registros de mantenimiento</li>
                <li>• Número de propietarios</li>
                <li>• Estado del título</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VinCheckPage;
