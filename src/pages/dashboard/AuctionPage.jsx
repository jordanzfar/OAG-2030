// src/pages/dashboard/AuctionPage.jsx

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
import CurrencyInput from 'react-currency-input-field';

// Data y Cliente Supabase
import { groupedIaaLocations, groupedCopartLocations } from '@/data/auctionLocations';
import { supabase } from '@/lib/supabase'; 

// Hooks y Componentes UI
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableFooter, TableRow, TableHead, TableHeader } from "@/components/ui/table";
import { PenSquare, CalendarIcon, Info } from 'lucide-react';
import { cn } from "@/lib/utils";

// ====================================================================
// --- INICIO DE LA NUEVA LÓGICA DE LA CALCULADORA DE TARIFAS ---
// ====================================================================
const buyerFeeTiers = [
    { min: 0, max: 49.99, fee: 25 }, { min: 50, max: 99.99, fee: 45 },
    { min: 100, max: 199.99, fee: 80 }, { min: 200, max: 299.99, fee: 130 },
    { min: 300, max: 349.99, fee: 137.50 }, { min: 350, max: 399.99, fee: 145 },
    { min: 400, max: 449.99, fee: 175 }, { min: 450, max: 499.99, fee: 185 },
    { min: 500, max: 549.99, fee: 205 }, { min: 550, max: 599.99, fee: 210 },
    { min: 600, max: 699.99, fee: 240 }, { min: 700, max: 799.99, fee: 270 },
    { min: 800, max: 899.99, fee: 295 }, { min: 900, max: 999.99, fee: 320 },
    { min: 1000, max: 1199.99, fee: 375 }, { min: 1200, max: 1299.99, fee: 395 },
    { min: 1300, max: 1399.99, fee: 410 }, { min: 1400, max: 1499.99, fee: 430 },
    { min: 1500, max: 1599.99, fee: 445 }, { min: 1600, max: 1699.99, fee: 465 },
    { min: 1700, max: 1799.99, fee: 485 }, { min: 1800, max: 1999.99, fee: 510 },
    { min: 2000, max: 2399.99, fee: 535 }, { min: 2400, max: 2499.99, fee: 570 },
    { min: 2500, max: 2999.99, fee: 610 }, { min: 3000, max: 3499.99, fee: 655 },
    { min: 3500, max: 3999.99, fee: 705 }, { min: 4000, max: 4499.99, fee: 725 },
    { min: 4500, max: 4999.99, fee: 750 }, { min: 5000, max: 5499.99, fee: 775 },
    { min: 5500, max: 5999.99, fee: 800 }, { min: 6000, max: 6499.99, fee: 825 },
    { min: 6500, max: 6999.99, fee: 845 }, { min: 7000, max: 7499.99, fee: 880 },
    { min: 7500, max: 7999.99, fee: 900 }, { min: 8000, max: 8499.99, fee: 925 },
    { min: 8500, max: 9999.99, fee: 945 }, { min: 10000, max: 14999.99, fee: 1000 },
    { min: 15000, max: Infinity, fee: 0.075, isPercentage: true }
];

const OPULENT_FEE = 300.00;
const INTERNET_FEE = 85.00;
const PROCESSING_FEES = 95.00 + 15.00 + 20.00;

const calculateFees = (bid) => {
    const numericBid = parseFloat(bid);
    if (isNaN(numericBid) || numericBid < 0) return null;

    const tier = buyerFeeTiers.find(t => numericBid >= t.min && numericBid <= t.max);
    if (!tier) return null;

    const buyer_fee = tier.isPercentage ? numericBid * tier.fee : tier.fee;
    const total = numericBid + buyer_fee + INTERNET_FEE + OPULENT_FEE + PROCESSING_FEES;

    return {
        bid: numericBid,
        buyer_fee,
        internet_fee: INTERNET_FEE,
        opulent_fee: OPULENT_FEE,
        processing_fees: PROCESSING_FEES,
        total,
    };
};
// ====================================================================
// --- FIN DE LA NUEVA LÓGICA DE LA CALCULADORA ---
// ====================================================================


