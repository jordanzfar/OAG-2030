import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAdminData } from '@/hooks/useAdminData';
import RealtimeDepositsTable from '@/components/admin/RealtimeDepositsTable';
import { Link as LinkIcon } from 'lucide-react';

const AdminPaymentsPage = () => {
  const { toast } = useToast();
  const { fetchAllDeposits, updateDepositStatus, loading } = useAdminData();
  const [deposits, setDeposits] = useState([]);

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
      // Refresh the deposits list
      await loadDeposits();
    }
  };

  const generatePaymentLink = (clientId, amount) => {
    // Lógica para generar enlace de pago (Stripe, etc.) - Simulado
    const link = `https://pay.example.com/${clientId}?amount=${amount}&ref=${Date.now()}`;
    prompt("Enlace de pago generado (copiar manualmente):", link);
    toast({ title: "Enlace de Pago Generado", description: "El enlace se ha mostrado para copiar." });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Pagos y Finanzas</h1>
        <p className="text-muted-foreground">
          Confirma depósitos y gestiona pagos en tiempo real con Supabase
        </p>
      </div>

      {/* Sección para generar enlaces de pago */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Generar Enlace de Pago Manual</CardTitle>
          <CardDescription>Crea un enlace de pago para un cliente específico.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); generatePaymentLink(e.target.clientId.value, e.target.amount.value); e.target.reset(); }} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-grow">
              <Label htmlFor="clientId">ID o Email del Cliente</Label>
              <Input id="clientId" name="clientId" placeholder="Ej: client123 o cliente@email.com" required className="mt-1" />
            </div>
            <div className="flex-grow">
              <Label htmlFor="amount">Monto (USD)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" placeholder="Ej: 100.00" required className="mt-1" />
            </div>
            <Button type="submit" className="w-full md:w-auto">
              <LinkIcon className="w-4 h-4 mr-2"/> Generar Enlace
            </Button>
          </form>
        </CardContent>
      </Card>

      <RealtimeDepositsTable 
        deposits={deposits}
        loading={loading}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default AdminPaymentsPage;