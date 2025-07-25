import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Copy, Search, Paperclip, X, File as FileIcon, Download, Loader2, History, MessageSquarePlus } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
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

const AdminChatInstancePage = () => {
    const { clientId } = useParams();
    const { user } = useSupabaseAuth();
    const { sendAdminMessage, updateChatStatus } = useAdminData();
    const { toast } = useToast();
    const supabase = useSupabaseClient();
    
    const [clientProfile, setClientProfile] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [fileToSend, setFileToSend] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    const [quickReplies, setQuickReplies] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyMessages, setHistoryMessages] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isClientTyping, setIsClientTyping] = useState(false);
    
    const scrollAreaRef = useRef(null);
    const fileInputRef = useRef(null);
    const textInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) setTimeout(() => { scrollViewport.scrollTop = scrollViewport.scrollHeight; }, 100);
    }, []);

    const loadChatData = useCallback(async () => {
        if (!clientId) return;
        setLoading(true);
        try {
            const { data: profileData, error: profileError } = await supabase.from('users_profile').select('*').eq('user_id', clientId).single();
            if (profileError) throw profileError;
            setClientProfile(profileData);

            const { data: convData, error: convError } = await supabase
                .from('chat_conversations')
                .select('*')
                .eq('client_id', clientId)
                .neq('status', 'cerrada')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (convError) throw convError;
            setConversation(convData);
            
            const { data: messagesData, error: messagesError } = await supabase.from('chat_messages').select('*').eq('conversation_id', convData.id).order('created_at');
            if (messagesError) throw messagesError;
            setMessages(messagesData || []);
            
        } catch (error) {
            console.error("Error al cargar datos del chat:", error);
            toast({ variant: "destructive", title: "Error al Cargar", description: "No se pudo cargar la conversación activa." });
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    }, [clientId, supabase, toast, scrollToBottom]);

    useEffect(() => {
        if (clientId && user) {
            loadChatData();
        }
    }, [clientId, user, loadChatData]);
    
    const handleNewMessage = useCallback((payload) => {
        setMessages((prev) => [...prev, payload.new]);
        scrollToBottom();
    }, [scrollToBottom]);

    const debouncedTyping = useDebouncedCallback(() => {
        if (!clientId) return;
        const channel = supabase.channel(`realtime-chat-events:${clientId}`);
        channel.send({ type: 'broadcast', event: 'typing', payload: { isTyping: true, sender: 'agent' } });
    }, 1500, { leading: true, trailing: false });

    useEffect(() => {
        if (!clientId || !user || !conversation) return;
        const eventsChannel = supabase.channel(`realtime-chat-events:${clientId}`);
        const messagesChannel = supabase.channel(`admin-chat-with-${clientId}`);
        const statusChannel = supabase.channel(`conversation-status-${conversation.id}`);

        eventsChannel.on('broadcast', { event: 'typing' }, ({ payload }) => {
            if (payload.sender === 'client') {
                setIsClientTyping(payload.isTyping);
                if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = setTimeout(() => setIsClientTyping(false), 3000);
            }
        }).subscribe();

        messagesChannel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversation.id}` }, handleNewMessage).subscribe();
        statusChannel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_conversations', filter: `id=eq.${conversation.id}` }, (payload) => setConversation(payload.new)).subscribe();
        
        return () => {
            supabase.removeChannel(eventsChannel);
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(statusChannel);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [clientId, user, conversation, supabase, handleNewMessage]);

    const fetchHistory = async () => {
        if (!clientProfile) return;
        setIsLoadingHistory(true);
        setHistoryMessages([]);
        const { data, error } = await supabase.rpc('get_client_conversation_history', { p_client_id: clientProfile.user_id });
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el historial.' });
            setHistory([]);
        } else {
            setHistory(data || []);
        }
        setIsLoadingHistory(false);
    };

    const fetchHistoryMessages = async (conversationId) => {
        setIsLoadingHistory(true);
        const { data, error } = await supabase.from('chat_messages').select('*').eq('conversation_id', conversationId).order('created_at');
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron cargar los mensajes del historial.' });
            setHistoryMessages([]);
        } else {
            setHistoryMessages(data);
        }
        setIsLoadingHistory(false);
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        debouncedTyping();
    };

    const handleQuickReplySelect = (content) => {
        setNewMessage(content);
        document.getElementById('close-popover-button')?.click();
        textInputRef.current?.focus();
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !fileToSend) || isSending || !clientProfile || !conversation) return;
        setIsSending(true);
        const { data: sentMessage, error } = await sendAdminMessage(clientProfile.user_id, newMessage.trim(), fileToSend, conversation.id);
        setIsSending(false);
        if (sentMessage && !error) {
            setMessages(prevMessages => [...prevMessages, sentMessage]);
            setNewMessage('');
            clearFileSelection();
            scrollToBottom();
        } else {
            toast({ variant: 'destructive', title: 'Error al enviar', description: error?.message });
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

    const handleStatusChange = async (newStatus) => {
        if (!newStatus || newStatus === conversation?.status || !conversation) return;
        const { error } = await updateChatStatus(conversation.id, newStatus);
        if (!error) {
            setConversation(prev => ({ ...prev, status: newStatus }));
        }
    };
    
    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "ID copiado al portapapeles." });
    };
    
    const filteredMessages = messages.filter(msg => msg.content?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) { return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>; }
    if (!clientProfile || !conversation) { return <div className="flex flex-col items-center justify-center h-screen text-center p-4"><h2 className="text-xl font-semibold text-destructive">No se encontró conversación activa</h2><p className="text-muted-foreground">Este cliente no tiene un chat activo.</p><Button asChild className="mt-4"><Link to="/admin/chat">Volver a la lista</Link></Button></div>; }

    return (
        <div className="grid grid-rows-[auto,1fr] h-screen max-h-screen p-4 md:p-6 gap-4">
            <header className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-3">
                    <Button variant="outline" size="icon" asChild><Link to="/admin/chat"><ArrowLeft className="h-4 w-4" /></Link></Button>
                    <Avatar><AvatarImage src={null} alt={clientProfile.full_name} /><AvatarFallback>{clientProfile.full_name?.charAt(0) || 'C'}</AvatarFallback></Avatar>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">{clientProfile.full_name}</h1>
                        <p className="text-muted-foreground text-sm">{clientProfile.email}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Dialog onOpenChange={(open) => !open && setHistoryMessages([])}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon" onClick={fetchHistory}><History className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                            <DialogHeader>
                                <DialogTitle>Historial de {clientProfile?.full_name}</DialogTitle>
                                <DialogDescription>Conversaciones cerradas anteriormente.</DialogDescription>
                            </DialogHeader>
                            {isLoadingHistory ? <div className="flex justify-center p-8"><Loader2 className="animate-spin"/></div> : (
                                historyMessages.length > 0 ? (
                                    <div>
                                        <Button variant="link" className="p-0 h-auto mb-2" onClick={() => setHistoryMessages([])}>&larr; Volver a la lista</Button>
                                        <ScrollArea className="h-96 p-4 border rounded-md">
                                            {historyMessages.map(msg => (
                                                <div key={msg.id} className={`flex my-2 ${msg.sender_id === clientProfile.user_id ? 'justify-start' : 'justify-end'}`}>
                                                    <div className={`max-w-[85%] p-2 rounded-lg text-sm ${msg.sender_id === clientProfile.user_id ? 'bg-secondary' : 'bg-primary text-primary-foreground'}`}>{msg.content}</div>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-96">
                                        <div className="space-y-2 pr-4">
                                        {history.length > 0 ? history.map(conv => (
                                            <div key={conv.id} className="p-3 border rounded-lg hover:bg-muted cursor-pointer" onClick={() => fetchHistoryMessages(conv.id)}>
                                                <p className="font-semibold">Cerrada por: {conv.agent_name}</p>
                                                <p className="text-sm text-muted-foreground">Fecha: {new Date(conv.closed_at).toLocaleString('es-ES')}</p>
                                            </div>
                                        )) : <p className="text-sm text-muted-foreground text-center py-4">No hay conversaciones cerradas.</p>}
                                        </div>
                                    </ScrollArea>
                                )
                            )}
                        </DialogContent>
                    </Dialog>
                    <Select value={conversation.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cambiar estado" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="en revisión">En Revisión</SelectItem>
                            <SelectItem value="leído">Leído</SelectItem>
                            <SelectItem value="solucionado">Solucionado</SelectItem>
                            <SelectItem value="cerrada">Cerrada</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </header>
            <Card className="grid grid-rows-[auto,1fr,auto] overflow-hidden">
                <CardHeader className="p-2 border-b">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar en la conversación..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent pl-10"/>
                    </div>
                </CardHeader>
                <ScrollArea ref={scrollAreaRef} className="p-4">
                    <AnimatePresence>
                        {filteredMessages.map((msg) => (
                            <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex my-2 ${msg.sender_id === clientProfile.user_id ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[75%] p-3 rounded-2xl ${msg.sender_id === clientProfile.user_id ? 'bg-secondary text-secondary-foreground rounded-bl-lg' : 'bg-primary text-primary-foreground rounded-br-lg'}`}>
                                    {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                                    {msg.file_path && <ChatMessageFile filePath={msg.file_path} fileType={msg.file_type} />}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </ScrollArea>
                <div className="p-4 border-t bg-background">
                    <AnimatePresence>
                        {filePreviewUrl && fileToSend && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="relative w-fit max-w-xs p-2 border rounded-lg bg-secondary/50">
                                <div className="flex items-center space-x-2">{fileToSend.type.startsWith('image/') ? <img src={filePreviewUrl} alt="Previsualización" className="object-cover w-16 h-16 rounded-md" /> : <div className="flex items-center justify-center w-16 h-16 rounded-md bg-secondary"><FileIcon className="w-8 h-8 text-muted-foreground" /></div>}<div className="flex-1 min-w-0"><p className="text-sm font-medium truncate text-foreground">{fileToSend.name}</p><p className="text-xs text-muted-foreground">{(fileToSend.size / 1024).toFixed(1)} KB</p></div></div>
                                <Button variant="ghost" size="icon" className="absolute top-0 right-0 w-6 h-6 rounded-full -mt-2 -mr-2 bg-muted hover:bg-destructive/80" onClick={clearFileSelection}><X className="w-4 h-4" /></Button>
                            </motion.div>
                        )}
                        {isClientTyping && (
                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="text-xs text-muted-foreground mb-2 flex items-center">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2 animate-pulse"></span>
                                Cliente está escribiendo...
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}><Paperclip className="w-5 h-5"/></Button>
                        <Input ref={textInputRef} placeholder="Escribe tu respuesta..." value={newMessage} onChange={handleInputChange} className="flex-grow" disabled={isSending} autoComplete="off"/>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button type="button" variant="ghost" size="icon" id="close-popover-button"><MessageSquarePlus className="w-5 h-5 text-muted-foreground" /></Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-1">
                                <div className="text-xs text-muted-foreground p-2">Respuestas Rápidas</div>
                                <div className="max-h-48 overflow-y-auto">
                                    {quickReplies.map(reply => (
                                        <div key={reply.shortcut} onClick={() => handleQuickReplySelect(reply.content)} className="p-2 hover:bg-muted rounded-md cursor-pointer text-sm">
                                            <span className="font-semibold text-primary">/{reply.shortcut}</span>
                                            <p className="text-muted-foreground text-xs truncate">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <Button type="submit" size="icon" disabled={!newMessage.trim() && !fileToSend || isSending}><Send className="h-4 w-4"/></Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default AdminChatInstancePage;