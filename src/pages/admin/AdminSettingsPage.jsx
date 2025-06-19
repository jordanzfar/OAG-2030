import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch'; // Necesario
import { useToast } from '@/components/ui/use-toast';

// Comprobando codebase... Switch no existe. Creándolo.

// Página de Configuración General (Solo Admin General)
const AdminSettingsPage = () => {
  const { toast } = useToast();

  // Simulación de estado de configuración
  const [settings, setSettings] = React.useState({
    notificationsEnabled: true,
    defaultAssignee: 'admin@opulent.com',
    maintenanceMode: false,
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: value }));
  };

   const handleSwitchChange = (id, checked) => {
    setSettings(prev => ({ ...prev, [id]: checked }));
  };

  const handleSaveChanges = (e) => {
    e.preventDefault();
    // Lógica para guardar configuración (simulada)
    toast({
      title: "Configuración Guardada",
      description: "Los ajustes generales han sido actualizados.",
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Configuración General</h1>
      <p className="text-muted-foreground">Ajusta las configuraciones globales de la plataforma.</p>

      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle>Ajustes Principales</CardTitle>
          <CardDescription>Controla el comportamiento general del sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveChanges} className="space-y-6">
            {/* Notificaciones */}
            <div className="flex items-center justify-between space-x-2 p-4 border border-border rounded-lg">
               <div>
                <Label htmlFor="notificationsEnabled" className="text-base">Habilitar Notificaciones</Label>
                <p className="text-sm text-muted-foreground">Activa o desactiva las notificaciones por email/push.</p>
               </div>
              <Switch
                id="notificationsEnabled"
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => handleSwitchChange('notificationsEnabled', checked)}
              />
            </div>

             {/* Asignado por defecto */}
             <div className="space-y-2">
                <Label htmlFor="defaultAssignee">Email Asignado por Defecto</Label>
                <Input
                    id="defaultAssignee"
                    type="email"
                    placeholder="Email para nuevas tareas no asignadas"
                    value={settings.defaultAssignee}
                    onChange={handleInputChange}
                />
                <p className="text-sm text-muted-foreground">
                    Las nuevas solicitudes o tareas se asignarán a este email si no se especifica otro.
                </p>
             </div>

             {/* Modo Mantenimiento */}
             <div className="flex items-center justify-between space-x-2 p-4 border border-border rounded-lg bg-secondary/50">
               <div>
                <Label htmlFor="maintenanceMode" className="text-base">Modo Mantenimiento</Label>
                <p className="text-sm text-muted-foreground">Desactiva temporalmente el acceso de clientes a la plataforma.</p>
               </div>
              <Switch
                id="maintenanceMode"
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleSwitchChange('maintenanceMode', checked)}
                className="data-[state=checked]:bg-destructive" // Estilo rojo cuando activo
              />
            </div>

            {/* Botón Guardar */}
            <div className="flex justify-end pt-4 border-t border-border">
                <Button type="submit">Guardar Cambios</Button>
            </div>
          </form>
        </CardContent>
      </Card>

       {/* Placeholder para otras secciones de configuración */}
       <Card className="bg-card border-border shadow-lg opacity-50">
        <CardHeader>
          <CardTitle>Integraciones (Próximamente)</CardTitle>
          <CardDescription>Conecta con Stripe, APIs de VIN Check, etc.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-muted-foreground italic">Configuración de integraciones externas estará disponible aquí.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;