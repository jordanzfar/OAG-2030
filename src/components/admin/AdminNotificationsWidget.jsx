import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

// --- Componentes UI ---
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

// --- Iconos ---
import { 
    Bell, Clock, X, Package, Gavel, Megaphone, 
    Trophy, CircleSlash, CheckCircle, DollarSign, 
    AlertTriangle, Info, XCircle, Loader2 
} from 'lucide-react';

// ===================================================================================
// --- LÓGICA DE UTILIDADES (Compartida por ambos componentes) ---
// ===================================================================================

const buildNotificationDescription = (notification) => {
    if (!notification) return '';
    const metadata = notification.metadata || {};
    let description = notification.message;

    // Regla específica para la notificación de nueva puja para el admin
    if (notification.type === 'new_auction_bid' && metadata.lot_number) {
        const formattedAmount = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(metadata.amount || 0);
        description = `Nueva puja de ${metadata.user_name || 'un usuario'} por ${formattedAmount} en el lote #${metadata.lot_number}.`;
    }
    // Puedes añadir más reglas 'else if' aquí si es necesario

    return description;
};

const NotificationIcon = ({ notification }) => {
    const iconHint = notification.metadata?.icon;
    const iconMap = {
        'gavel': { Cmp: Gavel, color: "text-gray-500" },
        'megaphone': { Cmp: Megaphone, color: "text-orange-500" },
        'trophy': { Cmp: Trophy, color: "text-yellow-500" },
        'circle_slash': { Cmp: CircleSlash, color: "text-red-600" },
        'check_circle': { Cmp: CheckCircle, color: "text-green-500" },
        'clock': { Cmp: Clock, color: "text-blue-500" },
        'dollar_sign': { Cmp: DollarSign, color: "text-yellow-600" },
        'package': { Cmp: Package, color: "text-gray-600" },
        'alert': { Cmp: AlertTriangle, color: "text-red-500" },
        'info': { Cmp: Info, color: "text-blue-400" },
        'x_circle': { Cmp: XCircle, color: "text-red-500" },
    };

    if (iconHint && iconMap[iconHint]) {
        const { Cmp, color } = iconMap[iconHint];
        return <Cmp className={`w-5 h-5 ${color}`} />;
    }

    return <Bell className="w-5 h-5 text-muted-foreground" />;
};


// ===================================================================================
// --- WIDGET DE NOTIFICACIONES DEL ADMINISTRADOR ---
// ===================================================================================
const AdminNotificationsWidget = () => {
    const navigate = useNavigate();
    const supabase = useSupabaseClient();
    const { toast } = useToast();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadUnreadNotifications = useCallback(async () => {
        setLoading(true);
        const { data, error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('is_read', false)
            .or(`target_role.eq.admin`) // Trae notificaciones para cualquier admin
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error widget:", error);
        } else {
            setNotifications(data || []);
            setUnreadCount(count || 0);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        loadUnreadNotifications();
        
        const channel = supabase.channel('admin-notifications-widget')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, 
            (payload) => {
                // Recargar notificaciones cuando haya cualquier cambio
                loadUnreadNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadUnreadNotifications, supabase]);


    const handleNotificationClick = async (notification) => {
        setShowDropdown(false);
        const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
        if (error) {
            toast({ title: "Error", description: "No se pudo marcar como leída.", variant: "destructive" });
        }
        if (notification.link) {
            navigate(notification.link);
        } else {
            navigate('/admin/notifications');
        }
    };
    
    const formatTimeAgo = (dateString) => {
        const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
        if (diff < 1) return 'Ahora';
        if (diff < 60) return `${diff}m`;
        if (diff < 1440) return `${Math.floor(diff / 60)}h`;
        return `${Math.floor(diff / 1440)}d`;
    };

    return (
        <div className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setShowDropdown(!showDropdown)}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span></span>
                )}
            </Button>
            <AnimatePresence>
                {showDropdown && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="absolute right-0 top-12 z-50 w-80">
                        <Card className="shadow-lg">
                            <CardHeader className="pb-3"><div className="flex items-center justify-between"><CardTitle className="text-lg">Notificaciones</CardTitle><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDropdown(false)}><X className="h-4 w-4" /></Button></div></CardHeader>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-4 h-24 flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>
                                ) : notifications.length === 0 ? (
                                    <div className="p-4 h-24 flex items-center justify-center text-center text-muted-foreground">No tienes notificaciones nuevas.</div>
                                ) : (
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.slice(0, 5).map((notification) => (
                                            <div key={notification.id} className="p-3 border-b hover:bg-muted/50 cursor-pointer" onClick={() => handleNotificationClick(notification)}>
                                                <div className="flex items-start space-x-3">
                                                    <div className="mt-1"><NotificationIcon notification={notification} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium">{buildNotificationDescription(notification)}</p>
                                                        <div className="flex items-center mt-1 space-x-2"><Clock className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">{formatTimeAgo(notification.created_at)}</span></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full text-primary" onClick={() => { setShowDropdown(false); navigate('/admin/notifications'); }}>Ver todas las notificaciones</Button></div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminNotificationsWidget;
