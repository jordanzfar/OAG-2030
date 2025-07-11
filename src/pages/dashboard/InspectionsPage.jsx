import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, subDays } from "date-fns";
import { es } from 'date-fns/locale';

// Shadcn UI & Lucide Icons
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from '@/components/ui/use-toast';
import { Calendar as CalendarIcon, Info, Download, Loader2, AlertTriangle, MapPin } from 'lucide-react';

// Project Hooks, Utils & Data
import { cn } from "@/lib/utils";
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/hooks/useAuth';
import { groupedIaaLocations, groupedCopartLocations, flatIaaLocations, flatCopartLocations } from '@/data/auctionLocations';
import { supabase } from '@/lib/supabase'; // Asegúrate que esta ruta sea correcta

// Zod Schema
const locationSchema = z.discriminatedUnion("locationType", [
    z.object({
      locationType: z.literal("iaa"),
      state: z.string({ required_error: "Debes seleccionar un estado." }),
      locationId: z.string({ required_error: "Debes seleccionar una sucursal." }),
    }),
    z.object({
      locationType: z.literal("copart"),
      state: z.string({ required_error: "Debes seleccionar un estado." }),
      locationId: z.string({ required_error: "Debes seleccionar una sucursal." }),
    }),
    z.object({
      locationType: z.literal("other"),
      otherLocationAddress: z.string().min(10, "La dirección debe tener al menos 10 caracteres."),
    }),
]);

const inspectionSchema = z.object({
  stockNumber: z.string().min(1, "El número de stock/lote es requerido.").regex(/^[a-zA-Z0-9]+$/, "Solo caracteres alfanuméricos."),
  vehicleUrl: z.string().url("Debe ser una URL válida.").min(1, "La URL del vehículo es requerida."),
  auctionDate: z.date({ required_error: "La fecha de subasta es requerida." }),
  comments: z.string().max(500, "Máximo 500 caracteres.").optional(),
  exactLocationDetails: z.string().optional(),
}).and(locationSchema);

