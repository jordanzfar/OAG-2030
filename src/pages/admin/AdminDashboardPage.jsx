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
import RealtimeDepositsTable from '@/components/admin/RealtimeDepositsTable';

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
  }, []);

  const loadDashboardData = async () => {
    // Load dashboard statistics
    const statsResult = await getDashboardStats();
    if (statsResult.success) {
      setStats(statsResult.data);
    }

    // Load data based on user role
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

  const handleRequestStatusUpdate = async (requestId, type, newStatus) => {
    const result = await updateRequestStatus(requestId, type, newStatus);
    if (result.success) {
      // Refresh requests data
      const requestsResult = await fetchAllRequests();
      if (requestsResult.success) {
        setRequests(requestsResult.data);
      }
      // Refresh stats
      const statsResult = await getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    }
  };

  const handleDocumentStatusUpdate = async (documentId, newStatus, rejectionReason = null) => {
    const result = await updateDocumentStatus(documentId, newStatus, rejectionReason);
    if (result.success) {
      // Refresh documents data
      const documentsResult = await fetchAllDocuments();
      if (documentsResult.success) {
        setDocuments(documentsResult.data);
      }
      // Refresh stats
      const statsResult = await getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    }
  };

  const handleDepositStatusUpdate = async (depositId, newStatus) => {
    const result = await updateDepositStatus(depositId, newStatus);
    if (result.success) {
      // Refresh deposits data
      const depositsResult = await fetchAllDeposits();
      if (depositsResult.success) {
        setDeposits(depositsResult.data);
      }
      // Refresh stats
      const statsResult = await getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
      }
    }
  };

  const handleUserVerificationUpdate = async (userId, verificationStatus) => {
    // La firma ahora es más simple, solo userId y verificationStatus.
    // El 'buyingPower' ya no es necesario aquí.
    const result = await updateUserVerification(userId, verificationStatus);
    if (result.success) {
      // Tu lógica de refresco de datos (¡está perfecta!)
      const usersResult = await fetchAllUsers();
      if (usersResult.success) {
        setUsers(usersResult.data);
      }
      const statsResult = await getDashboardStats();
      if (statsResult.success) {
        setStats(statsResult.data);
       }
    }
  };

  // Filter tabs based on user role
  const getAvailableTabs = () => {
    const tabs = [
      { value: 'overview', label: 'Resumen General', roles: ['admin', 'support', 'validation', 'finance'] }
    ];

    if (userRole === 'admin' || userRole === 'support' || userRole === 'validation') {
      tabs.push({ value: 'requests', label: 'Solicitudes', roles: ['admin', 'support', 'validation'] });
    }

    if (userRole === 'admin' || userRole === 'validation') {
      tabs.push({ value: 'documents', label: 'Documentos', roles: ['admin', 'validation'] });
    }

    if (userRole === 'admin') {
      tabs.push({ value: 'users', label: 'Usuarios', roles: ['admin'] });
    }

    if (userRole === 'admin' || userRole === 'finance') {
      tabs.push({ value: 'deposits', label: 'Depósitos', roles: ['admin', 'finance'] });
    }

    return tabs.filter(tab => tab.roles.includes(userRole));
  };

  const availableTabs = getAvailableTabs();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Dashboard de Administración
        </h1>
        <p className="text-muted-foreground">
          Gestión completa del sistema en tiempo real con Supabase
        </p>
      </div>

      {/* Statistics Cards */}
      <AdminStatsCards stats={stats} loading={loading} />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
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
                <CardDescription>Últimas acciones en el sistema</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {requests.slice(0, 5).map((request) => (
                    <div key={request.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{request.client_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Nueva solicitud de {request.type === 'inspection' ? 'inspección' : 
                          request.type === 'legalization' ? 'legalización' : 
                          request.type === 'power_buying' ? 'power buying' : 'VIN check'}
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
                <CardDescription>Métricas clave de rendimiento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Solicitudes Procesadas Hoy</span>
                    <span className="font-semibold">{requests.filter(r => 
                      new Date(r.created_at).toDateString() === new Date().toDateString()
                    ).length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Documentos Aprobados</span>
                    <span className="font-semibold">{documents.filter(d => d.status === 'approved').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Usuarios Verificados</span>
                    <span className="font-semibold">{users.filter(u => u.verification_status === 'verified').length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Depósitos Confirmados</span>
                    <span className="font-semibold">{deposits.filter(d => d.status === 'confirmed').length}</span>
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
            />
          </TabsContent>
        )}

        {(userRole === 'admin' || userRole === 'finance') && (
          <TabsContent value="users">
            {/* ✅ CORREGIDO: Se pasa la prop onDocumentViewRequest */}
            <RealtimeUsersTable 
              users={users}
              loading={loading}
              onVerificationUpdate={handleUserVerificationUpdate}
              onDocumentViewRequest={getDocumentDownloadUrl}
            />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
};

export default AdminDashboardPage;