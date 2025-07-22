import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft, Copy, Search, Paperclip, X, File as FileIcon, Download, Loader2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Componente Auxiliar para Renderizar Archivos del Chat ---
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
    if (fileType.startsWith('image/')) {
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
    
    // Estados
    const [clientProfile, setClientProfile] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [conversationStatus, setConversationStatus] = useState('pendiente');
    const [searchTerm, setSearchTerm] = useState('');
    const [fileToSend, setFileToSend] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    
    // Referencias
    const scrollAreaRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) setTimeout(() => { scrollViewport.scrollTop = scrollViewport.scrollHeight; }, 100);
    };

    // Efecto para cargar los datos iniciales
    useEffect(() => {
        if (!clientId || !user) { setLoading(false); return; }
        const loadChatData = async () => {
            setLoading(true);
            try {
                const [profileResult, messagesResult, statusResult, _] = await Promise.all([
                    supabase.from('users_profile').select('user_id, full_name, email, short_id').eq('user_id', clientId).single(),
                    supabase.from('chat_messages').select('*').or(`and(sender_id.eq.${clientId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${clientId})`).order('created_at', { ascending: true }),
                    supabase.from('chat_conversations').select('status').eq('client_id', clientId).single(),
                    supabase.rpc('mark_messages_as_read', { p_client_id: clientId, p_user_id: user.id })
                ]);
                if (profileResult.error) throw new Error(`Perfil no encontrado: ${profileResult.error.message}`);
                setClientProfile(profileResult.data);
                if (messagesResult.error) throw new Error(`Error al cargar mensajes: ${messagesResult.error.message}`);
                setMessages(messagesResult.data || []);
                if (statusResult.data) setConversationStatus(statusResult.data.status);
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
    }, [clientId, user, supabase, toast]);

    // ✅ INICIO: Handlers para tiempo real refactorizados con useCallback
    const handleNewMessage = useCallback((payload) => {
        const newMsg = payload.new;
        if (user && clientId && (newMsg.sender_id === clientId && newMsg.receiver_id === user.id)) {
            setMessages((prev) => [...prev, newMsg]);
            supabase.rpc('mark_messages_as_read', { p_client_id: clientId, p_user_id: user.id });
            scrollToBottom();
        }
    }, [clientId, user, supabase]);

    const handleStatusUpdate = useCallback((payload) => {
        setConversationStatus(payload.new.status);
    }, []);
    // ✅ FIN: Handlers para tiempo real

    // ✅ Efecto para las suscripciones en tiempo real (ahora más limpio)
    useEffect(() => {
        if (!clientId || !user) return;

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
    }, [clientId, user, supabase, handleNewMessage, handleStatusUpdate]);

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

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !fileToSend) || isSending || !clientProfile) return;
        setIsSending(true);

        const { data: sentMessage, error } = await sendAdminMessage(clientProfile.user_id, newMessage.trim(), fileToSend);
        setIsSending(false);

        if (sentMessage && !error) {
            setMessages(prevMessages => [...prevMessages, sentMessage]);
            setNewMessage('');
            clearFileSelection();
            scrollToBottom();
        } else {
            toast({ variant: 'destructive', title: 'Error al enviar', description: error.message });
        }
    };

    const handleStatusChange = async (newStatus) => {
        if (!newStatus || newStatus === conversationStatus || !clientProfile) return;
        setConversationStatus(newStatus);
        const { error } = await updateChatStatus(clientProfile.user_id, newStatus);
        if (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el estado.' });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copiado", description: "ID copiado al portapapeles." });
    };
    
    const filteredMessages = messages.filter(msg => msg.content?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    
    if (!clientProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                <h2 className="text-xl font-semibold text-destructive">Error al Cargar Cliente</h2>
                <p className="text-muted-foreground">No se pudo cargar el perfil del cliente.</p>
                <Button asChild className="mt-4"><Link to="/admin/chat">Volver a la lista</Link></Button>
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
                        <div className="text-xs text-muted-foreground font-mono mt-1 flex items-center gap-2">
                            <span>ID: {clientProfile.short_id}</span>
                            <Copy className="h-3 w-3 cursor-pointer hover:text-foreground" onClick={() => copyToClipboard(clientProfile.short_id)} />
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
                            <SelectItem value="cerrada">Cerrada</SelectItem>

                        </SelectContent>
                    </Select>
                </div>
            </header>

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
                                <div className="flex items-center space-x-2">
                                    {fileToSend.type.startsWith('image/') ? <img src={filePreviewUrl} alt="Previsualización" className="object-cover w-16 h-16 rounded-md" /> : <div className="flex items-center justify-center w-16 h-16 rounded-md bg-secondary"><FileIcon className="w-8 h-8 text-muted-foreground" /></div>}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-foreground">{fileToSend.name}</p>
                                        <p className="text-xs text-muted-foreground">{(fileToSend.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="absolute top-0 right-0 w-6 h-6 rounded-full -mt-2 -mr-2 bg-muted hover:bg-destructive/80" onClick={clearFileSelection}><X className="w-4 h-4" /></Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                            <Paperclip className="w-5 h-5 text-muted-foreground" />
                        </Button>
                        <Input 
                            placeholder="Escribe tu respuesta..." 
                            value={newMessage} 
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-grow" 
                            disabled={isSending} 
                            autoComplete="off" 
                        />
                        <Button type="submit" size="icon" disabled={(!newMessage.trim() && !fileToSend) || isSending}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default AdminChatInstancePage;