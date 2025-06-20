import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { UserPlus, Loader2, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase'; // Importamos supabase directamente
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import RegistrationForm from '@/components/registration/RegistrationForm';
import { registrationSchema } from '@/components/registration/schemas';

const RegistrationPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { signUp } = useSupabaseAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const methods = useForm({
        resolver: zodResolver(registrationSchema),
        mode: 'onChange',
        defaultValues: { /* ...tus valores... */ }
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
                toast({ title: "¡Cuenta Creada!", description: "Tu registro se ha completado exitosamente." });

                // --- INICIO DE LA CORRECCIÓN DE LA LÓGICA DE NOTIFICACIÓN ---
                try {
                    // En lugar de buscar admins, creamos una única notificación global para el rol.
                    // El `user_id` se deja en `null` porque no es para un usuario específico.
                    const notificationData = {
                        message: `¡Nuevo usuario! ${data.fullName || data.email} se ha registrado.`,
                        type: 'new_user',
                        target_role: 'admin', // Clave: La notificación es para el ROL de admin
                    };

                    const { error: notificationError } = await supabase
                        .from('notifications')
                        .insert(notificationData);

                    if (notificationError) {
                        // Si falla, lo registramos en la consola pero no molestamos al usuario.
                        console.error("Error al crear notificación de nuevo usuario:", notificationError);
                    } else {
                        console.log("Notificación global de nuevo usuario creada exitosamente.");
                    }
                } catch (error) {
                    console.error("Error inesperado al gestionar la notificación:", error);
                }
                // --- FIN DE LA CORRECCIÓN DE LA LÓGICA DE NOTIFICACIÓN ---

                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                // Manejo del error de signUp
                toast({ variant: "destructive", title: "Error de registro", description: result.error.message });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error de registro", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Tu JSX permanece sin cambios...
    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 md:p-8">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
                    <Card className="bg-card border-border shadow-xl">
                        <CardContent className="p-8 text-center space-y-6">
                            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                            <h3 className="text-2xl font-semibold text-foreground">¡Cuenta Creada!</h3>
                            <p className="text-muted-foreground">Tu registro se ha completado. Serás redirigido al login.</p>
                            <Button onClick={() => navigate('/login')} size="lg" className="w-full">Ir al Login</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted to-background p-4 md:p-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-lg">
                <Card className="bg-card border-border shadow-xl overflow-hidden">
                    <CardHeader className="text-center border-b pb-4">
                        <UserPlus className="mx-auto h-8 w-8 text-primary mb-2" />
                        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
                        <CardDescription></CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 md:p-8 relative">
                        <form onSubmit={methods.handleSubmit(handleSubmit)}>
                            <RegistrationForm control={methods.control} register={methods.register} errors={methods.formState.errors} watch={methods.watch} formState={methods.formState} />
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