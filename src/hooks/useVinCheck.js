import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

const LOW_CREDIT_THRESHOLD = 2;

export const useVinCheck = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [vinCredits, setVinCredits] = useState(null);
  const [showLowCreditAlert, setShowLowCreditAlert] = useState(false);
  const [showNoCreditModal, setShowNoCreditModal] = useState(false);
  const [vinHistory, setVinHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Cargar créditos desde Supabase
  const loadCredits = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('users_profile')
      .select('vin_credits')
      .eq('user_id', user.id) // Cambia a 'id' si tu campo se llama así
      .maybeSingle();

    console.log('loadCredits data:', data);
    console.log('loadCredits error:', error);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error al cargar créditos",
        description: error.message,
      });
      return;
    }

    setVinCredits(data?.vin_credits ?? 0);
  };

  // Consumir un crédito y actualizar en Supabase
  const consumeCredit = async () => {
    if (!user || vinCredits === null || vinCredits <= 0) return false;

    const { error } = await supabase
      .from('users_profile')
      .update({ vin_credits: vinCredits - 1 })
      .eq('user_id', user.id); // Igual, cambia a 'id' si usas otro campo

    if (error) {
      console.error("Error al consumir crédito:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar tu saldo de créditos.",
      });
      return false;
    }

    setVinCredits(vinCredits - 1);
    return true;
  };

  // Cargar historial de verificaciones del usuario
  const loadVinHistory = async () => {
    if (!user) return;

    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('vin_check_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setVinHistory(data || []);
    } catch (error) {
      console.error("Error al cargar historial VIN:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cargar el historial de verificaciones.",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  // Solicitar verificación de VIN
  const handleCheckVin = async (vin) => {
    if (!user || vinCredits === null) return;

    if (vinCredits <= 0) {
      setShowNoCreditModal(true);
      return;
    }

    setIsLoading(true);
    setReportData(null);

    try {
      const { error } = await supabase
        .from('vin_check_logs')
        .insert([
          {
            vin,
            user_id: user.id,
            status: 'pending',
            credits_used: 1,
            result: null,
          },
        ]);

      if (error) throw error;

      const creditConsumed = await consumeCredit();
      if (!creditConsumed) return;

      if (vinCredits - 1 <= LOW_CREDIT_THRESHOLD) {
        setShowLowCreditAlert(true);
      }

      toast({
        title: "Solicitud Enviada",
        description: `Tu solicitud de verificación para el VIN ${vin} ha sido registrada.`,
      });

      loadVinHistory();
    } catch (error) {
      console.error("Error al enviar solicitud VIN:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo enviar la solicitud. Inténtalo de nuevo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadCredits();
      loadVinHistory();
    }
  }, [user]);

  return {
    isLoading,
    reportData,
    vinCredits,
    showLowCreditAlert,
    showNoCreditModal,
    vinHistory,
    historyLoading,
    handleCheckVin,
    loadCredits,
    loadVinHistory,
    setShowLowCreditAlert,
    setShowNoCreditModal,
    LOW_CREDIT_THRESHOLD,
  };
};
