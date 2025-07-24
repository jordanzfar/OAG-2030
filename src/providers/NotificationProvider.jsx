import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationContext } from '@/context/NotificationContext';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import { buildNotificationDescription } from '@/lib/utils';

const NotificationProvider = ({ children }) => {
    const supabase = useSupabaseClient();
    const { user, userRole } = useAuth();
    const [notifications, setNotifications] = useState([]);

    // Cargar notificaciones iniciales del usuario
    useEffect(() => {
        const fetchInitialNotifications = async () => {
            if (!user) {
                setNotifications([]);
                return;
            }
            const { data } = await supabase
                .from('notifications')
                .select('*')
                .or(`user_id.eq.${user.id},target_role.eq.${userRole}`)
                .order('created_at', { ascending: false });
            setNotifications(data || []);
        };
        fetchInitialNotifications();
    }, [user, userRole]);

    const navigate = useNavigate();

    const handleNewNotification = useCallback((payload) => {
        const newNotification = payload.new;
        const description = buildNotificationDescription(newNotification);

        toast(newNotification.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), {
            description: description,
            action: { label: "Ver", onClick: () => navigate(newNotification.link || '/notifications') },
        });
        
        // Añadir la nueva notificación al principio de la lista
        setNotifications(prev => [newNotification, ...prev]);
    }, [navigate]);

    // Suscripción a eventos en tiempo real
    useEffect(() => {
    if (!user || !userRole) return;

    // ✅ AÑADE ESTE LOG para ver el rol del usuario actual
    console.log(`Rol de usuario actual: ${userRole}`);

    let filter;
    const adminRoles = ['admin', 'support', 'validation', 'finance'];
    if (adminRoles.includes(userRole)) {
        filter = `or=(target_role.eq.${userRole},user_id.eq.${user.id})`;
    } else {
        filter = `user_id=eq.${user.id}`;
    }
    const channelParams = {
            config: {
                websocket: true,
            },
        };
    // ✅ AÑADE ESTE OTRO LOG para ver el filtro que se está aplicando
    console.log(`Aplicando filtro de notificación: ${filter}`);

    const channel = supabase
            .channel(`notifications_channel_${user.id}`, channelParams) // ✅ Pasa los nuevos parámetros aquí
            .on(
                'postgres_changes', 
                { 
                    event: 'INSERT', 
                    schema: 'public', 
                    table: 'notifications', 
                    filter: filter 
                }, 
                handleNewNotification
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Canal de notificaciones conectado (WebSocket) con filtro: ${filter}`);
                }
            });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [user, userRole, handleNewNotification]);

    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    // ✅ Funciones para modificar el estado que expondremos en el contexto
    const updateNotificationStatus = async (notificationId, is_read) => {
        // Actualizar estado local inmediatamente para una UI fluida
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, is_read } : n)
        );
        // Actualizar en la base de datos en segundo plano
        await supabase.from('notifications').update({ is_read }).eq('id', notificationId);
    };

    const markAllAsRead = async () => {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (unreadIds.length > 0) {
            await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
        }
    };
    
    // ✅ Exponemos las notificaciones y las funciones para manipularlas
    const value = { notifications, unreadCount, updateNotificationStatus, markAllAsRead };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export default NotificationProvider;