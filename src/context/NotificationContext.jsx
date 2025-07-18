import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const supabase = useSupabaseClient();

    const { user } = useSupabaseAuth();
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);

    // Esta función no cambia, sigue siendo perfecta para la carga inicial.
    const fetchUnreadMessages = useCallback(async () => {
        if (!user) {
            setUnreadMessageCount(0); // Resetea el contador si no hay usuario
            return;
        }
        
        const { count, error } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setUnreadMessageCount(count || 0);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            // Carga el conteo inicial al entrar a la app.
            fetchUnreadMessages();

            // ✅ Se ha mejorado la suscripción para que escuche INSERTS y UPDATES.
            const channel = supabase
                .channel('realtime-admin-notifications')
                .on(
                    'postgres_changes',
                    // Escuchamos cualquier evento ('*') en la tabla de mensajes.
                    { event: '*', schema: 'public', table: 'chat_messages' },
                    (payload) => {
                        // Verificamos si el cambio nos afecta como receptores.
                        const record = payload.new.receiver_id ? payload.new : payload.old;
                        if (record.receiver_id === user.id) {
                            // En lugar de sumar o restar, simplemente volvemos a contar.
                            // Esto es más robusto y evita errores de sincronización.
                            fetchUnreadMessages();
                        }
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [user, fetchUnreadMessages]);

    // El valor proporcionado por el contexto no necesita cambios.
    const value = {
        unreadMessageCount,
        // Esta función podría ser útil en otros lugares si quieres un reseteo manual.
        clearMessageNotifications: () => setUnreadMessageCount(0), 
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Este hook para usar el contexto no necesita cambios.
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
    }
    return context;
};