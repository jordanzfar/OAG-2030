import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData'; // Importa useSupabaseData
import RegistrationForm from '@/components/registration/RegistrationForm';
import { registrationSchema } from '@/components/registration/schemas';

const RegistrationPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useSupabaseAuth();
  // Obtiene la función 'createRecord' y la nueva 'fetchUsersByRole' de useSupabaseData
  const { createRecord, fetchUsersByRole } = useSupabaseData(); 
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const methods = useForm({ 
    resolver: zodResolver(registrationSchema), 
    mode: 'onChange',
    defaultValues: { 
      acceptTerms: false,
      fullName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    } 
  });

  const handleSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await signUp(data.email || `${data.phone}@temp.com`, data.password, {
        full_name: data.fullName,
        phone: data.phone
      });

      if (result.success) {
        setIsSuccess(true);
        
        toast({
          title: "¡Cuenta Creada!",
          description: "Tu registro se ha completado exitosamente.",
        });

        // --- INICIO DE LA LÓGICA PARA CREAR LA NOTIFICACIÓN ADMINISTRATIVA ---
        try {
            // Buscar los IDs de los administradores
            const adminUsersResult = await fetchUsersByRole('admin'); // Busca usuarios con rol 'admin' en users_profile
            
            if (adminUsersResult.success && adminUsersResult.data && adminUsersResult.data.length > 0) {
                // Selecciona el primer admin encontrado para enviarle la notificación
                // Si quieres enviarla a todos los admins, necesitarías un bucle e insertar
                // una notificación para cada uno. Por ahora, se envía al primero.
                const targetAdminId = adminUsersResult.data[0]; 

                const notificationMessage = `¡Nuevo usuario! ${data.fullName || data.email || data.phone} se ha registrado en el sistema.`;
                const notificationType = 'new_user';

                const notificationData = {
                    user_id: targetAdminId, // Asigna la notificación al ID de este admin
                    message: notificationMessage,
                    type: notificationType,
                    is_read: false, 
                    created_at: new Date().toISOString(), 
                    target_role: 'admin', // Indica que esta notificación es para administradores (para filtros)
                };

                const notificationResult = await createRecord('notifications', notificationData); 

                if (notificationResult.success) {
                    console.log("Notificación de nuevo usuario creada para el administrador:", targetAdminId);
                } else {
                    console.error("Error al crear notificación de nuevo usuario para administrador:", notificationResult.error);
                    toast({
                        variant: "warning",
                        title: "Advertencia de notificación",
                        description: "No se pudo notificar al administrador sobre el nuevo usuario.",
                    });
                }
            } else {
                console.warn("No se encontraron administradores con rol 'admin' para enviar la notificación de nuevo usuario.");
                toast({
                    variant: "warning",
                    title: "Advertencia",
                    description: "No se encontraron administradores para enviar la notificación de nuevo usuario."
                });
            }
        } catch (notificationError) {
            console.error("Error al gestionar notificación de nuevo usuario:", notificationError);
            toast({
                variant: "warning",
                title: "Advertencia de notificación",
                description: "Ocurrió un error inesperado al intentar notificar a los administradores."
            });
        }
        // --- FIN DE LA LÓGICA DE NOTIFICACIÓN ---

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: error.message || "No se pudo crear la cuenta. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 md:p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <Card className="bg-card border-border shadow-xl">
            <CardContent className="p-8 text-center space-y-6">
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
              <h3 className="text-2xl font-semibold text-foreground">¡Cuenta Creada!</h3>
              <p className="text-muted-foreground">
                Tu registro se ha completado exitosamente. Serás redirigido al login en unos segundos.
              </p>
              <Button onClick={() => navigate('/login')} size="lg" className="w-full">
                Ir al Login
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-card border-border shadow-xl overflow-hidden">
          <CardHeader className="text-center border-b pb-4">
            <UserPlus className="mx-auto h-8 w-8 text-primary mb-2" />
            <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
            <CardDescription>Únete a Opulent Auto Gallery</CardDescription>
          </CardHeader>
          <CardContent className="p-6 md:p-8 relative">
            <form onSubmit={methods.handleSubmit(handleSubmit)}>
              <RegistrationForm
                onSubmit={handleSubmit}
                control={methods.control}
                register={methods.register}
                errors={methods.formState.errors}
                watch={methods.watch}
                formState={methods.formState}
              />
            </form>
            {isLoading && (
              <div className="absolute inset-0 bg-card/80 flex items-center justify-center z-10 rounded-b-lg">
                <div className="text-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground">Creando tu cuenta...</p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-4">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <Button variant="link" className="p-0 h-auto" asChild>
                <Link to="/login">Inicia Sesión</Link>
              </Button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegistrationPage;