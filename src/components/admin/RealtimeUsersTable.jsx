import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MoreHorizontal, CheckCircle, XCircle, FileText, PauseCircle, Loader2, Info, Download, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import { useAdminActions } from '@/hooks/useAdminActions';
import { useSupabaseClient } from '@supabase/auth-helpers-react';


// --- Subcomponente para un solo documento ---
const DocumentItem = ({ doc, onView, onApprove, onReject, isUpdating }) => {
    const [isViewing, setIsViewing] = useState(false);

    const handleViewClick = async () => {
        setIsViewing(true);
        await onView(doc);
        setIsViewing(false);
    };

    const getStatusBadge = (status) => {
        const config = {
            approved: { icon: CheckCircle, color: 'text-green-700', label: 'Aprobado' },
            rejected: { icon: XCircle, color: 'text-red-700', label: 'Rechazado' },
            pending: { icon: PauseCircle, color: 'text-yellow-700', label: 'Pendiente' },
        }[status] || { icon: Info, color: 'text-gray-700', label: 'N/A' };
        const Icon = config.icon;
        return <span className={`flex items-center text-xs font-medium ${config.color}`}><Icon className="w-3 h-3 mr-1.5" />{config.label}</span>;
    };

    return (
        <div className="p-3 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
                <button onClick={handleViewClick} disabled={isViewing} className="flex items-center gap-2 text-primary hover:underline disabled:opacity-50 disabled:cursor-wait">
                    {isViewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                    <span className="font-medium text-sm truncate">{doc.file_path.split('/').pop() || 'documento'}</span>
                </button>
                {getStatusBadge(doc.status)}
            </div>
            {doc.status === 'rejected' && doc.rejection_reason && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
                    <strong>Motivo:</strong> {doc.rejection_reason}
                </p>
            )}
            <div className="flex items-center justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => onApprove(doc)} disabled={doc.status === 'approved' || isUpdating}>
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aprobar"}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onReject(doc)} disabled={doc.status === 'rejected' || isUpdating}>
                    {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Rechazar"}
                </Button>
            </div>
        </div>
    );
};

// --- Subcomponente para el modal de rechazo ---
const RejectionModal = ({ open, onOpenChange, onSubmit, reason, setReason, isSubmitting }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Motivo del Rechazo</DialogTitle>
                <DialogDescription>Explica por qué se está rechazando este documento. Esta información será útil para el usuario.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    placeholder="Ej: La imagen es borrosa, la información no coincide..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button onClick={onSubmit} disabled={!reason || isSubmitting}>
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Confirmar Rechazo
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
);


const RealtimeUsersTable = ({ users, loading, onVerificationUpdate, onDocumentViewRequest, onDocumentStatusUpdate }) => {
    const supabase = useSupabaseClient();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [requestCounts, setRequestCounts] = useState(null);
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);
    
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [docToReject, setDocToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [updatingDocId, setUpdatingDocId] = useState(null);
    
    // Asumimos que la función viene de un hook, puede que necesites ajustar esto
    const { fetchUserRequestCounts } = useAdminActions ? useAdminActions() : { fetchUserRequestCounts: null };

    useEffect(() => {
        if (isDetailsModalOpen && selectedUser) {
            const loadCounts = async () => {
                setIsLoadingCounts(true);
                try {
                    // Hacemos las 5 consultas de conteo directamente aquí
                    const [
                        inspectionsRes,
                        legalizationsRes,
                        powerBuyingRes,
                        vinChecksRes,
                        auctionBidsRes
                    ] = await Promise.all([
                        supabase.from('inspections').select('*', { count: 'exact', head: true }).eq('user_id', selectedUser.user_id),
                        supabase.from('legalizations').select('*', { count: 'exact', head: true }).eq('user_id', selectedUser.user_id),
                        supabase.from('power_buying_requests').select('*', { count: 'exact', head: true }).eq('user_id', selectedUser.user_id),
                        supabase.from('vin_check_logs').select('*', { count: 'exact', head: true }).eq('user_id', selectedUser.user_id),
                        supabase.from('auction_bids').select('*', { count: 'exact', head: true }).eq('user_id', selectedUser.user_id),
                    ]);

                    // Revisamos si hubo algún error
                    const errors = [inspectionsRes.error, legalizationsRes.error, powerBuyingRes.error, vinChecksRes.error, auctionBidsRes.error].filter(Boolean);
                    if (errors.length > 0) {
                        throw new Error(errors.map(e => e.message).join(', '));
                    }

                    // Actualizamos el estado con todos los conteos
                    setRequestCounts({
                        inspections: inspectionsRes.count,
                        legalizations: legalizationsRes.count,
                        power_buying: powerBuyingRes.count,
                        vin_checks: vinChecksRes.count,
                        auction_bids: auctionBidsRes.count
                    });

                } catch (err) {
                    console.error("Error fetching counts directly:", err);
                    setRequestCounts({}); // Ponemos un objeto vacío en caso de error para que muestre N/A
                }
                setIsLoadingCounts(false);
            };
            loadCounts();
        } else {
            setRequestCounts(null);
        }
    }, [isDetailsModalOpen, selectedUser, supabase]);

    const filteredUsers = useMemo(() => users.filter(user => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' || user.full_name?.toLowerCase().includes(lowerCaseSearchTerm) || user.email?.toLowerCase().includes(lowerCaseSearchTerm) || user.short_id?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesStatus = statusFilter === 'all' || user.verification_status === statusFilter;
        return matchesSearch && matchesStatus;
    }), [users, searchTerm, statusFilter]);

    const handleOpenDetailsModal = (user) => {
        setSelectedUser(user);
        setIsDetailsModalOpen(true);
    };

    

    const handleDocumentView = async (doc) => {
        if (!onDocumentViewRequest) return;
        const result = await onDocumentViewRequest(doc.file_path);
        if (result.success && result.url) {
            window.open(result.url, '_blank', 'noopener,noreferrer');
        } else {
            toast({ variant: "destructive", title: "No se pudo abrir el documento", description: result?.error?.message || "Error al generar el enlace." });
        }
    };

    const handleApproveDocument = async (doc) => {
        setUpdatingDocId(doc.id);
        await onDocumentStatusUpdate(doc.id, 'approved', null);
        setUpdatingDocId(null);
    };

    const handleRejectDocument = (doc) => {
        setDocToReject(doc);
        setRejectionReason("");
        setIsRejectionModalOpen(true);
    };

    const handleRejectionSubmit = async () => {
        if (!docToReject || !rejectionReason) return;
        setUpdatingDocId(docToReject.id);
        await onDocumentStatusUpdate(docToReject.id, 'rejected', rejectionReason);
        setUpdatingDocId(null);
        setIsRejectionModalOpen(false);
        setDocToReject(null);
        setRejectionReason("");
    };

    if (loading && users.length === 0) {
        return (
            <Card>
                <CardHeader><CardTitle>Gestión de Usuarios</CardTitle><CardDescription>Cargando usuarios...</CardDescription></CardHeader>
                <CardContent><div className="animate-pulse space-y-2"><div className="h-12 bg-muted rounded"></div><div className="h-12 bg-muted rounded"></div><div className="h-12 bg-muted rounded"></div></div></CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>Verifica usuarios y consulta sus documentos de validación.</CardDescription>
                    <div className="flex flex-col md:flex-row gap-4 pt-2">
                        <Input placeholder="Buscar por nombre, email o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="verified">Verificado</SelectItem>
                                <SelectItem value="pending">Pendiente</SelectItem>
                                <SelectItem value="paused">Pausado</SelectItem>
                                <SelectItem value="rejected">Rechazado</SelectItem>
                                <SelectItem value="not_verified">Sin verificar</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Estado Verificación</TableHead><TableHead>Fecha Registro</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                    <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.full_name || 'Sin Nombre'}</span>
                                                <span className="text-xs text-muted-foreground font-mono">{user.short_id || 'N/A'}</span>
                                                <span className="text-xs text-muted-foreground">{user.email || 'N/A'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><StatusBadge status={user.role} /></TableCell>
                                        <TableCell><StatusBadge status={user.verification_status} /></TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleOpenDetailsModal(user)}><FileText className="w-4 h-4 mr-2" />Ver Detalles y Documentos</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => onVerificationUpdate(user.id, 'verified')} disabled={user.verification_status === 'verified'}><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Aprobar Verificación</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onVerificationUpdate(user.id, 'paused')} disabled={user.verification_status === 'paused'}><PauseCircle className="w-4 h-4 mr-2 text-orange-600" />Pausar Verificación</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onVerificationUpdate(user.id, 'rejected')} disabled={user.verification_status === 'rejected'}><XCircle className="w-4 h-4 mr-2 text-red-600" />Rechazar Verificación</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </motion.tr>
                                )) : (
                                    <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No se encontraron usuarios.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Detalles de {selectedUser?.full_name}</DialogTitle>
                        <DialogDescription>Gestiona la información y los documentos de verificación del usuario.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 max-h-[70vh] overflow-y-auto">
                        <Tabs defaultValue="info" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="info">Información y Actividad</TabsTrigger>
                                <TabsTrigger value="docs">Documentos</TabsTrigger>
                            </TabsList>
                            <TabsContent value="info">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Card>
                                        <CardHeader><CardTitle>Perfil de Usuario</CardTitle></CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <p><strong>Nombre:</strong> {selectedUser?.full_name}</p>
                                            <p><strong>Email:</strong> {selectedUser?.email}</p>
                                            <p><strong>ID Comprador:</strong> {selectedUser?.short_id}</p>
                                            <p><strong>Rol:</strong> {selectedUser?.role}</p>
                                            <p><strong>Registrado:</strong> {selectedUser ? new Date(selectedUser.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader><CardTitle>Resumen de Actividad</CardTitle></CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            {isLoadingCounts ? (
                                                <div className="space-y-3">
                                                    <Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-3/4" />
                                                </div>
                                            ) : (
                                                <>
                                                    <p><strong>Inspecciones:</strong> {requestCounts?.inspections ?? 'N/A'}</p>
                                                    <p><strong>Legalizaciones:</strong> {requestCounts?.legalizations ?? 'N/A'}</p>
                                                    <p><strong>Poder de Compra:</strong> {requestCounts?.power_buying ?? 'N/A'}</p>
                                                    <p><strong>Chequeos VIN:</strong> {requestCounts?.vin_checks ?? 'N/A'}</p>
                                                    <p><strong>Pujas en Subasta:</strong> {requestCounts?.auction_bids ?? 'N/A'}</p>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>
                            <TabsContent value="docs">
                                <Card>
                                    <CardHeader><CardTitle>Documentos de Verificación</CardTitle></CardHeader>
                                    <CardContent>
                                        {selectedUser?.documents && selectedUser.documents.length > 0 ? (
                                            ['id_front', 'id_back', 'selfie'].map(docType => {
                                                const docs = selectedUser.documents.filter(d => d.type === docType);
                                                const title = { id_front: "Identificación (Frente)", id_back: "Identificación (Dorso)", selfie: "Selfie" }[docType];
                                                return (
                                                    <div key={docType} className="mb-6">
                                                        <h3 className="font-semibold text-lg mb-2">{title}</h3>
                                                        {docs.length > 0 ? docs.map(doc => (
                                                            <DocumentItem 
                                                                key={doc.id}
                                                                doc={doc}
                                                                onView={handleDocumentView}
                                                                onApprove={handleApproveDocument}
                                                                onReject={handleRejectDocument}
                                                                isUpdating={updatingDocId === doc.id}
                                                            />
                                                        )) : <p className="text-sm text-muted-foreground p-3 border rounded-md">No hay documentos de este tipo.</p>}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-8">Este usuario no tiene documentos adjuntos.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

            <RejectionModal 
                open={isRejectionModalOpen}
                onOpenChange={setIsRejectionModalOpen}
                onSubmit={handleRejectionSubmit}
                reason={rejectionReason}
                setReason={setRejectionReason}
                isSubmitting={updatingDocId === docToReject?.id}
            />
        </>
    );
};

export default RealtimeUsersTable;