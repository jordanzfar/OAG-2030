// ✅ INICIO DE CAMBIOS: Se añade 'useEffect' a la importación
import React, { useState, useMemo, useCallback, useEffect } from 'react';
// ✅ FIN DE CAMBIOS
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDebounce } from 'use-debounce';
import { motion, AnimatePresence } from 'framer-motion';

import { useVinCheck } from '@/hooks/useVinCheck';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Info, AlertTriangle, CheckCircle, Clock, Download, Search, Loader2, Check, X, ArrowLeft, ArrowRight } from 'lucide-react';

// ... (El resto del archivo no necesita cambios)
// ... (VinCheckForm, HistoryItem, VinHistoryList, VinCheckPage)

// (Pega este código completo en tu archivo para asegurar que todo esté correcto)

// --- Sub-componente del Formulario ---
const vinSchema = z.object({
  vin: z.string().length(17, "El VIN debe tener 17 caracteres.").regex(/^[a-zA-Z0-9]+$/, "Solo caracteres alfanuméricos."),
});

const VinCheckForm = ({ onSubmitVin, decoding, decodedData, decodeVinWithFunction, resetDecoder }) => {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm({ resolver: zodResolver(vinSchema), mode: 'onChange' });
  const vinValue = watch('vin');
  const [debouncedVin] = useDebounce(vinValue, 500);

  const resetAll = useCallback(() => {
    reset();
    resetDecoder();
    setIsConfirmed(false);
  }, [reset, resetDecoder]);

  useEffect(() => {
    if(vinValue) setValue('vin', vinValue.toUpperCase());
    const isVinValid = debouncedVin && debouncedVin.length === 17 && !errors.vin;
    if (isVinValid) {
        decodeVinWithFunction(debouncedVin);
    } else {
        resetDecoder();
    }
    setIsConfirmed(false);
  }, [debouncedVin, errors.vin, setValue, decodeVinWithFunction, resetDecoder]);

  const vehicleInfo = useMemo(() => {
    if (!decodedData || decodedData.length === 0) return null;
    const findValue = (variableName) => decodedData.find(item => item.Variable === variableName)?.Value || null;
    const info = {
      make: findValue('Make'),
      model: findValue('Model'),
      year: findValue('Model Year'),
      engineCylinders: findValue('Engine Cylinders'),
      displacementL: findValue('Displacement (L)'),
      driveType: findValue('Drive Type'),
      plantCountry: findValue('Plant Country'),
      bodyClass: findValue('Body Class'),
      vehicleType: findValue('Vehicle Type'),
      doors: findValue('Doors'),
      fuelType: findValue('Fuel Type - Primary'),
    };
    if (info.make && info.model && info.year) return info;
    return null;
  }, [decodedData]);

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    await onSubmitVin(data.vin);
    resetAll();
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="vin">Número de Identificación Vehicular (VIN)</Label>
        <div className="relative mt-1">
          <Input id="vin" placeholder="Ingresa los 17 caracteres del VIN" {...register("vin")} className={`pr-10 text-lg font-mono tracking-wider ${errors.vin ? 'border-destructive' : ''}`} maxLength={17} disabled={isSubmitting} autoComplete="off" />
          <div className="absolute inset-y-0 right-3 flex items-center">{decoding && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}</div>
        </div>
        <div className="flex justify-between items-center mt-1 h-5">
          {errors.vin ? <p className="text-sm text-destructive">{errors.vin.message}</p> : <div />}
          <p className="text-sm text-muted-foreground font-mono">{vinValue?.length || 0}/17</p>
        </div>
      </div>
      <AnimatePresence>
        {vehicleInfo && !isConfirmed && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-4 rounded-lg border bg-muted space-y-4">
            <div>
                <h4 className="font-semibold text-lg">Vehículo Detectado</h4>
                <p className="text-xl">
                    <span className="font-bold">{vehicleInfo.year}</span>
                    <span className="mx-2 font-light text-muted-foreground">|</span>
                    <span>{vehicleInfo.make} {vehicleInfo.model}</span>
                </p>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="space-y-1">
                    {vehicleInfo.bodyClass && <p><strong>Carrocería:</strong> {vehicleInfo.bodyClass}</p>}
                    {vehicleInfo.vehicleType && <p><strong>Tipo:</strong> {vehicleInfo.vehicleType}</p>}
                    {vehicleInfo.driveType && <p><strong>Tracción:</strong> {vehicleInfo.driveType}</p>}
                    {vehicleInfo.doors && <p><strong>Puertas:</strong> {vehicleInfo.doors}</p>}
                </div>
                <div className="space-y-1">
                    {vehicleInfo.engineCylinders && <p><strong>Cilindros:</strong> {vehicleInfo.engineCylinders}</p>}
                    {vehicleInfo.displacementL && <p><strong>Cilindrada:</strong> {vehicleInfo.displacementL} L</p>}
                    {vehicleInfo.fuelType && <p><strong>Combustible:</strong> {vehicleInfo.fuelType}</p>}
                    {vehicleInfo.plantCountry && <p><strong>Ensamblado en:</strong> {vehicleInfo.plantCountry}</p>}
                </div>
            </div>
            <div className="pt-2">
                <p className="text-sm text-center font-medium">¿Es este tu vehículo?</p>
                <div className="flex justify-center gap-2 pt-2">
                    <Button type="button" onClick={() => setIsConfirmed(true)} size="sm"><Check className="mr-2 h-4 w-4" /> Sí, confirmar y solicitar</Button>
                    <Button type="button" variant="ghost" onClick={resetAll} size="sm"><X className="mr-2 h-4 w-4" /> Ingresar otro VIN</Button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Button type="submit" className="w-full text-lg py-6" disabled={isSubmitting || !isConfirmed || decoding || !!errors.vin}>
        {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
        {isSubmitting ? 'Enviando Solicitud...' : 'Solicitar Reporte Completo'}
      </Button>
    </form>
  );
};


const statusConfig = {
    completed: { text: 'Completado', icon: <CheckCircle className="h-5 w-5 text-green-500" />, variant: 'success' },
    processing: { text: 'Procesando', icon: <Clock className="h-5 w-5 text-blue-500" />, variant: 'default' },
    pending: { text: 'Pendiente', icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />, variant: 'secondary' },
};

const HistoryItem = ({ check }) => {
    const config = statusConfig[check.status] || statusConfig.pending;
    return (
        <div className="p-4 border rounded-lg bg-background hover:bg-muted/50 transition-colors flex flex-col space-y-3">
            <h4 className="w-full font-semibold font-mono text-base text-foreground break-all">{check.vin}</h4>
            <p className="text-sm text-muted-foreground">{new Date(check.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })} {' '} {new Date(check.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            <div className="flex items-center gap-2">
                <Badge variant={config.variant}>{config.text}</Badge>
                {config.icon}
            </div>
            {check.status === 'completed' && check.pdf_url && (
                <div className="pt-3 mt-3 border-t">
                    <Button asChild variant="outline" className="w-full"><a href={check.pdf_url} download target="_blank" rel="noopener noreferrer"><Download className="mr-2 h-4 w-4" />Descargar Reporte</a></Button>
                </div>
            )}
        </div>
    );
};

const VinHistoryList = ({ history, isLoading, currentPage, totalPages, onPageChange }) => {
  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!history || history.length === 0) return <div className="text-center text-muted-foreground py-8 px-4 border-2 border-dashed rounded-lg"><p>No tienes verificaciones anteriores.</p></div>;
  
  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {history.map((check) => <HistoryItem key={check.id} check={check} />)}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <Button variant="outline" size="icon" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-muted-foreground">{currentPage} / {totalPages}</span>
          <Button variant="outline" size="icon" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const VinCheckPage = () => {
  const { vinCredits, showLowCreditAlert, vinHistory, historyLoading, handleCheckVin, decoding, decodedData, decodeVinWithFunction, resetDecoder, currentPage, totalPages, loadVinHistory } = useVinCheck();
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Verificación de VIN</h1>
        <p className="text-lg text-muted-foreground">Solicita reportes de vehículos procesados por nuestro equipo de expertos.</p>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
          <Info className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertTitle className="text-emerald-900 dark:text-emerald-200">Créditos Disponibles</AlertTitle>
          <AlertDescription className="text-emerald-800 dark:text-emerald-300">Tienes <strong className="text-2xl font-bold">{vinCredits ?? '...'}</strong> verificaciones restantes.</AlertDescription>
        </Alert>
        <AnimatePresence>
          {showLowCreditAlert && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Atención Requerida</AlertTitle><AlertDescription>Te quedan pocas verificaciones.</AlertDescription></Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Solicitar Verificación</CardTitle><CardDescription>Ingresa un VIN para obtener los datos básicos del vehículo y confirmar tu solicitud.</CardDescription></CardHeader>
            <CardContent>
              <VinCheckForm onSubmitVin={handleCheckVin} decoding={decoding} decodedData={decodedData} decodeVinWithFunction={decodeVinWithFunction} resetDecoder={resetDecoder} />
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader><CardTitle>Historial de Solicitudes</CardTitle><CardDescription>Revisa el estado de tus verificaciones.</CardDescription></CardHeader>
            <CardContent>
              <VinHistoryList 
                history={vinHistory} 
                isLoading={historyLoading}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={loadVinHistory}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VinCheckPage;