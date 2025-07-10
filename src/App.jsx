import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// 🔥 --- SECCIÓN DE IMPORTACIONES CORREGIDA --- 🔥
// Se apunta a las nuevas rutas de los providers y hooks.
import AuthProvider from '@/providers/AuthProvider';
import NotificationProvider from '@/providers/NotificationProvider'; // Se añade la importación que faltaba
import { useAuth } from '@/hooks/useAuth';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from '@/components/ui/toaster';

// Layouts
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminLayout from '@/components/layouts/AdminLayout';

// (El resto de tus importaciones de páginas no cambia)
import LoginPage from '@/pages/LoginPage';
import RegistrationPage from '@/pages/RegistrationPage';
import NotFoundPage from '@/pages/NotFoundPage';
import DashboardPage from '@/pages/DashboardPage';
import InspectionsPage from '@/pages/dashboard/InspectionsPage';
import TestPage from '@/pages/dashboard/TestPage';
import VinCheckPage from '@/pages/dashboard/VinCheckPage';
import LegalizationPage from '@/pages/dashboard/LegalizationPage';
import PowerBuyingPage from '@/pages/dashboard/PowerBuyingPage';
import DepositsPage from '@/pages/dashboard/DepositsPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import DocumentsPage from '@/pages/dashboard/DocumentsPage';
import ChatPage from '@/pages/dashboard/ChatPage';
import NotificationsPage from '@/pages/dashboard/NotificationsPage';
import AuctionPage from '@/pages/dashboard/AuctionPage';
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


// --- Componente para Proteger Rutas (Sin cambios) ---
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, userRole, loading } = useAuth(); // Se añade 'loading' para más robustez

    // Mientras el contexto principal está cargando, mostramos un loader.
    // Esto evita parpadeos si se accede a una ruta protegida directamente.
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Verificando...</p></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Si está autenticado, pero el rol aún no se carga (poco probable con la nueva arq.)
    if (!userRole) {
        return <div className="flex justify-center items-center h-screen"><p>Cargando perfil...</p></div>;
    }

    if (allowedRoles && !allowedRoles.includes(userRole)) {
        const redirectTo = userRole === 'client' ? '/dashboard' : '/admin';
        return <Navigate to={redirectTo} replace />;
    }
    return children;
};

// --- Componente de Página de Inicio (Sin cambios) ---
const HomePage = () => {
    const { isAuthenticated, userRole, loading } = useAuth();
    
    if (loading) {
        return <div className="flex justify-center items-center h-screen"><p>Iniciando...</p></div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!userRole) {
        return <div className="flex justify-center items-center h-screen"><p>Cargando perfil...</p></div>;
    }

    const redirectTo = userRole === 'client' ? '/dashboard' : '/admin';
    return <Navigate to={redirectTo} replace />;
};


// --- Componente Principal de la Aplicación (Sin cambios en la estructura) ---
function App() {
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.add('dark');
    }, []);

    return (
        <Router>
            <AuthProvider>
                <NotificationProvider>
                    <TooltipProvider>
                        <div className="min-h-screen bg-background font-sans antialiased">
                            <Routes>
                                {/* ... Tu estructura de rutas no necesita cambios ... */}
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegistrationPage />} />
                                <Route path="/" element={<HomePage />} />
                                <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['client']}><DashboardLayout /></ProtectedRoute>}>
                                    <Route index element={<DashboardPage />} />
                                    <Route path="inspections" element={<InspectionsPage />} />
                                    <Route path="test" element={<TestPage />} />
                                    <Route path="vin-check" element={<VinCheckPage />} />
                                    <Route path="legalization" element={<LegalizationPage />} />
                                    <Route path="power-buying" element={<PowerBuyingPage />} />
                                    <Route path="deposits" element={<DepositsPage />} />
                                    <Route path="profile" element={<ProfilePage />} />
                                    <Route path="documents" element={<DocumentsPage />} />
                                    <Route path="chat" element={<ChatPage />} />
                                    <Route path="notifications" element={<NotificationsPage />} />
                                    <Route path="auction" element={<AuctionPage />} />
                                </Route>
                                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin', 'support', 'validation', 'finance']}><AdminLayout /></ProtectedRoute>}>
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
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                            <Toaster />
                        </div>
                    </TooltipProvider>
                </NotificationProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;