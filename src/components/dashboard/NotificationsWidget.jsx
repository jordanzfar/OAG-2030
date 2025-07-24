import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle, AlertTriangle, Info, Clock, DollarSign, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { /*...,*/ ShieldCheck, ShieldAlert } from 'lucide-react';

// Importaciones clave: traemos los hooks y utilidades que necesitamos.
import { useNotifications } from '@/hooks/useNotifications';
import { buildNotificationDescription } from '@/lib/utils';

const NotificationsWidget = () => {
  const navigate = useNavigate();
  
  // Conectamos al estado global: esta es ahora nuestra ÚNICA fuente de verdad.
  const { notifications, unreadCount, updateNotificationStatus } = useNotifications();

  // Mantenemos solo el estado local para controlar la visibilidad del dropdown.
  const [showDropdown, setShowDropdown] = useState(false);

  // La lógica de 'marcar como leída' ahora usa la función del contexto.
  const handleNotificationClick = (notification) => {
    // Primero, marca como leída si no lo está.
    if (!notification.is_read) {
      updateNotificationStatus(notification.id, true);
    }
    // Luego, navega al link correspondiente.
    if (notification.link) {
      navigate(notification.link);
    }
    // Cierra el dropdown.
    setShowDropdown(false);
  };

  const handleViewAllNotifications = () => {
    setShowDropdown(false);
    navigate('/dashboard/notifications');
  };

  // --- Funciones de Ayuda para la UI ---

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

const getNotificationIcon = (notification) => {
    switch (notification.type) {
        case 'payment_required': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
        case 'document_missing': return <AlertTriangle className="w-4 h-4 text-red-500" />;
        case 'inspection_status_update': { 
                  const status = notification.metadata?.status; 
                  switch (status) {
                    case 'completed':
                      return <CheckCircle className="w-4 h-4 text-green-500" />;
                    case 'pending_payment':
                      return <DollarSign className="w-4 h-4 text-yellow-500" />;
                    case 'scheduled':
                      return <Clock className="w-4 h-4 text-blue-500" />;
                    case 'cancelled':
                      return <XCircle className="w-4 h-4 text-red-500" />;
                    default:
                      return <CheckCircle className="w-4 h-4 text-green-500" />;
                  }
                }
        case 'new_inspection': return <Info className="w-4 h-4 text-blue-500" />;
        case 'vin_check_completed': return <ShieldCheck className="w-4 h-4 text-green-500" />;
        case 'vin_check_failed': return <ShieldAlert className="w-4 h-4 text-red-500" />;

    default:
      return <Bell className="w-4 h-4 text-muted-foreground" />;
  }
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
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDropdown(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">No tienes notificaciones</div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${!notification.is_read ? 'bg-primary/5' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                         {getNotificationIcon(notification)}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm ${!notification.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                              {buildNotificationDescription(notification)}
                            </p>
                            <div className="flex items-center mt-1 space-x-2">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>
                              {!notification.is_read && (<span className="w-2 h-2 bg-primary rounded-full"></span>)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="p-2 border-t border-border">
                  <Button variant="ghost" size="sm" className="w-full text-primary" onClick={handleViewAllNotifications}>
                    Ver todas las notificaciones
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsWidget;