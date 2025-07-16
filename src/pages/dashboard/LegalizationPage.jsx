import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Hooks y UI de shadcn/ui
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Iconos
import { CheckCircle, AlertCircle, Clock, FileText, FolderOpen, PlusCircle } from 'lucide-react';

// Hooks de la aplicación
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

// Componentes del formulario y modal (asegúrate que las rutas sean correctas)
import LegalizationForm from '@/components/legalization/LegalizationForm';
import DocumentUploadModal from '@/components/legalization/DocumentUploadModal';

// Constantes que estaban en otro archivo, ahora integradas aquí
const requiredDocuments = [
    { id: 'title', label: 'Título del Vehículo' },
    { id: 'bill_of_sale', label: 'Bill of Sale' },
    { id: 'id', label: 'Identificación Oficial' },
    // Agrega aquí los demás documentos requeridos
];

// ====================================================================
// --- SUB-COMPONENTES PARA EL HISTORIAL ---
// ====================================================================

// Componente para cuando no hay historial
const EmptyState = () => (
    <div className="text-center py-12 px-6 bg-card border border-dashed rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay solicitudes todavía</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            Cuando inicies tu primer trámite, aparecerá aquí.
        </p>
    </div>
);

const PROCESS_STEPS = {
  'pending':            { value: 10, label: 'Solicitud Recibida' },
  'in_review':          { value: 30, label: 'Revisión de Documentos' },
  'payment_pending':    { value: 50, label: 'Pendiente de Pago' },
  'processing':         { value: 75, label: 'Legalización en Proceso' },
  'ready_for_delivery': { value: 90, label: 'Listo para Entrega' },
  'completed':          { value: 100, label: 'Vehículo Entregado' },
  'rejected':           { value: 0,  label: 'Solicitud Rechazada' }
};

