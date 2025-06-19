import React from 'react';
import { Clock } from 'lucide-react';

const ProcessInfo = () => {
  return (
    <div className="bg-muted/50 rounded-lg p-4">
      <h4 className="font-semibold text-foreground mb-3 flex items-center">
        <Clock className="w-5 h-5 mr-2" />
        ¿Cómo funciona el proceso?
      </h4>
      <ol className="space-y-2 text-sm text-muted-foreground">
        <li className="flex items-start">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">1</span>
          Seleccionas el monto de poder de compra que necesitas
        </li>
        <li className="flex items-start">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">2</span>
          Se hace un holding (retención) del depósito en tu tarjeta
        </li>
        <li className="flex items-start">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">3</span>
          Tu poder de compra se activa inmediatamente
        </li>
        <li className="flex items-start">
          <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs mr-3 mt-0.5 flex-shrink-0">4</span>
          El holding se libera cuando no uses el poder o se convierte en pago al usarlo
        </li>
      </ol>
    </div>
  );
};

export default ProcessInfo;