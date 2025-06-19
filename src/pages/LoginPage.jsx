
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Car, UserPlus } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn, isAuthenticated, userProfile, loading } = useSupabaseAuth();
  const { login, isAuthenticated: isLocalAuth, userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && userProfile) {
      // Sync with local auth context
      login(userProfile.role || 'client');
      const redirectTo = (userProfile.role === 'admin' || userProfile.role === 'support' || userProfile.role === 'validation' || userProfile.role === 'finance') ? '/admin' : '/dashboard';
      navigate(redirectTo, { replace: true });
    } else if (isAuthenticated && !userProfile) {
      // User is authenticated but profile is still loading, wait a bit more
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          // Default to client role if profile is not available
          login('client');
          navigate('/dashboard', { replace: true });
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userProfile, login, navigate]);

  // Also check if already authenticated locally
  useEffect(() => {
    if (isLocalAuth && !loading) {
      const redirectTo = (userRole === 'admin' || userRole === 'support' || userRole === 'validation' || userRole === 'finance') ? '/admin' : '/dashboard';
      navigate(redirectTo, { replace: true });
    }
  }, [isLocalAuth, userRole, navigate, loading]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        toast({
          title: "Inicio de Sesión Exitoso",
          description: "¡Bienvenido de vuelta!",
        });
        // The useEffect will handle the redirection once userProfile is loaded
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: "Ha ocurrido un error durante el inicio de sesión",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary to-background">
        <div className="text-center">
          <Car className="mx-auto h-12 w-12 text-primary animate-pulse" />
          <p className="mt-4 text-muted-foreground">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-secondary to-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-xl border border-border"
      >
        <div className="text-center">
          <Car className="mx-auto h-12 w-12 text-primary" />
          <h1 className="text-3xl font-bold mt-4 text-foreground">Opulent Auto Gallery</h1>
          <p className="text-muted-foreground">Acceso a la Plataforma</p>
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
            {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>
        </form>
        
        {/* Botón de Registro */}
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
          <p>Utiliza tu cuenta registrada para acceder a la plataforma</p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
