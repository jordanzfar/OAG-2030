import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Data y Cliente Supabase
import { groupedIaaLocations, groupedCopartLocations, flatIaaLocations, flatCopartLocations } from '@/data/auctionLocations';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

; 

// Hooks y Componentes UI
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // CORREGIDO: Se importa Input
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PenSquare, CalendarIcon, Info, MapPin } from 'lucide-react';
import { cn } from "@/lib/utils";

// Componentes Mejorados y Reutilizables (Asegúrate de que estas rutas sean correctas)
import FeeCalculator from '@/components/page-specific/auctions/FeeCalculator';
import FormInput from '@/components/page-specific/auctions/FormInput';

// --- LÓGICA DE CÁLCULO DE TARIFAS ---
const buyerFeeTiers = [ { min: 0, max: 49.99, fee: 25 }, { min: 50, max: 99.99, fee: 45 }, { min: 100, max: 199.99, fee: 80 }, { min: 200, max: 299.99, fee: 130 }, { min: 300, max: 349.99, fee: 137.50 }, { min: 350, max: 399.99, fee: 145 }, { min: 400, max: 449.99, fee: 175 }, { min: 450, max: 499.99, fee: 185 }, { min: 500, max: 549.99, fee: 205 }, { min: 550, max: 599.99, fee: 210 }, { min: 600, max: 699.99, fee: 240 }, { min: 700, max: 799.99, fee: 270 }, { min: 800, max: 899.99, fee: 295 }, { min: 900, max: 999.99, fee: 320 }, { min: 1000, max: 1199.99, fee: 375 }, { min: 1200, max: 1299.99, fee: 395 }, { min: 1300, max: 1399.99, fee: 410 }, { min: 1400, max: 1499.99, fee: 430 }, { min: 1500, max: 1599.99, fee: 445 }, { min: 1600, max: 1699.99, fee: 465 }, { min: 1700, max: 1799.99, fee: 485 }, { min: 1800, max: 1999.99, fee: 510 }, { min: 2000, max: 2399.99, fee: 535 }, { min: 2400, max: 2499.99, fee: 570 }, { min: 2500, max: 2999.99, fee: 610 }, { min: 3000, max: 3499.99, fee: 655 }, { min: 3500, max: 3999.99, fee: 705 }, { min: 4000, max: 4499.99, fee: 725 }, { min: 4500, max: 4999.99, fee: 750 }, { min: 5000, max: 5499.99, fee: 775 }, { min: 5500, max: 5999.99, fee: 800 }, { min: 6000, max: 6499.99, fee: 825 }, { min: 6500, max: 6999.99, fee: 845 }, { min: 7000, max: 7499.99, fee: 880 }, { min: 7500, max: 7999.99, fee: 900 }, { min: 8000, max: 8499.99, fee: 925 }, { min: 8500, max: 9999.99, fee: 945 }, { min: 10000, max: 14999.99, fee: 1000 }, { min: 15000, max: Infinity, fee: 0.075, isPercentage: true }];
const OPULENT_FEE = 300.00;
const INTERNET_FEE = 85.00;
const PROCESSING_FEES = 95.00 + 15.00 + 20.00;
const defaultFees = { bid: 0, buyer_fee: 0, internet_fee: 0, opulent_fee: 0, processing_fees: 0, total: 0 };
const calculateFees = (bid) => { const numericBid = bid ? parseFloat(String(bid).replace(/[^0-9.]/g, '')) : 0; if (isNaN(numericBid) || numericBid <= 0) return defaultFees; const tier = buyerFeeTiers.find(t => numericBid >= t.min && numericBid <= t.max); if (!tier) return defaultFees; const buyer_fee = tier.isPercentage ? numericBid * tier.fee : tier.fee; const total = numericBid + buyer_fee + INTERNET_FEE + OPULENT_FEE + PROCESSING_FEES; return { bid: numericBid, buyer_fee, internet_fee: INTERNET_FEE, opulent_fee: OPULENT_FEE, processing_fees: PROCESSING_FEES, total }; };

