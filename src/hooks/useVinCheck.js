import { useState, useEffect, useCallback } from 'react';
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

    // --- AÑADIDO INDISPENSABLE: Estados para el pre-chequeo del VIN ---
    const [decoding, setDecoding] = useState(false);
    const [decodedData, setDecodedData] = useState([]);


    const loadCredits = useCallback(async () => {
        if (!user) return;
        
        const { data, error } = await supabase
            .from('users_profile')
            .select('vin_credits')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error("Error al cargar créditos:", error);
            toast({
                variant: "destructive",
                title: "Error al cargar créditos",
                description: error.message,
            });
            return;
        }

        setVinCredits(data?.vin_credits ?? 0);
    }, [user, toast]);

    const loadVinHistory = useCallback(async () => {
        if (!user) return;
        setHistoryLoading(true);
        try {
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
    }, [user, toast]);

    useEffect(() => {
        if (user) {
            loadCredits();
            loadVinHistory();
        } else {
            setHistoryLoading(false);
        }
    }, [user, loadCredits, loadVinHistory]);
    
    // --- AÑADIDO INDISPENSABLE: Funciones para el pre-chequeo del VIN ---

    // Función para limpiar los datos del vehículo decodificado
    const resetDecoder = useCallback(() => {
        setDecodedData([]);
    }, []);

    // Función que llama a tu Supabase Edge Function para decodificar el VIN
    const decodeVinWithFunction = useCallback(async (vin) => {
        if (!vin || vin.length !== 17) {
            resetDecoder();
            return;
        }
        setDecoding(true);
        resetDecoder(); // Limpia resultados anteriores
        try {
            const { data, error } = await supabase.functions.invoke('vpic-decode-vin', {
                body: { vin },
            });
            if (error) throw error;
            if (data.results) {
                setDecodedData(data.results);
            }
        } catch (error) {
            console.error("Error al decodificar VIN:", error);
            toast({
                variant: "destructive",
                title: "Error de Decodificación",
                description: "No se pudo obtener la información del vehículo. Inténtalo de nuevo.",
            });
            resetDecoder();
        } finally {
            setDecoding(false);
        }
    }, [supabase, toast, resetDecoder]);


    const consumeCredit = async () => {
        if (!user || vinCredits === null || vinCredits <= 0) return false;
        const { error } = await supabase
            .from('users_profile')
            .update({ vin_credits: vinCredits - 1 })
            .eq('user_id', user.id);

        if (error) {
            console.error("Error al consumir crédito:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo actualizar tu saldo de créditos." });
            return false;
        }
        setVinCredits(prev => prev - 1);
        return true;
    };

    const handleCheckVin = async (vin) => {
        if (!user || vinCredits === null) return;
        if (vinCredits <= 0) {
            setShowNoCreditModal(true);
            return;
        }
        setIsLoading(true);
        setReportData(null);
        try {
            const { error } = await supabase.from('vin_check_logs').insert([{ vin, user_id: user.id, status: 'pending', credits_used: 1, result: null }]);
            if (error) throw error;

            const creditConsumed = await consumeCredit();
            if (!creditConsumed) return;

            if (vinCredits - 1 <= LOW_CREDIT_THRESHOLD) {
                setShowLowCreditAlert(true);
            }
            toast({ title: "Solicitud Enviada", description: `Tu solicitud para el VIN ${vin} ha sido registrada.` });
            loadVinHistory(); // Recarga el historial
        } catch (error) {
            console.error("Error al enviar solicitud VIN:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo enviar la solicitud. Inténtalo de nuevo." });
        } finally {
            setIsLoading(false);
        }
    };

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
        // --- AÑADIDO INDISPENSABLE: Exportar nuevas variables y funciones ---
        decoding,
        decodedData,
        decodeVinWithFunction,
        resetDecoder,
    };
};