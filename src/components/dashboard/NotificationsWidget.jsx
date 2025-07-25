import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bell, X, Clock } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { buildNotificationDescription, getNotificationCategory, getNotificationIcon, getNotificationColor } from '@/lib/utils';
import { Icon } from "@/components/ui/Icon";

const NotificationsWidget = () => {
  const navigate = useNavigate();
  const { notifications, unreadCount, updateNotificationStatus } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      updateNotificationStatus(notification.id, true);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    setShowDropdown(false);
  };

  const handleViewAllNotifications = () => {
    setShowDropdown(false);
    navigate('/dashboard/notifications');
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
                    {notifications.slice(0, 5).map((notification) => {
                      const category = getNotificationCategory(notification.type);
                      const iconName = getNotificationIcon(notification);
                      const iconColor = getNotificationColor(notification);

                      return (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors duration-150 ${!notification.is_read ? 'bg-muted/30' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start space-x-3">
                            <Icon name={iconName} className={`w-5 h-5 mt-0.5 ${iconColor}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
                                  {category}
                                </span>
                                {!notification.is_read && (
                                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                                    Nuevo
                                  </span>
                                )}
                              </div>
                              <p className={`text-sm ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {buildNotificationDescription(notification)}
                              </p>
                              <div className="flex items-center mt-1.5 space-x-2">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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