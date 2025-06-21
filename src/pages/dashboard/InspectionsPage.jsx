
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, subDays, addDays } from "date-fns";
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Calendar as CalendarIcon, AlertCircle, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// Constants & Mock Data
const iaaLocations = [
  { id: 'IAA_DAL', name: 'IAA Dallas', address: '123 Auction Ln, Dallas, TX' },
  { id: 'IAA_HOU', name: 'IAA Houston', address: '456 Bidder Ave, Houston, TX' },
  { id: 'IAA_AUS', name: 'IAA Austin', address: '789 Hammer St, Austin, TX' },
  { id: 'IAA_SAN', name: 'IAA San Antonio', address: '101 Gavel Rd, San Antonio, TX' },
  { id: 'IAA_ELP', name: 'IAA El Paso', address: '202 West Dr, El Paso, TX' },
];

const copartLocations = [
  { id: 'COPART_DAL', name: 'Copart Dallas', address: '300 Auto Auction Way, Dallas, TX' },
  { id: 'COPART_HOU', name: 'Copart Houston', address: '400 Vehicle Blvd, Houston, TX' },
  { id: 'COPART_AUS', name: 'Copart Austin', address: '500 Salvage St, Austin, TX' },
  { id: 'COPART_SAN', name: 'Copart San Antonio', address: '600 Bid Lane, San Antonio, TX' },
  { id: 'COPART_FTW', name: 'Copart Fort Worth', address: '700 Auction Ave, Fort Worth, TX' },
  { id: 'COPART_ELP', name: 'Copart El Paso', address: '800 Yard Dr, El Paso, TX' },
];

// Zod Schema - Simplified to only require auction date
const inspectionSchema = z.object({
  stockNumber: z.string().min(1, "El Stock Number es requerido").regex(/^[a-zA-Z0-9]+$/, "Solo caracteres alfanuméricos"),
  vehicleUrl: z.string().url("Debe ser una URL válida").min(1, "La URL del vehículo es requerida"),
  auctionDate: z.date({ required_error: "Fecha de subasta requerida" }),
  locationType: z.enum(['iaa', 'copart', 'other'], { required_error: "Selecciona un tipo de ubicación" }),
  iaaLocation: z.string().optional(),
  copartLocation: z.string().optional(),
  otherLocationAddress: z.string().optional(),
  exactLocationDetails: z.string().optional(),
  comments: z.string().max(500, "Máximo 500 caracteres").optional(),
}).refine(data => {
    if (data.locationType === 'iaa') return !!data.iaaLocation;
    if (data.locationType === 'copart') return !!data.copartLocation;
    if (data.locationType === 'other') return !!data.otherLocationAddress;
    return false;
}, {
    message: "Debes seleccionar una sucursal o ingresar otra dirección",
    path: ["iaaLocation"],
});

const InspectionsPage = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { createInspection, fetchRecords } = useSupabaseData();
  const [locationType, setLocationType] = useState('');
  const [commentLength, setCommentLength] = useState(0);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors }, reset } = useForm({
    resolver: zodResolver(inspectionSchema),
  });

  const watchedComments = watch('comments');
  const watchedLocationType = watch('locationType');
  const watchedAuctionDate = watch('auctionDate');

  // Calculate inspection date automatically (1 day before auction)
  const inspectionDate = watchedAuctionDate ? subDays(watchedAuctionDate, 1) : null;

  useEffect(() => {
    setCommentLength(watchedComments?.length || 0);
  }, [watchedComments]);

  useEffect(() => {
    if (user) {
      loadInspections();
    }
  }, [user]);

  const loadInspections = async () => {
    if (!user) return;

    const result = await fetchRecords('inspections', { user_id: user.id }, {
      orderBy: { column: 'created_at', ascending: false }
    });

    if (result.success) {
      setInspections(result.data || []);
    }
    setLoading(false);
  };

  const handleFormSubmit = async (data) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      // Prepare location details
      let locationDetails = {};
      if (data.locationType === 'iaa') {
        const location = iaaLocations.find(loc => loc.id === data.iaaLocation);
        locationDetails = { type: 'iaa', location: location };
      } else if (data.locationType === 'copart') {
        const location = copartLocations.find(loc => loc.id === data.copartLocation);
        locationDetails = { type: 'copart', location: location };
      } else {
        locationDetails = { type: 'other', address: data.otherLocationAddress };
      }

      // Calculate inspection date (1 day before auction)
      const calculatedInspectionDate = subDays(data.auctionDate, 1);

      const inspectionData = {
        stock_number: data.stockNumber,
        vehicle_url: data.vehicleUrl,
        inspection_date: calculatedInspectionDate.toISOString().split('T')[0],
        auction_date: data.auctionDate.toISOString().split('T')[0],
        location_type: data.locationType,
        location_details: locationDetails,
        exact_location_details: data.exactLocationDetails || '',
        comments: data.comments || '',
        status: 'pending'
      };

      const result = await createInspection(user.id, inspectionData);
      
      if (result.success) {
  const paymentLink = `https://buy.stripe.com/test_8x2eV69LA9v55yo366ebu00?stock=${data.stockNumber}`;

toast({
  title: "Solicitud Enviada",
  description: `Tu solicitud para el Stock# ${data.stockNumber} fue registrada correctamente.`,
});

toast({
  title: "Pago Requerido ($50 USD)",
  description: (
    <div>
      <p className="mb-2">
        Para procesar tu inspección, realiza el pago de <strong>$50 USD</strong>. Usa el número <strong>{data.stockNumber}</strong> como referencia en tu comprobante. Guarda el comprobante para futuras aclaraciones.
      </p>
      <a
        href={paymentLink}
        target="_blank"
        rel="noopener noreferrer"
        className="underline text-blue-600 hover:text-blue-800"
      >
        Haz clic aquí para pagar ahora
      </a>
    </div>
  ),
  duration: 12000,
});

// Redirigir automáticamente al link de pago
window.open(paymentLink, '_blank');

reset();
loadInspections();

}
    } catch (error) {
      console.error('Error submitting inspection:', error);
      toast({
        variant: "destructive",
        title: "Error al Enviar Solicitud",
        description: "No se pudo enviar la solicitud. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Inspeccion Fisica </h1>
        <div className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">Cargando inspecciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Inspeccion Fisica</h1>
      <p className="text-muted-foreground">
        Solicita una inspección fisica en las yardas de IAA o Copart, puedes agendar inmediatamente, sin embargo no se asegura tu lugar si el pago no se realizo para las 09:00 AM CST (Central Standard Time)
        de un dia antes de la inspección .</p>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Nueva Solicitud de Inspección</CardTitle>
          <CardDescription>Ingresa los detalles del vehículo, la fecha de subasta y realiza tu pago.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Stock Number */}
            <div>
              <Label htmlFor="stockNumber">Stock Number / Lot Number</Label>
              <Input id="stockNumber" placeholder="Ej: lot 12345678 / Stock 12345678" {...register("stockNumber")} className={`mt-1 ${errors.stockNumber ? 'border-destructive' : ''}`} />
              {errors.stockNumber && <p className="text-sm text-destructive mt-1">{errors.stockNumber.message}</p>}
            </div>

            {/* Vehicle URL */}
            <div>
              <Label htmlFor="vehicleUrl">URL del Vehículo</Label>
              <Input id="vehicleUrl" type="url" placeholder="EJ: https://www.iaai.com/VehicleDetail/12345678~US" {...register("vehicleUrl")} className={`mt-1 ${errors.vehicleUrl ? 'border-destructive' : ''}`} />
              {errors.vehicleUrl && <p className="text-sm text-destructive mt-1">{errors.vehicleUrl.message}</p>}
            </div>

            {/* Date Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="auctionDate">Fecha de Subasta</Label>
                <Controller
                  name="auctionDate"
                  control={control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn("w-full justify-start text-left font-normal mt-1", !field.value && "text-muted-foreground", errors.auctionDate ? 'border-destructive' : '')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona fecha</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar 
                          mode="single" 
                          selected={field.value} 
                          onSelect={field.onChange} 
                          initialFocus 
                          locale={es} 
                          disabled={(date) => date <= new Date()} 
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.auctionDate && <p className="text-sm text-destructive mt-1">{errors.auctionDate.message}</p>}
              </div>
              
              <div>
                <Label htmlFor="inspectionDate">Fecha de Inspección (Automática)</Label>
                <div className="mt-1 p-3 bg-muted rounded-md border border-border">
                  <div className="flex items-center space-x-2">
                    <Info className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">
                      {inspectionDate ? format(inspectionDate, "PPP", { locale: es }) : 'Selecciona fecha de subasta'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se programa automáticamente 1 día antes de la subasta
                  </p>
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-lg font-medium text-foreground mb-2">Ubicación del Vehículo</h3>
              <Controller
                name="locationType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      setLocationType(value);
                      if (value === 'iaa') {
                        setValue('copartLocation', '');
                        setValue('otherLocationAddress', '');
                      }
                      if (value === 'copart') {
                        setValue('iaaLocation', '');
                        setValue('otherLocationAddress', '');
                      }
                      if (value === 'other') {
                        setValue('iaaLocation', '');
                        setValue('copartLocation', '');
                      }
                    }}
                    value={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2"><RadioGroupItem value="iaa" id="loc-iaa" /><Label htmlFor="loc-iaa">Sucursal IAA</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="copart" id="loc-copart" /><Label htmlFor="loc-copart">Sucursal Copart</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="loc-other" /><Label htmlFor="loc-other">Otra Ubicación</Label></div>
                  </RadioGroup>
                )}
              />
              {errors.locationType && <p className="text-sm text-destructive mt-1">{errors.locationType.message}</p>}

              {watchedLocationType === 'iaa' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <Label htmlFor="iaaLocation">Selecciona Sucursal IAA (Texas)</Label>
                    <Controller name="iaaLocation" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`mt-1 w-full ${errors.iaaLocation ? 'border-destructive' : ''}`}><SelectValue placeholder="Selecciona una sucursal IAA" /></SelectTrigger>
                          <SelectContent>{iaaLocations.map(loc => (<SelectItem key={loc.id} value={loc.id}>{loc.name} - {loc.address}</SelectItem>))}</SelectContent>
                        </Select>
                    )} />
                    {errors.iaaLocation && <p className="text-sm text-destructive mt-1">{errors.iaaLocation.message}</p>}
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground text-sm p-2 border rounded-md bg-muted/50 h-10"><MapPin className="h-4 w-4" /><span>Mapa interactivo (Próximamente)</span></div>
                </div>
              )}

              {watchedLocationType === 'copart' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div>
                    <Label htmlFor="copartLocation">Selecciona Sucursal Copart (Texas)</Label>
                    <Controller name="copartLocation" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className={`mt-1 w-full ${errors.copartLocation ? 'border-destructive' : ''}`}><SelectValue placeholder="Selecciona una sucursal Copart" /></SelectTrigger>
                          <SelectContent>{copartLocations.map(loc => (<SelectItem key={loc.id} value={loc.id}>{loc.name} - {loc.address}</SelectItem>))}</SelectContent>
                        </Select>
                    )} />
                    {errors.copartLocation && <p className="text-sm text-destructive mt-1">{errors.copartLocation.message}</p>}
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground text-sm p-2 border rounded-md bg-muted/50 h-10"><MapPin className="h-4 w-4" /><span>Mapa interactivo (Próximamente)</span></div>
                </div>
              )}

              {watchedLocationType === 'other' && (
                <div>
                  <Label htmlFor="otherLocationAddress">Dirección Completa</Label>
                  <Input id="otherLocationAddress" placeholder="Calle, Número, Ciudad, Estado, CP" {...register("otherLocationAddress")} className={`mt-1 ${errors.otherLocationAddress ? 'border-destructive' : ''}`} />
                  {errors.otherLocationAddress && <p className="text-sm text-destructive mt-1">{errors.otherLocationAddress.message}</p>}
                </div>
              )}
              <div>
                <Label htmlFor="exactLocationDetails">Ubicación Exacta / Detalles Adicionales</Label>
                <Input id="exactLocationDetails" placeholder="Ej: Fila 5, Espacio 12; Contactar a Juan Pérez" {...register("exactLocationDetails")} className="mt-1" />
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-2">
              <Label htmlFor="comments">Instrucciones Especiales</Label>
              <Textarea id="comments" placeholder="Describe si necesitas verificar algo específicamente (máx 500 caracteres)" maxLength={500} {...register("comments")} className={`mt-1 resize-none ${errors.comments ? 'border-destructive' : ''}`} rows={4} />
              <div className="text-right text-sm text-muted-foreground">{commentLength}/500</div>
              {errors.comments && <p className="text-sm text-destructive mt-1">{errors.comments.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando Solicitud...' : 'Enviar Solicitud'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Historial de Inspecciones</CardTitle>
          <CardDescription>Estado de tus solicitudes anteriores.</CardDescription>
        </CardHeader>
        <CardContent>
          {inspections.length > 0 ? (
            <div className="space-y-3">
              {inspections.map((inspection) => (
                <div key={inspection.id} className="p-4 border border-border rounded-lg bg-secondary">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">Stock# {inspection.stock_number}</h4>
                      <p className="text-sm text-muted-foreground">
                        Inspección: {new Date(inspection.inspection_date).toLocaleDateString()} | 
                        Subasta: {new Date(inspection.auction_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Estado: <span className="capitalize">{inspection.status}</span>
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      inspection.status === 'completed' ? 'bg-green-400 text-green-950' :
                      inspection.status === 'scheduled' ? 'bg-blue-400 text-blue-950' :
                      'bg-yellow-400 text-yellow-950'
                    }`}>
                      {inspection.status === 'completed' ? 'Completada' :
                       inspection.status === 'scheduled' ? 'Programada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No hay inspecciones anteriores registradas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectionsPage;
