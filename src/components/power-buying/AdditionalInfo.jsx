import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Clock, CreditCard } from 'lucide-react';

const AdditionalInfo = () => {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Información Importante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="flex items-start space-x-2">
          <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <p><strong>Seguridad:</strong> Utilizamos Stripe para procesar pagos de forma segura. Tu información financiera está protegida.</p>
        </div>
        <div className="flex items-start space-x-2">
          <Clock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p><strong>Activación:</strong> Tu poder de compra se activa inmediatamente después del pago exitoso.</p>
        </div>
        <div className="flex items-start space-x-2">
          <CreditCard className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
          <p><strong>Holding:</strong> El depósito se mantiene como garantía y se libera automáticamente si no usas el poder de compra en 30 días.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdditionalInfo;