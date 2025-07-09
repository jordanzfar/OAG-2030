import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, FileText, SearchCheck, FileBadge, Coins as HandCoins, Banknote, User, UploadCloud, MessageSquare, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase'; // Importamos supabase directamente para signOut
import { useToast } from '@/components/ui/use-toast';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget';
import logo from '@/assets/OPULENT-BRONZE.png';

const sidebarNavItems = [
    { title: "Panel Principal", href: "/dashboard", icon: LayoutDashboard },
    { title: "Inspecciones", href: "/dashboard/inspections", icon: FileText },
    { title: "TEST", href: "/dashboard/test", icon: FileText },
    { title: "Verificación VIN", href: "/dashboard/vin-check", icon: SearchCheck },
    { title: "Solicitar Puja", href: "/dashboard/auction", icon: HandCoins },
    { title: "Legalización", href: "/dashboard/legalization", icon: FileBadge },
    { title: "Power Buying", href: "/dashboard/power-buying", icon: HandCoins },
    { title: "Depósitos", href: "/dashboard/deposits", icon: Banknote },
    { title: "Documentos", href: "/dashboard/documents", icon: UploadCloud },
    { title: "Notificaciones", href: "/dashboard/notifications", icon: Bell },
    { title: "Perfil", href: "/dashboard/profile", icon: User },
    { title: "Chat", href: "/dashboard/chat", icon: MessageSquare },
    
];

const DashboardLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    // --- INICIO DE LA CORRECCIÓN 1 ---
    // Ya no necesitamos `logout` de useAuth, ni `signOut` del otro hook. Lo haremos directo.
    const { user, userProfile } = useAuth();

    // --- FIN DE LA CORRECCIÓN 1 ---


    // --- INICIO DE LA CORRECCIÓN 2 ---
    // Simplificamos la función handleLogout para que solo use el método de Supabase.
    const handleLogout = async () => {
        toast({
            title: "Cerrando sesión...",
        });
        
        // Llamamos directamente a la función signOut del cliente de Supabase.
        const { error } = await supabase.auth.signOut();
        
        // Navegamos al login independientemente de si hubo un error o no.
        navigate('/login', { replace: true });
        
        if (error) {
            toast({
                variant: "destructive",
                title: "Hubo un error",
                description: "No se pudo cerrar la sesión en el servidor, pero te hemos redirigido.",
            });
            console.error('Error during logout:', error);
        } else {
            toast({
                title: "Sesión cerrada",
                description: "Has cerrado sesión exitosamente.",
            });
        }
    };
    // --- FIN DE LA CORRECCIÓN ---


    return (
        <div className="flex min-h-screen flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center">
                            <img 
                                src={logo} 
                                alt="Opulent Auto Gallery Logo" 
                                className="h-12" 
                            />
                        </Link>

                    {/* Right side: Notifications & User */}
                    <div className="flex items-center space-x-4">
                        <NotificationsWidget />
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || 'Usuario'} />
                            <AvatarFallback>
                                {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
                {/* Sidebar */}
                <aside className="fixed top-16 z-30 -ml-2 hidden h-[calc(100vh-4rem)] w-full shrink-0 md:sticky md:block">
                    <ScrollArea className="h-full py-6 pr-6 lg:py-8">
                        <nav className="flex flex-col space-y-2">
                            {sidebarNavItems.map((item) => (
                                <Link
                                    key={item.href}
                                    to={item.href}
                                    className={cn(
                                        'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                                        location.pathname === item.href
                                            ? 'bg-accent text-accent-foreground'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.title}
                                </Link>
                            ))}
                        </nav>
                    </ScrollArea>
                </aside>

                {/* Main Content */}
                <main className="relative py-6 lg:py-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;