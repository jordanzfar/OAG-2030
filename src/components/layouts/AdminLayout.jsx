import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/components/ui/use-toast';
import AdminNotificationsWidget from '@/components/admin/AdminNotificationsWidget';
import { NotificationProvider, useNotifications } from '@/context/NotificationContext.jsx';
import { LogOut, LayoutDashboard, FileStack, FileCheck2, MessageSquare, Banknote, Users, BarChart2, Settings, Bell, DollarSign, Shield, ClipboardCheck, SearchCheck, Gavel } from 'lucide-react';

const SidebarNav = () => {
    const location = useLocation();
    const { userRole } = useAuth();
    const { unreadMessageCount } = useNotifications();

    const adminSidebarNavItems = [
        { title: "Panel General", href: "/admin", icon: LayoutDashboard, roles: ['admin', 'support', 'validation', 'finance'] },
        { title: "Solicitudes", href: "/admin/requests", icon: FileStack, roles: ['admin', 'support', 'validation'] },
        { title: "Inspecciones", href: "/admin/inspections", icon: ClipboardCheck, roles: ['admin', 'support', 'validation'] },
        { title: "VIN Checks", href: "/admin/vin-requests", icon: SearchCheck, roles: ['admin', 'support'] },
        { title: "Pujas de Subasta", href: "/admin/auction-bids", icon: Gavel, roles: ['admin', 'finance', 'support'] },
        { title: "Legalizaciones", href: "/admin/legalizations", icon: FileCheck2, roles: ['admin', 'validation'] },
        { title: "Compras de Poder", href: "/admin/power-buying", icon: DollarSign, roles: ['admin', 'finance'] },
        { title: "KYC", href: "/admin/users", icon: Users, roles: ['admin'] },
        { title: "Depositos", href: "/admin/deposits", icon: Users, roles: ['admin', 'finance'] },

        { title: "Documentos", href: "/admin/documents", icon: FileCheck2, roles: ['admin', 'validation'] },
        { title: "Chat", href: "/admin/chat", icon: MessageSquare, roles: ['admin', 'support'], notificationCount: unreadMessageCount },
       // { title: "Pagos", href: "/admin/payments", icon: Banknote, roles: ['admin', 'finance'] },
       // { title: "Finanzas", href: "/admin/finance", icon: DollarSign, roles: ['admin', 'finance'] },
        //{ title: "Verificaciones", href: "/admin/verification", icon: Shield, roles: ['admin', 'validation'] },
        { title: "Notificaciones", href: "/admin/notifications", icon: Bell, roles: ['admin', 'support', 'validation', 'finance'] },
       // { title: "Estadísticas", href: "/admin/stats", icon: BarChart2, roles: ['admin'] },
        //{ title: "Configuración", href: "/admin/settings", icon: Settings, roles: ['admin'] },
    ];

    const accessibleNavItems = userRole ? adminSidebarNavItems.filter(item => item.roles.includes(userRole)) : [];

    return (
        <nav className="flex flex-col space-y-2 p-4">
            {accessibleNavItems.map((item) => (
                <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                        'flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                        location.pathname.startsWith(item.href) && (location.pathname === item.href || item.href !== '/admin')
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                    )}
                >
                    <div className="flex items-center">
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.title}
                    </div>
                    {item.notificationCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                            {item.notificationCount}
                        </span>
                    )}
                </Link>
            ))}
        </nav>
    );
};

const AdminLayout = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { signOut, userProfile } = useSupabaseAuth(); 
    
    const handleLogout = async () => {
        toast({ title: "Cerrando sesión..." });
        const { error } = await signOut();
        if (error) {
            toast({ variant: "destructive", title: "Error al cerrar sesión", description: error.message });
        } else {
            navigate('/login', { replace: true });
            toast({ title: "Sesión cerrada", description: "Has cerrado sesión exitosamente." });
        }
    };

    return (
        <NotificationProvider>
            <div className="flex h-screen max-h-screen bg-background">
                <aside className="hidden md:block w-64 flex-shrink-0 border-r">
                    <ScrollArea className="h-full">
                        <SidebarNav />
                    </ScrollArea>
                </aside>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="flex-shrink-0 border-b">
                        <div className="container flex h-16 items-center justify-between">
                            <Link to="/admin" className="flex items-center space-x-2">
                                <span className="font-bold text-foreground">Opulent Auto - Admin</span>
                            </Link>
                            <div className="flex items-center space-x-4">
                                <AdminNotificationsWidget />
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || 'Admin'} />
                                    <AvatarFallback>{userProfile?.full_name?.charAt(0) || 'A'}</AvatarFallback>
                                </Avatar>
                                <Button variant="ghost" size="icon" onClick={handleLogout}>
                                    <LogOut className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                                </Button>
                            </div>
                        </div>
                    </header>
                    
                    {/* ✅ INICIO DE CAMBIOS: Se añade la clase de padding "p-6" */}
                    <main className="flex-1 relative overflow-y-auto p-6">
                    {/* ✅ FIN DE CAMBIOS */}
                        <AnimatePresence mode="wait">
                            <motion.div 
                                key={useLocation().pathname} 
                                initial={{ opacity: 0, y: 10 }} 
                                animate={{ opacity: 1, y: 0 }} 
                                exit={{ opacity: 0, y: -10 }} 
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                <Outlet />
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
            </div>
        </NotificationProvider>
    );
};

export default AdminLayout;