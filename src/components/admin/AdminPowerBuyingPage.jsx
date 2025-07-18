// src/components/admin/AdminPowerBuyingPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const AdminPowerBuyingPage = () => {
    const supabase = useSupabaseClient();
    const { userProfile, session } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const getExpirationDate = (requestDate) => {
        const date = new Date(requestDate);
        date.setDate(date.getDate() + 7);
        return date;
    };

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        // SOLUCIÓN FINAL: Forzamos un INNER JOIN explícito para anular problemas de caché.
        const { data, error } = await supabase
            .from('power_buying_requests')
            .select(`
                id,
                amount,
                deposit,
                status,
                created_at,
                payment_intent_id,
                users_profile!inner(
                    email,
                    full_name,
                    short_id 
                )
            `)
            .in('status', ['active', 'approved', 'pending']);

        if (error) {
            console.error("Error detallado de la consulta:", error);
            toast({ variant: "destructive", title: "Error al cargar solicitudes", description: error.message });
        } else {
            setRequests(data);
        }
        setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        if (userProfile?.role === 'admin') {
            fetchRequests();
        }
    }, [userProfile, fetchRequests]);

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
            const parsedError = JSON.parse(error.context.text);
            toast({
                variant: "destructive",
                title: "Error en la acción",
                description: parsedError.error || "Error desconocido.",
            });
        } finally {
            setActionLoading(null);
        }
    };

    if (userProfile?.role !== 'admin') {
        return <div className="p-4"><Card><CardHeader><CardTitle>Acceso Denegado</CardTitle><CardDescription>Esta página es solo para administradores.</CardDescription></CardHeader></Card></div>;
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-4 md:p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Administrar Poder de Compra</CardTitle>
                    <CardDescription>
                        Visualiza, captura o cancela los depósitos de garantía de los usuarios.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Poder de Compra</TableHead>
                                <TableHead>Depósito</TableHead>
                                <TableHead>Fecha Solicitud</TableHead>
                                <TableHead>Fecha Expiración</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan="6" className="text-center h-24">No hay solicitudes activas.</TableCell>
                                </TableRow>
                            ) : (
                                requests.map(req => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="font-medium">{req.users_profile?.full_name || 'Sin Nombre'}</div>
                                            <div className="text-sm text-muted-foreground">{req.users_profile?.email || 'N/A'}</div>
                                            <div className="font-mono text-xs text-gray-500 mt-1">ID: {req.users_profile?.short_id || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell>${new Intl.NumberFormat().format(req.amount)}</TableCell>
                                        <TableCell className="font-bold">${new Intl.NumberFormat().format(req.deposit)}</TableCell>
                                        <TableCell>{new Date(req.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell>{getExpirationDate(req.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleAction('capture', req.payment_intent_id, req.id)}
                                                disabled={actionLoading === req.id}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                                                <span className="ml-2 hidden md:inline">Capturar</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleAction('cancel', req.payment_intent_id, req.id)}
                                                disabled={actionLoading === req.id}
                                            >
                                                {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                                <span className="ml-2 hidden md:inline">Cancelar</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminPowerBuyingPage;
