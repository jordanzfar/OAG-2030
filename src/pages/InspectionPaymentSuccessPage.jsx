import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

const InspectionPaymentSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const supabase = useSupabaseClient();
    const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
    const [error, setError] = useState('');

    useEffect(() => {
        const updateInspectionStatus = async () => {
            const inspectionId = searchParams.get('inspection_id');

            if (!inspectionId) {
                setError("No se encontró el ID de la inspección para actualizar.");
                setStatus('error');
                return;
            }

            try {
                const { error: updateError } = await supabase
                    .from('inspections')
                    .update({ status: 'scheduled' }) // Cambiamos el estado a 'programada'
                    .eq('id', inspectionId);

                if (updateError) throw updateError;
                
                setStatus('success');
                // Redirigir de vuelta al panel de inspecciones después de un breve momento
                setTimeout(() => navigate('/dashboard/inspections'), 2000);

            } catch (err) {
                console.error("Error al actualizar el estado de la inspección:", err);
                setError("No se pudo actualizar tu solicitud. Por favor, contacta a soporte.");
                setStatus('error');
            }
        };

        updateInspectionStatus();
    }, [searchParams, navigate, supabase]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center p-8 space-y-4">
                {status === 'processing' && (
                    <>
                        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                        <h1 className="text-xl font-semibold">Procesando tu pago...</h1>
                        <p className="text-muted-foreground">Actualizando el estado de tu solicitud, no cierres esta ventana.</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                        <h1 className="text-xl font-semibold">¡Pago Confirmado!</h1>
                        <p className="text-muted-foreground">Tu inspección ha sido programada. Serás redirigido...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
                        <h1 className="text-xl font-semibold text-destructive">Hubo un Error</h1>
                        <p className="text-muted-foreground">{error}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default InspectionPaymentSuccessPage;