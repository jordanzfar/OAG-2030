import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Clock, FileText, FolderOpen } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { requiredDocuments } from '@/components/legalization/constants';

// ✨ MEJORA: Componente de estado vacío, más atractivo y reutilizable.
const EmptyState = () => (
    <div className="text-center py-12 px-6 bg-card border border-dashed rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No hay solicitudes todavía</h3>
        <p className="mt-1 text-sm text-muted-foreground">
            Cuando inicies tu primer trámite, aparecerá aquí.
        </p>
    </div>
);

// ✨ MEJORA: Componente interno para una tarjeta de legalización limpia.
const LegalizationItemCard = ({ legalization, documents, onOpenDocumentModal }) => {
    const stats = useMemo(() => {
        const totalRequired = requiredDocuments.length;
        const uploadedDocs = documents || [];
        const uploaded = uploadedDocs.length;
        const approved = uploadedDocs.filter(doc => doc.status === 'approved').length;
        const rejected = uploadedDocs.filter(doc => doc.status === 'rejected').length;
        const pending = uploadedDocs.filter(doc => doc.status === 'pending').length;

        return {
            total: totalRequired,
            uploaded,
            approved,
            rejected,
            pending,
            missing: totalRequired - uploaded,
            completionPercentage: totalRequired > 0 ? Math.round((uploaded / totalRequired) * 100) : 0
        };
    }, [documents]);

    const statusVariantMap = {
        completed: 'success',
        approved: 'success',
        in_review: 'secondary',
        rejected: 'destructive',
        pending: 'outline',
    };

    return (
        <Card className="bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div>
                    <CardTitle className="text-lg">VIN: {legalization.vin}</CardTitle>
                    <CardDescription>
                        {legalization.vehicle_info.marca} {legalization.vehicle_info.modelo} {legalization.vehicle_info.ano}
                    </CardDescription>
                </div>
                <Badge variant={statusVariantMap[legalization.status] || 'outline'} className="capitalize">
                    {legalization.status.replace('_', ' ')}
                </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* ✨ MEJORA: Barra de progreso con el componente de shadcn/ui */}
                <div>
                    <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">Progreso de Documentos</span>
                        <span className="text-muted-foreground">{stats.uploaded}/{stats.total}</span>
                    </div>
                    <Progress value={stats.completionPercentage} className="h-2" />
                    <div className="flex flex-wrap justify-end gap-x-3 text-xs mt-1.5 text-muted-foreground">
                        <span className="flex items-center"><CheckCircle className="w-3 h-3 mr-1 text-green-500" />{stats.approved} Aprobados</span>
                        {stats.rejected > 0 && <span className="flex items-center"><AlertCircle className="w-3 h-3 mr-1 text-red-500" />{stats.rejected} Rechazados</span>}
                        {stats.pending > 0 && <span className="flex items-center"><Clock className="w-3 h-3 mr-1 text-yellow-500" />{stats.pending} en Revisión</span>}
                    </div>
                </div>

                {/* ✨ MEJORA: Alertas con el componente de shadcn/ui */}
                {stats.rejected > 0 && (
                    <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                            Hay {stats.rejected} documento(s) rechazado(s). Por favor, súbelos de nuevo.
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


const LegalizationHistory = ({ legalizations, onOpenDocumentModal }) => {
    const { user } = useSupabaseAuth();
    const { fetchRecords } = useSupabaseData();
    const [documentsMap, setDocumentsMap] = useState({});
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);

    // ✨ MEJORA CRÍTICA DE RENDIMIENTO: Evita el problema N+1.
    const loadAllDocuments = useCallback(async () => {
        if (!user || legalizations.length === 0) {
            setIsLoadingDocs(false);
            return;
        }

        setIsLoadingDocs(true);
        const legalizationIds = legalizations.map(leg => leg.id);

        // Una sola llamada para traer todos los documentos de todas las legalizaciones
        const result = await fetchRecords('documents', { user_id: user.id }, {
            filter: { column: 'legalization_id', operator: 'in', value: legalizationIds }
        });

        if (result.success) {
            const newDocumentsMap = {};
            // Agrupamos los documentos por legalization_id en el cliente
            result.data.forEach(doc => {
                if (!newDocumentsMap[doc.legalization_id]) {
                    newDocumentsMap[doc.legalization_id] = [];
                }
                newDocumentsMap[doc.legalization_id].push(doc);
            });
            setDocumentsMap(newDocumentsMap);
        }
        setIsLoadingDocs(false);

    }, [user, legalizations, fetchRecords]);

    useEffect(() => {
        loadAllDocuments();
    }, [loadAllDocuments]);

    if (legalizations.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-4">
            {legalizations.map((legalization) => (
                <LegalizationItemCard
                    key={legalization.id}
                    legalization={legalization}
                    documents={documentsMap[legalization.id]} // Pasamos los documentos correspondientes
                    onOpenDocumentModal={onOpenDocumentModal}
                />
            ))}
        </div>
    );
};

export default LegalizationHistory;