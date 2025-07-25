import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

// --- Iconos (solo los usados directamente en el template) ---
import { Bell, Search, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Hooks y Utilidades CENTRALIZADAS ---
import { useNotifications } from '@/hooks/useNotifications';
import { getNotificationCategory, buildNotificationDescription, getNotificationIcon, getNotificationColor } from '@/lib/utils';
import { Icon } from '@/components/ui/Icon';


const NotificationsPage = () => {
    const { notifications, unreadCount, updateNotificationStatus, markAllAsRead } = useNotifications();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const NOTIFICATIONS_PER_PAGE = 10;

    const availableCategories = useMemo(() => {
        const categories = new Set(notifications.map(n => getNotificationCategory(n.type)));
        return Array.from(categories).sort();
    }, [notifications]);

    const filteredNotifications = useMemo(() => {
        return notifications.filter(n => {
            const category = getNotificationCategory(n.type);
            const matchesCategory = filterCategory === 'all' || category === filterCategory;
            const matchesStatus = filterStatus === 'all' || (filterStatus === 'read' && n.is_read) || (filterStatus === 'unread' && !n.is_read);
            const matchesSearch = searchTerm === '' || buildNotificationDescription(n).toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesStatus && matchesSearch;
        });
    }, [notifications, searchTerm, filterCategory, filterStatus]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterCategory, filterStatus]);
    
    const totalPages = Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE);
    const paginatedNotifications = useMemo(() => {
        const startIndex = (currentPage - 1) * NOTIFICATIONS_PER_PAGE;
        return filteredNotifications.slice(startIndex, startIndex + NOTIFICATIONS_PER_PAGE);
    }, [filteredNotifications, currentPage]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="space-y-8 p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Centro de Notificaciones</h1>
                    <p className="text-muted-foreground mt-1">
                        Revisa y gestiona todas tus alertas y actualizaciones.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button onClick={markAllAsRead}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar todas como leídas ({unreadCount})
                    </Button>
                )}
            </div>

            <Card className="bg-card/50 border-border/50 shadow-sm">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <Input
                                placeholder="Buscar por contenido..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger><SelectValue placeholder="Filtrar por categoría" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las categorías</SelectItem>
                                {availableCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                <SelectItem value="unread">No leídas</SelectItem>
                                <SelectItem value="read">Leídas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-3">
                <AnimatePresence>
                    {paginatedNotifications.length > 0 ? (
                        paginatedNotifications.map((notification) => {
                            // Lógica centralizada
                            const iconName = getNotificationIcon(notification);
                            const iconColor = getNotificationColor(notification);

                            return (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                >
                                    <Card className={`transition-all duration-300 ${!notification.is_read ? 'bg-primary/5 border-primary/20' : 'bg-card/60'}`}>
                                        <CardContent className="p-4 flex items-start space-x-4">
                                            <div className="flex-shrink-0 mt-1">
                                                <Icon name={iconName} className={`w-6 h-6 ${iconColor}`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <Badge variant={!notification.is_read ? "default" : "secondary"}>
                                                        {getNotificationCategory(notification.type)}
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateNotificationStatus(notification.id, !notification.is_read);
                                                        }}
                                                    >
                                                        {notification.is_read ? "Marcar no leída" : "Marcar leída"}
                                                    </Button>
                                                </div>
                                                <p className={`text-sm ${!notification.is_read ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                                    {buildNotificationDescription(notification)}
                                                </p>
                                                <div className="flex items-center text-xs text-muted-foreground mt-2">
                                                    <Clock className="w-3 h-3 mr-1.5" />
                                                    {formatDateTime(notification.created_at)}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                            <Card className="bg-card border-dashed">
                                <CardContent className="p-12 text-center">
                                    <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold">Todo en orden</h3>
                                    <p className="text-muted-foreground mt-1">
                                        {notifications.length > 0
                                            ? 'No hay notificaciones que coincidan con tus filtros.'
                                            : 'No tienes notificaciones por ahora.'
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-4 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                    </Button>
                    <span className="text-sm font-medium text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente
                        <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
};

export default NotificationsPage;