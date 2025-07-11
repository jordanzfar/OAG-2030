import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { supabase } from '@/lib/supabase';
import { Badge } from "@/components/ui/badge";

const AdminChatListPage = () => {
    const { user } = useSupabaseAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadChats = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase.rpc('get_admin_chat_list', { admin_id_param: user.id });
        if (error) {
            console.error("Error fetching chat list:", error);
            setChats([]);
        } else {
            setChats(data);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) loadChats();
        const channel = supabase.channel('admin-chat-list-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, loadChats)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, loadChats)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [user, loadChats]);

    const getFallbackName = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
    };

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const msgDate = new Date(timestamp);
        if (now.toDateString() === msgDate.toDateString()) return msgDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return msgDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'pendiente': return 'destructive';
            case 'solucionado': return 'success';
            case 'en revisión': return 'secondary';
            case 'leído': return 'outline';
            default: return 'secondary';
        }
    };

    const filteredChats = chats.filter(chat =>
        chat.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.short_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col p-4 md:p-6">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-foreground">Centro de Mensajes</h1>
                <p className="text-muted-foreground">Gestiona las conversaciones con los clientes.</p>
            </div>
            <Card className="bg-card border-border shadow-md flex-grow flex flex-col overflow-hidden">
                <CardHeader className="border-b border-border flex-shrink-0 p-4">
                    <Input placeholder="Buscar por nombre o ID de cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </CardHeader>
                <CardContent className="p-0 flex-grow">
                    <ScrollArea className="h-full">
                        {loading ? (
                            <div className="flex items-center justify-center h-full p-6 text-muted-foreground">Cargando chats...</div>
                        ) : filteredChats.length > 0 ? (
                            filteredChats.map((chat) => (
                                // ✅ ESTA ES LA LÍNEA CORREGIDA
                                // El enlace 'to' ahora usa el UUID (`chat.client_id`) para la URL, lo que es correcto.
                                <Link key={chat.client_id} to={`/admin/chat/${chat.client_id}`} className="block hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center space-x-4 p-4 border-b border-border last:border-b-0">
                                        <Avatar>
                                            <AvatarImage src={chat.client_avatar_url} alt={chat.client_name} />
                                            <AvatarFallback>{getFallbackName(chat.client_name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <p className="font-semibold text-foreground truncate">{chat.client_name}</p>
                                                <Badge variant={getStatusVariant(chat.conversation_status)} className="capitalize text-xs px-1.5 py-0.5">
                                                    {chat.conversation_status.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-mono">{chat.short_id}</p>
                                            <p className="text-sm text-muted-foreground truncate mt-1">{chat.last_message_content}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0 w-20">
                                            <p className="text-xs text-muted-foreground mb-1">{formatTimestamp(chat.last_message_at)}</p>
                                            {chat.unread_count > 0 && (
                                                <span className="ml-auto inline-block bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
                                                    {chat.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full p-6 text-muted-foreground italic">
                                No hay conversaciones activas.
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminChatListPage;