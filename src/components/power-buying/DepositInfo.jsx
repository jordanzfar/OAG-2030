import React from 'react';
import { CreditCard, Shield } from 'lucide-react';

const DepositInfo = ({ deposit, formatCurrency }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="p-4 bg-card border border-border rounded-md">
        <div className="flex items-center space-x-2 mb-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground">Depósito Requerido</p>
        </div>
        <p className="text-2xl font-bold text-foreground">{formatCurrency(deposit)}</p>
        <p className="text-sm text-muted-foreground">
          (10% del monto seleccionado)
        </p>
      </div>

      <div className="p-4 bg-card border border-border rounded-md">
        <div className="flex items-center space-x-2 mb-2">
          <Shield className="w-5 h-5 text-primary" />
          <p className="font-semibold text-foreground">Holding Seguro</p>
        </div>
        <p className="text-sm text-muted-foreground">
          El monto se mantiene como garantía en tu tarjeta, no se cobra hasta que uses el poder de compra.
        </p>
      </div>
    </div>
  );
};

export default DepositInfo;