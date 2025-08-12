import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();

  // Redirige al usuario al dashboard después de unos segundos.
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/dashboard'); // O a la página que prefieras
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md text-center p-8">
        <CardContent>
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h1 className="text-2xl font-bold mb-2">¡Pago Exitoso!</h1>
          <p className="text-muted-foreground">
            Tu suscripción ha sido activada. Serás redirigido a tu panel de control en unos momentos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;