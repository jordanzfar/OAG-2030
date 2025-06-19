import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, Users, FileText, CreditCard, Loader2 } from 'lucide-react'; // Añadido Loader2
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const AdminNotificationsWidget = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { user, isLoading: userLoading } = useSupabaseAuth();
    const { fetchRecords, updateRecord } = useSupabaseData(); // Cambiado a fetchRecords de tu hook

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userLoading && user) {
            loadAdminNotificationsFromSupabase();
        } else if (!userLoading && !user) {
            setLoading(false);
        }
    }, [user, userLoading]);

    // --- INICIO DE LA CORRECCIÓN ---
    // Simplificamos la carga de datos a una sola llamada a la API,
    // eliminando la dependencia de user.id y las dos llamadas separadas.
    const loadAdminNotificationsFromSupabase = async () => {
        setLoading(true);

        try {
            // Lógica corregida: Una sola consulta para todas las notificaciones de administradores.
            // Asumimos que todas las notificaciones para administradores tienen `target_role: 'admin'`.
            // Esto es más robusto y eficiente.
            const result = await fetchRecords('notifications', 
                { 
                    target_role: 'admin', // Trae notificaciones destinadas al rol de admin
                    is_read: false      // Solo las no leídas
                }, 
                {
                    orderBy: { column: 'created_at', ascending: false }
                }
            );

            if (result.success && result.data) {
                // Ordenamos por si acaso la BD no lo hizo perfectamente
                const sorted = result.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                setNotifications(sorted);
                setUnreadCount(sorted.length); // El conteo es simplemente la longitud del array resultante
            } else if (result.error) {
                throw new Error(result.error.message);
            }

        } catch (error) {
            console.error("Error al cargar notificaciones para widget:", error.message);
            toast({
                title: "Error de Widget",
                description: "No se pudieron cargar las notificaciones.",
                variant: "destructive"
            });
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };
    // --- FIN DE LA CORRECCIÓN ---


    const markAsRead = async (notificationId) => {
        const result = await updateRecord('notifications', notificationId, {
            is_read: true
        });

        if (result.success) {
            setNotifications(prev => {
                const updated = prev.filter(n => n.id !== notificationId); // La quitamos de la lista del widget
                setUnreadCount(updated.length);
                return updated;
            });
            toast({
                title: "Notificación marcada como leída",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo marcar la notificación como leída.",
            });
        }
    };

    // El resto de tus funciones (getNotificationIcon, formatTimeAgo, etc.) y tu JSX están perfectos.
    // No necesitan ningún cambio. Los incluyo debajo sin modificaciones.

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_user': return <Users className="w-4 h-4 text-blue-500" />;
            case 'new_request': return <FileText className="w-4 h-4 text-green-500" />;
            case 'payment_pending': return <CreditCard className="w-4 h-4 text-yellow-500" />;
            case 'document_review': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
            case 'system_alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'verification_required': return <CheckCircle className="w-4 h-4 text-purple-500" />;
            case 'payment_required': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'document_missing': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'status_update': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'info': return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Bell className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Ahora';
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
        return `${Math.floor(diffInMinutes / 1440)}d`;
    };

    const handleViewAllNotifications = () => {
        setShowDropdown(false);
        navigate('/admin/notifications');
    };

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => setShowDropdown(!showDropdown)}
            >
                <Bell className="h-5 w-5 text-foreground" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {showDropdown && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-12 z-50 w-80"
                    >
                        <Card className="bg-card border-border shadow-lg">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Notificaciones</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-4 h-24 flex items-center justify-center text-muted-foreground">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-4 h-24 flex items-center justify-center text-center text-muted-foreground">
                                        No tienes notificaciones nuevas.
                                    </div>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.slice(0, 5).map((notification) => (
                                            <div
                                                key={notification.id}
                                                className="p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                                onClick={() => markAsRead(notification.id)}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    {getNotificationIcon(notification.type)}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-foreground">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center mt-1 space-x-2">
                                                            <Clock className="w-3 h-3 text-muted-foreground" />
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTimeAgo(notification.created_at)}
                                                            </span>
                                                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {notifications.length > 5 && (
                                            <div className="p-3 text-center text-sm text-muted-foreground border-b border-border">
                                                Y {notifications.length - 5} notificaciones más...
                                            </div>
                                        )}
                                    </div>
                                )}
                                {notifications.length > 0 && (
                                    <div className="p-3 border-t border-border">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-primary"
                                        onClick={handleViewAllNotifications}
                                    >
                                        Ver todas las notificaciones
                                    </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminNotificationsWidget;