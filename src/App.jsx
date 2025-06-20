import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from 'react-router-dom';

// Cliente de Supabase
import { supabase } from '@/lib/supabase'; // Asegúrate de que esta ruta sea la correcta para tu cliente

// Páginas de Autenticación
import LoginPage from '@/pages/LoginPage';
import RegistrationPage from '@/pages/RegistrationPage';

// Layouts
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminLayout from '@/components/layouts/AdminLayout';

// Páginas de Cliente
import DashboardPage from '@/pages/DashboardPage';
import InspectionsPage from '@/pages/dashboard/InspectionsPage';
import VinCheckPage from '@/pages/dashboard/VinCheckPage';
import LegalizationPage from '@/pages/dashboard/LegalizationPage';
import PowerBuyingPage from '@/pages/dashboard/PowerBuyingPage';
import DepositsPage from '@/pages/dashboard/DepositsPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import DocumentsPage from '@/pages/dashboard/DocumentsPage';
import ChatPage from '@/pages/dashboard/ChatPage';
import NotificationsPage from '@/pages/dashboard/NotificationsPage';
import AuctionPage from '@/pages/dashboard/AuctionPage';


// Páginas de Admin
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminRequestsPage from '@/pages/admin/AdminRequestsPage';
import AdminDocumentsPage from '@/pages/admin/AdminDocumentsPage';
import AdminChatListPage from '@/pages/admin/AdminChatListPage';
import AdminChatInstancePage from '@/pages/admin/AdminChatInstancePage';
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminStatsPage from '@/pages/admin/AdminStatsPage';
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage';
import AdminFinancePage from '@/pages/admin/AdminFinancePage';
import AdminVerificationPage from '@/pages/admin/AdminVerificationPage';
import AdminNotificationsPage from '@/pages/admin/AdminNotificationsPage';

// Componentes y Páginas Genéricas
import NotFoundPage from '@/pages/NotFoundPage';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from "@/components/ui/use-toast"; // CORRECCIÓN: Importación correcta
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { TooltipProvider } from "@/components/ui/tooltip";

// --- Componente Oyente para Manejar la Autenticación Globalmente ---
const AuthHandler = () => {
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            // Este evento se dispara cuando Supabase intenta refrescar el token y falla.
            // Si falla, la 'session' que devuelve es null.
            if (event === 'TOKEN_REFRESHED' && !session) {
                console.error("Token de sesión inválido. Se requiere iniciar sesión de nuevo.");
                toast({
                    title: "Tu sesión ha expirado",
                    description: "Por favor, inicia sesión de nuevo para continuar.",
                    variant: "destructive",
                });
                // Forzar el cierre de sesión y redirigir al login.
                supabase.auth.signOut();
                navigate('/login');
            }
        });

        // Limpiar el listener cuando el componente se desmonte.
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [navigate, toast]);

    // Este componente no renderiza nada visible.
    return null;
};

// --- Componente para Proteger Rutas ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, userRole, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        const redirectTo = userRole === 'client' ? '/dashboard' : '/admin';
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

// --- Componente para la Redirección Inicial ---
const InitialRedirect = () => {
    const { isAuthenticated, userRole, isLoading } = useAuth();

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><p>Cargando...</p></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const redirectTo = userRole === 'client' ? '/dashboard' : '/admin';
    return <Navigate to={redirectTo} replace />;
};

// --- Componente Principal de la Aplicación ---
function App() {

    // ====================================================================
    // --- INICIO DEL CÓDIGO AÑADIDO PARA FORZAR EL MODO OSCURO ---
    // ====================================================================
    useEffect(() => {
        const root = window.document.documentElement;

        // 1. Añade la clase 'dark' a la etiqueta <html>
        root.classList.add('dark');

        // 2. (Opcional) Elimina la clase 'light' si existiera
        root.classList.remove('light');
    
    // El array de dependencias vacío `[]` asegura que este efecto
    // se ejecute solo una vez, cuando la aplicación se monta por primera vez.
    }, []);
    // ====================================================================
    // --- FIN DEL CÓDIGO AÑADIDO ---
    // ====================================================================


    return (
        <Router>
            <AuthProvider>
                <TooltipProvider>
                    {/* El AuthHandler vive aquí para escuchar eventos en toda la app */}
                    <AuthHandler />
                    <div className="min-h-screen bg-background font-sans antialiased">
                        <Routes>
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/register" element={<RegistrationPage />} />

                            {/* Rutas Protegidas del Dashboard del Cliente */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute allowedRoles={['client']}>
                                        <DashboardLayout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<DashboardPage />} />
                                <Route path="inspections" element={<InspectionsPage />} />
                                <Route path="vin-check" element={<VinCheckPage />} />
                                <Route path="legalization" element={<LegalizationPage />} />
                                <Route path="power-buying" element={<PowerBuyingPage />} />
                                <Route path="deposits" element={<DepositsPage />} />
                                <Route path="profile" element={<ProfilePage />} />
                                <Route path="documents" element={<DocumentsPage />} />
                                <Route path="chat" element={<ChatPage />} />
                                <Route path="notifications" element={<NotificationsPage />} />
                                <Route path="deposits" element={<DepositsPage />} />
                                <Route path="auction" element={<AuctionPage />} />
                            </Route>

                            {/* Rutas Protegidas del Panel de Administración */}
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute allowedRoles={['admin', 'support', 'validation', 'finance']}>
                                        <AdminLayout />
                                    </ProtectedRoute>
                                }
                            >
                               <Route index element={<AdminDashboardPage />} />
                               <Route path="requests" element={<AdminRequestsPage />} />
                               <Route path="documents" element={<AdminDocumentsPage />} />
                               <Route path="chat" element={<AdminChatListPage />} />
                               <Route path="chat/:clientId" element={<AdminChatInstancePage />} />
                               <Route path="payments" element={<AdminPaymentsPage />} />
                               <Route path="users" element={<AdminUsersPage />} />
                               <Route path="stats" element={<AdminStatsPage />} />
                               <Route path="settings" element={<AdminSettingsPage />} />
                               <Route path="finance" element={<AdminFinancePage />} />
                               <Route path="verification" element={<AdminVerificationPage />} />
                               <Route path="notifications" element={<AdminNotificationsPage />} />
                            </Route>

                            {/* Redirección inicial */}
                               <Route path="/" element={<InitialRedirect />} />

                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                        <Toaster />
                    </div>
                </TooltipProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;