
import React, { useState, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {LogOut, LayoutDashboard, FileText, SearchCheck, FileBadge, Coins as HandCoins, Banknote, User,UploadCloud, MessageSquare, Bell, PanelLeft, PanelRight } from 'lucide-react';import { useToast } from '@/components/ui/use-toast';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget';
import logo from '@/assets/OPULENT-BRONZE.png';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';

const sidebarNavItems = [
    { title: "Inicio", href: "/dashboard", icon: LayoutDashboard },
    { title: "Inspecciones Vehiculares", href: "/dashboard/inspections", icon: FileText },
    { title: "Verificación VIN", href: "/dashboard/vin-check", icon: SearchCheck },
    { title: "Subastas", href: "/dashboard/auction", icon: HandCoins },
    { title: "Legalizaciones", href: "/dashboard/legalization", icon: FileBadge },
    { title: "Poder de Compra", href: "/dashboard/power-buying", icon: HandCoins },
    { title: "Gestión de Depósitos", href: "/dashboard/deposits", icon: Banknote },
    { title: "Verificación de Usuario", href: "/dashboard/verification", icon: User },
    { title: "Centro de Mensajes", href: "/dashboard/chat", icon: MessageSquare },
   // title: "Gestión de Documentos", href: "/dashboard/documents", icon: UploadCloud },
    { title: "Notificaciones", href: "/dashboard/notifications", icon: Bell },
    { title: "Mi Perfil", href: "/dashboard/profile", icon: User },

];

const SidebarNav = ({ isCollapsed }) => {
    const location = useLocation();
    return (
        <nav className="flex flex-col gap-1 px-2">
            {sidebarNavItems.map((item) => (
                <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                        'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
                        location.pathname === item.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground',
                        isCollapsed && 'justify-center' // Centra el ícono cuando está colapsado
                    )}
                >
                    <item.icon className={cn('h-5 w-5', !isCollapsed && 'mr-3')} />
                    <AnimatePresence>
                        {!isCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="whitespace-nowrap"
                            >
                                {item.title}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </Link>
            ))}
        </nav>
    );
};

const DashboardLayout = () => {
    const supabase = useSupabaseClient();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    // --- INICIO DE LA CORRECCIÓN 1 ---
    // Ya no necesitamos `logout` de useAuth, ni `signOut` del otro hook. Lo haremos directo.
    const { user, userProfile } = useAuth();
    // MODIFICADO: El sidebar ahora empieza colapsado por defecto.
    const [isCollapsed, setIsCollapsed] = useState(true);
    
    // NUEVO: Usamos una referencia para manejar el temporizador del retraso.
    const timerRef = useRef(null);

    // NUEVO: Funciones para manejar el hover con retraso.
    const handleMouseEnter = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setIsCollapsed(false);
    };

 const handleMouseLeave = () => {
        timerRef.current = setTimeout(() => {
            setIsCollapsed(true);
        }, 300); // 300ms de retraso antes de colapsar
    };

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
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            {/* INICIO: Sidebar de escritorio (visible en md y superior) */}
            <motion.aside
                // NUEVO: Eventos de mouse para controlar el estado
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                
                // MODIFICADO: Clases para el efecto Glassmorphism
                className="hidden md:fixed md:inset-y-0 md:z-50 md:flex md:flex-col border-r border-border/20 bg-background/80 backdrop-blur-xl"
                
                initial={false}
                animate={{ width: isCollapsed ? 80 : 240 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {/* El botón ya no controla el estado, solo es un indicador visual */}
                <div className="flex h-16 items-center justify-between border-b border-border/20 px-4">
                    <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
                        {!isCollapsed && <img src={logo} alt="Logo" className="h-10" />}
                    </Link>
                    {/* MODIFICADO: El botón ahora es solo un ícono visual */}
                    <div className="h-9 w-9 flex items-center justify-center">
                        {isCollapsed ? <PanelRight className="h-5 w-5 text-muted-foreground" /> : <PanelLeft className="h-5 w-5 text-muted-foreground" />}
                    </div>
                </div>
                <ScrollArea className="flex-1 py-4">
                    <SidebarNav isCollapsed={isCollapsed} />
                </ScrollArea>
                <div className="mt-auto border-t border-border/20 p-4">
                    <Button variant="ghost" className="w-full" onClick={handleLogout}>
                         <div className={cn('flex items-center', isCollapsed && "justify-center w-full")}>
                           <LogOut className={cn('h-5 w-5', !isCollapsed && "mr-3")} />
                           {!isCollapsed && <span className="whitespace-nowrap">Cerrar Sesión</span>}
                         </div>
                    </Button>
                </div>
            </motion.aside>
            {/* FIN: Sidebar de escritorio */}

            <div className={cn('flex flex-col sm:gap-4 sm:py-4', isCollapsed ? 'md:pl-[80px]' : 'md:pl-[240px]', 'transition-all duration-300 ease-in-out')}>
                {/* ... El resto de tu layout (header móvil, main content) no necesita cambios ... */}
                {/* INICIO: Header para móvil */}
                <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 md:justify-end">
                    {/* Botón de menú para móvil (Sheet) */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button size="icon" variant="outline" className="md:hidden">
                                <PanelLeft className="h-5 w-5" />
                                <span className="sr-only">Toggle Menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-64 bg-background/80 backdrop-blur-xl border-r-border/20">
                             {/* Mostramos el logo y el nombre en el menú móvil */}
                             <div className="flex h-16 items-center border-b border-border/20 px-4">
                                <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
                                    <img src={logo} alt="Logo" className="h-10" />
                                </Link>
                             </div>
                            {/* Reutilizamos la navegación aquí */}
                            <SidebarNav isCollapsed={false} />
                        </SheetContent>
                    </Sheet>
                    
                    <Link to="/dashboard" className="flex items-center md:hidden">
                        <img src={logo} alt="Opulent Logo" className="h-10" />
                    </Link>

                    {/* Lado derecho: Notificaciones y Usuario */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        <NotificationsWidget />
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || 'Usuario'} />
                            <AvatarFallback>
                                {userProfile?.full_name ? userProfile.full_name.charAt(0).toUpperCase() : 'U'}
                            </AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className='md:hidden'>
                             <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        </Button>
                    </div>
                </header>
                {/* FIN: Header para móvil */}

                {/* Main Content */}
                <main className="flex-1 p-4 sm:px-6 sm:py-0 md:gap-8">
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