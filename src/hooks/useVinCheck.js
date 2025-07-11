import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

export const useVinCheck = () => {
  const ITEMS_PER_PAGE = 3; 
  
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [vinCredits, setVinCredits] = useState(0);
  const [showLowCreditAlert, setShowLowCreditAlert] = useState(false);
  const [vinHistory, setVinHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [decoding, setDecoding] = useState(false);
  const [decodedData, setDecodedData] = useState([]);

  // Carga del historial con paginación
  const loadVinHistory = useCallback(async (page = 1) => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_paginated_vin_history', {
        p_user_id: user.id,
        p_page_number: page,
        p_page_size: ITEMS_PER_PAGE
      });
      if (error) throw error;
      setVinHistory(data || []);
      if (data && data.length > 0) {
        setTotalPages(Math.ceil(data[0].total_records / ITEMS_PER_PAGE));
      } else {
        setTotalPages(0);
      }
      setCurrentPage(page);
    } catch (error) {
      console.error("Error al cargar historial VIN:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo cargar el historial." });
    } finally {
      setHistoryLoading(false);
    }
  }, [user, toast]);

  // Carga de créditos
  const loadCredits = useCallback(async () => {
      if (!user) return;
      const { data, error } = await supabase.from('users_profile').select('vin_credits').eq('user_id', user.id).single();
      if (!error) {
          setVinCredits(data?.vin_credits ?? 0);
      }
  }, [user]);

  // Efecto inicial
  useEffect(() => {
    if (user) {
      loadCredits();
      loadVinHistory(1);
    }
  }, [user, loadCredits, loadVinHistory]);


  // Funciones de decodificación de VIN
  const resetDecoder = useCallback(() => setDecodedData([]), []);

  const decodeVinWithFunction = useCallback(async (vin) => {
    if (!vin || vin.length !== 17) return;
    setDecoding(true);
    resetDecoder();
    try {
        const { data, error } = await supabase.functions.invoke('vpic-decode-vin', { body: { vin } });
        if (error) throw error;
        setDecodedData(data.results || []);
    } catch (error) {
        console.error("Error al decodificar VIN:", error);
        toast({ variant: "destructive", title: "Error de Decodificación", description: "No se pudo obtener la información." });
        resetDecoder();
    } finally {
        setDecoding(false);
    }
  }, [toast, resetDecoder]);

  // Función para enviar la solicitud
  const handleCheckVin = async (vin) => {
    if (!user || vinCredits <= 0) {
        toast({ variant: "destructive", title: "Sin Créditos", description: "No tienes créditos suficientes." });
        return;
    }
    setIsLoading(true);
    try {
        await supabase.from('vin_check_logs').insert([{ vin, user_id: user.id, status: 'pending' }]);
        await supabase.rpc('decrement_vin_credits', { user_id_param: user.id, amount: 1 });
        toast({ title: "Solicitud Enviada", description: `Tu solicitud para el VIN ${vin} ha sido registrada.` });
        await loadCredits();
        await loadVinHistory();
    } catch (error) {
        console.error("Error al enviar solicitud VIN:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la solicitud." });
    } finally {
        setIsLoading(false);
    }
  };

  return {
    isLoading,
    vinCredits,
    showLowCreditAlert,
    vinHistory,
    historyLoading,
    handleCheckVin,
    decoding,
    decodedData,
    decodeVinWithFunction,
    resetDecoder,
    currentPage,
    totalPages,
    loadVinHistory,
  };
};