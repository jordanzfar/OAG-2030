import React, { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';
import RealtimeUsersTable from '@/components/admin/RealtimeUsersTable';

const AdminUsersPage = () => {
  const { fetchAllUsers, updateUserVerification, loading } = useAdminData();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const result = await fetchAllUsers();
    if (result.success) {
      setUsers(result.data);
    }
  };

  const handleVerificationUpdate = async (userId, verificationStatus, buyingPower = null) => {
    const result = await updateUserVerification(userId, verificationStatus, buyingPower);
    if (result.success) {
      // Refresh the users list
      await loadUsers();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">
          Gestiona verificaciones y poder de compra de usuarios en tiempo real
        </p>
      </div>

      <RealtimeUsersTable 
        users={users}
        loading={loading}
        onVerificationUpdate={handleVerificationUpdate}
      />
    </div>
  );
};

export default AdminUsersPage;