const currentYear = new Date().getFullYear();
const auctionSchema = z.object({
  vin: z.string().length(17, { message: "El VIN debe tener 17 caracteres." }).trim(),
  vehicleUrl: z.string().url({ message: "Debe ser una URL válida." }),
  auctionDate: z.date({ required_error: "La fecha es obligatoria." }),
  make: z.string().min(2, { message: "La marca es requerida." }).trim(),
  model: z.string().min(1, { message: "El modelo es requerido." }).trim(),
  year: z.coerce.number().min(1980, `El año debe ser 1980 o posterior.`).max(currentYear, `El año no puede ser mayor que ${currentYear}.`),
  color: z.string().min(2, { message: "El color es requerido." }).trim(),
  auctionHouse: z.enum(['IAA', 'Copart'], { required_error: "Selecciona una casa de subastas." }),
  auctionLocation: z.string({ required_error: "Selecciona una ubicación." }).min(1, "Selecciona una ubicación."),
  lotNumber: z.string().min(1, { message: "El número de lote es requerido." }),
  maxBid: z.string().min(1, { message: "La puja es obligatoria." }).or(z.number()).transform(val => Number(String(val).replace(/[^0-9.-]+/g, ""))).refine(val => val >= 0, { message: "La puja debe ser un número positivo."}),
  comments: z.string().max(500, "Máximo 500 caracteres.").optional(),
  legalAuth: z.boolean().refine(val => val === true, { message: "Debes aceptar los términos para continuar." }),
});

