import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileWarning, FileCheck, FileX } from 'lucide-react';
import UserVerificationChart from '@/components/admin/UserVerificationChart'; // Import the new chart component
import { Button } from '@/components/ui/button';

// Mock data for the chart
const chartData = {
  labels: ['Sin Verificar', 'En Revisión', 'Rechazados'],
  datasets: [
    {
      label: 'Usuarios',
      data: [23, 12, 5], // Corresponds to sin_verificar, en_revision, rechazados
      backgroundColor: [
        'hsl(var(--primary) / 0.6)', // Bronze semi-transparent
        'hsl(var(--secondary) / 0.6)', // Gray semi-transparent
        'hsl(var(--destructive) / 0.6)', // Red semi-transparent
      ],
      borderColor: [
        'hsl(var(--primary))',
        'hsl(var(--secondary))',
        'hsl(var(--destructive))',
      ],
      borderWidth: 1,
    },
  ],
};

const totalUsuarios = 150; // From the user request

const AdminStatsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h1 className="text-3xl font-bold text-foreground">Estadísticas Generales</h1>
      <p className="text-muted-foreground">Visualización de métricas clave de la plataforma.</p>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
         {/* Example Stat Cards */}
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuarios</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{totalUsuarios}</div>
                <p className="text-xs text-muted-foreground">+5 desde ayer</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Sin Verificar</CardTitle>
                <FileWarning className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{chartData.datasets[0].data[0]}</div>
                 <p className="text-xs text-muted-foreground">{((chartData.datasets[0].data[0] / totalUsuarios) * 100).toFixed(1)}% del total</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios En Revisión</CardTitle>
                <FileCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{chartData.datasets[0].data[1]}</div>
                 <p className="text-xs text-muted-foreground">{((chartData.datasets[0].data[1] / totalUsuarios) * 100).toFixed(1)}% del total</p>
            </CardContent>
         </Card>
         <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Rechazados</CardTitle>
                <FileX className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{chartData.datasets[0].data[2]}</div>
                 <p className="text-xs text-muted-foreground">{((chartData.datasets[0].data[2] / totalUsuarios) * 100).toFixed(1)}% del total</p>
            </CardContent>
         </Card>
      </div>

      {/* User Verification Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Verificación de Usuarios</CardTitle>
          <CardDescription>Distribución de usuarios según su estado de verificación.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
           <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
             <UserVerificationChart data={chartData} totalUsers={totalUsuarios} />
           </div>
           <Button variant="outline" size="sm" onClick={() => console.log("Ver lista clicked")}>
                Ver Lista Detallada
           </Button>
        </CardContent>
      </Card>

      {/* Placeholder for other charts */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos Mensuales (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">Gráfica de ingresos aquí... (Próximamente)</p>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
          <CardTitle>Solicitudes por Tipo (Placeholder)</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">Gráfica de tipos de solicitud aquí... (Próximamente)</p>
        </CardContent>
      </Card>

    </motion.div>
  );
};

export default AdminStatsPage;