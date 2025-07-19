// src/pages/RegistrationPage.jsx

import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import RegistrationForm from '@/components/registration/RegistrationForm'; // Tu formulario refactorizado
import { registrationSchema } from '@/components/registration/schemas';

// 🧼 Función de ayuda para mantener la lógica de notificación separada
const sendAdminNotification = async (supabase, newUser) => {
    const notificationData = {
        message: `¡Nuevo usuario! ${newUser.fullName || newUser.email} se ha registrado.`,
        type: 'new_user',
        target_role: 'admin', // Notificación para el rol de administrador
    };

    const { error } = await supabase.from('notifications').insert(notificationData);

    if (error) {
        // Para producción, considera un servicio de logging como Sentry o LogRocket
        console.error("Error al crear la notificación de nuevo usuario:", error);
    }
};


const RegistrationPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { signUp } = useSupabaseAuth();
    const supabase = useSupabaseClient(); // 💡 Obteniendo el cliente de forma explícita
    const [isSuccess, setIsSuccess] = useState(false);

    const methods = useForm({
        resolver: zodResolver(registrationSchema),
        mode: 'onChange', // Bueno para feedback en tiempo real
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
        }
    });

    // La función `isSubmitting` de react-hook-form es ideal para el estado de carga
    const { formState: { isSubmitting } } = methods;

    const handleSubmit = async (data) => {
        try {
            const result = await signUp(data.email, data.password, {
                full_name: data.fullName,
                phone: data.phone
            });

            if (result.success) {
                setIsSuccess(true);
                toast({ title: "¡Cuenta Creada!", description: "Tu registro se ha completado exitosamente." });
                
                // Llama a la función de ayuda para notificar a los admins
                await sendAdminNotification(supabase, data);

                setTimeout(() => navigate('/login'), 2000);
            } else {
                toast({ variant: "destructive", title: "Error de registro", description: result.error.message });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error inesperado", description: error.message });
        }
    };

    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted to-background p-4">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="w-full max-w-md bg-card border-border shadow-xl">
                        <CardContent className="p-8 text-center space-y-6">
                            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                            <h3 className="text-2xl font-semibold text-foreground">¡Cuenta Creada!</h3>
                            <p className="text-muted-foreground">Serás redirigido en un momento...</p>
                            <Button onClick={() => navigate('/login')} size="lg" className="w-full">Ir al Login Ahora</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted to-background p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
                <Card className="bg-card border-border shadow-xl overflow-hidden">
                    <CardHeader className="text-center border-b p-6">
                        <UserPlus className="mx-auto h-8 w-8 text-primary mb-2" />
                        <CardTitle className="text-2xl">Crear una Cuenta</CardTitle>
                        <CardDescription>Completa el formulario para unirte.</CardDescription>
                    </CardHeader>

                    {/* ✅ Usando FormProvider para desacoplar los componentes */}
                    <FormProvider {...methods}>
                        <form onSubmit={methods.handleSubmit(handleSubmit)}>
                            <CardContent className="p-6 md:p-8 relative">
                                <RegistrationForm />
                                {isSubmitting && (
                                    <div className="absolute inset-0 bg-card/80 flex items-center justify-center z-10 rounded-b-lg">
                                        <div className="text-center space-y-4">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            <p className="text-sm text-muted-foreground">Creando tu cuenta...</p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            {/* El botón de submit ahora está dentro de RegistrationForm, donde debe estar */}
                        </form>
                    </FormProvider>

                    <CardFooter className="flex justify-center border-t p-4 bg-muted/50">
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