// Tarjeta individual para cada trámite en el historial
const LegalizationItemCard = ({ legalization, documents, onOpenDocumentModal }) => {
    // Cálculo de estadísticas de documentos (sin cambios)
    const documentStats = useMemo(() => {
        const totalRequired = requiredDocuments.length;
        const uploadedDocs = documents || [];
        const approved = uploadedDocs.filter(doc => doc.status === 'approved').length;
        const completionPercentage = totalRequired > 0 ? Math.round((approved / totalRequired) * 100) : 0;
        return {
            total: totalRequired,
            approved,
            completionPercentage,
            rejected: uploadedDocs.filter(doc => doc.status === 'rejected').length
        };
    }, [documents]);

    // ✨ NUEVO: Obtiene el estado actual del proceso general
    const currentProcessStep = PROCESS_STEPS[legalization.status] || { value: 0, label: 'Estado Desconocido' };

  

    // Mapeo de estados a variantes del Badge de shadcn/ui
    const statusVariantMap = {
        completed: 'success',
        approved: 'success',
        in_review: 'secondary',
        rejected: 'destructive',
        pending: 'outline',
    };

     return (
        <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
                <CardTitle className="text-lg">VIN: {legalization.vin}</CardTitle>
                <CardDescription>
                    {legalization.vehicle_info.marca} {legalization.vehicle_info.modelo} {legalization.vehicle_info.ano}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4"> {/* Aumentamos el espacio aquí */}
                {/* --- BARRA 1: Progreso de Documentos --- */}
                <div>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-muted-foreground">Progreso de Documentos</span>
                        <span className="font-semibold">{documentStats.approved}/{documentStats.total} Aprobados</span>
                    </div>
                    <Progress value={documentStats.completionPercentage} className="h-2" />
                </div>

                {/* --- ✨ NUEVO: BARRA 2: Estado General del Trámite --- */}
                <div>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-muted-foreground">Estado del Trámite</span>
                        <span className="font-semibold">{currentProcessStep.label}</span>
                    </div>
                    <Progress value={currentProcessStep.value} className="h-2" />
                </div>

                {documentStats.rejected > 0 && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            Hay {documentStats.rejected} documento(s) rechazado(s). Por favor, súbelos de nuevo.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex justify-between items-center pt-2">
                     <p className="text-sm text-muted-foreground">
                        Solicitado: {new Date(legalization.created_at).toLocaleDateString()}
                    </p>
                    <Button variant="secondary" size="sm" onClick={() => onOpenDocumentModal(legalization)}>
                        <FolderOpen className="w-4 h-4 mr-2" />
                        Gestionar Documentos
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

// ====================================================================
// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
// ====================================================================

const LegalizationPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { createRecord, createLegalization, createDocument, uploadFile, fetchRecords } = useSupabaseData();
    
    // Estados para la página
    const [legalizations, setLegalizations] = useState([]);
    const [documentsMap, setDocumentsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedLegalization, setSelectedLegalization] = useState(null);
    const [showDocumentModal, setShowDocumentModal] = useState(false);

    // --- LÓGICA DE CARGA DE DATOS ---

    // 1. Cargar las legalizaciones
    const loadLegalizations = useCallback(async () => {
        if (!user) {
            setLegalizations([]);
            return;
        }
        const result = await fetchRecords('legalizations', 
  [{ column: 'user_id', operator: 'eq', value: user.id }], 
  { orderBy: { column: 'created_at', ascending: false } }
);
        if (result.success) {
            setLegalizations(result.data || []);
        }
    }, [user, fetchRecords]);

    // 2. Cargar TODOS los documentos asociados en una sola consulta (optimización N+1)
    const loadAllDocuments = useCallback(async () => {
        if (!user || legalizations.length === 0) {
            return;
        }
        const legalizationIds = legalizations.map(leg => leg.id);
        const result = await fetchRecords('documents', [
    { column: 'user_id', operator: 'eq', value: user.id },
    { column: 'legalization_id', operator: 'in', value: legalizationIds }
]);

        if (result.success) {
            const newDocumentsMap = {};
            result.data.forEach(doc => {
                if (!newDocumentsMap[doc.legalization_id]) {
                    newDocumentsMap[doc.legalization_id] = [];
                }
                newDocumentsMap[doc.legalization_id].push(doc);
            });
            setDocumentsMap(newDocumentsMap);
        }
    }, [user, legalizations, fetchRecords]);

    // useEffect para orquestar la carga de datos
    useEffect(() => {
        const runLoad = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            await loadLegalizations();
            setLoading(false);
        };
        runLoad();
    }, [user, loadLegalizations]);

    // useEffect que se dispara cuando las legalizaciones cambian para cargar sus documentos
    useEffect(() => {
        if (legalizations.length > 0) {
            loadAllDocuments();
        }
    }, [legalizations, loadAllDocuments]);


    // --- MANEJADORES DE EVENTOS ---

    const handleSubmit = async (data, uploadedFiles) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
        // --- ✅ CORRECCIÓN AQUÍ ---
        // Añadimos el user_id directamente al objeto que se va a insertar.
        const legalizationData = {
            user_id: user.id, // <--- LA LÍNEA MÁS IMPORTANTE
            vin: data.vin,
            vehicle_info: { vin: data.vin, color: data.color, marca: data.marca, modelo: data.modelo, ano: data.ano, motor: data.motor, cilindraje: data.cilindraje },
            owner_info: { name: data.ownerName, phone: data.ownerPhone },
            title_info: { issue_date: data.titleIssueDate, origin_state: data.originState, legalization_type: data.legalizationType },
            status: 'pending'
        };

        // Y ahora llamamos a createRecord directamente, que es más limpio.
        const legalizationResult = await createRecord('legalizations', legalizationData);


            if (legalizationResult.success) {
                if (Object.keys(uploadedFiles).length > 0) {
                    const uploadPromises = Object.entries(uploadedFiles).map(async ([key, file]) => {
                        const filePath = `${user.id}/legalizations/${legalizationResult.data.id}/${key}_${file.name}`;
                        const uploadResult = await uploadFile('documents', filePath, file);
                        if (uploadResult.success) {
                            return createDocument(user.id, {
                                legalization_id: legalizationResult.data.id, document_type: key, file_name: file.name, file_path: filePath,
                                file_size: file.size, mime_type: file.type, status: 'pending'
                            });
                        }
                        return null;
                    });
                    await Promise.all(uploadPromises);
                }
                 toast({
                title: "✅ Solicitud Enviada",
                description: "Tu trámite ha sido creado. Ahora puedes gestionar sus documentos.",
            });
            await loadLegalizations(); // Recargar todo
        }
    } catch (error) {
        console.error('Error submitting legalization:', error);
        toast({ variant: "destructive", title: "❌ Error", description: "No se pudo enviar la solicitud." });
    } finally {
        setIsSubmitting(false);
    }
};

    const handleOpenDocumentModal = (legalization) => {
        setSelectedLegalization(legalization);
        setShowDocumentModal(true);
    };

    const handleCloseDocumentModal = () => {
        setSelectedLegalization(null);
        setShowDocumentModal(false);
    };

    const handleDocumentsUploaded = () => {
        // Al subir, recargamos tanto legalizaciones como documentos para reflejar los cambios de estado.
        loadLegalizations();
    };


    // --- RENDERIZADO DEL COMPONENTE ---

    // Estado de carga con Skeletons
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-3/4" />
                    <Skeleton className="h-5 w-full" />
                </div>
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-48 w-full rounded-lg" />
                </div>
            </div>
        );
    }

    // Página principal
    return (
        <div className="space-y-8">
            <div className="space-y-1.5">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Gestión de Trámites
                </h1>
                <p className="text-muted-foreground">
                    Inicia un nuevo trámite de legalización o consulta el historial de tus solicitudes.
                </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="new-request" className="border-border rounded-lg border shadow-sm bg-card">
                    <AccordionTrigger className="px-6 text-lg font-medium hover:no-underline">
                        <div className="flex items-center">
                            <PlusCircle className="h-5 w-5 mr-3 text-primary" />
                            Iniciar Nuevo Trámite
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pt-2 pb-6">
                        <p className="text-sm text-muted-foreground mb-4">
                            Completa la información del vehículo para generar una nueva solicitud.
                        </p>
                        <LegalizationForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <div className="space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">
                    Historial de Solicitudes
                </h2>
                {legalizations.length > 0 ? (
                    <div className="space-y-4">
                        {legalizations.map((legalization) => (
                            <LegalizationItemCard
                                key={legalization.id}
                                legalization={legalization}
                                documents={documentsMap[legalization.id]}
                                onOpenDocumentModal={handleOpenDocumentModal}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
            </div>

            {selectedLegalization && (
                <DocumentUploadModal
                    isOpen={showDocumentModal}
                    onClose={handleCloseDocumentModal}
                    legalization={selectedLegalization}
                    onDocumentsUploaded={handleDocumentsUploaded}
                />
            )}
        </div>
    );
};

export default LegalizationPage;