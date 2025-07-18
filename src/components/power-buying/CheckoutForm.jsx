// Asumiendo un archivo como src/components/power-buying/CheckoutForm.jsx

import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const CheckoutForm = ({ onSuccessfulPayment }) => {
  const stripe = useStripe();
  const elements = useElements();
  const supabase = useSupabaseClient();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements || !user) {
      toast({
        variant: "destructive",
        title: "Error de inicialización",
        description: "El formulario de pago no está listo. Por favor, recarga la página.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        throw error;
      }

      if (paymentIntent && paymentIntent.status === 'requires_capture') {
        // --- El pago fue autorizado con éxito, ahora actualizamos la base de datos ---
        toast({
          title: "Autorización Exitosa",
          description: "Actualizando tu poder de compra...",
        });

        // Obtenemos el monto desde nuestra propia base de datos.
        const { data: request, error: requestError } = await supabase
          .from('power_buying_requests')
          .select('amount')
          .eq('payment_intent_id', paymentIntent.id)
          .single();

        if (requestError || !request) {
          throw new Error("No se pudo encontrar la solicitud de compra original en la base de datos.");
        }
        
        const powerAmountToAdd = request.amount;

        // 1. Actualizar el estado de la solicitud a 'active'
        const { error: requestUpdateError } = await supabase
          .from('power_buying_requests')
          .update({ status: 'active' })
          .eq('payment_intent_id', paymentIntent.id);

        if (requestUpdateError) throw requestUpdateError;

        // 2. Actualizar el poder de compra del usuario usando la función RPC correcta
        // SOLUCIÓN: Cambiamos el nombre de la función a la que sugiere el error.
        const { error: rpcError } = await supabase.rpc('increment_buying_power', {
          user_id_param: user.id,
          amount_to_add: powerAmountToAdd
        });

        if (rpcError) throw rpcError;

        toast({
          title: "¡Listo!",
          description: "El depósito ha sido autorizado y tu poder de compra ha sido actualizado.",
        });
        
        onSuccessfulPayment(); // Cierra el modal y refresca la data

      } else {
        throw new Error(`Estado de pago inesperado: ${paymentIntent ? paymentIntent.status : 'desconocido'}.`);
      }

    } catch (error) {
      console.error("Error detallado en handleSubmit:", error);
      toast({
        variant: "destructive",
        title: "Error en el Proceso",
        description: error.message || "Ocurrió un error desconocido. Revisa la consola.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button disabled={isLoading || !stripe || !elements} className="w-full mt-4">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        <span>{isLoading ? 'Procesando...' : 'Autorizar Depósito'}</span>
      </Button>
    </form>
  );
};

// --- FUNCIÓN DE BASE DE DATOS RECOMENDADA ---
// Para evitar problemas de concurrencia, es mejor usar una función de base de datos (RPC)
// para actualizar el poder de compra. Puedes crearla en el SQL Editor de Supabase:
/*
  create or replace function increment_buying_power(user_id_param uuid, amount_to_add numeric)
  returns void as $$
    update public.users_profile
    set buying_power = buying_power + amount_to_add
    where user_id = user_id_param;
  $$ language sql;
*/

export default CheckoutForm;
