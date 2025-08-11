import React, { useState, useEffect, useRef, useCallback } from 'react'; // Se añade useCallback
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

// Hooks y Componentes UI
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

// Componentes Mejorados y Reutilizables
import FeeCalculator from '@/components/page-specific/auctions/FeeCalculator';
import FormInput from '@/components/page-specific/auctions/FormInput';
import { Skeleton } from "@/components/ui/skeleton"; // --- ADICIÓN PARA EL HISTORIAL ---

// --- ADICIÓN PARA EL HISTORIAL ---
// Importamos el componente de historial que creamos anteriormente.
import AuctionBidsHistory from '@/components/bids/AuctionBidsHistory';

// --- LÓGICA DE CÁLCULO DE TARIFAS (sin cambios) ---
const buyerFeeTiers = [ { min: 0, max: 49.99, fee: 25 }, { min: 50, max: 99.99, fee: 45 }, { min: 100, max: 199.99, fee: 80 }, { min: 200, max: 299.99, fee: 130 }, { min: 300, max: 349.99, fee: 137.50 }, { min: 350, max: 399.99, fee: 145 }, { min: 400, max: 449.99, fee: 175 }, { min: 450, max: 499.99, fee: 185 }, { min: 500, max: 549.99, fee: 205 }, { min: 550, max: 599.99, fee: 210 }, { min: 600, max: 699.99, fee: 240 }, { min: 700, max: 799.99, fee: 270 }, { min: 800, max: 899.99, fee: 295 }, { min: 900, max: 999.99, fee: 320 }, { min: 1000, max: 1199.99, fee: 375 }, { min: 1200, max: 1299.99, fee: 395 }, { min: 1300, max: 1399.99, fee: 410 }, { min: 1400, max: 1499.99, fee: 430 }, { min: 1500, max: 1599.99, fee: 445 }, { min: 1600, max: 1699.99, fee: 465 }, { min: 1700, max: 1799.99, fee: 485 }, { min: 1800, max: 1999.99, fee: 510 }, { min: 2000, max: 2399.99, fee: 535 }, { min: 2400, max: 2499.99, fee: 570 }, { min: 2500, max: 2999.99, fee: 610 }, { min: 3000, max: 3499.99, fee: 655 }, { min: 3500, max: 3999.99, fee: 705 }, { min: 4000, max: 4499.99, fee: 725 }, { min: 4500, max: 4999.99, fee: 750 }, { min: 5000, max: 5499.99, fee: 775 }, { min: 5500, max: 5999.99, fee: 800 }, { min: 6000, max: 6499.99, fee: 825 }, { min: 6500, max: 6999.99, fee: 845 }, { min: 7000, max: 7499.99, fee: 880 }, { min: 7500, max: 7999.99, fee: 900 }, { min: 8000, max: 8499.99, fee: 925 }, { min: 8500, max: 9999.99, fee: 945 }, { min: 10000, max: 14999.99, fee: 1000 }, { min: 15000, max: Infinity, fee: 0.075, isPercentage: true }];
const OPULENT_FEE = 300.00;
const INTERNET_FEE = 85.00;
const PROCESSING_FEES = 95.00 + 15.00 + 20.00;
const defaultFees = { bid: 0, buyer_fee: 0, internet_fee: 0, opulent_fee: 0, processing_fees: 0, total: 0 };
const calculateFees = (bid) => { const numericBid = bid ? parseFloat(String(bid).replace(/[^0-9.]/g, '')) : 0; if (isNaN(numericBid) || numericBid <= 0) return defaultFees; const tier = buyerFeeTiers.find(t => numericBid >= t.min && numericBid <= t.max); if (!tier) return defaultFees; const buyer_fee = tier.isPercentage ? numericBid * tier.fee : tier.fee; const total = numericBid + buyer_fee + INTERNET_FEE + OPULENT_FEE + PROCESSING_FEES; return { bid: numericBid, buyer_fee, internet_fee: INTERNET_FEE, opulent_fee: OPULENT_FEE, processing_fees: PROCESSING_FEES, total }; };


