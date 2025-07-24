import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AdminPowerBuyingPage = () => {
    const supabase = useSupabaseClient();
    const { session } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [filter, setFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // ✅ --- Función para calcular la fecha de expiración --- ✅
    const getExpirationDate = (requestDate) => {
        const date = new Date(requestDate);
        date.setDate(date.getDate() + 7);
        return date;
    };

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('power_buying_requests')
            .select(`id, amount, deposit, status, created_at, payment_intent_id, users_profile!inner(email, full_name, short_id)`)
            .in('status', ['active', 'approved', 'pending']);

        if (error) {
            toast({ variant: "destructive", title: "Error al cargar solicitudes", description: error.message });
        } else {
            setRequests(data);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const filteredRequests = useMemo(() => {
        if (!filter) return requests;
        return requests.filter(req => {
            const profile = req.users_profile;
            const searchTerm = filter.toLowerCase();
            return (
                profile?.full_name?.toLowerCase().includes(searchTerm) ||
                profile?.email?.toLowerCase().includes(searchTerm) ||
                profile?.short_id?.toLowerCase().includes(searchTerm)
            );
        });
    }, [requests, filter]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredRequests, currentPage]);
    
    const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);

    const handleAction = async (action, paymentIntentId, requestId) => {
        setActionLoading(requestId);
        try {
            const { error } = await supabase.functions.invoke(`${action}-deposit`, {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: { payment_intent_id: paymentIntentId },
            });
            if (error) throw new Error(error.message || "Ocurrió un error en la función.");
            toast({
                title: "Acción completada",
                description: `El depósito ha sido ${action === 'capture' ? 'capturado' : 'cancelado'} con éxito.`,
            });
            fetchRequests();
        } catch (error) {
            const errorContext = error.context ? JSON.parse(error.context.text) : { error: "Error desconocido." };
            toast({ variant: "destructive", title: "Error en la acción", description: errorContext.error });
        } finally {
            setActionLoading(null);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Administrar Poder de Compra</CardTitle>
                    <CardDescription>Visualiza, captura o cancela los depósitos de garantía de los usuarios.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <Input
                            placeholder="Filtrar por nombre, email o ID de usuario..."
                            value={filter}
                            onChange={(e) => {
                                setFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="max-w-sm"
                        />
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Poder de Compra</TableHead>
                                    <TableHead>Depósito</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Fecha Solicitud</TableHead>
                                    <TableHead>Fecha Expiración</TableHead> {/* ✅ --- Cabecera de Expiración añadida --- ✅ */}
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRequests.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">No se encontraron solicitudes.</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedRequests.map(req => (
                                        <TableRow key={req.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{req.users_profile?.full_name || 'Sin Nombre'}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{req.users_profile?.short_id || 'N/A'}</span>
                                                    <span className="text-xs text-muted-foreground">{req.users_profile?.email || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>${new Intl.NumberFormat().format(req.amount)}</TableCell>
                                            <TableCell className="font-semibold">${new Intl.NumberFormat().format(req.deposit)}</TableCell>
                                            <TableCell><StatusBadge status={req.status} /></TableCell>
                                            <TableCell>{new Date(req.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                                            <TableCell>{getExpirationDate(req.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell> {/* ✅ --- Celda de Expiración añadida --- ✅ */}
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => handleAction('capture', req.payment_intent_id, req.id)} disabled={actionLoading === req.id}>
                                                        {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                                        <span className="ml-2 hidden md:inline">Capturar</span>
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleAction('cancel', req.payment_intent_id, req.id)} disabled={actionLoading === req.id}>
                                                        {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                        <span className="ml-2 hidden md:inline">Cancelar</span>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 pt-4">
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>Anterior</Button>
                            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</span>
                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>Siguiente</Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminPowerBuyingPage;