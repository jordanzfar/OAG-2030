import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from '@/components/ui/use-toast';

export const useAdminStats = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
const supabase = useSupabaseClient();
  // Get dashboard statistics
  const getDashboardStats = async () => {
    setLoading(true);
    try {
      // Get counts for different entities using Promise.all for better performance
      const [
        usersResult,
        inspectionsResult,
        legalizationsResult,
        powerBuyingResult,
        vinChecksResult,
        documentsResult,
        messagesResult,
        depositsResult
      ] = await Promise.all([
        supabase.from('users_profile').select('*', { count: 'exact', head: true }),
        supabase.from('inspections').select('*', { count: 'exact', head: true }),
        supabase.from('legalizations').select('*', { count: 'exact', head: true }),
        supabase.from('power_buying_requests').select('*', { count: 'exact', head: true }),
        supabase.from('vin_check_logs').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('chat_messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'pending')
      ]);

      // Calculate total requests from all sources
      const totalRequests = (inspectionsResult.count || 0) + 
                           (legalizationsResult.count || 0) + 
                           (powerBuyingResult.count || 0) + 
                           (vinChecksResult.count || 0);

      // Get revenue data
      const { data: confirmedDeposits } = await supabase
        .from('deposits')
        .select('amount, created_at')
        .eq('status', 'confirmed');

      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const monthlyRevenue = (confirmedDeposits || [])
        .filter(deposit => new Date(deposit.created_at) >= thisMonth)
        .reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);

      return {
        success: true,
        data: {
          totalUsers: usersResult.count || 0,
          totalRequests: totalRequests,
          pendingDocuments: documentsResult.count || 0,
          unreadMessages: messagesResult.count || 0,
          pendingDeposits: depositsResult.count || 0,
          monthlyRevenue
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        variant: "destructive",
        title: "Error al cargar estadísticas",
        description: error.message,
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getDashboardStats
  };
};