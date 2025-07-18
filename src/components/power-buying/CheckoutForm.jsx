import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Lock } from 'lucide-react';

export default function CheckoutForm({ depositAmount, onSuccessfulPayment }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [message, setMessage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-status`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setMessage(error.message);
      toast({
        variant: "destructive",
        title: "Error en el pago",
        description: error.message,
      });
    } else if (paymentIntent && paymentIntent.status === 'requires_capture') {
      toast({
        title: "¡Autorización Exitosa!",
        description: "El depósito ha sido autorizado. Tu poder de compra se actualizará pronto.",
      });
      onSuccessfulPayment();
    }

    setIsProcessing(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      <Button 
        disabled={isProcessing || !stripe || !elements} 
        id="submit"
        className="w-full mt-6"
        size="lg"
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Lock className="mr-2 h-4 w-4" />
        )}
        <span>Autorizar Depósito de {formatCurrency(depositAmount)}</span>
      </Button>

      {message && <div id="payment-message" className="text-destructive text-sm mt-2">{message}</div>}
    </form>
  );
}