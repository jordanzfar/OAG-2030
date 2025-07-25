import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAdminData } from '@/hooks/useAdminData';
import AdminStatsCards from '@/components/admin/AdminStatsCards';
import RealtimeRequestsTable from '@/components/admin/RealtimeRequestsTable';
import RealtimeDocumentsTable from '@/components/admin/RealtimeDocumentsTable';
import RealtimeUsersTable from '@/components/admin/RealtimeUsersTable';
import DepositsTable from '@/components/admin/DepositsTable';
import AdminDepositsPage from './AdminDepositsPage';

const AdminDashboardPage = () => {
  const { userRole } = useAuth();
  const {
    loading,
    fetchAllRequests,
    fetchAllDocuments,
    fetchAllUsers,
    fetchAllDeposits,
    updateRequestStatus,
    updateDocumentStatus,
    updateDepositStatus,
    updateUserVerification,
    getDashboardStats,
    getDocumentDownloadUrl
  } = useAdminData();

  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [users, setUsers] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, [userRole]); // Recargar si el rol del usuario cambia

  const loadDashboardData = async () => {
    if (!userRole) return; // No hacer nada si el rol aún no se ha cargado

    // Cargar estadísticas del dashboard
    const statsResult = await getDashboardStats();
    if (statsResult.success) {
      setStats(statsResult.data);
    }

    // Cargar datos basados en el rol del usuario
    if (userRole === 'admin' || userRole === 'support' || userRole === 'validation') {
      const requestsResult = await fetchAllRequests();
      if (requestsResult.success) {
        setRequests(requestsResult.data);
      }
    }

    if (userRole === 'admin' || userRole === 'validation') {
      const documentsResult = await fetchAllDocuments();
      if (documentsResult.success) {
        setDocuments(documentsResult.data);
      }
    }

    if (userRole === 'admin') {
      const usersResult = await fetchAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }
    }

    if (userRole === 'admin' || userRole === 'finance') {
      const depositsResult = await fetchAllDeposits();
      if (depositsResult.success) {
        setDeposits(depositsResult.data);
      }
    }
  };

  const handleDataUpdate = async (updateAction, ...args) => {
    const result = await updateAction(...args);
    if (result.success) {
      // Recargar todos los datos para mantener la consistencia en todo el dashboard
      loadDashboardData();
    }
  };
  
  // Handlers que usan la función centralizada
  const handleRequestStatusUpdate = (requestId, type, newStatus) => 
    handleDataUpdate(updateRequestStatus, requestId, type, newStatus);
  
  const handleDocumentStatusUpdate = (documentId, newStatus, rejectionReason = null) => 
    handleDataUpdate(updateDocumentStatus, documentId, newStatus, rejectionReason);

  const handleDepositStatusUpdate = (depositId, newStatus) => 
    handleDataUpdate(updateDepositStatus, depositId, newStatus);

  const handleUserVerificationUpdate = (userId, verificationStatus) => 
    handleDataUpdate(updateUserVerification, userId, verificationStatus);

  const getAvailableTabs = () => {
    if (!userRole) return [];
    const allTabs = [
      { value: 'overview', label: 'Resumen General', roles: ['admin', 'support', 'validation', 'finance'] },
      { value: 'requests', label: 'Solicitudes', roles: ['admin', 'support', 'validation'] },
      { value: 'documents', label: 'Documentos', roles: ['admin', 'validation'] },
      { value: 'users', label: 'Usuarios', roles: ['admin'] },
      { value: 'deposits', label: 'Depósitos', roles: ['admin', 'finance'] },
    ];
    return allTabs.filter(tab => tab.roles.includes(userRole));
  };

  const availableTabs = getAvailableTabs();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard de Administración
        </h1>
        <p className="text-muted-foreground">
          Gestión completa del sistema en tiempo real.
        </p>
      </div>

      <AdminStatsCards stats={stats} loading={loading} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {availableTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimas solicitudes recibidas en el sistema.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{request.client_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Nueva solicitud de {request.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Estado del Sistema</CardTitle>
                <CardDescription>Métricas clave de rendimiento.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Solicitudes Pendientes</span>
                    <span className="font-semibold">{stats?.pendingRequests ?? '...'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Documentos en Revisión</span>
                    <span className="font-semibold">{stats?.pendingDocuments ?? '...'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Usuarios por Verificar</span>
                    <span className="font-semibold">{stats?.unverifiedUsers ?? '...'}</span>
                  </div>
                   <div className="flex justify-between items-center">
                    <span className="text-sm">Depósitos por Confirmar</span>
                    <span className="font-semibold">{stats?.pendingDeposits ?? '...'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {(userRole === 'admin' || userRole === 'support' || userRole === 'validation') && (
          <TabsContent value="requests">
            <RealtimeRequestsTable 
              requests={requests}
              loading={loading}
              onStatusUpdate={handleRequestStatusUpdate}
            />
          </TabsContent>
        )}

        {(userRole === 'admin' || userRole === 'validation') && (
          <TabsContent value="documents">
            <RealtimeDocumentsTable 
              documents={documents}
              loading={loading}
              onStatusUpdate={handleDocumentStatusUpdate}
            />
          </TabsContent>
        )}

        {userRole === 'admin' && (
          <TabsContent value="users">
            <RealtimeUsersTable 
              users={users}
              loading={loading}
              onVerificationUpdate={handleUserVerificationUpdate}
              onDocumentViewRequest={getDocumentDownloadUrl}
            />
          </TabsContent>
        )}

        {(userRole === 'admin' || userRole === 'finance') && (
          <TabsContent value="deposits">
            <AdminDepositsPage
              deposits={deposits}
              loading={loading}
              onStatusUpdate={handleDepositStatusUpdate}
            />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};

export default AdminDashboardPage;