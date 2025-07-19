import React from 'react';
import { motion } from 'framer-motion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Upload, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { text: 'Pendiente', variant: 'secondary', icon: <Clock className="h-4 w-4 mr-1" /> },
    approved: { text: 'Aprobado', variant: 'success', icon: <CheckCircle className="h-4 w-4 mr-1" /> },
    rejected: { text: 'Rechazado', variant: 'destructive', icon: <AlertCircle className="h-4 w-4 mr-1" /> },
  };
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <Badge variant={config.variant} className="flex items-center w-fit">
      {config.icon}
      <span>{config.text}</span>
    </Badge>
  );
};

const DepositsPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { createDeposit, fetchRecords, uploadFile } = useSupabaseData();
    const [deposits, setDeposits] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [fileName, setFileName] = React.useState('Seleccionar archivo');

    const loadDeposits = React.useCallback(async () => {
        if (!user) { setDeposits([]); return; }
        const result = await fetchRecords('deposits', { user_id: user.id }, { orderBy: { column: 'created_at', ascending: false } });
        if (result.success) { setDeposits(result.data || []); }
    }, [user, fetchRecords]);

    React.useEffect(() => {
        const runLoad = async () => {
            if (!user) { setLoading(false); return; }
            setLoading(true);
            await loadDeposits();
            setLoading(false);
        };
        runLoad();
    }, [user, loadDeposits]);

    // NOVA UI: Lógica de envío de formulario corregida y robusta.
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);

        const fileInput = e.target.querySelector('input[type="file"]');
        if (fileInput.files.length === 0) {
            toast({ variant: "destructive", title: "Archivo Requerido", description: "Por favor, adjunta el comprobante de pago." });
            setIsSubmitting(false);
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData(e.target);
        const amount = parseFloat(formData.get('amount'));
        const reference = formData.get('reference');
        const paymentDate = formData.get('paymentDate');
        const filePath = `${user.id}/deposits/${Date.now()}_${file.name}`;
        
        try {
            // 1. Intentar subir el archivo
            const uploadResult = await uploadFile('documents', filePath, file);
            if (!uploadResult.success) {
                // Si la subida falla, mostrar error y detenerse.
                throw new Error(uploadResult.error?.message || 'No se pudo subir el archivo.');
            }

            // 2. Si la subida es exitosa, crear el registro en la base de datos
            const depositData = { amount, reference, payment_date: paymentDate, receipt_file_path: filePath, status: 'pending' };
            const result = await createDeposit(user.id, depositData);
            
            if (result.success) {
                toast({ title: "Depósito Registrado Exitosamente", description: `Hemos recibido tu registro por $${amount.toFixed(2)}. Será verificado pronto.` });
                e.target.reset();
                setFileName('Seleccionar archivo');
                loadDeposits();
            } else {
                throw new Error(result.error?.message || 'No se pudo registrar el depósito en la base de datos.');
            }
        } catch (error) {
            console.error('Error submitting deposit:', error);
            toast({ variant: "destructive", title: "Error al Registrar Depósito", description: error.message || "Por favor, inténtalo de nuevo." });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) setFileName(e.target.files[0].name);
        else setFileName('Seleccionar archivo');
    };
    
    const tableContainerVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.2 } }
    };

    const tableRowVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    };

    if (loading) {
        return ( <div className="p-6"><h1 className="text-3xl font-bold">Depósitos</h1><p>Cargando...</p></div> );
    }

    return (
        <motion.div className="space-y-6 p-4 md:p-6" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div>
                <h1 className="text-3xl font-bold text-foreground">Depósitos y Comprobantes</h1>
                <p className="text-muted-foreground">Registra tus depósitos y adjunta los comprobantes para verificación.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <motion.div className="lg:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                    <Card className="bg-card border-border shadow-lg h-full">
                        <CardHeader>
                            <CardTitle>Registrar Nuevo Depósito</CardTitle>
                            <CardDescription>Ingresa los detalles y sube el comprobante.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="amount">Monto Depositado (USD)</Label>
                                    <Input id="amount" name="amount" type="number" step="0.01" min="0.01" placeholder="Ej: 600.00" required className="mt-1" disabled={isSubmitting} />
                                </div>
                                <div>
                                    <Label htmlFor="reference">Referencia o Concepto</Label>
                                    <Input id="reference" name="reference" placeholder="Ej: Depósito Power Buying" required className="mt-1" disabled={isSubmitting} />
                                </div>
                                <div>
                                    <Label htmlFor="paymentDate">Fecha del Depósito</Label>
                                    <Input id="paymentDate" name="paymentDate" type="date" required className="mt-1" disabled={isSubmitting} max={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div>
                                    <Label htmlFor="receipt">Comprobante de Pago</Label>
                                    <div className="mt-1">
                                        <label htmlFor="receipt-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-muted/50">
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                                                <p className="mb-2 text-sm text-muted-foreground text-center px-2">
                                                    {fileName === 'Seleccionar archivo' ? (<><span className="font-semibold">Haz clic para subir</span> o arrastra</>) : (<span className="font-semibold">{fileName}</span>)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">PDF, PNG, JPG (MAX. 5MB)</p>
                                            </div>
                                            <Input id="receipt-upload" name="receipt" type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} disabled={isSubmitting} />
                                        </label>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full mt-4" disabled={isSubmitting}>{isSubmitting ? 'Registrando...' : 'Registrar Depósito'}</Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
                <motion.div className="lg:col-span-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <Card className="bg-card border-border shadow-lg h-full">
                        <CardHeader>
                            <CardTitle>Historial de Depósitos</CardTitle>
                            <CardDescription>El estado de tus depósitos registrados.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Monto</TableHead><TableHead>Referencia</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                                <motion.tbody variants={tableContainerVariants} initial="hidden" animate="visible">
                                    {deposits.length > 0 ? (
                                        deposits.map((deposit) => (
                                            <motion.tr key={deposit.id} variants={tableRowVariants}>
                                                <TableCell className="font-medium">${parseFloat(deposit.amount).toFixed(2)}</TableCell>
                                                <TableCell>{deposit.reference}</TableCell>
                                                <TableCell>{new Date(deposit.payment_date).toLocaleDateString()}</TableCell>
                                                <TableCell><StatusBadge status={deposit.status} /></TableCell>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={4} className="h-24 text-center">No tienes depósitos registrados.</TableCell></TableRow>
                                    )}
                                </motion.tbody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DepositsPage;