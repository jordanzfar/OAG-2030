import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, AlertCircle, TrendingUp } from 'lucide-react';

const FinanceStatsCards = ({ clients, deposits }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{clients.length}</div>
          <p className="text-xs text-muted-foreground">Clientes registrados</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Poder de Compra Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${clients.reduce((sum, client) => sum + (client.buying_power || 0), 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Asignado a clientes</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Depósitos Pendientes</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {deposits.filter(d => d.status === 'pending').length}
          </div>
          <p className="text-xs text-muted-foreground">Requieren confirmación</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${deposits
              .filter(d => d.status === 'confirmed' && new Date(d.created_at).getMonth() === new Date().getMonth())
              .reduce((sum, d) => sum + d.amount, 0)
              .toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Depósitos confirmados</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinanceStatsCards;