const ProgressBar = ({ currentStep, totalSteps }) => {
    const steps = [ { id: 1, title: 'Detalles y Costos' }, { id: 2, title: 'Confirmar y Firmar' } ];
    return (
        <nav className="mb-8">
            <ol className="flex items-center w-full">
                {steps.map((step, index) => (
                    <li key={step.id} className={`flex w-full items-center ${index < totalSteps - 1 ? 'after:content-[\'\'] after:w-full after:h-1 after:border-b after:border-4 after:inline-block' : ''} ${currentStep > step.id ? 'after:border-primary' : 'after:border-border'}`}>
                        <div className="flex flex-col items-center justify-center">
                            <span className={`flex items-center justify-center w-10 h-10 rounded-full text-lg ${currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                {currentStep > step.id ? '✓' : step.id}
                            </span>
                            <span className={`mt-2 text-sm text-center ${currentStep >= step.id ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{step.title}</span>
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
};

export default function AuctionPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calculatedFees, setCalculatedFees] = useState(null);
    const [selectedState, setSelectedState] = useState('');
    const sigPadRef = useRef(null);
    const { toast } = useToast();
    const { user, userProfile } = useAuth();

    const form = useForm({
        resolver: zodResolver(auctionSchema),
        mode: "onChange",
        defaultValues: { vin: '', vehicleUrl: '', make: '', model: '', year: '', color: '', lotNumber: '', auctionDate: null, auctionHouse: undefined, auctionLocation: '', maxBid: '', comments: '', legalAuth: false },
    });

    const watchedBidAmount = form.watch('maxBid');
    
    useEffect(() => {
        const fees = calculateFees(watchedBidAmount);
        setCalculatedFees(fees);
    }, [watchedBidAmount]);

    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    const handleNextStep = async () => {
        const fieldsToValidate = ["vin", "vehicleUrl", "auctionDate", "make", "model", "year", "color", "auctionHouse", "auctionLocation", "lotNumber", "maxBid"];
        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) setCurrentStep(2);
        else toast({ title: "Campos Incompletos", description: "Por favor, completa todos los campos del Paso 1 para continuar.", variant: "destructive" });
    };
    
    const generatePdfBlob = (bidData, fees) => {
        const doc = new jsPDF();
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
                    ["Buyer's Fee (Tarifa de Compra)", currencyFormatter.format(fees.buyer_fee)],
                    ['Internet Fee', currencyFormatter.format(fees.internet_fee)],
                    ['Tarifa de Servicio (Opulent)', currencyFormatter.format(fees.opulent_fee)],
                    ['Tarifas de Procesamiento', currencyFormatter.format(fees.processing_fees)],
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
        if (sigPadRef.current.isEmpty()) return toast({ title: "Firma Requerida", variant: "destructive" });
        setIsSubmitting(true);
        const signatureImage = sigPadRef.current.toDataURL('image/png');
        const dataToInsert = {
            user_id: user.id, full_name: userProfile.full_name, email: user.email, phone: userProfile.phone || 'N/A',
            vin: data.vin, vehicle_url: data.vehicleUrl, auction_date: format(data.auctionDate, 'yyyy-MM-dd'),
            make: data.make, model: data.model, year: data.year, color: data.color,
            auction_type: data.auctionHouse, auction_location_id: data.auctionLocation,
            lot_number: data.lotNumber, max_bid: data.maxBid, comments: data.comments,
            legal_auth_accepted: data.legalAuth, signature_image_base64: signatureImage,
            fees_detail: calculatedFees
        };
        const { data: newBid, error: insertError } = await supabase.from('auction_bids').insert(dataToInsert).select('id').single();
        if (insertError) {
            console.error('Error al insertar puja:', insertError);
            toast({ title: "Error al Guardar Datos", description: insertError.message, variant: "destructive" });
            setIsSubmitting(false); return;
        }
        const pdfBlob = generatePdfBlob(dataToInsert, calculatedFees);
        const pdfPath = `${user.id}/${newBid.id}/comprobante-puja.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from('auction-receipts').upload(pdfPath, pdfBlob);
        if (uploadError) {
            console.error('Error al subir PDF:', uploadError);
            toast({ title: "Error al Subir Comprobante", description: uploadError.message, variant: "destructive" });
            setIsSubmitting(false); return;
        }
        const { error: updateError } = await supabase.from('auction_bids').update({ receipt_pdf_path: uploadData.path }).eq('id', newBid.id);
        if (updateError) {
            toast({ title: "Error al Vincular PDF", description: updateError.message, variant: "destructive" });
        } else {
            toast({ title: "¡Solicitud Completa!", description: "Tus datos y comprobante han sido guardados." });
        }
        form.reset();
        sigPadRef.current.clear();
        setCurrentStep(1);
        setIsSubmitting(false);
    };
    
    const watchedAuctionHouse = form.watch('auctionHouse');
    const locationOptions = watchedAuctionHouse ? (watchedAuctionHouse === 'IAA' ? groupedIaaLocations : groupedCopartLocations) : {};
    const availableStates = Object.keys(locationOptions).sort();

    return (
        <div className="w-full max-w-5xl mx-auto pb-8 px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Solicitar Puja en Subasta</h1>
            <p className="text-muted-foreground mb-8">Completa los 2 pasos para autorizarnos a pujar por un vehículo en tu nombre.</p>
            <Card className="bg-card border-border shadow-lg">
                <CardHeader><ProgressBar currentStep={currentStep} totalSteps={2} /></CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onFormSubmit)}>
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
                                    <CardTitle>Paso 1: Detalles y Costos</CardTitle>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                                        <div className="space-y-6">
                                            <div><Label htmlFor="vin">VIN del vehículo (17 caracteres)</Label><Input id="vin" placeholder="Ingresa los 17 caracteres del VIN" maxLength="17" {...form.register("vin")} />{form.formState.errors.vin && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.vin.message}</p>}</div>
                                            <div><Label htmlFor="vehicleUrl">URL del Vehículo en Subasta</Label><Input id="vehicleUrl" placeholder="https://www.copart.com/lot/..." {...form.register("vehicleUrl")} />{form.formState.errors.vehicleUrl && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.vehicleUrl.message}</p>}</div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label htmlFor="make">Marca</Label><Input id="make" {...form.register("make")} />{form.formState.errors.make && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.make.message}</p>}</div>
                                                <div><Label htmlFor="model">Modelo</Label><Input id="model" {...form.register("model")} />{form.formState.errors.model && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.model.message}</p>}</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label htmlFor="year">Año</Label><Input id="year" type="number" placeholder={currentYear.toString()} {...form.register("year")} />{form.formState.errors.year && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.year.message}</p>}</div>
                                                <div><Label htmlFor="color">Color</Label><Input id="color" {...form.register("color")} />{form.formState.errors.color && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.color.message}</p>}</div>
                                            </div>
                                             <div>
                                                <Label>Fecha de la subasta</Label>
                                                <Controller name="auctionDate" control={form.control} render={({ field }) => (
                                                    <Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{field.value ? format(field.value, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus /></PopoverContent></Popover>
                                                )} />
                                                {form.formState.errors.auctionDate && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.auctionDate.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="lotNumber">Número de Lote / Stock</Label>
                                                <Input id="lotNumber" placeholder="Ej: 12345678" {...form.register("lotNumber")} />
                                                {form.formState.errors.lotNumber && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.lotNumber.message}</p>}
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div className="space-y-4 rounded-lg border p-4">
                                                <Label>Casa y Ubicación de la Subasta</Label>
                                                <Controller name="auctionHouse" control={form.control} render={({ field }) => (
                                                    <RadioGroup onValueChange={(value) => { field.onChange(value); setSelectedState(''); form.setValue('auctionLocation', ''); }} value={field.value} className="flex space-x-4 pt-2">
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="IAA" id="house-iaa" /><Label htmlFor="house-iaa">IAA</Label></div>
                                                        <div className="flex items-center space-x-2"><RadioGroupItem value="Copart" id="house-copart" /><Label htmlFor="house-copart">Copart</Label></div>
                                                    </RadioGroup>
                                                )} />
                                                {form.formState.errors.auctionHouse && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.auctionHouse.message}</p>}
                                                <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
                                                  <div>
                                                    <Label>Estado</Label>
                                                    <Select onValueChange={(value) => { setSelectedState(value); form.setValue('auctionLocation', ''); }} value={selectedState} disabled={!watchedAuctionHouse}>
                                                      <SelectTrigger><SelectValue placeholder="Elige..." /></SelectTrigger>
                                                      <SelectContent className="max-h-[280px]">{availableStates.map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent>
                                                    </Select>
                                                  </div>
                                                  <div>
                                                    <Label>Sucursal</Label>
                                                    <Controller name="auctionLocation" control={form.control} render={({ field }) => (
                                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                                                            <SelectTrigger className="w-full"><SelectValue className="truncate" placeholder={!selectedState ? "Elige estado" : "Selecciona sucursal"} /></SelectTrigger>
                                                            <SelectContent className="max-h-[280px]">{selectedState && locationOptions[selectedState]?.map(loc => (<SelectItem key={loc.full} value={loc.full}>{loc.name} – {loc.address}</SelectItem>))}</SelectContent>
                                                        </Select>
                                                    )} />
                                                  </div>
                                                </div>
                                                {form.formState.errors.auctionLocation && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.auctionLocation.message}</p>}
                                            </div>
                                            <div>
                                                <Label htmlFor="maxBid" className="text-base font-semibold">Monto máximo de puja (USD)</Label>
                                                <Controller name="maxBid" control={form.control} render={({ field }) => (
                                                    <CurrencyInput id="maxBid" name={field.name} placeholder="$1,234.56" value={field.value} onValueChange={(value) => field.onChange(value)} intlConfig={{ locale: 'en-US', currency: 'USD' }} decimalsLimit={2}
                                                        className={cn("flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50")}
                                                    />
                                                )} />
                                                {form.formState.errors.maxBid && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.maxBid.message}</p>}
                                            </div>
                                            <div className="rounded-lg bg-muted/50 p-4 border self-start">
                                                <h4 className="font-semibold mb-2 text-center text-muted-foreground">Desglose de Tarifas Estimadas</h4>
                                                {calculatedFees ? (
                                                    <Table>
                                                        <TableBody>
                                                            <TableRow><TableCell className="text-muted-foreground">Puja Máxima</TableCell><TableCell className="text-right font-medium">{currencyFormatter.format(calculatedFees.bid)}</TableCell></TableRow>
                                                            <TableRow><TableCell className="text-muted-foreground">Buyer's Fee</TableCell><TableCell className="text-right">{currencyFormatter.format(calculatedFees.buyer_fee)}</TableCell></TableRow>
                                                            <TableRow><TableCell className="text-muted-foreground">Internet Fee</TableCell><TableCell className="text-right">{currencyFormatter.format(calculatedFees.internet_fee)}</TableCell></TableRow>
                                                            <TableRow><TableCell className="text-muted-foreground">Tarifa Opulent</TableCell><TableCell className="text-right">{currencyFormatter.format(calculatedFees.opulent_fee)}</TableCell></TableRow>
                                                            <TableRow><TableCell className="text-muted-foreground">Tarifas de Proceso</TableCell><TableCell className="text-right">{currencyFormatter.format(calculatedFees.processing_fees)}</TableCell></TableRow>
                                                        </TableBody>
                                                        <TableFooter><TableRow className="text-base font-bold"><TableHead>Total Estimado</TableHead><TableHead className="text-right">{currencyFormatter.format(calculatedFees.total)}</TableHead></TableRow></TableFooter>
                                                    </Table>
                                                ) : ( <p className="text-sm text-center text-muted-foreground py-10">Ingresa un monto de puja para ver el desglose.</p> )}
                                            </div>
                                        </div>
                                    </div>
                                    <Alert variant="default" className="mt-6"><Info className="h-4 w-4" /><AlertDescription>El total mostrado es aproximado. Las tarifas pueden variar minimamente de 0% a 5% del total estimado.</AlertDescription></Alert>
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
                                            <p className="font-bold pt-2">Puja Máxima: {currencyFormatter.format(form.getValues('maxBid') || 0)}</p>
                                            <p className="font-bold text-lg">Total Estimado: {currencyFormatter.format(calculatedFees?.total || 0)}</p>
                                        </div>
                                    </Card>
                                    <div><Label htmlFor="comments">Comentarios o Instrucciones Adicionales</Label><Textarea id="comments" {...form.register('comments')} className="mt-1" placeholder="Ej: Revisar si hay daños en la parte inferior..." /></div>
                                    <div className="border-t pt-4 space-y-4">
                                        <Label className="text-lg font-semibold">Consentimiento y Firma Digital</Label>
                                        <Alert variant="default" className="bg-muted/50"><PenSquare className="h-4 w-4" /><AlertTitle>Firma Requerida</AlertTitle><AlertDescription>Firma en el recuadro para confirmar tu solicitud. Esta firma se guardará como comprobante de tu autorización.</AlertDescription></Alert>
                                        <div className="w-full h-[200px] bg-background rounded-md border border-dashed"><SignatureCanvas ref={sigPadRef} penColor='white' canvasProps={{ className: 'w-full h-full' }} /></div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => sigPadRef.current.clear()}>Limpiar Firma</Button>
                                        <div className="pt-2">
                                            <Label>Nombre del Solicitante (Confirmación)</Label>
                                            <Input readOnly value={userProfile?.full_name || 'Cargando...'} className="mt-1 bg-muted/50 cursor-not-allowed" />
                                        </div>
                                        <div className="flex items-start space-x-3 mt-4">
                                            <Controller name="legalAuth" control={form.control} render={({ field }) => ( <Checkbox id="legalAuth" checked={field.value} onCheckedChange={field.onChange} className="mt-1" /> )}/>
                                            <div className="grid gap-1.5 leading-none">
                                                <Label htmlFor="legalAuth">Autorizo y acepto los términos *</Label>
                                                <p className="text-sm text-muted-foreground">Entiendo que esta solicitud es una autorización vinculante para pujar en mi nombre hasta el monto máximo especificado.</p>
                                                {form.formState.errors.legalAuth && <p className="text-sm font-medium text-destructive mt-1">{form.formState.errors.legalAuth.message}</p>}
                                            </div>
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