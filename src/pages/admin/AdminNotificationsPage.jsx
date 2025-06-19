import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Info, Clock, Bell, Search, Users, FileText, CreditCard, BookMarked as MarkAsUnread, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const AdminNotificationsPage = () => {
    const { toast } = useToast();
    const { user, isLoading: userLoading } = useSupabaseAuth();
    const { fetchRecords, updateRecord, deleteRecord } = useSupabaseData();

    const [notifications, setNotifications] = useState([]);
    const [filteredNotifications, setFilteredNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (!userLoading && user) {
            loadNotifications();
        } else if (!userLoading && !user) {
            setLoading(false);
        }
    }, [user, userLoading]);

    useEffect(() => {
        filterNotifications();
    }, [notifications, searchTerm, filterType, filterStatus]);

    const loadNotifications = async () => {
        setLoading(true);
        if (!user) {
            setLoading(false);
            return;
        }

        // --- INICIO DE LA CORRECCIÓN ---
        // Se asume que esta página solo es accesible para administradores.
        // Por lo tanto, traemos TODAS las notificaciones, no solo las de un admin específico.
        // Esto soluciona el error de "uuid null" y alinea la lógica con el caso de uso de un panel de admin global.

        // ANTES (Causa del error):
        // const result = await fetchRecords('notifications', { user_id: user.id }, { orderBy: { column: 'created_at', ascending: false } });
        
        // AHORA (Corregido):
        const result = await fetchRecords('notifications', {}, {
            orderBy: { column: 'created_at', ascending: false }
        });
        // --- FIN DE LA CORRECCIÓN ---


        if (result.success) {
            setNotifications(result.data || []);
        } else {
            console.error("Error al cargar notificaciones de administrador:", result.error);
            toast({
                title: "Error al cargar notificaciones",
                description: result.error?.message || "Ocurrió un error al cargar las notificaciones.",
                variant: "destructive"
            });
            setNotifications([]);
        }
        setLoading(false);
    };

    const filterNotifications = () => {
        let filtered = [...notifications];

        // Filtrar por término de búsqueda
        if (searchTerm) {
            filtered = filtered.filter(notification =>
                notification.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtrar por tipo
        if (filterType !== 'all') {
            filtered = filtered.filter(notification => notification.type === filterType);
        }

        // Filtrar por estado de lectura
        if (filterStatus === 'unread') {
            filtered = filtered.filter(notification => !notification.is_read);
        } else if (filterStatus === 'read') {
            filtered = filtered.filter(notification => notification.is_read);
        }

        setFilteredNotifications(filtered);
    };

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
        } else {
            toast({
                title: "Error",
                description: "No se pudo marcar la notificación como leída.",
                variant: "destructive"
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
        } else {
            toast({
                title: "Error",
                description: "No se pudo marcar la notificación como no leída.",
                variant: "destructive"
            });
        }
    };

    const markAllAsRead = async () => {
        const unreadNotifications = notifications.filter(n => !n.is_read);
        if(unreadNotifications.length === 0) return;

        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

        const updatePromises = unreadNotifications.map(notification =>
            updateRecord('notifications', notification.id, { is_read: true })
        );

        const results = await Promise.all(updatePromises);
        
        const failedUpdates = results.filter(r => !r.success);
        if (failedUpdates.length > 0) {
            toast({
                title: "Advertencia",
                description: `Algunas notificaciones no pudieron ser marcadas como leídas.`,
                variant: "destructive" // Changed to destructive for clarity
            });
            // Opcional: Revertir el estado local para las que fallaron
            loadNotifications();
        } else {
            toast({
                title: "Todas las notificaciones marcadas como leídas",
                description: "Se han marcado todas las notificaciones como leídas exitosamente."
            });
        }
    };

    const deleteNotification = async (notificationId) => {
        // Optimistic UI update
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        const result = await deleteRecord('notifications', notificationId);

        if (result.success) {
            toast({
                title: "Notificación eliminada",
                description: "La notificación ha sido eliminada exitosamente."
            });
        } else {
            // Revert on failure
            setNotifications(originalNotifications);
            toast({
                title: "Error",
                description: "No se pudo eliminar la notificación.",
                variant: "destructive"
            });
        }
    };

    // --- El resto de tu componente (funciones de UI, JSX) permanece sin cambios ---
    // (He omitido el resto del JSX por brevedad, ya que es idéntico y correcto)
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_user': return <Users className="w-5 h-5 text-blue-500" />;
            case 'new_request': return <FileText className="w-5 h-5 text-green-500" />;
            case 'payment_pending': return <CreditCard className="w-5 h-5 text-yellow-500" />;
            case 'document_review': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'system_alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'verification_required': return <CheckCircle className="w-5 h-5 text-purple-500" />;
            case 'payment_required': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case 'document_missing': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'status_update': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'info': return <Info className="w-5 h-5 text-blue-500" />;
            default: return <Bell className="w-5 h-5 text-muted-foreground" />;
        }
    };
 
    const getNotificationTypeBadge = (type) => {
        switch (type) {
            case 'new_user': return <Badge variant="default">Nuevo Usuario</Badge>;
            case 'new_request': return <Badge variant="default">Nueva Solicitud</Badge>;
            case 'payment_pending': return <Badge variant="destructive">Pago Pendiente</Badge>;
            case 'document_review': return <Badge variant="secondary">Revisión Documento</Badge>;
            case 'system_alert': return <Badge variant="destructive">Alerta Sistema</Badge>;
            case 'verification_required': return <Badge variant="secondary">Verificación Requerida</Badge>;
            case 'payment_required': return <Badge variant="destructive">Pago Requerido Cliente</Badge>;
            case 'document_missing': return <Badge variant="destructive">Documento Cliente Faltante</Badge>;
            case 'status_update': return <Badge variant="default">Actualización Cliente</Badge>;
            case 'info': return <Badge variant="secondary">Información Cliente</Badge>;
            default: return <Badge variant="outline">General</Badge>;
        }
    };
 
    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };
 
    const getUnreadCount = () => {
        return notifications.filter(n => !n.is_read).length;
    };
 
    if (loading || userLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Cargando notificaciones administrativas...</p>
                </div>
            </div>
        );
    }
 
    if (!user) {
        return (
            <div className="space-y-6">
                <Card className="bg-card border-border shadow-lg">
                    <CardContent className="p-8 text-center">
                        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Acceso Denegado</h3>
                        <p className="text-muted-foreground">
                            Necesitas iniciar sesión como administrador para ver las notificaciones.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }
 
    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <div>
                     <h1 className="text-3xl font-bold text-foreground">Notificaciones Administrativas</h1>
                     <p className="text-muted-foreground">
                         Gestiona y revisa todas las notificaciones del sistema. {getUnreadCount() > 0 && `Tienes ${getUnreadCount()} notificaciones sin leer.`}
                     </p>
                 </div>
                 {getUnreadCount() > 0 && (
                     <Button onClick={markAllAsRead} variant="outline">
                         <CheckCircle className="w-4 h-4 mr-2" />
                         Marcar todas como leídas
                     </Button>
                 )}
             </div>
 
             <Card className="bg-card border-border shadow-lg">
                 <CardHeader>
                     <CardTitle className="text-lg">Filtros</CardTitle>
                     <CardDescription>Filtra y busca notificaciones específicas del sistema</CardDescription>
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
                                 <SelectItem value="new_user">Nuevo Usuario</SelectItem>
                                 <SelectItem value="new_request">Nueva Solicitud</SelectItem>
                                 <SelectItem value="payment_pending">Pago Pendiente</SelectItem>
                                 <SelectItem value="document_review">Revisión Documento</SelectItem>
                                 <SelectItem value="system_alert">Alerta Sistema</SelectItem>
                                 <SelectItem value="verification_required">Verificación Requerida</SelectItem>
                                 <SelectItem value="payment_required">Pago Requerido Cliente</SelectItem>
                                 <SelectItem value="document_missing">Documento Cliente Faltante</SelectItem>
                                 <SelectItem value="status_update">Actualización Cliente</SelectItem>
                                 <SelectItem value="info">Información Cliente</SelectItem>
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
 
             <div className="space-y-4">
                 {filteredNotifications.length === 0 ? (
                     <Card className="bg-card border-border shadow-lg">
                         <CardContent className="p-8 text-center">
                             <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                             <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
                             <p className="text-muted-foreground">
                                 {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                                     ? 'No se encontraron notificaciones que coincidan con los filtros aplicados.'
                                     : 'No tienes notificaciones administrativas en este momento.'
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
                                 <Card className={`bg-card border-border shadow-lg hover:shadow-xl transition-shadow ${!notification.is_read ? 'ring-2 ring-primary/20' : ''}`}>
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
                                                                 <><MarkAsUnread className="w-4 h-4 mr-1" />Marcar como no leída</>
                                                             ) : (
                                                                 <><CheckCircle className="w-4 h-4 mr-1" />Marcar como leída</>
                                                             )}
                                                         </Button>
                                                         <Button
                                                             variant="ghost"
                                                             size="sm"
                                                             onClick={() => deleteNotification(notification.id)}
                                                             className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                         >
                                                             <Trash2 className="w-4 h-4 mr-1" />
                                                             Eliminar
                                                         </Button>
                                                     </div>
                                                 </div>
                                                 <p className={`text-sm mb-3 ${!notification.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
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
 
             {notifications.length > 0 && (
                 <Card className="bg-card border-border shadow-lg">
                     <CardHeader>
                         <CardTitle className="text-lg">Estadísticas Administrativas</CardTitle>
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
                                     {notifications.filter(n => n.type === 'new_user').length}
                                 </div>
                                 <div className="text-sm text-muted-foreground">Nuevos Usuarios</div>
                             </div>
                         </div>
                     </CardContent>
                 </Card>
             )}
         </div>
     );
};

export default AdminNotificationsPage;