import { useAdminQueries } from '@/hooks/useAdminQueries';
import { useAdminActions } from '@/hooks/useAdminActions';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useSupabaseData } from '@/hooks/useSupabaseData';

export const useAdminData = () => {
  // Import all functionality from specialized hooks
  const queries = useAdminQueries();
  const actions = useAdminActions();
  const stats = useAdminStats();
  const { fetchRecords } = useSupabaseData();

  // Fetch all users (simple query, no joins needed)
  const fetchAllUsers = async () => {
    const result = await fetchRecords('users_profile', {}, {
      orderBy: { column: 'created_at', ascending: false }
    });
    return result;
  };

  // Combine loading states
  const loading = queries.loading || actions.loading || stats.loading;

  return {
    loading,
    // Query functions
    fetchAllRequests: queries.fetchAllRequests,
    fetchAllDocuments: queries.fetchAllDocuments,
    fetchAllUsers,
    fetchAllDeposits: queries.fetchAllDeposits,
    fetchChatMessages: queries.fetchChatMessages,
    // Action functions
    updateRequestStatus: actions.updateRequestStatus,
    updateDocumentStatus: actions.updateDocumentStatus,
    updateDepositStatus: actions.updateDepositStatus,
    updateUserVerification: actions.updateUserVerification,
    sendAdminMessage: actions.sendAdminMessage,
    // Stats functions
    getDashboardStats: stats.getDashboardStats
  };
};