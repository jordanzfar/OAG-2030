import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreHorizontal, CheckCircle, XCircle, Clock, AlertTriangle, Shield, FileText, PauseCircle, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";

// Subcomponente para un solo documento con sus acciones
const DocumentItem = ({ doc, onApprove, onReject, onView, isUpdating }) => {
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
            pending: { icon: Clock, color: 'text-yellow-700', label: 'Pendiente' },
        }[status] || { icon: Info, color: 'text-gray-700', label: 'N/A' };
        const Icon = config.icon;
        return <span className={`flex items-center text-xs font-medium ${config.color}`}><Icon className="w-3 h-3 mr-1.5" />{config.label}</span>;
    };

    return (
        <div className="p-3 border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
                <button onClick={handleViewClick} disabled={isViewing} className="flex items-center gap-2 text-primary hover:underline disabled:opacity-50 disabled:cursor-wait">
                    {isViewing ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
                    <span className="font-medium text-sm truncate">{doc.file_path.split('/').pop() || 'documento.jpg'}</span>
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

// Modal para la razón de rechazo
const RejectionModal = ({ open, onOpenChange, onSubmit, reason, setReason, isSubmitting }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Motivo del Rechazo</DialogTitle>
                <DialogDescription>Por favor, explica por qué se está rechazando este documento. Esta información será útil para el usuario.</DialogDescription>
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
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
    const [docToReject, setDocToReject] = useState(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [updatingDocId, setUpdatingDocId] = useState(null);
    const { toast } = useToast();

    const getStatusBadge = (status) => {
        const statusConfig = {
          verified: { icon: CheckCircle, color: 'text-green-900', bg: 'bg-green-300', label: 'Verificado' },
          pending: { icon: Clock, color: 'text-yellow-900', bg: 'bg-yellow-300', label: 'Pendiente' },
          paused: { icon: PauseCircle, color: 'text-orange-900', bg: 'bg-orange-300', label: 'Pausado' },
          rejected: { icon: XCircle, color: 'text-red-900', bg: 'bg-red-300', label: 'Rechazado' },
          not_verified: { icon: AlertTriangle, color: 'text-gray-900', bg: 'bg-gray-300', label: 'Sin verificar' }
        };
        const config = statusConfig[status] || statusConfig.not_verified;
        const Icon = config.icon;
        return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}><Icon className="w-3 h-3 mr-1" />{config.label}</span>;
    };
    
    const getRoleBadge = (role) => {
        const roleConfig = { 
            admin: { color: 'text-purple-900', bg: 'bg-purple-300', label: 'Admin' }, 
            client: { color: 'text-blue-900', bg: 'bg-blue-300', label: 'Cliente' },
            support: { color: 'text-green-900', bg: 'bg-green-300', label: 'Soporte' },
            validation: { color: 'text-orange-900', bg: 'bg-orange-300', label: 'Validación' },
            finance: { color: 'text-emerald-900', bg: 'bg-emerald-300', label: 'Finanzas' }
        };
        const config = roleConfig[role] || { color: 'text-gray-900', bg: 'bg-gray-300', label: role };
        return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}><Shield className="w-3 h-3 mr-1" />{config.label}</span>;
    };

    const filteredUsers = users.filter(user => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' || user.full_name?.toLowerCase().includes(lowerCaseSearchTerm) || user.email?.toLowerCase().includes(lowerCaseSearchTerm);
        const matchesStatus = statusFilter === 'all' || user.verification_status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleOpenDocsModal = (user) => {
        setSelectedUser(user);
        setIsDocsModalOpen(true);
    };

    const handleDocumentView = async (doc) => {
        if (!onDocumentViewRequest) {
            toast({ variant: "destructive", title: "Error de Configuración", description: "La función para ver documentos no está conectada." });
            return;
        }
        const result = await onDocumentViewRequest(doc.file_path);
        if (result.success && result.url) {
            window.open(result.url, '_blank', 'noopener,noreferrer');
        } else {
            toast({ variant: "destructive", title: "No se pudo abrir el documento", description: result?.error?.message || "Ocurrió un error al generar el enlace seguro." });
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
                        <Input placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-sm" />
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
                    <Table>
                        <TableHeader><TableRow><TableHead>Usuario</TableHead><TableHead>Rol</TableHead><TableHead>Estado Verificación</TableHead><TableHead>Fecha Registro</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <motion.tr key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-b">
                                    <TableCell><div className="font-medium">{user.full_name || 'Sin nombre'}</div><div className="text-sm text-muted-foreground">{user.email || 'Sin email'}</div></TableCell>
                                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                                    <TableCell>{getStatusBadge(user.verification_status)}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString('es-ES')}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => handleOpenDocsModal(user)}><FileText className="w-4 h-4 mr-2" />Ver Documentos</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => onVerificationUpdate(user.id, 'verified')} disabled={user.verification_status === 'verified'}><CheckCircle className="w-4 h-4 mr-2 text-green-600" />Aprobar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onVerificationUpdate(user.id, 'paused')} disabled={user.verification_status === 'paused'}><PauseCircle className="w-4 h-4 mr-2 text-orange-600" />Pausar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onVerificationUpdate(user.id, 'rejected')} disabled={user.verification_status === 'rejected'}><XCircle className="w-4 h-4 mr-2 text-red-600" />Rechazar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </motion.tr>
                            )) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No se encontraron usuarios.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDocsModalOpen} onOpenChange={setIsDocsModalOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader><DialogTitle>Documentos de {selectedUser?.full_name}</DialogTitle><DialogDescription>Gestiona el estado de cada documento de verificación.</DialogDescription></DialogHeader>
                    <div className="py-4 space-y-4">
                        {selectedUser?.documents && selectedUser.documents.length > 0 ? (
                            ['id_front', 'id_back', 'selfie'].map(docType => {
                                const docs = selectedUser.documents.filter(d => d.type === docType);
                                const title = { id_front: "Identificación (Frente)", id_back: "Identificación (Dorso)", selfie: "Selfie" }[docType];
                                return (
                                    <div key={docType}>
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
