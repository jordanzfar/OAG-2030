import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Copy, Search } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminChatInstancePage = () => {
    const { clientId } = useParams();
    const { user } = useSupabaseAuth();
    const { sendAdminMessage, updateChatStatus } = useAdminData();
    const { toast } = useToast();
const supabase = useSupabaseClient();
    // Estados
    const [clientProfile, setClientProfile] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [conversationStatus, setConversationStatus] = useState('pendiente');
    const [searchTerm, setSearchTerm] = useState('');
    const scrollAreaRef = useRef(null);

    const scrollToBottom = () => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            setTimeout(() => { scrollViewport.scrollTop = scrollViewport.scrollHeight; }, 100);
        }
    };

    // Efecto para cargar los datos iniciales
    useEffect(() => {
        if (!clientId || !user) {
            setLoading(false);
            return;
        }

        const loadChatData = async () => {
            setLoading(true);
            try {
                const [
                    profileResult,
                    messagesResult,
                    statusResult,
                    _
                ] = await Promise.all([
                    supabase.from('users_profile').select('user_id, full_name, email, short_id').eq('user_id', clientId).single(),
                    supabase.from('chat_messages').select('*').or(`and(sender_id.eq.${clientId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${clientId})`).order('created_at', { ascending: true }),
                    supabase.from('chat_conversations').select('status').eq('client_id', clientId).single(),
                    supabase.rpc('mark_messages_as_read', { p_client_id: clientId })
                ]);

                if (profileResult.error) throw new Error(`Perfil no encontrado: ${profileResult.error.message}`);
                setClientProfile(profileResult.data);

                if (messagesResult.error) throw new Error(`Error al cargar mensajes: ${messagesResult.error.message}`);
                setMessages(messagesResult.data || []);

                if (statusResult.data) {
                    setConversationStatus(statusResult.data.status);
                }

            } catch (error) {
                console.error("Error al cargar datos del chat:", error);
                toast({ variant: "destructive", title: "Error al Cargar", description: error.message });
                setClientProfile(null);
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        loadChatData();
    }, [clientId, user, toast]);

    // Efecto para las suscripciones en tiempo real
    useEffect(() => {
        if (!clientId || !user) return;

        const handleNewMessage = (payload) => {
             const newMsg = payload.new;
            if ((newMsg.sender_id === clientId && newMsg.receiver_id === user.id) || (newMsg.sender_id === user.id && newMsg.receiver_id === clientId)) {
                setMessages((prev) => [...prev, newMsg]);
                supabase.rpc('mark_messages_as_read', { p_client_id: clientId });
                scrollToBottom();
            }
        };

        const handleStatusUpdate = (payload) => {
            setConversationStatus(payload.new.status);
        };

        const messagesChannel = supabase.channel(`admin-chat-with-${clientId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, handleNewMessage)
            .subscribe();

        const statusChannel = supabase.channel(`conversation-status-${clientId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations', filter: `client_id=eq.${clientId}` }, handleStatusUpdate)
            .subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(statusChannel);
        };
    }, [clientId, user]);

    // Lógica para filtrar los mensajes según el término de búsqueda
    const filteredMessages = messages.filter(msg =>
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || isSending || !clientProfile) return;
        setIsSending(true);
        await sendAdminMessage(clientProfile.user_id, newMessage.trim());
        setNewMessage('');
        setIsSending(false);
    };

    const handleStatusChange = async (newStatus) => {
        if (!newStatus || newStatus === conversationStatus || !clientProfile) return;
        setConversationStatus(newStatus);
        await updateChatStatus(clientProfile.user_id, newStatus);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "ID copiado al portapapeles." });
    };

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><p className="text-muted-foreground">Cargando...</p></div>;
    }

    if (!clientProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                 <h2 className="text-xl font-semibold text-destructive">Error al Cargar Cliente</h2>
                 <p className="text-muted-foreground">No se pudo cargar el perfil del cliente.</p>
                 <Button asChild className="mt-4">
                     <Link to="/admin/chat">Volver a la lista</Link>
                 </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-rows-[auto,1fr] h-screen max-h-screen p-4 md:p-6 gap-4">
            
            <header className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                    <Button variant="outline" size="icon" asChild>
                        <Link to="/admin/chat"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <Avatar>
                        <AvatarImage src={null} alt={clientProfile.full_name} />
                        <AvatarFallback>{clientProfile.full_name?.charAt(0) || 'C'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{clientProfile.full_name}</h1>
                        <p className="text-muted-foreground text-sm">{clientProfile.email}</p>
                        <div className="text-xs text-muted-foreground font-mono mt-1 space-y-1">
                            <div className="flex items-center gap-2">
                               <span>ID: {clientProfile.short_id}</span>
                               <Copy className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => copyToClipboard(clientProfile.short_id)} />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Select value={conversationStatus} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="en revisión">En Revisión</SelectItem>
                            <SelectItem value="leído">Leído</SelectItem>
                            <SelectItem value="solucionado">Solucionado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>

            {/* ✅ CAMBIO ESTRUCTURAL: La tarjeta ahora usa CSS Grid para definir sus filas. */}
            <Card className="grid grid-rows-[auto,1fr,auto] overflow-hidden">
                <CardHeader className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar en la conversación..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent pl-10"
                        />
                    </div>
                </CardHeader>
                
                {/* ✅ Fila 2: El área de scroll ocupa todo el espacio disponible ('1fr') y maneja el scroll interno. */}
                <ScrollArea ref={scrollAreaRef} className="p-4">
                    <AnimatePresence>
                        {filteredMessages.map((msg) => (
                            <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={`flex my-2 ${msg.sender_id === clientProfile.user_id ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl ${msg.sender_id === clientProfile.user_id
                                        ? 'bg-secondary text-secondary-foreground rounded-bl-lg'
                                        : 'bg-primary text-primary-foreground rounded-br-lg'}`}>
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {filteredMessages.length === 0 && searchTerm && (
                        <div className="text-center text-muted-foreground py-10">No se encontraron mensajes.</div>
                    )}
                </ScrollArea>
                
                {/* ✅ Fila 3: El área de texto ocupa su altura natural ('auto') y siempre está visible. */}
                <div className="p-4 border-t bg-background">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <Input 
                            placeholder="Escribe tu respuesta..." 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-grow" 
                            disabled={isSending} 
                            autoComplete="off" 
                        />
                        <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default AdminChatInstancePage;