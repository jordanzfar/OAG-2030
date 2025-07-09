import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, MoreVertical, AlertTriangle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

const SUPPORT_USER_ID = import.meta.env.VITE_SUPABASE_SUPPORT_USER_ID;

const ChatPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();

    // Estados
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [conversationStatus, setConversationStatus] = useState('abierta');
    const scrollAreaRef = useRef(null);

    const scrollToBottom = () => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) {
            setTimeout(() => { scrollViewport.scrollTop = scrollViewport.scrollHeight; }, 50);
        }
    };

    const loadInitialData = React.useCallback(async () => {
        if (!user || !SUPPORT_USER_ID) {
            setMessages([]);
            return;
        }
        try {
            const { data: statusData } = await supabase
                .from('chat_conversations')
                .select('status')
                .eq('client_id', user.id)
                .single();
            
            const currentStatus = statusData?.status || 'abierta';
            setConversationStatus(currentStatus);

            if (currentStatus !== 'solucionado') {
                const { data: messagesData, error } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${SUPPORT_USER_ID}),and(sender_id.eq.${SUPPORT_USER_ID},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: true });
                if (error) throw error;
                setMessages(messagesData || []);
            } else {
                setMessages([]);
            }
        } catch (error) {
            console.error("Error al cargar el chat:", error);
            toast({ title: "Error al cargar el chat", variant: "destructive" });
        }
    }, [user, toast]);

    // 2. useEffect para CARGAR DATOS (maneja el estado `loading`)
    useEffect(() => {
        const runLoad = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            setLoading(true);
            await loadInitialData();
            setLoading(false);
            scrollToBottom();
        };
        runLoad();
    }, [user, loadInitialData]);

    // 3. useEffect para SUSCRIPCIONES EN TIEMPO REAL (no toca el estado `loading`)
    useEffect(() => {
        if (!user) return;

        const handleNewMessage = (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
        };

        const handleStatusChange = (payload) => {
            const newStatus = payload.new.status;
            setConversationStatus(newStatus);
            if (newStatus === 'solucionado') {
                setMessages([]);
                toast({ title: "Conversación finalizada", description: "Un administrador ha marcado esta conversación como solucionada." });
            }
        };

        const messagesChannel = supabase.channel(`client-chat-${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${user.id}` }, handleNewMessage)
            .subscribe();
            
        const statusChannel = supabase.channel(`client-status-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations', filter: `client_id=eq.${user.id}` }, handleStatusChange)
            .subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(statusChannel);
        };
    }, [user, toast]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || isSending) return;

        const messageContent = newMessage.trim();
        setIsSending(true);
        setNewMessage('');

        try {
            await supabase.rpc('reabrir_conversacion_si_es_necesario', { p_client_id: user.id });
            
            if (conversationStatus === 'solucionado') {
                const { data: oldMessages } = await supabase.from('chat_messages').select('*').or(`and(sender_id.eq.${user.id},receiver_id.eq.${SUPPORT_USER_ID}),and(sender_id.eq.${SUPPORT_USER_ID},receiver_id.eq.${user.id})`).order('created_at', { ascending: true });
                setMessages(oldMessages || []);
                setConversationStatus('pendiente');
            }
            
            const { data: sentMessage, error } = await supabase
                .from('chat_messages')
                .insert({ sender_id: user.id, receiver_id: SUPPORT_USER_ID, content: messageContent, is_read: false })
                .select()
                .single();
            
            if (error) throw error;
            
            setMessages((prev) => [...prev, sentMessage]);
            scrollToBottom();

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            toast({ variant: "destructive", title: "Error al Enviar", description: "Tu mensaje no se pudo enviar." });
            setNewMessage(messageContent);
        } finally {
            setIsSending(false);
        }
    };

    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);
        if (diffInSeconds < 60) return 'Ahora';
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) return `${diffInMinutes}m`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h`;
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d`;
    };

    const isOwnMessage = (senderId) => senderId === user?.id;

    if (loading) {
        return <div className="flex-1 flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando tu conversación...</p></div>;
    }
    
    if (!SUPPORT_USER_ID) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-4">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h2 className="text-xl font-bold text-destructive">Error de Configuración del Chat</h2>
                <p className="text-muted-foreground max-w-sm mt-2">
                    El servicio de soporte no está disponible en este momento. Por favor, contacta al administrador del sistema.
                </p>
            </div>
        );
    }

    return (
        // ✅ Contenedor principal sin altura fija, permite que el contenido defina el tamaño
        <div className="space-y-6">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-foreground">Chat de Soporte</h1>
                <p className="text-muted-foreground">Comunícate directamente con nuestro equipo de soporte.</p>
            </div>

            {/* ✅ La tarjeta ya no tiene clases de crecimiento (flex-grow) */}
            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar>
                                <AvatarImage src="/support-avatar.jpg" alt="Soporte Opulent" />
                                <AvatarFallback className="bg-primary text-primary-foreground">SA</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-lg">Soporte Opulent Auto</CardTitle>
                                <CardDescription className="text-green-500 flex items-center">
                                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                    En línea
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                
                {/* ✅ El CardContent ya no necesita ser flex */}
                <CardContent className="p-0">
                    {/* ✅ ESTE ES EL CAMBIO CLAVE: Se aplica una altura fija al ScrollArea.
                        - h-96 equivale a 24rem o 384px.
                        - Puedes cambiar este valor por lo que necesites, por ejemplo: h-80, h-[500px], etc.
                    */}
                    <ScrollArea ref={scrollAreaRef} className="h-96 p-4">
                        <AnimatePresence>
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className={`flex my-2 ${isOwnMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[75%] p-3 rounded-2xl ${isOwnMessage(msg.sender_id) ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-secondary text-secondary-foreground rounded-bl-lg'}`}>
                                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <p className={`text-xs text-right mt-1 ${isOwnMessage(msg.sender_id) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                            {formatTimeAgo(msg.created_at)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {conversationStatus === 'solucionado' && !loading && (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Esta conversación fue marcada como solucionada.</p>
                                <p className="text-sm">Si tienes una nueva pregunta, envía un mensaje para iniciar una nueva conversación.</p>
                            </div>
                        )}
                        {messages.length === 0 && conversationStatus !== 'solucionado' && !loading && (
                            <div className="text-center py-8 text-muted-foreground">
                                No hay mensajes aún. ¡Inicia la conversación!
                            </div>
                        )}
                    </ScrollArea>
                    
                    <div className="p-4 border-t border-border bg-background">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                            <Input
                                placeholder={conversationStatus === 'solucionado' ? "Escribe para reabrir la conversación..." : "Escribe tu mensaje..."}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-grow"
                                maxLength={1000}
                                disabled={isSending}
                                autoComplete="off"
                            />
                            <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChatPage;