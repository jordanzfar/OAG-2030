import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info, Clock, Bell, Search, Filter, BookMarked as MarkAsUnread, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const NotificationsPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const { fetchRecords, updateRecord } = useSupabaseData();
    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    // ====================================================================
    // --- INICIO DE LA CORRECCIÓN ---
    // ====================================================================

    // 1. Estabilizamos la función de carga
    const loadNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const result = await fetchRecords('notifications', { user_id: user.id }, {
            orderBy: { column: 'created_at', ascending: false }
        });

        if (result.success) {
            setNotifications(result.data || []);
        }
    }, [user, fetchRecords]);

    // 2. Creamos un useEffect robusto para la carga inicial
    useEffect(() => {
        const runLoad = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            await loadNotifications();
            setLoading(false);
        };
        runLoad();
    }, [user, loadNotifications]);

    // 3. Creamos un useEffect separado para los filtros, que reacciona a los cambios.
    useEffect(() => {
        let filtered = [...notifications];
        if (searchTerm) {
            filtered = filtered.filter(n => n.message.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (filterType !== 'all') {
            filtered = filtered.filter(n => n.type === filterType);
        }
        if (filterStatus === 'unread') {
            filtered = filtered.filter(n => !n.is_read);
        } else if (filterStatus === 'read') {
            filtered = filtered.filter(n => n.is_read);
        }
        setFilteredNotifications(filtered);
    }, [notifications, searchTerm, filterType, filterStatus]);

  const markAsRead = async (notificationId) => {
    const result = await updateRecord('notifications', notificationId, {
      is_read: true
    });

    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      toast({
        title: "Notificación marcada como leída",
        description: "La notificación ha sido marcada como leída exitosamente."
      });
    }
  };

  const markAsUnread = async (notificationId) => {
    const result = await updateRecord('notifications', notificationId, {
      is_read: false
    });

    if (result.success) {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
      );

      toast({
        title: "Notificación marcada como no leída",
        description: "La notificación ha sido marcada como no leída exitosamente."
      });
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.is_read);
    
    const updatePromises = unreadNotifications.map(notification =>
      updateRecord('notifications', notification.id, { is_read: true })
    );

    await Promise.all(updatePromises);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

    toast({
      title: "Todas las notificaciones marcadas como leídas",
      description: "Se han marcado todas las notificaciones como leídas exitosamente."
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'payment_required':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'document_missing':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'status_update':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeBadge = (type) => {
    switch (type) {
      case 'payment_required':
        return <Badge variant="destructive">Pago Requerido</Badge>;
      case 'document_missing':
        return <Badge variant="destructive">Documento Faltante</Badge>;
      case 'status_update':
        return <Badge variant="default">Actualización</Badge>;
      case 'info':
        return <Badge variant="secondary">Información</Badge>;
      default:
        return <Badge variant="outline">General</Badge>;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getUnreadCount = () => {
    return notifications.filter(n => !n.is_read).length;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Cargando notificaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Todas las Notificaciones</h1>
          <p className="text-muted-foreground">
            Gestiona y revisa todas tus notificaciones. {getUnreadCount() > 0 && `Tienes ${getUnreadCount()} notificaciones sin leer.`}
          </p>
        </div>
        {getUnreadCount() > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar todas como leídas
          </Button>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <Card className="bg-card border-border shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Filtra y busca notificaciones específicas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar notificaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="payment_required">Pago Requerido</SelectItem>
                <SelectItem value="document_missing">Documento Faltante</SelectItem>
                <SelectItem value="status_update">Actualización</SelectItem>
                <SelectItem value="info">Información</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="unread">No leídas</SelectItem>
                <SelectItem value="read">Leídas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de notificaciones */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card className="bg-card border-border shadow-lg">
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all' || filterStatus !== 'all' 
                  ? 'No se encontraron notificaciones que coincidan con los filtros aplicados.'
                  : 'No tienes notificaciones en este momento.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`bg-card border-border shadow-lg hover:shadow-xl transition-shadow ${
                  !notification.is_read ? 'ring-2 ring-primary/20' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {getNotificationTypeBadge(notification.type)}
                            {!notification.is_read && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                Nuevo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => notification.is_read ? markAsUnread(notification.id) : markAsRead(notification.id)}
                            >
                              {notification.is_read ? (
                                <>
                                  <MarkAsUnread className="w-4 h-4 mr-1" />
                                  Marcar como no leída
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Marcar como leída
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className={`text-sm mb-3 ${
                          !notification.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDateTime(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Estadísticas */}
      {notifications.length > 0 && (
        <Card className="bg-card border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{notifications.length}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{getUnreadCount()}</div>
                <div className="text-sm text-muted-foreground">Sin leer</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {notifications.filter(n => n.is_read).length}
                </div>
                <div className="text-sm text-muted-foreground">Leídas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {notifications.filter(n => n.type === 'status_update').length}
                </div>
                <div className="text-sm text-muted-foreground">Actualizaciones</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotificationsPage;