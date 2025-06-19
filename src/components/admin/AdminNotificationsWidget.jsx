import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, Users, FileText, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
// Importamos los hooks de Supabase
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const AdminNotificationsWidget = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isLoading: userLoading } = useSupabaseAuth(); // Necesitamos el usuario para filtrar
  const { fetchRecords, updateRecord } = useSupabaseData(); // Para cargar y marcar como leídas

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Solo cargar notificaciones si el estado de autenticación ha terminado de cargar
    // y si hay un usuario logueado (solo admins deberían ver este widget)
    if (!userLoading && user) {
      loadAdminNotificationsFromSupabase();
    } else if (!userLoading && !user) {
      // Si no hay usuario o no es admin, no cargamos y mostramos 0 notificaciones
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
    }
  }, [user, userLoading]); // Dependencias: user y userLoading

  const loadAdminNotificationsFromSupabase = async () => {
    setLoading(true);
    if (!user) { // Doble verificación para estar seguros
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    let allRelevantNotifications = [];

    try {
      // 1. Cargar notificaciones dirigidas específicamente a este admin
      // Este filtro es crucial para que el admin vea sus notificaciones personales
      const personalAdminResult = await fetchRecords('notifications', { user_id: user.id, is_read: false }, {
          orderBy: { column: 'created_at', ascending: false }
      });
      if (personalAdminResult.success && personalAdminResult.data) {
          allRelevantNotifications = [...personalAdminResult.data];
      } else if (personalAdminResult.error) {
          console.error("Error al cargar notificaciones personales para widget:", personalAdminResult.error);
      }

      // 2. Cargar notificaciones de sistema/globales para todos los administradores (sin user_id específico)
      // Solo si el usuario logueado realmente es un admin (puedes añadir una verificación de rol aquí si user.role existe)
      // Asume que las notificaciones de sistema tienen user_id: null y target_role: 'admin'
      const globalAdminResult = await fetchRecords('notifications', { user_id: null, target_role: 'admin', is_read: false }, {
          orderBy: { column: 'created_at', ascending: false }
      });
      if (globalAdminResult.success && globalAdminResult.data) {
          const combined = [...allRelevantNotifications, ...globalAdminResult.data];
          // Eliminar duplicados si una misma notificación pudiera coincidir con ambos criterios (aunque poco probable si user_id es null para global)
          const uniqueNotificationsMap = new Map(combined.map(item => [item.id, item]));
          allRelevantNotifications = Array.from(uniqueNotificationsMap.values());
      } else if (globalAdminResult.error) {
          console.error("Error al cargar notificaciones globales para widget:", globalAdminResult.error);
      }

      // Ordenar por fecha más reciente (las notificaciones más nuevas arriba)
      const sortedNotifications = allRelevantNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.filter(n => !n.is_read).length); // Recalcular no leídas del set relevante
      
    } catch (error) {
      console.error("Excepción en loadAdminNotificationsFromSupabase:", error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    // Marcar como leída en Supabase
    const result = await updateRecord('notifications', notificationId, {
      is_read: true
    });

    if (result.success) {
      // Actualizar el estado local
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
        setUnreadCount(updated.filter(n => !n.is_read).length);
        return updated;
      });
      toast({
        title: "Notificación marcada como leída",
        description: "El contador del widget se ha actualizado.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo marcar la notificación como leída en Supabase.",
      });
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_user': return <Users className="w-4 h-4 text-blue-500" />;
      case 'new_request': return <FileText className="w-4 h-4 text-green-500" />;
      case 'payment_pending': return <CreditCard className="w-4 h-4 text-yellow-500" />;
      case 'document_review': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'system_alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'verification_required': return <CheckCircle className="w-4 h-4 text-purple-500" />;
      // Asegúrate de que todos los tipos de notificaciones de cliente relevantes también estén aquí
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
                  <CardTitle className="text-lg">Notificaciones Admin</CardTitle>
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
                  <div className="p-4 text-center text-muted-foreground">
                    Cargando notificaciones...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No tienes notificaciones
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                          !notification.is_read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {!notification.is_read && (
                                <span className="w-2 h-2 bg-primary rounded-full"></span>
                              )}
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