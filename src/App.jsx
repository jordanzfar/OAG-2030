import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import RegistrationPage from '@/pages/RegistrationPage'; // Import Registration Page
import DashboardLayout from '@/components/layouts/DashboardLayout';
import AdminLayout from '@/components/layouts/AdminLayout';
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

import NotFoundPage from '@/pages/NotFoundPage';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { TooltipProvider } from "@/components/ui/tooltip"; // Import TooltipProvider

// Updated ProtectedRoute to use context and handle loading state
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

// Updated InitialRedirect to use context and handle loading state
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

// Main App component wrapped with AuthProvider and TooltipProvider
function App() {
  return (
    <Router>
      <AuthProvider>
        <TooltipProvider> {/* Wrap with TooltipProvider */}
          <div className="min-h-screen bg-background font-sans antialiased">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegistrationPage />} /> {/* Add Registration Route */}

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