
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { CreditCard, ExternalLink, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const PowerBuyingPage = () => {
  const { toast } = useToast();
  const { user, userProfile } = useSupabaseAuth();
  const { createPowerBuyingRequest, fetchRecords } = useSupabaseData();
  const [powerAmount, setPowerAmount] = useState([6000]);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [currentBuyingPower, setCurrentBuyingPower] = useState(0);
  const [powerRequests, setPowerRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const minAmount = 6000; // Mínimo $6,000
  const maxAmount = 100000; // Sin límite real, pero ponemos 100k para el slider
  const powerPackages = [
    { amount: 6000, popular: true, title: "Básico", description: "Ideal para empezar" },
    { amount: 12000, popular: false, title: "Estándar", description: "Más opciones de compra" },
    { amount: 25000, popular: false, title: "Premium", description: "Mayor flexibilidad" },
    { amount: 50000, popular: false, title: "Profesional", description: "Para compradores serios" },
  ];

  useEffect(() => {
    if (user) {
      loadPowerRequests();
    }
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      setCurrentBuyingPower(userProfile.buying_power || 0);
    }
  }, [userProfile]);

  const loadPowerRequests = async () => {
    if (!user) return;

    const result = await fetchRecords('power_buying_requests', { user_id: user.id }, {
      orderBy: { column: 'created_at', ascending: false }
    });

    if (result.success) {
      setPowerRequests(result.data || []);
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSelectedAmount = () => {
    return isCustomAmount ? parseFloat(customAmount) || 0 : powerAmount[0];
  };

  const getDeposit = () => {
    const amount = getSelectedAmount();
    return Math.round(amount * 0.1); // 10% deposit
  };

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
    if (!user) return;

    const selectedAmount = getSelectedAmount();
    
    if (selectedAmount < minAmount) {
      toast({
        variant: "destructive",
        title: "Monto Inválido",
        description: `El monto mínimo es ${formatCurrency(minAmount)}.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const deposit = getDeposit();
      
      const result = await createPowerBuyingRequest(user.id, selectedAmount, deposit);
      
      if (result.success) {
        toast({
          title: "Solicitud Enviada Exitosamente",
          description: `Tu solicitud de poder de compra por ${formatCurrency(selectedAmount)} ha sido enviada. El depósito requerido es ${formatCurrency(deposit)}.`,
        });
        
        // Reset form
        setPowerAmount([6000]);
        setCustomAmount('');
        setIsCustomAmount(false);
        
        // Refresh requests list
        loadPowerRequests();
      }
    } catch (error) {
      console.error('Error submitting power buying request:', error);
      toast({
        variant: "destructive",
        title: "Error al Enviar Solicitud",
        description: "No se pudo enviar la solicitud. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
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
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Power Buying</h1>
          <p className="text-muted-foreground">
            Obtén poder de compra para participar en subastas. El depósito se mantiene como garantía (holding) en tu tarjeta.
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

      {/* Power Packages */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Paquetes de Poder de Compra</CardTitle>
          <CardDescription>Selecciona un paquete predefinido o personaliza tu monto. Mínimo ${formatCurrency(minAmount)}.</CardDescription>
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

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Configuración Personalizada</CardTitle>
          <CardDescription>Ajusta el monto exacto que necesitas para la subasta. Sin límite máximo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestPower} className="space-y-6">
            {/* Slider Section */}
            <div className="space-y-4">
              <Label>Monto de Poder de Compra: {formatCurrency(getSelectedAmount())}</Label>
              <Slider
                value={powerAmount}
                onValueChange={handleSliderChange}
                max={maxAmount}
                min={minAmount}
                step={1000}
                className="w-full"
                disabled={isSubmitting}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatCurrency(minAmount)}</span>
                <span>{formatCurrency(maxAmount)}+</span>
              </div>
            </div>

            {/* Custom Amount */}
            <div className="space-y-2">
              <Label htmlFor="customAmount">O ingresa un monto personalizado (sin límite máximo)</Label>
              <Input
                id="customAmount"
                type="number"
                placeholder={`Ej: ${(minAmount + 6000).toLocaleString()}`}
                value={customAmount}
                onChange={handleCustomAmountChange}
                min={minAmount}
                step="1000"
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Monto mínimo: {formatCurrency(minAmount)} • No hay límite máximo
              </p>
            </div>

            {/* Deposit Info */}
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

            {/* Process Info */}
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
              <CreditCard className="w-5 h-5 mr-2" />
              {isSubmitting ? 'Enviando Solicitud...' : 'Solicitar Poder de Compra'}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* History Section */}
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
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(request.status)}
                      <span className={`text-sm font-medium ${getStatusColor(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
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

      {/* Additional Info */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-2">¿Qué es el Power Buying?</h4>
              <p>El Power Buying te permite participar en subastas de vehículos con un poder de compra preaprobado, garantizado por un depósito que se mantiene como holding en tu tarjeta de crédito.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Beneficios</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Acceso inmediato a subastas una vez aprobado</li>
                <li>Proceso de pago simplificado</li>
                <li>Mayor credibilidad en las subastas</li>
                <li>Depósito se libera automáticamente</li>
                <li>Sin límite máximo - solicita lo que necesites</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Cálculo del Depósito</h4>
              <p>El depósito siempre es el <strong>10% del monto solicitado</strong>. Por ejemplo:</p>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>{formatCurrency(6000)} → Depósito: {formatCurrency(600)}</li>
                <li>{formatCurrency(12000)} → Depósito: {formatCurrency(1200)}</li>
                <li>{formatCurrency(50000)} → Depósito: {formatCurrency(5000)}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PowerBuyingPage;