// --- ESQUEMA DE VALIDACIÓN ZOD ---
const currentYear = new Date().getFullYear();
const auctionSchema = z.object({
  vin: z.string().length(17, { message: "El VIN debe tener 17 caracteres." }).trim(),
  vehicleUrl: z.string().url({ message: "Debe ser una URL válida." }),
  auctionDate: z.date({ required_error: "La fecha es obligatoria." }),
  make: z.string().min(2, { message: "La marca es requerida." }).trim(),
  model: z.string().min(1, { message: "El modelo es requerido." }).trim(),
  year: z.coerce.number().min(1980, `El año debe ser 1980 o posterior.`).max(currentYear + 1, `El año no puede ser mayor que ${currentYear + 1}.`),
  color: z.string().min(2, { message: "El color es requerido." }).trim(),
  auctionHouse: z.enum(['IAA', 'Copart'], { required_error: "Selecciona una casa de subastas." }),
  auctionState: z.string().min(1, "Debes seleccionar un estado."),
  auctionLocation: z.string({ required_error: "Selecciona una ubicación." }).min(1, "Selecciona una ubicación."),
  lotNumber: z.string().min(1, { message: "El número de lote es requerido." }),
  maxBid: z.string().min(1, { message: "La puja es obligatoria." }),
  comments: z.string().max(500, "Máximo 500 caracteres.").optional(),
  legalAuth: z.boolean().refine(val => val === true, { message: "Debes aceptar los términos para continuar." }),
});

// --- COMPONENTE DE BARRA DE PROGRESO (MEJORADO) ---
const ProgressBar = ({ currentStep }) => {
  const steps = [
    { id: 1, title: 'Detalles y Costos' },
    { id: 2, title: 'Confirmar y Firmar' },
  ];

  return (
    <nav className="mb-8 pt-2">
      <ol className="flex items-center w-full">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* El nodo del paso (círculo y texto) */}
            <li className="flex flex-col items-center justify-start text-center w-28 flex-shrink-0">
              <motion.div
                layout
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold transition-colors duration-500',
                  currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}
              >
                {/* Mostramos un check si el paso fue completado */}
                <AnimatePresence>
                  {currentStep > step.id ? (
                    <motion.svg
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <motion.path d="M20 6 9 17l-5-5" />
                    </motion.svg>
                  ) : (
                    <motion.span
                      key="step-number"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {step.id}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <p className={cn(
                'mt-2 text-sm font-medium transition-colors duration-500',
                currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {step.title}
              </p>
            </li>

            {/* El conector (la línea que se estira) */}
            {index < steps.length - 1 && (
              <li className="flex-1 px-2">
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
                    <motion.div 
                        className="h-full bg-primary"
                        initial={{ width: '0%' }}
                        animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                        transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                </div>
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function AuctionPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calculatedFees, setCalculatedFees] = useState(defaultFees);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const sigPadRef = useRef(null);
    const { toast } = useToast();
    const { user, userProfile } = useAuth();

    const form = useForm({
        resolver: zodResolver(auctionSchema),
        mode: "onChange",
        defaultValues: { vin: '', vehicleUrl: '', make: '', model: '', year: '', color: '', lotNumber: '', auctionDate: null, auctionHouse: undefined, auctionState: '', auctionLocation: '', maxBid: '', comments: '', legalAuth: false },
    });
    
    const watchedBidAmount = form.watch('maxBid');
    const watchedAuctionHouse = form.watch('auctionHouse');
    const watchedState = form.watch('auctionState');

    useEffect(() => {
        setCalculatedFees(calculateFees(watchedBidAmount));
    }, [watchedBidAmount]);
    
    useEffect(() => {
        if (watchedAuctionHouse) {
            form.setValue('auctionState', '');
            form.setValue('auctionLocation', '');
            setSelectedLocation(null);
        }
    }, [watchedAuctionHouse, form.setValue]);

    const handleNextStep = async () => {
        const fieldsToValidate = ["vin", "vehicleUrl", "auctionDate", "make", "model", "year", "color", "auctionHouse", "auctionState", "auctionLocation", "lotNumber", "maxBid"];
        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
            setCurrentStep(2);
        } else {
            toast({ title: "Campos Incompletos", description: "Por favor, completa todos los campos requeridos para continuar.", variant: "destructive" });
        }
    };
    
    const generatePdfBlob = (bidData, fees) => {
        const doc = new jsPDF();
        const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
        const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.setFontSize(18); doc.text("Comprobante de Solicitud de Puja - Opulent Auto Gallery", 14, 22);
        doc.setFontSize(11);
        doc.text(`Fecha de Solicitud: ${today}`, 14, 30);
        doc.text(`Cliente: ${userProfile?.full_name || 'N/A'}`, 14, 36);
        doc.text(`Email: ${user?.email || 'N/A'}`, 14, 42);
        autoTable(doc, {
            startY: 50, head: [['Detalle del Vehículo', 'Información']],
            body: [
                ['VIN', bidData.vin], ['URL del Vehículo', { content: bidData.vehicle_url, styles: { cellWidth: 'wrap' } }],
                ['Vehículo', `${bidData.year} ${bidData.make} ${bidData.model} (${bidData.color})`],
                ['Subasta', `${bidData.auction_type} - Lote #${bidData.lot_number}`],
                ['Ubicación', bidData.auction_location_id], ['Fecha de Subasta', format(bidData.auction_date, 'PPP', { locale: es })],
            ], theme: 'striped'
        });
        let finalY = doc.lastAutoTable.finalY;
        doc.text("Desglose de Costos Estimados:", 14, finalY + 10);
        if (fees) {
            autoTable(doc, {
                startY: finalY + 12, head: [['Concepto', 'Monto (USD)']],
                body: [
                    ['Puja Máxima', currencyFormatter.format(fees.bid)],
                    ["Tarifa de Compra de la subasta (Tarifa de Compra)", currencyFormatter.format(fees.buyer_fee)],
                    ['Tarifa de Internet de la subasta (Tarifa de Internet)', currencyFormatter.format(fees.internet_fee)],
                    ['Tarifa de Servicio (Opulent)', currencyFormatter.format(fees.opulent_fee)],
                    ['Tarifas de Procesamiento de la Subasta (Auction Processing Fees)', currencyFormatter.format(fees.processing_fees)],
                ],
                foot: [['Total Estimado', currencyFormatter.format(fees.total)]], footStyles: { fontStyle: 'bold', fontSize: 12 }, theme: 'grid'
            });
            finalY = doc.lastAutoTable.finalY;
        }
        doc.text("Firma de Autorización:", 14, finalY + 15);
        if (bidData.signature_image_base64) doc.addImage(bidData.signature_image_base64, 'PNG', 14, finalY + 17, 60, 30);
        const signatureTextY = finalY + 55;
        doc.setLineWidth(0.2); doc.line(14, signatureTextY - 2, 84, signatureTextY - 2);
        doc.text(bidData.full_name, 14, signatureTextY);
        doc.setFontSize(8); doc.text("Nombre Impreso del Solicitante", 14, signatureTextY + 4);
        return doc.output('blob');
    };

    const onFormSubmit = async (data) => {
        if (!user || !userProfile) return toast({ title: "Error de autenticación", variant: "destructive" });
        if (sigPadRef.current.isEmpty()) return toast({ title: "Firma Requerida", description:"Por favor, firma en el recuadro para continuar.", variant: "destructive" });
        
        setIsSubmitting(true);
        try {
            const signatureImage = sigPadRef.current.toDataURL('image/png');
            const dataToInsert = {
                user_id: user.id, full_name: userProfile.full_name, email: user.email, phone: userProfile.phone || 'N/A',
                vin: data.vin, vehicle_url: data.vehicleUrl, auction_date: format(data.auctionDate, 'yyyy-MM-dd'),
                make: data.make, model: data.model, year: data.year, color: data.color,
                auction_type: data.auctionHouse, auction_location_id: data.auctionLocation,
                lot_number: data.lotNumber, max_bid: parseFloat(String(data.maxBid).replace(/[^0-9.]/g, '')), comments: data.comments,
                legal_auth_accepted: data.legalAuth, signature_image_base64: signatureImage,
                fees_detail: calculatedFees
            };

            const { data: newBid, error: insertError } = await supabase.from('auction_bids').insert(dataToInsert).select('id').single();
            if (insertError) throw insertError;
            
            const pdfBlob = generatePdfBlob(dataToInsert, calculatedFees);
            const pdfPath = `${user.id}/${newBid.id}/comprobante-puja.pdf`;
            
            // Reemplaza 'tu-bucket' con el nombre real de tu bucket de Storage
            const { data: uploadData, error: uploadError } = await supabase.storage.from('auction-receipts').upload(pdfPath, pdfBlob);
            if (uploadError) throw uploadError;

            const { error: updateError } = await supabase.from('auction_bids').update({ receipt_pdf_path: uploadData.path }).eq('id', newBid.id);
            if (updateError) throw updateError;
            
            toast({ title: "¡Solicitud Completa!", description: "Tus datos y comprobante han sido guardados." });
            form.reset();
            sigPadRef.current.clear();
            setCurrentStep(1);

        } catch (error) {
             console.error('Error en el proceso de envío:', error);
             toast({ title: "Ocurrió un Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const locationOptions = watchedAuctionHouse ? (watchedAuctionHouse === 'IAA' ? groupedIaaLocations : groupedCopartLocations) : {};
    const availableStates = Object.keys(locationOptions).sort();
    
    const handleLocationChange = (value) => {
        form.setValue('auctionLocation', value);
        const allLocations = watchedAuctionHouse === 'IAA' ? flatIaaLocations : flatCopartLocations;
        const locationDetails = allLocations.find(loc => loc.full === value);
        setSelectedLocation(locationDetails || null);
    };

    return (
        <div className="w-full max-w-5xl mx-auto pb-8 px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Solicitar Puja en Subasta</h1>
            <p className="text-muted-foreground mb-8">Completa los 2 pasos para autorizarnos a pujar por un vehículo en tu nombre.</p>
            <Card className="bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
                <CardHeader>
                    <ProgressBar currentStep={currentStep} />
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onFormSubmit)}>
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
                                    <CardTitle>Paso 1: Detalles y Costos</CardTitle>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                                        <div className="space-y-6">
                                            <FormInput name="vin" label="VIN del vehículo (17 caracteres)" control={form.control} placeholder="Ingresa los 17 caracteres del VIN" maxLength="17" />
                                            <FormInput name="vehicleUrl" label="URL del Vehículo en Subasta" control={form.control} placeholder="https://www.copart.com/lot/..." />
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormInput name="make" label="Marca" control={form.control} />
                                                <FormInput name="model" label="Modelo" control={form.control} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormInput name="year" label="Año" type="number" control={form.control} placeholder={currentYear.toString()} />
                                                <FormInput name="color" label="Color" control={form.control} />
                                            </div>
                                             <div>
                                                <Label>Fecha de la subasta</Label>
                                                <Controller name="auctionDate" control={form.control} render={({ field, fieldState: { error } }) => (
                                                  <>
                                                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal mt-1", !field.value && "text-muted-foreground", error && "border-destructive")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} initialFocus /></PopoverContent></Popover>
                                                    {error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}
                                                  </>
                                                )} />
                                            </div>
                                            <FormInput name="lotNumber" label="Número de Lote / Stock" control={form.control} placeholder="Ej: 12345678" />
                                        </div>
                                        <div className="space-y-6 flex flex-col">
                                            <div className="space-y-4 rounded-lg border p-4">
                                                <Label>Casa de Subastas</Label>
                                                <Controller name="auctionHouse" control={form.control} render={({ field, fieldState: { error } }) => (
                                                  <>
                                                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex space-x-4 pt-2">
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="IAA" id="house-iaa" /><Label htmlFor="house-iaa">IAA</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Copart" id="house-copart" /><Label htmlFor="house-copart">Copart</Label></div>
                                                    </RadioGroup>
                                                    {error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}
                                                  </>
                                                )} />
                                                <AnimatePresence>
                                                {watchedAuctionHouse && (
                                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 pt-2">
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                                            <Controller name="auctionState" control={form.control} render={({ field, fieldState: { error } }) => (
                                                                <div><Label>Estado</Label><Select onValueChange={value => { field.onChange(value); setSelectedLocation(null); form.setValue('auctionLocation', ''); }} value={field.value}><SelectTrigger className={cn("mt-1", error && "border-destructive")}><SelectValue placeholder="Elige..." /></SelectTrigger><SelectContent className="max-h-[280px]">{availableStates.map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent></Select>{error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}</div>
                                                            )} />
                                                            <Controller name="auctionLocation" control={form.control} render={({ field, fieldState: { error } }) => (
                                                                <div><Label>Sucursal</Label><Select onValueChange={(value) => handleLocationChange(value)} value={field.value} disabled={!watchedState}><SelectTrigger className={cn("w-full mt-1", error && "border-destructive")}><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent className="max-h-[280px]">{watchedState && locationOptions[watchedState]?.map(loc => (<SelectItem key={loc.full} value={loc.full}>{loc.name}</SelectItem>))}</SelectContent></Select>{error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}</div>
                                                            )} />
                                                        </div>
                                                        <AnimatePresence>
                                                        {selectedLocation && (
                                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="overflow-hidden">
                                                                <div className="pt-2">
                                                                    <Label>Dirección de la Sucursal</Label>
                                                                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground p-3 border rounded-md bg-background">
                                                                        <MapPin className="h-5 w-5 flex-shrink-0" />
                                                                        <p>{selectedLocation.address}</p>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                        </AnimatePresence>
                                                    </motion.div>
                                                )}
                                                </AnimatePresence>
                                            </div>
                                            <FormInput name="maxBid" label="Monto máximo de puja (USD)" control={form.control} placeholder="$1,234.56" isCurrency />
                                            <div className="flex-grow flex flex-col">
                                                <FeeCalculator fees={calculatedFees} />
                                            </div>
                                        </div>
                                    </div>
                                    <Alert variant="default" className="mt-6"><Info className="h-4 w-4" /><AlertDescription>El total mostrado es aproximado. Las tarifas pueden variar minimamente del total estimado.</AlertDescription></Alert>
                                </motion.div>
                            )}
                            
                            {currentStep === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                                    <CardTitle>Paso 2: Confirmar y Firmar</CardTitle>
                                    <Card className="bg-muted/50 p-4">
                                        <CardDescription>Por favor, confirma los detalles antes de firmar:</CardDescription>
                                        <div className="text-sm font-medium mt-2 space-y-1">
                                            <p><strong>Vehículo:</strong> {form.getValues('year')} {form.getValues('make')} {form.getValues('model')} ({form.getValues('color')})</p>
                                            <p><strong>Subasta:</strong> {form.getValues('auctionHouse')} - Lote #{form.getValues('lotNumber')}</p>
                                            <p className="font-bold pt-2">Puja Máxima: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(String(form.getValues('maxBid') || '0').replace(/[^0-9.]/g, '')))}</p>
                                            <p className="font-bold text-lg">Total Estimado: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculatedFees?.total || 0)}</p>
                                        </div>
                                    </Card>
                                    <div>
                                        <Label htmlFor="comments">Comentarios o Instrucciones Adicionales</Label>
                                        <Textarea id="comments" {...form.register('comments')} className="mt-1" placeholder="Ej: Revisar si hay daños en la parte inferior..." />
                                    </div>
                                    <div className="border-t pt-4 space-y-4">
                                        <Label className="text-lg font-semibold">Consentimiento y Firma Digital</Label>
                                        <Alert variant="default" className="bg-muted/50"><PenSquare className="h-4 w-4" /><AlertTitle>Firma Requerida</AlertTitle><AlertDescription>Firma en el recuadro para confirmar tu solicitud. Esta firma se guardará como comprobante de tu autorización.</AlertDescription></Alert>
                                        <div className="w-full h-[200px] bg-background rounded-md border border-dashed">
                                            <SignatureCanvas ref={sigPadRef} penColor='white' canvasProps={{ className: 'w-full h-full' }} />
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => sigPadRef.current.clear()}>Limpiar Firma</Button>
                                        <div className="pt-2">
                                            <Label>Nombre del Solicitante (Confirmación)</Label>
                                            <Input readOnly value={userProfile?.full_name || 'Cargando...'} className="mt-1 bg-muted/50 cursor-not-allowed" />
                                        </div>
                                        <div className="flex items-start space-x-3 mt-4">
                                            <Controller name="legalAuth" control={form.control} render={({ field, fieldState: { error } }) => (
                                                <div className='flex items-start space-x-3'>
                                                    <Checkbox id="legalAuth" checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <Label htmlFor="legalAuth" className={cn(error && "text-destructive")}>Autorizo y acepto los términos *</Label>
                                                        <p className="text-sm text-muted-foreground">Entiendo que esta solicitud es una autorización vinculante para pujar en mi nombre hasta el monto máximo especificado.</p>
                                                        {error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}
                                                    </div>
                                                </div>
                                            )}/>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        
                        <div className="flex justify-between items-center pt-8 mt-8 border-t">
                             {currentStep > 1 && (<Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>Anterior</Button>)}
                             <div className="flex-grow"></div>
                             {currentStep < 2 ? (<Button type="button" size="lg" onClick={handleNextStep}>Siguiente</Button>) : (<Button type="submit" size="lg" disabled={isSubmitting || !form.formState.isValid}>{isSubmitting ? 'Enviando...' : 'Enviar Solicitud Final'}</Button>)}
                         </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};