// --- ESQUEMA DE VALIDACIÓN ZOD (sin cambios) ---
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

// --- COMPONENTE DE BARRA DE PROGRESO (sin cambios) ---
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
            <li className="flex flex-col items-center justify-start text-center w-28 flex-shrink-0">
              <motion.div layout className={cn('flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold transition-colors duration-500', currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                <AnimatePresence>
                  {currentStep > step.id ? (
                    <motion.svg key="check" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><motion.path d="M20 6 9 17l-5-5" /></motion.svg>
                  ) : (
                    <motion.span key="step-number" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>{step.id}</motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <p className={cn('mt-2 text-sm font-medium transition-colors duration-500', currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground')}>{step.title}</p>
            </li>
            {index < steps.length - 1 && (
              <li className="flex-1 px-2">
                <div className="h-1.5 w-full rounded-full bg-border overflow-hidden"><motion.div className="h-full bg-primary" initial={{ width: '0%' }} animate={{ width: currentStep > step.id ? '100%' : '0%' }} transition={{ duration: 0.6, ease: 'easeInOut' }} /></div>
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
    const supabase = useSupabaseClient();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calculatedFees, setCalculatedFees] = useState(defaultFees);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const sigPadRef = useRef(null);
    const { toast } = useToast();
    const { user, userProfile } = useAuth();
    
    // --- ADICIONES PARA EL HISTORIAL ---
    const [bidsHistory, setBidsHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const form = useForm({
        resolver: zodResolver(auctionSchema),
        mode: "onChange",
        defaultValues: { vin: '', vehicleUrl: '', make: '', model: '', year: '', color: '', lotNumber: '', auctionDate: null, auctionHouse: undefined, auctionState: '', auctionLocation: '', maxBid: '', comments: '', legalAuth: false },
    });
    
    const watchedBidAmount = form.watch('maxBid');
    const watchedAuctionHouse = form.watch('auctionHouse');
    const watchedState = form.watch('auctionState');

    // --- LÓGICA PARA CARGAR EL HISTORIAL ---
    const fetchBidsHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const { data, error } = await supabase
                .from('auction_bids')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setBidsHistory(data || []);
        } catch (error) {
            console.error("Error fetching bids history:", error.message);
            toast({ title: "Error al cargar el historial", description: error.message, variant: "destructive" });
        } finally {
            setHistoryLoading(false);
        }
    }, [user, supabase, toast]);

    useEffect(() => {
        fetchBidsHistory();
    }, [fetchBidsHistory]);
    
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
      // Tu función para generar PDF (sin cambios)
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
                fees_detail: calculatedFees,
                status: 'pending' // Asignar estado inicial
            };

            const { data: newBid, error: insertError } = await supabase.from('auction_bids').insert(dataToInsert).select('id').single();
            if (insertError) throw insertError;
            
            const pdfBlob = generatePdfBlob(dataToInsert, calculatedFees);
            const pdfPath = `${user.id}/${newBid.id}/comprobante-puja.pdf`;
            
            const { data: uploadData, error: uploadError } = await supabase.storage.from('auction-receipts').upload(pdfPath, pdfBlob);
            if (uploadError) throw uploadError;

            const { error: updateError } = await supabase.from('auction_bids').update({ receipt_pdf_path: uploadData.path }).eq('id', newBid.id);
            if (updateError) throw updateError;
            
            toast({ title: "¡Solicitud Completa!", description: "Tus datos y comprobante han sido guardados." });
            form.reset();
            sigPadRef.current.clear();
            setCurrentStep(1);

            // --- ACTUALIZACIÓN DEL HISTORIAL ---
            // Volvemos a cargar el historial para mostrar la nueva puja inmediatamente.
            await fetchBidsHistory();

        } catch (error) {
             console.error('Error en el proceso de envío:', error);
             toast({ title: "Ocurrió un Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- ADICIÓN PARA EL HISTORIAL ---
    // Función para manejar la descarga de un comprobante existente.
    const handleDownloadReceipt = async (filePath) => {
      try {
        const { data, error } = await supabase.storage
          .from('auction-receipts') // Asegúrate de que el bucket name es correcto
          .download(filePath);
  
        if (error) throw error;
        
        const url = window.URL.createObjectURL(data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filePath.split('/').pop());
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      } catch (error) {
        console.error('Error downloading receipt:', error.message);
        toast({ title: "Error de Descarga", description: "No se pudo descargar el comprobante.", variant: "destructive" });
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
        <div className="w-full max-w-5xl mx-auto pb-16 px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
                Autorización para Participación en Subasta
            </h1>
            <p className="text-muted-foreground mb-8">
                Para que podamos realizar una puja en tu nombre...
            </p>
            
            {/* --- FORMULARIO PRINCIPAL (sin cambios en la estructura interna) --- */}
            <Card className="bg-card border-border shadow-lg">
      <CardHeader>
        <CardTitle>Historial de Pujas</CardTitle>
        <CardDescription>Revisa el estado de todas tus solicitudes de puja.</CardDescription>
      </CardHeader>
      <CardContent>
        {bids && bids.length > 0 ? (
          <div className="space-y-4">
            {bids.map((bid) => (
              <div key={bid.id} className="p-4 border border-border rounded-lg bg-secondary/50 transition-all hover:bg-secondary">
                <div className="flex justify-between items-start gap-4">
                  {/* Columna de Información Principal */}
                  <div className="flex-1">
                    <h4 className="font-semibold text-base">VIN: {bid.vin}</h4>
                    <p className="text-sm text-muted-foreground">
                      {bid.make} {bid.model} {bid.year}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviada: {new Date(bid.created_at).toLocaleDateString()}
                    </p>

                    {/* Detalles de la Puja */}
                    <div className="mt-3 border-t border-border/50 pt-3 space-y-1">
                       <p className="text-sm flex justify-between">
                         <span className="text-muted-foreground">Lote:</span>
                         <span className="font-mono">{bid.lot_number || 'N/A'}</span>
                       </p>
                       <p className="text-sm flex justify-between">
                         <span className="text-muted-foreground">Puja Máxima:</span>
                         <span className="font-semibold text-primary">{formatCurrency(bid.max_bid)}</span>
                       </p>
                    </div>

                    {/* Alerta de motivo para pujas perdidas o rechazadas */}
                    {(bid.status === 'lost' || bid.status === 'rejected') && bid.lost_reason && (
                      <div className="mt-3 p-2 bg-red-50 dark:bg-red-950/20 rounded border border-red-200 dark:border-red-800">
                        <p className="text-xs text-red-800 dark:text-red-200 flex items-start">
                          <XCircle className="w-3 h-3 inline mr-2 mt-0.5 flex-shrink-0" />
                          <strong>Motivo:</strong>&nbsp;{bid.lost_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Columna de Estado y Acciones */}
                  <div className="flex flex-col items-end space-y-2 flex-shrink-0">
                    {getStatusBadge(bid.status)}
                    
                    {/* Botón de acción contextual */}
                    {(bid.status === 'won' || bid.status === 'approved') && bid.receipt_pdf_path && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownloadReceipt(bid.receipt_pdf_path)}
                        className="text-xs w-full"
                      >
                        <FileDown className="w-3 h-3 mr-1" />
                        Descargar Comprobante
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
             <Gavel className="mx-auto h-12 w-12 text-muted-foreground/50" />
             <h3 className="mt-2 text-sm font-medium text-foreground">Sin historial de pujas</h3>
             <p className="mt-1 text-sm text-muted-foreground">Aún no has realizado ninguna puja.</p>
          </div>
        )}
      </CardContent>
    </Card>

            {/* --- SECCIÓN DE HISTORIAL DE PUJAS (NUEVA) --- */}
            <div className="mt-16">
                {historyLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                ) : (
                    <AuctionBidsHistory 
                        bids={bidsHistory} 
                        onDownloadReceipt={handleDownloadReceipt} 
                    />
                )}
            </div>
        </div>
    );
}