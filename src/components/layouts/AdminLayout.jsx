
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, LayoutDashboard, FileStack, FileCheck2, MessageSquare, Banknote, Users, BarChart2, Settings, Bell, DollarSign, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/components/ui/use-toast';
import AdminNotificationsWidget from '@/components/admin/AdminNotificationsWidget';

const adminSidebarNavItems = [
    { title: "Panel General", href: "/admin", icon: LayoutDashboard, roles: ['admin', 'support', 'validation', 'finance'] },
    { title: "Solicitudes", href: "/admin/requests", icon: FileStack, roles: ['admin', 'support', 'validation'] },
    { title: "Documentos", href: "/admin/documents", icon: FileCheck2, roles: ['admin', 'validation'] },
    { title: "Chat", href: "/admin/chat", icon: MessageSquare, roles: ['admin', 'support'] },
    { title: "Pagos", href: "/admin/payments", icon: Banknote, roles: ['admin', 'finance'] },
    { title: "Finanzas", href: "/admin/finance", icon: DollarSign, roles: ['admin', 'finance'] },
    { title: "Verificaciones", href: "/admin/verification", icon: Shield, roles: ['admin', 'validation'] },
    { title: "Notificaciones", href: "/admin/notifications", icon: Bell, roles: ['admin', 'support', 'validation', 'finance'] },
    { title: "Usuarios", href: "/admin/users", icon: Users, roles: ['admin'] },
    { title: "Estadísticas", href: "/admin/stats", icon: BarChart2, roles: ['admin'] },
    { title: "Configuración", href: "/admin/settings", icon: Settings, roles: ['admin'] },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, userRole } = useAuth();
  const { signOut, user, userProfile } = useSupabaseAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Sign out from Supabase
      const result = await signOut();
      
      if (result.success) {
        // Clear local auth state
        logout();
        
        // Navigate to login
        navigate('/login', { replace: true });
        
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión exitosamente.",
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        variant: "destructive",
        title: "Error al cerrar sesión",
        description: "Hubo un problema al cerrar la sesión.",
      });
    }
  };

  // Filter sidebar items based on user role
  const accessibleNavItems = userRole ? adminSidebarNavItems.filter(item => item.roles.includes(userRole)) : [];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/admin" className="flex items-center space-x-2">
             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <path d="M12 18l-3-3 3-3 3 3-3 3z"></path>
             </svg>
            <span className="font-bold text-foreground">Opulent Auto - Admin</span>
          </Link>

          {/* Right side: Notifications & User */}
          <div className="flex items-center space-x-4">
             <AdminNotificationsWidget />
             <Avatar className="h-8 w-8">
                <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name || 'Admin'} />
                <AvatarFallback>
                  {userRole ? userRole.charAt(0).toUpperCase() : 'A'}
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
              {accessibleNavItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    location.pathname.startsWith(item.href) && (location.pathname === item.href || item.href !== '/admin')
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

export default AdminLayout;
