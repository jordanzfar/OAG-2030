import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, MoreVertical, AlertTriangle, Paperclip, X, File as FileIcon, Download, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Rating } from '@/components/ui/Rating';
import { useDebouncedCallback } from 'use-debounce';

const ChatMessageFile = ({ filePath, fileType }) => {
    const supabase = useSupabaseClient();
    const [fileUrl, setFileUrl] = useState(null);

    useEffect(() => {
        if (!filePath) return;
        const downloadFile = async () => {
            const { data, error } = await supabase.storage.from('chatdocuments').createSignedUrl(filePath, 3600);
            if (error) console.error("Error generando URL firmada:", error);
            else setFileUrl(data.signedUrl);
        };
        downloadFile();
    }, [filePath, supabase]);

    if (!fileUrl) return <div className="text-xs text-muted-foreground mt-2 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Cargando...</div>;
    if (fileType && fileType.startsWith('image/')) {
        return <a href={fileUrl} target="_blank" rel="noopener noreferrer"><img src={fileUrl} alt="Adjunto" className="mt-2 rounded-lg max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-80 transition-opacity" /></a>;
    }
    return <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 mt-2 bg-secondary p-2 rounded-lg hover:bg-secondary/80 transition-colors max-w-xs"><FileIcon className="h-6 w-6 flex-shrink-0 text-muted-foreground" /><div className="flex-1 min-w-0"><p className="text-sm truncate">{filePath.split('/').pop().substring(14)}</p><span className="text-xs text-blue-500 flex items-center">Ver/Descargar <Download className="h-3 w-3 ml-1" /></span></div></a>;
};

const ChatPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const supabase = useSupabaseClient();
    
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [agent, setAgent] = useState(null);
    const [fileToSend, setFileToSend] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [chatUiState, setChatUiState] = useState('loading');
    const [hasRated, setHasRated] = useState(false);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    
    const scrollAreaRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    
    const scrollToBottom = () => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) setTimeout(() => { scrollViewport.scrollTop = scrollViewport.scrollHeight; }, 100);
    };

    const loadInitialData = useCallback(async () => {
        if (!user) return;
        setChatUiState('loading');
        try {
            // PASO 1: Obtener la conversación más reciente de forma simple.
            const { data: convData, error: convError } = await supabase
                .from('chat_conversations')
                .select('id, status, agent_id')
                .eq('client_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (convError) throw convError;

            if (convData?.status === 'cerrada') {
                setConversation(null);
                setMessages([]);
                setAgent(null);
            } else if (convData) {
                setConversation(convData);

                // PASO 2: Si hay un agente, obtener su perfil en una consulta separada y robusta.
                if (convData.agent_id) {
                    const { data: agentProfile, error: agentProfileError } = await supabase
                        .from('users_profile')
                        .select('full_name')
                        .eq('user_id', convData.agent_id)
                        .single();
                    if (agentProfileError) throw agentProfileError;
                    setAgent({ agent_id: convData.agent_id, display_name: agentProfile.full_name });
                }
                
                if (convData.status === 'solucionado') {
                    const { data: ratingData } = await supabase.from('chat_ratings').select('id').eq('conversation_id', convData.id).maybeSingle();
                    setHasRated(!!ratingData);
                    setMessages([]);
                } else {
                    const { data: messagesData, error: messagesError } = await supabase.from('chat_messages').select('*').eq('conversation_id', convData.id).order('created_at', { ascending: true });
                    if (messagesError) throw messagesError;
                    setMessages(messagesData || []);
                }
            }
            setChatUiState('active');
        } catch (error) {
            console.error("Error al inicializar el chat:", error);
            toast({ variant: "destructive", title: "Error Inesperado", description: "Ocurrió un problema al cargar el chat." });
            setChatUiState('error');
        } finally {
            scrollToBottom();
        }
    }, [user, supabase, toast]);

    useEffect(() => { if (user) loadInitialData(); }, [user, loadInitialData]);

    const debouncedTyping = useDebouncedCallback(() => {
        if (!user) return;
        const channel = supabase.channel(`realtime-chat-events:${user.id}`);
        channel.send({ type: 'broadcast', event: 'typing', payload: { isTyping: true, sender: 'client' } });
    }, 1500, { leading: true, trailing: false });

    useEffect(() => {
        if (!user) return;
        const channelId = `realtime-chat-events:${user.id}`;
        const eventsChannel = supabase.channel(channelId);
        eventsChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (payload.sender === 'agent') {
                setIsAgentTyping(payload.isTyping);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsAgentTyping(false), 3000);
            }
        }).subscribe();
        
        const messagesChannel = supabase.channel(`client-chat-${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${user.id}` }, (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
        }).subscribe();
        
        const statusChannel = supabase.channel(`client-status-${user.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_conversations', filter: `client_id=eq.${user.id}` }, (payload) => {
            loadInitialData();
        }).subscribe();

        return () => {
            supabase.removeChannel(eventsChannel);
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(statusChannel);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [user, supabase, loadInitialData]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !fileToSend) || isSending) return;
        setIsSending(true);

        try {
            let currentConversation = conversation;
            let currentAgent = agent;

            if (!currentConversation) {
                const { data, error } = await supabase.rpc('reopen_or_create_chat');
                if (error) throw error;
                const newConvData = data[0];
                currentConversation = { id: newConvData.id, status: newConvData.status };
                currentAgent = { agent_id: newConvData.agent_id, display_name: newConvData.agent_name };
                setConversation(currentConversation);
                setAgent(currentAgent);
                setMessages([]);
            }
            
            let filePath = null, fileType = null;
            if (fileToSend) {
                const uniquePath = `${user.id}/${Date.now()}_${fileToSend.name}`;
                const { error: uploadError } = await supabase.storage.from('chatdocuments').upload(uniquePath, fileToSend);
                if (uploadError) throw uploadError;
                filePath = uniquePath;
                fileType = fileToSend.type;
            }

            const messageToInsert = { 
                conversation_id: currentConversation.id,
                sender_id: user.id, 
                receiver_id: currentAgent.agent_id, 
                content: newMessage.trim(), 
                file_path: filePath, 
                file_type: fileType 
            };
            
            const { data: sentMessage, error: insertError } = await supabase.from('chat_messages').insert(messageToInsert).select().single();
            if (insertError) throw insertError;
            
            setMessages((prev) => [...prev, sentMessage]);
            setNewMessage('');
            clearFileSelection();
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            toast({ variant: "destructive", title: "Error al Enviar", description: "No se pudo enviar tu mensaje." });
        } finally {
            setIsSending(false);
            scrollToBottom();
        }
    };
    
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        debouncedTyping();
    };

    const handleRatingSubmit = async ({ rating, comment, conversationId }) => {
        const { error } = await supabase.from('chat_ratings').insert({
            conversation_id: conversationId, user_id: user.id, rating, comment: comment || null,
        });
        if (error) {
            toast({ variant: "destructive", title: "Error", description: "No se pudo enviar tu valoración." });
            throw error;
        } else {
            setHasRated(true);
        }
    };
    
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setFileToSend(file);
            setFilePreviewUrl(URL.createObjectURL(file));
        }
        e.target.value = null;
    };
    
    const clearFileSelection = () => {
        if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
        setFileToSend(null);
        setFilePreviewUrl(null);
    };

    const isOwnMessage = (senderId) => senderId === user?.id;
    
    if (chatUiState === 'loading') return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Conectando con soporte...</div>;
    if (chatUiState === 'no_agents') return <div className="space-y-6"><div className="flex-shrink-0"><h1 className="text-3xl font-bold text-foreground">Chat de Soporte</h1><p className="text-muted-foreground">Comunícate directamente con nuestro equipo de soporte.</p></div><Card className="bg-card border-border shadow-lg"><CardContent className="p-6 flex flex-col items-center justify-center text-center h-96"><AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" /><p className="font-semibold text-foreground text-lg">Soporte no disponible</p><p className="text-muted-foreground mt-2">Todos nuestros agentes están ocupados.</p><Button onClick={loadInitialData} className="mt-6"><RefreshCw className="mr-2 h-4 w-4" />Intentar de Nuevo</Button></CardContent></Card></div>;

    return (
        <div className="space-y-6">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-foreground">Chat de Soporte</h1>
                <p className="text-muted-foreground">
                    {conversation && conversation.id ? `Conversación #${conversation.id.substring(0, 8)}` : 'Comunícate directamente con nuestro equipo.'}
                </p>
            </div>
            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar><AvatarImage src="/support-avatar.jpg" /><AvatarFallback className="bg-primary text-primary-foreground">S</AvatarFallback></Avatar>
                            <div>
                                <CardTitle className="text-lg">{agent?.display_name || 'Soporte Opulent'}</CardTitle>
                                {agent && <CardDescription className="text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>En línea</CardDescription>}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <ScrollArea ref={scrollAreaRef} className="h-96 p-4">
                        {!conversation ? (
                            <div className="flex h-full items-center justify-center text-center">
                                <p className="text-muted-foreground">Bienvenido. Escribe un mensaje para iniciar una conversación.</p>
                            </div>
                        ) : conversation.status === 'solucionado' ? (
                            hasRated ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                    <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                                    <p className="font-semibold text-foreground">¡Gracias por tu valoración!</p>
                                </div>
                            ) : (
                                <Rating onSubmit={handleRatingSubmit} conversationId={conversation.id} />
                            )
                        ) : (
                            <AnimatePresence>
                                {messages.map((msg) => (
                                    <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex my-2 ${isOwnMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-3 rounded-2xl ${isOwnMessage(msg.sender_id) ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-secondary text-secondary-foreground rounded-bl-lg'}`}>
                                            {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                                            {msg.file_path && <ChatMessageFile filePath={msg.file_path} fileType={msg.file_type} />}
                                            <p className={`text-xs text-right mt-1 ${isOwnMessage(msg.sender_id) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </ScrollArea>
                    {(!conversation || (conversation.status !== 'solucionado' && conversation.status !== 'cerrada')) && (
                        <div className="p-4 border-t border-border bg-background">
                            <AnimatePresence>
                                {isAgentTyping && (
                                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="text-xs text-muted-foreground mb-2 flex items-center">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 animate-pulse"></span>
                                        Agente está escribiendo...
                                    </motion.div>
                                )}
                                {filePreviewUrl && fileToSend && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="relative w-fit max-w-xs p-2 border rounded-lg bg-secondary/50">
                                        <div className="flex items-center space-x-2">{fileToSend.type.startsWith('image/') ? <img src={filePreviewUrl} alt="Previsualización" className="object-cover w-16 h-16 rounded-md" /> : <div className="flex items-center justify-center w-16 h-16 rounded-md bg-secondary"><FileIcon className="w-8 h-8 text-muted-foreground" /></div>}<div className="flex-1 min-w-0"><p className="text-sm font-medium truncate text-foreground">{fileToSend.name}</p><p className="text-xs text-muted-foreground">{(fileToSend.size / 1024).toFixed(1)} KB</p></div></div>
                                        <Button variant="ghost" size="icon" className="absolute top-0 right-0 w-6 h-6 rounded-full -mt-2 -mr-2 bg-muted hover:bg-destructive/80" onClick={clearFileSelection}><X className="w-4 h-4" /></Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                                <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}><Paperclip className="w-5 h-5" /></Button>
                                <Input value={newMessage} onChange={handleInputChange} placeholder="Escribe tu mensaje..." className="flex-grow" disabled={isSending} autoComplete="off"/>
                                <Button type="submit" size="icon" disabled={isSending || (!newMessage.trim() && !fileToSend)}><Send className="h-4 w-4" /></Button>
                            </form>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ChatPage;