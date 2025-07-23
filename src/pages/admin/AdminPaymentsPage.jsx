import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAdminData } from '@/hooks/useAdminData';
import RealtimeDepositsTable from '@/components/admin/RealtimeDepositsTable';
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const AdminPaymentsPage = () => {
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  const { fetchAllDeposits, updateDepositStatus, loading: loadingDeposits } = useAdminData();
  const [deposits, setDeposits] = useState([]);

  // Estado para el formulario de generación de enlace
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  useEffect(() => {
    loadDeposits();
  }, []);

  const loadDeposits = async () => {
    const result = await fetchAllDeposits();
    if (result.success) {
      setDeposits(result.data);
    }
  };

  const handleStatusUpdate = async (depositId, newStatus) => {
    const result = await updateDepositStatus(depositId, newStatus);
    if (result.success) {
      toast({
        title: "Estado Actualizado",
        description: `El depósito ha sido marcado como "${newStatus}".`,
      });
      await loadDeposits();
    } else {
      toast({
        title: "Error al actualizar",
        description: result.error.message,
        variant: "destructive",
      });
    }
  };

  const handleGeneratePaymentLink = async (e) => {
    e.preventDefault();
    if (!clientId || !amount) return;

    setIsGeneratingLink(true);

    try {
      // Invocamos una Edge Function 'create-payment-link' en Supabase
      const { data, error } = await supabase.functions.invoke('create-payment-link', {
        body: { clientId, amount: parseFloat(amount) },
      });

      if (error) throw error;

      // Copiamos el enlace al portapapeles
      await navigator.clipboard.writeText(data.paymentLink);

      toast({
        title: "Enlace Generado y Copiado",
        description: "El enlace de pago se ha copiado a tu portapapeles.",
      });

      // Limpiamos el formulario
      setClientId('');
      setAmount('');

    } catch (error) {
      toast({
        title: "Error al Generar Enlace",
        description: error.message || "Ocurrió un problema con el servidor. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Pagos y Finanzas</h1>
        <p className="text-muted-foreground">
          Confirma depósitos y gestiona pagos en tiempo real.
        </p>
      </div>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Generar Enlace de Pago Manual</CardTitle>
          <CardDescription>Crea un enlace de pago de Stripe para un cliente específico.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGeneratePaymentLink} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <Label htmlFor="clientId">ID o Email del Cliente</Label>
              <Input
                id="clientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Ej: client123 o cliente@email.com"
                required
                className="mt-1"
                disabled={isGeneratingLink}
              />
            </div>
            <div className="flex-grow w-full">
              <Label htmlFor="amount">Monto (USD)</Label>
              <Input
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.01"
                placeholder="Ej: 100.00"
                required
                className="mt-1"
                disabled={isGeneratingLink}
              />
            </div>
            <Button type="submit" className="w-full md:w-auto" disabled={isGeneratingLink}>
              {isGeneratingLink ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4 mr-2" />
              )}
              {isGeneratingLink ? 'Generando...' : 'Generar Enlace'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <RealtimeDepositsTable
        deposits={deposits}
        loading={loadingDeposits}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default AdminPaymentsPage;