import { useSupabaseClient } from '@supabase/auth-helpers-react';
import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '@/components/power-buying/CheckoutForm.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CreditCard, ExternalLink, DollarSign, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const PowerBuyingPage = () => {
    const supabase = useSupabaseClient();
    const { toast } = useToast();
    const { user, userProfile, session } = useAuth();
    const { fetchRecords } = useSupabaseData();
    const [powerAmount, setPowerAmount] = useState([6000]);
    const [customAmount, setCustomAmount] = useState('');
    const [isCustomAmount, setIsCustomAmount] = useState(false);
    const [currentBuyingPower, setCurrentBuyingPower] = useState(0);
    const [powerRequests, setPowerRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Lógica dinámica que cambia según si el usuario ya tiene poder de compra
    const isAddingPower = currentBuyingPower > 0;
    const minRequestAmount = isAddingPower ? 1000 : 6000;
    const stepAmount = isAddingPower ? 1000 : 1000;
    const maxSliderAmount = isAddingPower ? 50000 : 100000;

    const powerPackages = [
        { amount: 6000, popular: true, title: "Básico", description: "Ideal para empezar" },
        { amount: 12000, popular: false, title: "Estándar", description: "Más opciones" },
        { amount: 25000, popular: false, title: "Premium", description: "Mayor flexibilidad" },
        { amount: 50000, popular: false, title: "Profesional", description: "Para compradores serios" },
    ];

    const handleCancelRequest = async (requestId) => {
        if (!confirm('¿Estás seguro de que quieres cancelar esta solicitud? El "holding" en tu tarjeta será liberado.')) {
            return;
        }
        toast({ title: 'Cancelando solicitud...' });
        try {
            const { data, error } = await supabase.functions.invoke('cancel-power-buying', {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: { request_id: requestId },
            });
            if (error) throw error;
            if (data.error) throw new Error(data.error);
            toast({
                title: 'Solicitud Cancelada',
                description: 'La autorización en tu tarjeta ha sido liberada.',
            });
            loadPowerRequests();
        } catch (error) {
            console.error('Error al cancelar:', error);
            toast({
                variant: 'destructive',
                title: 'Error al Cancelar',
                description: error.message,
            });
        }
    };

    const loadPowerRequests = useCallback(async () => {
        if (!user) {
            setPowerRequests([]);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('power_buying_requests')
                .select('*')
                .eq('user_id', user.id)
                .neq('status', 'cancelled')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setPowerRequests(data || []);
        } catch (error) {
            console.error('Error al cargar las solicitudes de Power Buying:', error.message);
            toast({
                variant: "destructive",
                title: "Error al cargar el historial",
                description: "No se pudieron obtener las solicitudes.",
            });
        }
    }, [user, supabase, toast]);

    useEffect(() => {
        const runLoad = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            await loadPowerRequests();
            setLoading(false);
        };
        runLoad();
    }, [user, loadPowerRequests]);
    
    useEffect(() => {
        if (userProfile) {
            setCurrentBuyingPower(userProfile.buying_power || 0);
        }
    }, [userProfile]);

    useEffect(() => {
        if (isAddingPower) {
            setPowerAmount([minRequestAmount]);
        } else {
            setPowerAmount([minRequestAmount]);
        }
    }, [isAddingPower, minRequestAmount]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    };

    const getSelectedAmount = () => isCustomAmount ? parseFloat(customAmount) || 0 : powerAmount[0];
    const getDeposit = () => Math.round(getSelectedAmount() * 0.1);

    const handleSliderChange = (value) => {
        setPowerAmount(value);
        setIsCustomAmount(false);
        setCustomAmount('');
    };

    const handleCustomAmountChange = (e) => {
        const value = e.target.value;
        setCustomAmount(value);
        setIsCustomAmount(true);
    };

    const handlePackageSelect = (amount) => {
        setPowerAmount([amount]);
        setIsCustomAmount(false);
        setCustomAmount('');
    };

    const handleRequestPower = async (e) => {
        e.preventDefault();
        if (!user || !session?.access_token) {
            toast({
                variant: "destructive",
                title: "Error de Sesión",
                description: "No se pudo verificar tu sesión. Por favor, recarga la página e intenta de nuevo.",
            });
            return;
        }

        const selectedAmount = getSelectedAmount();
        if (selectedAmount < minRequestAmount) {
             toast({
                 variant: "destructive",
                 title: "Monto Inválido",
                 description: `El monto mínimo es ${formatCurrency(minRequestAmount)}.`,
             });
             return;
        }

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-power-buying-intent', {
                headers: { 'Authorization': `Bearer ${session.access_token}` },
                body: { amount: selectedAmount },
            });
            if (error) throw error;
            if (data.error) throw new Error(data.error);
            setClientSecret(data.clientSecret);
            setShowPaymentModal(true);
        } catch (error) {
            console.error('ERROR DEFINITIVO:', error);
            toast({
                variant: "destructive",
                title: "Error al Iniciar Solicitud",
                description: error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleModalClose = () => {
        setShowPaymentModal(false);
        setClientSecret('');
    };

    const handleSuccessfulPayment = () => {
        handleModalClose();
        loadPowerRequests(); 
    };
    
    const getStatusIcon = (status) => {
        switch (status) {
            case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case 'pending_payment': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case 'rejected': return <AlertCircle className="h-5 w-5 text-destructive" />;
            case 'cancelled': return <AlertCircle className="h-5 w-5 text-destructive" />;
            case 'charged for debt': return <AlertCircle className="h-5 w-5 text-destructive" />;
            default: return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'approved': return 'Aprobado';
            case 'active': return 'Activo';
            case 'pending': return 'Pendiente';
            case 'pending_payment': return 'Pendiente de Pago';
            case 'rejected': return 'Rechazado';
            case 'cancelled': return 'Cancelado';
            case 'charged for debt': return 'Cargado por Deuda';
            default: return 'Desconocido';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return 'text-green-500';
            case 'pending': return 'text-yellow-500';
            case 'pending_payment': return 'text-yellow-500';
            case 'rejected': return 'text-destructive';
            default: return 'text-muted-foreground';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold text-foreground">Power Buying</h1>
                <div className="animate-pulse space-y-4">
                    <div className="h-32 bg-muted rounded-lg"></div>
                    <div className="h-64 bg-muted rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {clientSecret && (
                <Dialog open={showPaymentModal} onOpenChange={handleModalClose}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Autorizar Depósito de Garantía</DialogTitle>
                            <DialogDescription>
                                Por favor, introduce los datos de tu tarjeta para autorizar el depósito de {formatCurrency(getDeposit())}. 
                                Este monto solo será retenido (holding) y no se te cobrará.
                            </DialogDescription>
                        </DialogHeader>
                        <Elements options={{ clientSecret }} stripe={stripePromise}>
                            <CheckoutForm depositAmount={getDeposit()} onSuccessfulPayment={handleSuccessfulPayment} />
                        </Elements>
                    </DialogContent>
                </Dialog>
            )}

            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Power Buying</h1>
                <p className="text-muted-foreground">
                    {isAddingPower 
                        ? "Añade más fondos a tu poder de compra actual."
                        : "Obtén poder de compra para participar en subastas. El depósito se mantiene como garantía (holding) en tu tarjeta."
                    }
                </p>
              </div>
              {currentBuyingPower > 0 && (
                <Card className="bg-card border-border">
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Poder Actual</p>
                        <p className="font-bold text-foreground">{formatCurrency(currentBuyingPower)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {!isAddingPower && (
                <Card className="bg-card border-border shadow-lg">
                    <CardHeader>
                        <CardTitle>Paquetes de Poder de Compra</CardTitle>
                        <CardDescription>Selecciona un paquete predefinido o personaliza tu monto. Mínimo {formatCurrency(minRequestAmount)}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            {powerPackages.map((pkg) => (
                                <div
                                    key={pkg.amount}
                                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                                        powerAmount[0] === pkg.amount && !isCustomAmount
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border hover:border-primary/50'
                                    }`}
                                    onClick={() => handlePackageSelect(pkg.amount)}
                                >
                                    {pkg.popular && (
                                        <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                                            Más Popular
                                        </span>
                                    )}
                                    <div className="text-center">
                                        <h4 className="font-semibold text-sm mb-1">{pkg.title}</h4>
                                        <p className="text-2xl font-bold text-foreground">{formatCurrency(pkg.amount)}</p>
                                        <p className="text-xs text-muted-foreground mb-2">{pkg.description}</p>
                                        <p className="text-sm text-muted-foreground">Depósito: {formatCurrency(pkg.amount * 0.1)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                    <CardTitle>{isAddingPower ? 'Añadir más Poder de Compra' : 'Configuración Personalizada'}</CardTitle>
                    <CardDescription>
                        {isAddingPower 
                            ? 'Añade fondos en incrementos de $1,000.' 
                            : 'Ajusta el monto exacto que necesitas para la subasta. Sin límite máximo.'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRequestPower} className="space-y-6">
                        <div className="space-y-4">
                            <Label>Monto a solicitar: {formatCurrency(getSelectedAmount())}</Label>
                            <Slider
                                value={powerAmount}
                                onValueChange={handleSliderChange}
                                max={maxSliderAmount}
                                min={minRequestAmount}
                                step={stepAmount}
                                className="w-full"
                                disabled={isSubmitting}
                            />
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{formatCurrency(minRequestAmount)}</span>
                                <span>{formatCurrency(maxSliderAmount)}+</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customAmount">O ingresa un monto personalizado (sin límite máximo)</Label>
                            <Input
                                id="customAmount"
                                type="number"
                                placeholder={`Ej: ${(minRequestAmount + 2000).toLocaleString()}`}
                                value={customAmount}
                                onChange={handleCustomAmountChange}
                                min={minRequestAmount}
                                step={stepAmount}
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">
                                Monto mínimo: {formatCurrency(minRequestAmount)}
                            </p>
                        </div>

                        <div className="p-4 bg-muted rounded-lg">
                            <h4 className="font-medium text-foreground mb-2">Información del Depósito</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Poder de Compra Solicitado:</span>
                                    <span className="font-medium">{formatCurrency(getSelectedAmount())}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Depósito Requerido (10%):</span>
                                    <span className="font-medium text-primary">{formatCurrency(getDeposit())}</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                           <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Proceso de Aprobación</h4>
                           <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                <li>• El depósito se mantiene como garantía (holding) en tu tarjeta</li>
                                <li>• Aprobación típica en 24-48 horas</li>
                                <li>• El poder de compra se activa una vez aprobado</li>
                                <li>• El depósito se libera al finalizar las subastas</li>
                                <li>• Sin límite máximo - solicita el monto que necesites</li>
                           </ul>
                        </div>

                        <Button type="submit" className="w-full md:w-auto" size="lg" disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="w-5 h-5 mr-2" />}
                           {isSubmitting ? 'Iniciando Solicitud...' : isAddingPower ? 'Añadir Fondos' : 'Solicitar Poder de Compra'}
                           <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                    <CardTitle>Historial de Solicitudes</CardTitle>
                    <CardDescription>Estado de tus solicitudes de poder de compra.</CardDescription>
                </CardHeader>
                <CardContent>
                    {powerRequests.length > 0 ? (
                        <div className="space-y-3">
                            {powerRequests.map((request) => (
                                <div key={request.id} className="p-4 border border-border rounded-lg bg-secondary">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium">{formatCurrency(parseFloat(request.amount))}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Depósito: {formatCurrency(parseFloat(request.deposit))}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Solicitado: {new Date(request.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(request.status)}
                                                <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                                                    {getStatusText(request.status)}
                                                </span>
                                            </div>
                                            
                                            {request.status === 'pending_payment' && (
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCancelRequest(request.id)}
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground italic">No hay solicitudes anteriores registradas.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PowerBuyingPage;