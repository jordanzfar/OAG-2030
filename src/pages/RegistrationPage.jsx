import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { UserPlus, Loader2, CheckCircle, ArrowLeft } from 'lucide-react';

import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import RegistrationForm from '@/components/registration/RegistrationForm';
import { registrationSchema } from '@/components/registration/schemas';
import PlanSelector, { membershipPlans } from '@/components/registration/PlanSelector';

const sendAdminNotification = async (supabase, newUser) => {
    const planName = membershipPlans.find(p => p.id === newUser.plan)?.name || newUser.plan;
    const notificationData = {
        message: `¡Nuevo usuario! ${newUser.fullName || newUser.email} se ha registrado con el plan ${planName}.`,
        type: 'new_user',
        target_role: 'admin',
    };

    const { error } = await supabase.from('notifications').insert(notificationData);
    if (error) {
        console.error("Error al crear la notificación de nuevo usuario:", error);
    }
};

/**
 * QUÉ HACE: Esta función sondea la base de datos, pidiendo el perfil del usuario.
 * POR QUÉ: Le da tiempo al trigger de Supabase para crear el perfil después del registro.
 * CÓMO EVITA ERRORES: Impide que llamemos a la Edge Function antes de que el perfil exista, evitando la "race condition".
 * @param {object} supabase - El cliente de Supabase.
 * @param {string} userId - El ID del usuario a buscar.
 * @param {number} retries - Número de reintentos.
 * @param {number} delay - Tiempo de espera entre reintentos en ms.
 * @returns {Promise<object|null>} El perfil del usuario o null si no se encuentra.
 */
const pollForUserProfile = async (supabase, userId, retries = 5, delay = 500) => {
    for (let i = 0; i < retries; i++) {

        // --- LA CORRECCIÓN ESTÁ AQUÍ ---
        // QUÉ CAMBIÓ: Buscamos en la columna 'user_id' en lugar de 'id'.
        // POR QUÉ: Tu tabla guarda el ID de autenticación en 'user_id'. Ahora el código de React
        // busca en el lugar correcto, coincidiendo con lo que hace el trigger de la base de datos.
        const { data, error } = await supabase
            .from('users_profile')
            .select('id, user_id') // Podemos seleccionar ambas para confirmar
            .eq('user_id', userId) // <-- ¡LA CORRECCIÓN CLAVE!
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') {
            // Si el error no es "0 rows returned", lo mostramos.
            console.error("Error inesperado durante el sondeo:", error);
        }
        
        if (data) {
            console.log(`Perfil encontrado en el intento ${i + 1}.`);
            return data; // ¡Éxito! Perfil encontrado.
        }
        
        // Si no se encontró, se registra en la consola y se reintenta.
        console.log(`Intento ${i + 1}: Perfil no encontrado. Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    console.error("No se pudo encontrar el perfil del usuario después de varios intentos.");
    return null; // El perfil no se encontró después de todos los reintentos.
};



const RegistrationPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { signUp } = useSupabaseAuth();
    const supabase = useSupabaseClient();
    const [isSuccess, setIsSuccess] = useState(false);
    
    const [step, setStep] = useState(1);
    const [selectedPlan, setSelectedPlan] = useState('free');

    const methods = useForm({
        resolver: zodResolver(registrationSchema),
        mode: 'onChange',
        defaultValues: {
            fullName: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            acceptTerms: false,
        }
    });

    const { formState: { isSubmitting }, setError } = methods;

    const handleSubmit = async (data) => {
        try {
            // Paso 1: Registrar al usuario
            const result = await signUp(data.email, data.password, {
                full_name: data.fullName,
                phone: data.phone,
                membership_plan: selectedPlan,
            });

            if (!result.success || !result.data.user) {
                throw new Error(result.error?.message || "No se pudo crear la cuenta.");
            }
            
            const user = result.data.user;

            // Enviar notificación (puede hacerse en paralelo)
            sendAdminNotification(supabase, { ...data, plan: selectedPlan });

            const chosenPlan = membershipPlans.find(p => p.id === selectedPlan);

            // Si es un plan de pago, iniciar el flujo de checkout
            if (chosenPlan && chosenPlan.price > 0) {
                
                // Paso 2: Esperar activamente a que el perfil exista
                toast({ title: "Verificando tu cuenta...", description: "Un momento por favor..." });
                
                const userProfile = await pollForUserProfile(supabase, user.id);
                
                if (!userProfile) {
                    // Si después de esperar el perfil no aparece, es un error grave.
                    throw new Error("No pudimos verificar tu perfil. Por favor, contacta a soporte.");
                }

                toast({ title: "Cuenta Verificada", description: "Ahora te redirigiremos a nuestro portal de pago seguro." });
                
                const successUrl = new URL('/payment-success', window.location.origin).toString();
                const cancelUrl = new URL('/payment-cancelled', window.location.origin).toString();

                // Paso 3: AHORA SÍ llamar a la Edge Function
                const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout-session', {
                    body: { planId: selectedPlan, successUrl, cancelUrl },
                });
                
                if (checkoutError) throw checkoutError;
                if (checkoutData.error) throw new Error(checkoutData.error);

                // Redirigir al pago
                window.location.href = checkoutData.checkoutUrl;

            } else {
                // Flujo para plan gratuito (sin cambios)
                setIsSuccess(true);
                toast({ title: "¡Cuenta Creada!", description: "Tu registro se ha completado exitosamente." });
                setTimeout(() => navigate('/login'), 3000);
            }

        } catch (error) {
            if (error.message.includes('unique constraint')) {
                setError('email', { type: 'manual', message: 'Este correo electrónico ya está en uso.' });
                toast({ variant: "destructive", title: "Error de registro", description: "Este correo electrónico ya está registrado." });
            } else {
                toast({ variant: "destructive", title: "Error inesperado", description: error.message });
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="w-full max-w-md bg-card border-border shadow-xl">
                        <CardContent className="p-8 text-center space-y-6">
                            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                            <h3 className="text-2xl font-semibold text-foreground">¡Registro Completo!</h3>
                            <p className="text-muted-foreground">Serás redirigido para iniciar sesión.</p>
                            <Button onClick={() => navigate('/login')} size="lg" className="w-full">Ir al Login Ahora</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/50 p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl">
                <AnimatePresence mode="wait">
                    {step === 1 ? (
                        <motion.div
                            key="step1-plans"
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3 }}
                        >
                            <PlanSelector
                                selectedPlan={selectedPlan}
                                onSelectPlan={setSelectedPlan}
                                onNextStep={() => setStep(2)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2-form"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Card className="bg-card border-border shadow-xl overflow-hidden max-w-lg mx-auto">
                                <CardHeader className="text-center border-b p-6 relative">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
                                        onClick={() => setStep(1)}
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Button>
                                    <UserPlus className="mx-auto h-8 w-8 text-primary mb-2" />
                                    <CardTitle className="text-2xl">Completa tu Registro</CardTitle>
                                    <CardDescription>
                                        Plan seleccionado: <span className="font-bold text-primary">{membershipPlans.find(p => p.id === selectedPlan)?.name}</span>
                                    </CardDescription>
                                </CardHeader>
                                <FormProvider {...methods}>
                                    <form onSubmit={methods.handleSubmit(handleSubmit)}>
                                        <CardContent className="p-6 md:p-8 relative">
                                            <RegistrationForm />
                                            {isSubmitting && (
                                                <div className="absolute inset-0 bg-card/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-b-lg">
                                                    <div className="text-center space-y-4">
                                                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                                        <p className="text-sm text-muted-foreground">Creando tu cuenta...</p>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
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
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default RegistrationPage;