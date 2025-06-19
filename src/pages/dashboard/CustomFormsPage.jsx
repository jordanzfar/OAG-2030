import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // Importar hook

// Esta página ahora es solo para CLIENTES (si admin necesita gestionar, se hará en otra sección)
const CustomFormsPage = () => {
  const { userRole } = useAuth();

  // Asegurarse de que solo clientes vean esto
  if (userRole !== 'client') {
    return <p className="text-destructive">Acceso no autorizado.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Mis Formularios Asignados</h1>
      <p className="text-muted-foreground">
        Accede y completa los formularios personalizados asignados por el administrador.
      </p>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Formularios Pendientes</CardTitle>
          <CardDescription>Formularios que necesitas completar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 border-2 border-border border-dashed rounded-lg bg-secondary">
             <FileText className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground italic text-center">
              No tienes formularios personalizados asignados por el momento.
              <br/>(Próximamente)
            </p>
          </div>
          {/* Aquí iría una lista de formularios asignados al cliente */}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomFormsPage;