
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const DepositsPage = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { createDeposit, fetchRecords, uploadFile } = useSupabaseData();
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      loadDeposits();
    }
  }, [user]);

  const loadDeposits = async () => {
    if (!user) return;

    const result = await fetchRecords('deposits', { user_id: user.id }, {
      orderBy: { column: 'created_at', ascending: false }
    });

    if (result.success) {
      setDeposits(result.data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target);
      const amount = parseFloat(formData.get('amount'));
      const reference = formData.get('reference');
      const paymentDate = formData.get('paymentDate');
      const fileInput = e.target.querySelector('input[type="file"]');

      if (fileInput.files.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Por favor, adjunta el comprobante de pago.",
        });
        setIsSubmitting(false);
        return;
      }

      const file = fileInput.files[0];

      // Upload receipt file to Supabase Storage
      const filePath = `${user.id}/deposits/${Date.now()}_${file.name}`;
      const uploadResult = await uploadFile('documents', filePath, file);

      if (uploadResult.success) {
        // Create deposit record in database
        const depositData = {
          amount: amount,
          reference: reference,
          payment_date: paymentDate,
          receipt_file_path: filePath,
          status: 'pending'
        };

        const result = await createDeposit(user.id, depositData);

        if (result.success) {
          toast({
            title: "Depósito Registrado Exitosamente",
            description: `Hemos recibido tu registro de depósito por $${amount.toFixed(2)} y el comprobante. Será verificado pronto.`,
          });
          
          e.target.reset();
          const fileLabel = document.getElementById('file-label');
          if (fileLabel) fileLabel.textContent = 'Seleccionar archivo';
          
          // Refresh deposits list
          loadDeposits();
        }
      }
    } catch (error) {
      console.error('Error submitting deposit:', error);
      toast({
        variant: "destructive",
        title: "Error al Registrar Depósito",
        description: "No se pudo registrar el depósito. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e) => {
    const fileLabel = document.getElementById('file-label');
    if (fileLabel && e.target.files.length > 0) {
      fileLabel.textContent = e.target.files[0].name;
    } else if (fileLabel) {
      fileLabel.textContent = 'Seleccionar archivo';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'rejected': return <AlertCircle className="h-5 w-5 text-destructive" />;
      default: return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendiente';
      case 'rejected': return 'Rechazado';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'text-green-500';
      case 'pending': return 'text-yellow-500';
      case 'rejected': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Depósitos y Comprobantes</h1>
        <div className="flex justify-center items-center py-8">
          <p className="text-muted-foreground">Cargando depósitos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Depósitos y Comprobantes</h1>
      <p className="text-muted-foreground">
        Registra tus depósitos realizados y adjunta los comprobantes de pago para verificación.
      </p>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Registrar Nuevo Depósito</CardTitle>
          <CardDescription>Ingresa los detalles del depósito y sube el comprobante.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Monto Depositado (USD)</Label>
              <Input 
                id="amount" 
                name="amount" 
                type="number" 
                step="0.01" 
                min="0.01"
                placeholder="Ej: 600.00" 
                required 
                className="mt-1" 
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="reference">Referencia o Concepto</Label>
              <Input 
                id="reference" 
                name="reference" 
                placeholder="Ej: Depósito Power Buying, Pago Legalización" 
                required 
                className="mt-1" 
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="paymentDate">Fecha del Depósito</Label>
              <Input 
                id="paymentDate" 
                name="paymentDate" 
                type="date" 
                required 
                className="mt-1" 
                disabled={isSubmitting}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="receipt">Comprobante de Pago</Label>
              <div className="mt-1 flex items-center justify-center w-full">
                <label htmlFor="receipt-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted/50">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p id="file-label" className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                    </p>
                    <p className="text-xs text-muted-foreground">PDF, PNG, JPG o GIF (MAX. 5MB)</p>
                  </div>
                  <Input 
                    id="receipt-upload" 
                    name="receipt" 
                    type="file" 
                    className="hidden" 
                    required 
                    accept=".pdf,.png,.jpg,.jpeg,.gif" 
                    onChange={handleFileChange} 
                    disabled={isSubmitting}
                  />
                </label>
              </div>
            </div>
            <Button type="submit" className="mt-4" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando Depósito...' : 'Registrar Depósito'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Historial de Depósitos</CardTitle>
          <CardDescription>Aquí verás el estado de tus depósitos registrados.</CardDescription>
        </CardHeader>
        <CardContent>
          {deposits.length > 0 ? (
            <div className="space-y-3">
              {deposits.map((deposit) => (
                <div key={deposit.id} className="p-4 border border-border rounded-lg bg-secondary">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">${parseFloat(deposit.amount).toFixed(2)}</h4>
                      <p className="text-sm text-muted-foreground">{deposit.reference}</p>
                      <p className="text-sm text-muted-foreground">
                        Fecha: {new Date(deposit.payment_date).toLocaleDateString()} | 
                        Registrado: {new Date(deposit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(deposit.status)}
                      <span className={`text-sm font-medium ${getStatusColor(deposit.status)}`}>
                        {getStatusText(deposit.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground italic">No hay depósitos anteriores registrados.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositsPage;
