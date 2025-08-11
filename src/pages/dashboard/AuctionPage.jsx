import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { PenSquare, CalendarIcon, Info, MapPin } from 'lucide-react';
import { cn } from "@/lib/utils";
import { groupedIaaLocations, groupedCopartLocations, flatIaaLocations, flatCopartLocations } from '@/data/auctionLocations';
import FeeCalculator from '@/components/page-specific/auctions/FeeCalculator';
import FormInput from '@/components/page-specific/auctions/FormInput';
import { Skeleton } from "@/components/ui/skeleton";
import AuctionBidsHistory from '@/components/bids/AuctionBidsHistory';

// --- LÓGICA DE CÁLCULO DE TARIFAS MODIFICADA ---
const buyerFeeTiers = [ { min: 0, max: 49.99, fee: 25 }, { min: 50, max: 99.99, fee: 45 }, { min: 100, max: 199.99, fee: 80 }, { min: 200, max: 299.99, fee: 130 }, { min: 300, max: 349.99, fee: 137.50 }, { min: 350, max: 399.99, fee: 145 }, { min: 400, max: 449.99, fee: 175 }, { min: 450, max: 499.99, fee: 185 }, { min: 500, max: 549.99, fee: 205 }, { min: 550, max: 599.99, fee: 210 }, { min: 600, max: 699.99, fee: 240 }, { min: 700, max: 799.99, fee: 270 }, { min: 800, max: 899.99, fee: 295 }, { min: 900, max: 999.99, fee: 320 }, { min: 1000, max: 1199.99, fee: 375 }, { min: 1200, max: 1299.99, fee: 395 }, { min: 1300, max: 1399.99, fee: 410 }, { min: 1400, max: 1499.99, fee: 430 }, { min: 1500, max: 1599.99, fee: 445 }, { min: 1600, max: 1699.99, fee: 465 }, { min: 1700, max: 1799.99, fee: 485 }, { min: 1800, max: 1999.99, fee: 510 }, { min: 2000, max: 2399.99, fee: 535 }, { min: 2400, max: 2499.99, fee: 570 }, { min: 2500, max: 2999.99, fee: 610 }, { min: 3000, max: 3499.99, fee: 655 }, { min: 3500, max: 3999.99, fee: 705 }, { min: 4000, max: 4499.99, fee: 725 }, { min: 4500, max: 4999.99, fee: 750 }, { min: 5000, max: 5499.99, fee: 775 }, { min: 5500, max: 5999.99, fee: 800 }, { min: 6000, max: 6499.99, fee: 825 }, { min: 6500, max: 6999.99, fee: 845 }, { min: 7000, max: 7499.99, fee: 880 }, { min: 7500, max: 7999.99, fee: 900 }, { min: 8000, max: 8499.99, fee: 925 }, { min: 8500, max: 9999.99, fee: 945 }, { min: 10000, max: 14999.99, fee: 1000 }, { min: 15000, max: Infinity, fee: 0.075, isPercentage: true }];
const OPULENT_FEE = 300.00;
const INTERNET_FEE = 85.00;
const PROCESSING_FEES = 95.00 + 15.00 + 20.00;
const TAX_RATE = 0.08; // 8%
const defaultFees = { bid: 0, buyer_fee: 0, internet_fee: 0, opulent_fee: 0, processing_fees: 0, tax: 0, total: 0 };

// Ahora acepta 'purchaseType' para el cálculo
const calculateFees = (bid, purchaseType) => { 
    const numericBid = bid ? parseFloat(String(bid).replace(/[^0-9.]/g, '')) : 0; 
    if (isNaN(numericBid) || numericBid <= 0) return defaultFees; 
    const tier = buyerFeeTiers.find(t => numericBid >= t.min && numericBid <= t.max); 
    if (!tier) return defaultFees; 
    
    const buyer_fee = tier.isPercentage ? numericBid * tier.fee : tier.fee; 
    
    let tax = 0;
    // Si la compra es local, calcula el impuesto sobre el monto de la puja
    if (purchaseType === 'local' && numericBid > 0) {
        tax = numericBid * TAX_RATE;
    }

    const total = numericBid + buyer_fee + INTERNET_FEE + OPULENT_FEE + PROCESSING_FEES + tax;
    
    return { bid: numericBid, buyer_fee, internet_fee: INTERNET_FEE, opulent_fee: OPULENT_FEE, processing_fees: PROCESSING_FEES, tax, total }; 
};

// --- ESQUEMA DE VALIDACIÓN ZOD MODIFICADO ---
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
  purchaseType: z.enum(['export', 'local'], { required_error: "Selecciona el tipo de compra." }), // <-- Nuevo campo
  lotNumber: z.string().min(1, { message: "El número de lote es requerido." }),
  maxBid: z.string().min(1, { message: "La puja es obligatoria." }),
  comments: z.string().max(500, "Máximo 500 caracteres.").optional(),
  legalAuth: z.boolean().refine(val => val === true, { message: "Debes aceptar los términos para continuar." }),
});

// --- COMPONENTE DE BARRA DE PROGRESO ---
const ProgressBar = ({ currentStep }) => {
    const steps = [{ id: 1, title: 'Detalles y Costos' }, { id: 2, title: 'Confirmar y Firmar' }];
    return (
        <nav className="mb-8 pt-2">
            <ol className="flex items-center w-full">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <li className="flex flex-col items-center justify-start text-center w-28 flex-shrink-0">
                            <motion.div layout className={cn('flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold transition-colors duration-500', currentStep >= step.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                                <AnimatePresence>
                                    {currentStep > step.id ? (<motion.svg key="check" initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><motion.path d="M20 6 9 17l-5-5" /></motion.svg>) : (<motion.span key="step-number" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.2 }}>{step.id}</motion.span>)}
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

// --- CONSTANTES PARA FILTROS Y PAGINACIÓN ---
const statusLabels = {
    pending: 'Pendiente', reviewing: 'En Revisión', approved: 'Aprobada',
    won: 'Ganada', lost: 'Perdida', outbid: 'Puja Superada', rejected: 'Rechazada',
    completed: 'Completado', pending_payment: 'Pendiente de Pago',
    cancelled: 'Cancelado', expired: 'Expirado', error: 'Error',
    offered: 'Ofertado', processing: 'Procesando'
};
const BIDS_PER_PAGE = 5;

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
    
    // State para el historial, filtros y paginación
    const [bidsHistory, setBidsHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalBids, setTotalBids] = useState(0);
    const [availableStatuses, setAvailableStatuses] = useState([]);

    const form = useForm({
        resolver: zodResolver(auctionSchema),
        mode: "onChange",
        defaultValues: { 
            vin: '', vehicleUrl: '', make: '', model: '', year: '', color: '', lotNumber: '', 
            auctionDate: null, auctionHouse: undefined, auctionState: '', auctionLocation: '', 
            purchaseType: 'export', // <-- Nuevo valor por defecto
            maxBid: '', comments: '', legalAuth: false 
        },
    });
    
    const watchedBidAmount = form.watch('maxBid');
    const watchedAuctionHouse = form.watch('auctionHouse');
    const watchedState = form.watch('auctionState');
    const watchedPurchaseType = form.watch('purchaseType'); // <-- Observa el nuevo campo


    // Función para obtener los filtros dinámicos
    const fetchDistinctStatuses = useCallback(async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase.rpc('get_user_bid_statuses');
            if (error) throw error;
            const options = data.map(item => ({
                value: item.status,
                label: statusLabels[item.status] || item.status
            }));
            setAvailableStatuses(options);
        } catch (error) {
            console.error("Error fetching distinct statuses:", error);
            toast({ title: "Error al cargar filtros", variant: "destructive" });
        }
    }, [user, supabase, toast]);

    // Función para obtener las pujas (con paginación y filtro)
    const fetchBidsHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
            const from = (currentPage - 1) * BIDS_PER_PAGE;
            const to = from + BIDS_PER_PAGE - 1;

            let query = supabase
                .from('auction_bids')
                .select('*', { count: 'exact' })
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (selectedStatus !== 'all') {
                query = query.eq('status', selectedStatus);
            }
            const { data, error, count } = await query;
            if (error) throw error;
            setBidsHistory(data || []);
            setTotalBids(count || 0);
        } catch (error) {
            console.error("Error fetching bids history:", error);
            toast({ title: "Error al cargar el historial", variant: "destructive" });
        } finally {
            setHistoryLoading(false);
        }
    }, [user, supabase, toast, currentPage, selectedStatus]);

    useEffect(() => {
        if (user) {
            fetchDistinctStatuses();
        }
    }, [user, fetchDistinctStatuses]);
    
    useEffect(() => {
        if (user) {
            fetchBidsHistory();
        }
    }, [user, fetchBidsHistory]);

    useEffect(() => {
        setCalculatedFees(calculateFees(watchedBidAmount, watchedPurchaseType));
    }, [watchedBidAmount, watchedPurchaseType]);
    
    
    useEffect(() => {
        if (watchedAuctionHouse) {
            form.setValue('auctionState', '');
            form.setValue('auctionLocation', '');
            setSelectedLocation(null);
        }
    }, [watchedAuctionHouse, form.setValue]);

    // Handlers para UI
    const handleStatusChange = (status) => {
        setCurrentPage(1);
        setSelectedStatus(status);
    };

    const handlePageChange = (newPage) => {
        const totalPages = Math.ceil(totalBids / BIDS_PER_PAGE);
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleNextStep = async () => {
        const fieldsToValidate = ["vin", "vehicleUrl", "auctionDate", "make", "model", "year", "color", "auctionHouse", "auctionState", "auctionLocation", "lotNumber", "maxBid"];
        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
            setCurrentStep(2);
        } else {
            toast({ title: "Campos Incompletos", description: "Por favor, completa todos los campos requeridos.", variant: "destructive" });
        }
    };
    
    const generatePdfBlob = (bidData, fees) => {
    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

    // --- 1. CONFIGURACIÓN DE DISEÑO Y MARCA ---
    // ¡Reemplaza esto con los colores de tu empresa!
    const primaryColor = '#0F172A'; // Un azul oscuro/casi negro para títulos
    const secondaryColor = '#64748B'; // Un gris para texto secundario
    const accentColor = '#3B82F6';   // Un azul brillante para el total
    const tableHeaderColor = '#F1F5F9'; // Un gris muy claro para cabeceras de tabla

    // --- ¡IMPORTANTE! Reemplaza el texto de abajo con el Base64 de tu logo ---
    const logoBase64 = 'data:image/png;base64,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'
    
    // --- 2. ENCABEZADO Y LOGO ---
    const addHeader = () => {
        doc.addImage(logoBase64, 'PNG', 14, 10, 70, 25); // (logo, formato, x, y, width, height)
        
        doc.setFontSize(14);
        doc.setTextColor(primaryColor);
        doc.setFont('helvetica', 'bold');
        doc.text("Opulent Auto Gallery", pageWidth - 14, 20, { align: 'right' });
        
        doc.setFontSize(9);
        doc.setTextColor(secondaryColor);
        doc.setFont('helvetica', 'normal');
        doc.text("123 Luxury Lane, Houston, TX 77001", pageWidth - 14, 25, { align: 'right' });
        doc.text("contact@opulentgallery.com | +1 (832) 555-1234", pageWidth - 14, 29, { align: 'right' });
    };

    // --- 3. PIE DE PÁGINA ---
    // Esta función se ejecutará en cada página gracias al hook `didDrawPage` de autoTable
    const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(secondaryColor);
        doc.setLineWidth(0.2);
        doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15); // Línea del footer
        doc.text('Este documento es una estimación y no una factura final. Los costos pueden variar.', 14, pageHeight - 10);
        doc.text(`Página ${doc.internal.getCurrentPageInfo().pageNumber} de ${pageCount}`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    };

    // --- 4. TÍTULO Y DATOS DEL CLIENTE ---
    addHeader();

    doc.setFontSize(22);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text("Autorización de Puja", 14, 45);

    doc.setLineWidth(0.5);
    doc.setDrawColor(primaryColor);
    doc.line(14, 47, 80, 47); // Línea decorativa bajo el título
    const col1_x = 14;
    const col2_x = pageWidth / 2 + 10; 

    // Bloque de información del cliente (Columna 1)
    doc.setFontSize(10);
    doc.setTextColor(secondaryColor);
    doc.text("FACTURADO A:", col1_x, 58);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(bidData.full_name || 'N/A', col1_x, 63);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    doc.text(bidData.email || 'N/A', col1_x, 68);

    // Bloque de detalles de la solicitud (Columna 2)
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text("FECHA DE SOLICITUD:", col2_x, 58);
    doc.text("TIPO DE COMPRA:", col2_x, 63);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(today, col2_x + 40, 58); // Alineamos el valor un poco a la derecha del label
    doc.text(bidData.purchaseType === 'local' ? 'Compra Local' : 'Exportación', col2_x + 40, 63);
    
    // --- 5. TABLAS CON ESTILO PERSONALIZADO ---
    const commonTableStyles = {
        startY: 75,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 2.5,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: tableHeaderColor,
            textColor: primaryColor,
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: '#CBD5E1'
        },
        bodyStyles: {
            textColor: secondaryColor,
            lineWidth: 0.1,
            lineColor: '#E2E8F0'
        },
        alternateRowStyles: {
            fillColor: '#F8FAFC'
        },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 45 },
            1: { cellWidth: 'auto' }
        }
    };

    // Tabla de Detalles del Vehículo
    autoTable(doc, {
        ...commonTableStyles,
        head: [['Detalle del Vehículo', 'Información']],
        body: [
            ['VIN', bidData.vin],
            ['Vehículo', `${bidData.year} ${bidData.make} ${bidData.model} (${bidData.color})`],
            ['Subasta', `${bidData.auction_type} - Lote #${bidData.lot_number}`],
            ['Ubicación', bidData.auction_location_id],
            ['Fecha Subasta', format(bidData.auction_date, 'PPP', { locale: es })],
            ['URL', { content: bidData.vehicle_url, styles: { textColor: accentColor } }]
        ]
    });
    
    let finalY = doc.lastAutoTable.finalY;
    const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    // Preparar datos para la tabla de costos
    const costBody = [
        ['Puja Máxima', currencyFormatter.format(fees.bid)],
        ["Tarifa de Compra (Auction)", currencyFormatter.format(fees.buyer_fee)],
        ['Tarifa de Internet (Auction)', currencyFormatter.format(fees.internet_fee)],
        ['Tarifa de Servicio (Opulent)', currencyFormatter.format(fees.opulent_fee)],
        ['Tarifas de Procesamiento', currencyFormatter.format(fees.processing_fees)],
    ];
    
    // Añadir el impuesto condicionalmente
    if (fees.tax > 0) {
        costBody.push([{ content: 'Tax ( % Variante por Estado )', styles: { fontStyle: 'bold' } }, { content: currencyFormatter.format(fees.tax), styles: { fontStyle: 'bold' } }]);
    }

    // Tabla de Desglose de Costos
    autoTable(doc, {
        ...commonTableStyles,
        startY: finalY + 10,
        head: [['Concepto', 'Monto (USD)']],
        body: costBody,
        foot: [['Total Estimado', currencyFormatter.format(fees.total)]],
        footStyles: {
            fillColor: primaryColor,
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            fontSize: 11
        },
        // Añadimos el footer a la última tabla para que se dibuje en todas las páginas
        didDrawPage: () => addFooter() 
    });

    finalY = doc.lastAutoTable.finalY;

    // --- 6. SECCIÓN DE FIRMA Y TÉRMINOS ---
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text("Firma de Autorización", 14, finalY + 15);
    
    if (bidData.signature_image_base64) {
        doc.addImage(bidData.signature_image_base64, 'PNG', 14, finalY + 18, 60, 25);
    }
    
    const signatureTextY = finalY + 50;
    doc.setLineWidth(0.2);
    doc.setDrawColor(secondaryColor);
    doc.line(14, signatureTextY - 2, 84, signatureTextY - 2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(secondaryColor);
    doc.setFontSize(8);
    doc.text("Firma digitalmente aceptada por:", 14, signatureTextY + 2);
    doc.setTextColor(primaryColor);
    doc.setFontSize(9);
    doc.text(bidData.full_name, 14, signatureTextY + 6);

    // Bloque de texto de términos y condiciones
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor);
    const termsText = "Al firmar, usted autoriza a Opulent Auto Gallery a pujar en su nombre hasta el monto máximo especificado. Entiende que esta autorización es vinculante y que todas las tarifas estimadas están sujetas a cambios menores basados en las tarifas finales de la casa de subastas.";
    const splitTerms = doc.splitTextToSize(termsText, pageWidth - 100); // Ancho del texto
    doc.text(splitTerms, pageWidth - 14, finalY + 15, { align: 'right' });
    
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
                status: 'pending'
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

            if (currentPage === 1 && selectedStatus === 'all') {
                await fetchBidsHistory();
            } else {
                setCurrentPage(1);
                setSelectedStatus('all');
            }
            await fetchDistinctStatuses(); // Refresh statuses in case a new one was created

        } catch (error) {
             console.error('Error en el proceso de envío:', error);
             toast({ title: "Ocurrió un Error", description: error.message, variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDownloadReceipt = async (filePath) => {
      try {
        const { data, error } = await supabase.storage.from('auction-receipts').download(filePath);
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
        toast({ title: "Error de Descarga", variant: "destructive" });
      }
    };

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
                Para que podamos realizar una puja en tu nombre durante una subasta vehicular, es necesario completar los dos pasos indicados a continuación.
            </p>
            
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
                                                                <div><Label>Estado</Label><Select onValueChange={value => { field.onChange(value); setSelectedLocation(null); form.setValue('auctionLocation', ''); }} value={field.value}><SelectTrigger className={cn("mt-1", error && "border-destructive")}><SelectValue placeholder="Elige..." /></SelectTrigger><SelectContent className="max-h-[280px]">{Object.keys(watchedAuctionHouse === 'IAA' ? groupedIaaLocations : groupedCopartLocations).sort().map(state => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent></Select>{error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}</div>
                                                            )} />
                                                            <Controller name="auctionLocation" control={form.control} render={({ field, fieldState: { error } }) => (
                                                                <div><Label>Sucursal</Label><Select onValueChange={(value) => handleLocationChange(value)} value={field.value} disabled={!watchedState}><SelectTrigger className={cn("w-full mt-1", error && "border-destructive")}><SelectValue placeholder="Selecciona..." /></SelectTrigger><SelectContent className="max-h-[280px]">{watchedState && (watchedAuctionHouse === 'IAA' ? groupedIaaLocations : groupedCopartLocations)[watchedState]?.map(loc => (<SelectItem key={loc.full} value={loc.full}>{loc.name}</SelectItem>))}</SelectContent></Select>{error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}</div>
                                                            )} />
                                                        </div>
                                                        <AnimatePresence>
                                                        {selectedLocation && (
                                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="overflow-hidden">
                                                                <div className="pt-2">
                                                                    <Label>Dirección</Label>
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

                                                <div className="space-y-2 rounded-lg border p-4">
                                                <Label>Tipo de Compra</Label>
                                                <Controller
                                                    name="purchaseType"
                                                    control={form.control}
                                                    render={({ field, fieldState: { error } }) => (
                                                        <>
                                                            <RadioGroup
                                                                onValueChange={field.onChange}
                                                                value={field.value}
                                                                className="flex space-x-4 pt-2"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="export" id="type-export" />
                                                                    <Label htmlFor="type-export" className="font-normal">Vehículo para Exportación</Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="local" id="type-local" />
                                                                    <Label htmlFor="type-local" className="font-normal">Compra Local</Label>
                                                                </div>
                                                            </RadioGroup>
                                                            {error && <p className="text-sm font-medium text-destructive mt-1">{error.message}</p>}
                                                        </>
                                                    )}
                                                />
                                            </div>   

                                            </div>
                                            <FormInput name="maxBid" label="Monto máximo de puja (USD)" control={form.control} placeholder="$1,234.56" isCurrency />
                                            <div className="flex-grow flex flex-col">
                                                <FeeCalculator fees={calculatedFees} />
                                            </div>
                                        </div>
                                    </div>
                                    <Alert variant="default" className="mt-6"><Info className="h-4 w-4" /><AlertDescription>El total mostrado es aproximado. Las tarifas pueden variar.</AlertDescription></Alert>
                                </motion.div>
                            )}
                            
                            {currentStep === 2 && (
                                <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
                                    <CardTitle>Paso 2: Confirmar y Firmar</CardTitle>
                                    <Card className="bg-muted/50 p-4">
                                        <CardDescription>Confirma los detalles antes de firmar:</CardDescription>
                                        <div className="text-sm font-medium mt-2 space-y-1">
                                            <p><strong>Vehículo:</strong> {form.getValues('year')} {form.getValues('make')} {form.getValues('model')}</p>
                                            <p><strong>Subasta:</strong> {form.getValues('auctionHouse')} - Lote #{form.getValues('lotNumber')}</p>
                                            <p className="font-bold pt-2">Puja Máxima: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(String(form.getValues('maxBid') || '0').replace(/[^0-9.]/g, '')))}</p>
                                            <p className="font-bold text-lg">Total Estimado: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(calculatedFees?.total || 0)}</p>
                                        </div>
                                    </Card>
                                    
                                    <div className="border-t pt-4 space-y-4">
                                        <Label className="text-lg font-semibold">Consentimiento y Firma</Label>
                                        <Alert variant="default" className="bg-muted/50"><PenSquare className="h-4 w-4" /><AlertTitle>Firma Requerida</AlertTitle><AlertDescription>Firma en el recuadro para confirmar tu autorización.</AlertDescription></Alert>
                                        <div className="w-full h-[200px] bg-gray-300 rounded-md border border-dashed">
                                            <SignatureCanvas ref={sigPadRef} penColor='black' canvasProps={{ className: 'w-full h-full' }} />
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={() => sigPadRef.current.clear()}>Limpiar Firma</Button>
                                        <div className="pt-2">
                                            <Label>Nombre del Solicitante</Label>
                                            <Input readOnly value={userProfile?.full_name || 'Cargando...'} className="mt-1 bg-muted/50 cursor-not-allowed" />
                                        </div>
                                        <div className="flex items-start space-x-3 mt-4">
                                            <Controller name="legalAuth" control={form.control} render={({ field, fieldState: { error } }) => (
                                                <div className='flex items-start space-x-3'>
                                                    <Checkbox id="legalAuth" checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                                                    <div className="grid gap-1.5 leading-none">
                                                        <Label htmlFor="legalAuth" className={cn(error && "text-destructive")}>Autorizo y acepto los términos *</Label>
                                                        <p className="text-sm text-muted-foreground">Entiendo que esta es una autorización vinculante.</p>
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

            <div className="mt-16">
                {historyLoading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-40 w-full" />
                    </div>
                ) : (
                    <AuctionBidsHistory 
                        bids={bidsHistory} 
                        onDownloadReceipt={handleDownloadReceipt}
                        statusOptions={availableStatuses}
                        selectedStatus={selectedStatus}
                        onStatusChange={handleStatusChange}
                        currentPage={currentPage}
                        totalPages={Math.ceil(totalBids / BIDS_PER_PAGE)}
                        onPageChange={handlePageChange}
                        totalBids={totalBids}
                        bidsPerPage={BIDS_PER_PAGE}
                    />
                )}
            </div>
        </div>
    );
}