// Subcomponente para el historial de inspecciones (VERSIÓN FINAL CORREGIDA)
const InspectionHistory = ({ inspections, loading }) => {
  const [isDownloading, setIsDownloading] = useState(null);

  const handleDownload = async (filePath) => {
    if (!filePath) return;

    // ‼️ REEMPLAZA ESTO con el nombre exacto de tu bucket en Supabase
    const bucketName = 'inspection-reports'; 

    setIsDownloading(filePath);

    try {
      const { data, error } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrl(filePath, 60, {
          download: true,
        });

      if (error) throw error;

      window.open(data.signedUrl, '_blank');

    } catch (error) {
      console.error('Error al generar la URL de descarga:', error);
      alert('No se pudo generar el enlace de descarga. Por favor, inténtalo de nuevo.');
    } finally {
      setIsDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-muted-foreground">Cargando historial...</span>
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <p className="text-muted-foreground italic text-center py-4">
        No tienes solicitudes de inspección registradas.
      </p>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      case 'pending_payment': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
        case 'completed': return 'Completada';
        case 'scheduled': return 'Programada';
        case 'pending_payment': return 'Pago Pendiente';
        default: return 'Pendiente';
      }
  };

  return (
    <div className="space-y-4">
      {inspections.map((inspection) => (
        <div key={inspection.id} className="p-4 border rounded-lg bg-background hover:bg-muted/20 transition-colors">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <h4 className="font-semibold text-lg">Stock# {inspection.stock_number}</h4>
              <p className="text-sm text-muted-foreground">
                Inspección: {format(new Date(inspection.inspection_date.replace(/-/g, '/')), "PPP", { locale: es })}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusBadge(inspection.status)}`}>
              {getStatusText(inspection.status)}
            </span>
          </div>

          {inspection.status === 'completed' && inspection.report_url && (
            <div className="mt-4 pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full sm:w-auto"
                onClick={() => handleDownload(inspection.report_url)}
                disabled={isDownloading === inspection.report_url}
              >
                {isDownloading === inspection.report_url ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Descargar Reporte
              </Button>
            </div>
          )}

          {inspection.status === 'pending_payment' && (
            <div className="mt-4 pt-4 border-t">
                 <Button className="w-full sm:w-auto" onClick={() => window.open(`https://buy.stripe.com/test_8x2eV69LA9v55yo366ebu00?stock=${inspection.stock_number}`, '_blank')}>
                    Proceder al Pago
                </Button>
           </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Componente principal de la página
const InspectionsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { createRecord, fetchRecords } = useSupabaseData();
  const [inspections, setInspections] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const form = useForm({
    resolver: zodResolver(inspectionSchema),
    defaultValues: {
      stockNumber: "",
      vehicleUrl: "",
      locationType: "iaa",
      state: "",
      locationId: "",
      otherLocationAddress: "",
      comments: "",
      exactLocationDetails: "",
    },
  });

  const { isSubmitting } = form.formState;
  const watchedAuctionDate = form.watch('auctionDate');
  const watchedLocationType = form.watch('locationType');
  const watchedState = form.watch('state');
  const watchedLocationId = form.watch('locationId');
  const inspectionDate = watchedAuctionDate ? subDays(watchedAuctionDate, 1) : null;
  
  const locationData = watchedLocationType === 'iaa' ? groupedIaaLocations : groupedCopartLocations;
  const states = Object.keys(locationData).sort();
  const branches = watchedState ? locationData[watchedState] : [];

  const selectedLocation = useMemo(() => {
    if (!watchedLocationId || !watchedLocationType) return null;
    const flatList = watchedLocationType === 'iaa' ? flatIaaLocations : flatCopartLocations;
    return flatList.find(loc => loc.id === watchedLocationId);
  }, [watchedLocationId, watchedLocationType]);

  useEffect(() => {
    form.resetField("state");
    form.resetField("locationId");
  }, [watchedLocationType, form]);

  const loadInspections = useCallback(async () => {
    if (!user) {
        setInspections([]);
        setIsLoadingHistory(false);
        return;
    }
    setIsLoadingHistory(true);
    const { success, data } = await fetchRecords('inspections', { user_id: user.id }, { orderBy: { column: 'created_at', ascending: false } });
    if (success) {
      setInspections(data || []);
    }
    setIsLoadingHistory(false);
  }, [user, fetchRecords]);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  const handleFormSubmit = async (data) => {
    if (!user) return;

    let locationDetails = {};
    if (data.locationType === 'iaa' || data.locationType === 'copart') {
        const flatList = data.locationType === 'iaa' ? flatIaaLocations : flatCopartLocations;
        const location = flatList.find(loc => loc.id === data.locationId);
        if (location) {
            locationDetails = { name: location.name, address: location.address };
        }
    } else {
        locationDetails = { address: data.otherLocationAddress };
    }

    const inspectionData = {
      user_id: user.id,
      stock_number: data.stockNumber,
      vehicle_url: data.vehicleUrl,
      auction_date: data.auctionDate.toISOString().split('T')[0],
      inspection_date: subDays(data.auctionDate, 1).toISOString().split('T')[0],
      location_type: data.locationType,
      location_details: locationDetails,
      exact_location_details: data.exactLocationDetails || '',
      comments: data.comments || '',
      status: 'pending_payment',
    };
    
    const { success, error } = await createRecord('inspections', inspectionData);

    if (success) {
        const paymentLink = `https://buy.stripe.com/test_8x2eV69LA9v55yo366ebu00?stock=${data.stockNumber}`;
        toast({
            title: "Paso 1: Solicitud Registrada",
            description: "Tu solicitud ha sido guardada. Completa el pago para procesarla.",
        });
        window.open(paymentLink, '_blank');
        form.reset();
        loadInspections();
    } else {
        console.error('Error submitting inspection:', error);
        toast({
            variant: "destructive",
            title: "Error al Registrar",
            description: "No se pudo registrar la solicitud. Por favor, inténtalo de nuevo.",
        });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inspección Física</h1>
        <p className="text-muted-foreground mt-1">Solicita una inspección profesional antes de la subasta.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Nueva Solicitud de Inspección</CardTitle>
            <CardDescription>Completa los datos para agendar tu inspección.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                
                <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                    <h3 className="font-semibold text-foreground">1. Detalles del Vehículo</h3>
                    <FormField control={form.control} name="stockNumber" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Stock / Lot Number</FormLabel>
                            <FormControl><Input placeholder="Ej: 12345678" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="vehicleUrl" render={({ field }) => (
                        <FormItem>
                            <FormLabel>URL del Vehículo</FormLabel>
                            <FormControl><Input type="url" placeholder="https://www.iaai.com/vehicledetail/..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>
                
                <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                    <h3 className="font-semibold text-foreground">2. Fecha y Ubicación</h3>
                    <FormField control={form.control} name="auctionDate" render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Fecha de Subasta</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date <= new Date()} initialFocus locale={es}/>
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    {inspectionDate && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>Fecha de Inspección</AlertTitle>
                            <AlertDescription>
                                Se programará automáticamente para el: <strong>{format(inspectionDate, "PPP", { locale: es })}</strong>.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <FormField control={form.control} name="locationType" render={({ field }) => (
                        <FormItem className="space-y-3">
                            <FormLabel>Tipo de Subasta</FormLabel>
                            <FormControl>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="iaa" /></FormControl><FormLabel className="font-normal">IAA</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="copart" /></FormControl><FormLabel className="font-normal">Copart</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="other" /></FormControl><FormLabel className="font-normal">Otra</FormLabel></FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>

                    {watchedLocationType !== 'other' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="state" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <Select onValueChange={(value) => { field.onChange(value); form.resetField("locationId"); }} value={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="1. Selecciona estado" /></SelectTrigger></FormControl>
                                        <SelectContent className="max-h-[16rem]">
                                            {states.map(state => <SelectItem key={state} value={state}>{state}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="locationId" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sucursal</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!watchedState}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="2. Selecciona sucursal" /></SelectTrigger></FormControl>
                                        <SelectContent className="max-h-[16rem]">
                                            {branches.map(branch => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>

                        {selectedLocation && (
                          <Alert variant="default" className="bg-background">
                            <MapPin className="h-5 w-5" />
                            <AlertTitle className="font-semibold">{selectedLocation.name}</AlertTitle>
                            <AlertDescription>
                              {selectedLocation.address}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                    
                    {watchedLocationType === 'other' && <FormField control={form.control} name="otherLocationAddress" render={({ field }) => (
                        <FormItem><FormLabel>Dirección Completa</FormLabel><FormControl><Input placeholder="Calle, Ciudad, Estado, CP" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>}

                    <FormField control={form.control} name="exactLocationDetails" render={({ field }) => (
                        <FormItem><FormLabel>Detalles Adicionales de Ubicación (Opcional)</FormLabel><FormControl><Input placeholder="Ej: Fila 5, Espacio 12" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                
                <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                    <h3 className="font-semibold text-foreground">3. Instrucciones Adicionales</h3>
                    <FormField control={form.control} name="comments" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Instrucciones Especiales (Opcional)</FormLabel>
                            <FormControl><Textarea placeholder="Indica si debemos enfocarnos en algo específico (motor, suspensión, etc.)" className="resize-none" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                </div>

                <Alert variant="default" className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <AlertTriangle className="h-4 w-4 !text-blue-600" />
                    <AlertTitle className="text-blue-800 dark:text-blue-300">Paso Final: Pago de $50 USD</AlertTitle>
                    <AlertDescription className="text-blue-700 dark:text-blue-400">
                       Al hacer clic en 'Registrar y Pagar', tu solicitud quedará registrada y serás redirigido a Stripe para completar el pago.
                    </AlertDescription>
                </Alert>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Registrando...' : 'Registrar y Proceder al Pago'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
            <CardHeader>
                <CardTitle>Historial de Solicitudes</CardTitle>
                <CardDescription>Revisa el estado de tus inspecciones anteriores.</CardDescription>
            </CardHeader>
            <CardContent>
                <InspectionHistory inspections={inspections} loading={isLoadingHistory} />
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InspectionsPage;