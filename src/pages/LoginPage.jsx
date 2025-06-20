import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { UserPlus, Loader2 } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useNavigate, Link } from 'react-router-dom';

// --- PASO 2.1: Importa la imagen del logo ---
import logo from '@/assets/OPULENT-BRONZE.png';

const LoginPage = () => {
    // Hooks y estado del formulario
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const navigate = useNavigate();
    const { signIn } = useSupabaseAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const { error } = await signIn(email, password);

        setIsLoading(false);

        if (error) {
            toast({
                variant: "destructive",
                title: "Error de inicio de sesión",
                description: error.message || "Email o contraseña incorrectos.",
            });
        } else {
            toast({
                title: "Inicio de Sesión Exitoso",
                description: "¡Bienvenido de vuelta!",
            });
            navigate('/');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary to-background p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-xl border border-border"
            >
                <div className="text-center">
                    {/* --- PASO 2.2: Reemplaza el ícono y el texto por el logo --- */}
                    {/* Eliminados:
                        <Car className="mx-auto h-12 w-12 text-primary" />
                        <h1 className="text-3xl font-bold mt-4 text-foreground">Opulent Auto Gallery</h1> 
                    */}
                    
                    {/* Agregado: */}
                    <img 
                        src={logo} 
                        alt="Logo de Opulent Auto Gallery" 
                        className="w-9/5 max-w-xs mx-auto mb-7" 
                    />
                    
                    <p className="text-muted-foreground"></p>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1"
                            disabled={isLoading}
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Contraseña</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1"
                            disabled={isLoading}
                        />
                    </div>
                    <Button 
                        type="submit" 
                        className="w-full !mt-6 bg-primary hover:bg-primary/90 text-primary-foreground"
                        disabled={isLoading}
                    >
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                </form>
                
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-3">¿No tienes cuenta?</p>
                    <Button variant="outline" className="w-full" asChild disabled={isLoading}>
                        <Link to="/register">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Crear Cuenta Nueva
                        </Link>
                    </Button>
                </div>

                <div className="text-center text-xs text-muted-foreground mt-6">
                    <p>Olvidaste tu contraseña? Envia un correo a soporte@opulentautogallery.com</p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;