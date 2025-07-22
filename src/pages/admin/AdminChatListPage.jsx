import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, MoreVertical, AlertTriangle, Paperclip, X, File as FileIcon, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// --- Componente Auxiliar para Renderizar Archivos del Chat ---
const ChatMessageFile = ({ filePath, fileType }) => {
    const supabase = useSupabaseClient();
    const [fileUrl, setFileUrl] = useState(null);

    useEffect(() => {
        if (!filePath) return;
        const downloadFile = async () => {
            const { data, error } = await supabase.storage.from('chatdocuments').createSignedUrl(filePath, 3600);
            if (error) {
                console.error("Error generando URL firmada:", error);
            } else {
                setFileUrl(data.signedUrl);
            }
        };
        downloadFile();
    }, [filePath, supabase]);

    if (!fileUrl) return <div className="text-xs text-muted-foreground mt-2 flex items-center"><Loader2 className="h-3 w-3 animate-spin mr-1" /> Cargando...</div>;
    if (fileType.startsWith('image/')) {
        return <a href={fileUrl} target="_blank" rel="noopener noreferrer"><img src={fileUrl} alt="Adjunto" className="mt-2 rounded-lg max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-80 transition-opacity" /></a>;
    }
    return <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 mt-2 bg-secondary p-2 rounded-lg hover:bg-secondary/80 transition-colors max-w-xs"><FileIcon className="h-6 w-6 flex-shrink-0 text-muted-foreground" /><div className="flex-1 min-w-0"><p className="text-sm truncate">{filePath.split('/').pop().substring(14)}</p><span className="text-xs text-blue-500 flex items-center">Ver/Descargar <Download className="h-3 w-3 ml-1" /></span></div></a>;
};


const ChatPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const supabase = useSupabaseClient();
    
    // Estados
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [conversationStatus, setConversationStatus] = useState('abierta');
    const [agent, setAgent] = useState(null);
    const [closingInfo, setClosingInfo] = useState(null);
    const [fileToSend, setFileToSend] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    
    // Referencias
    const scrollAreaRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) setTimeout(() => { scrollViewport.scrollTop = scrollViewport.scrollHeight; }, 100);
    };

    const loadInitialData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data: convData, error: functionError } = await supabase.functions.invoke('assign-support-agent');
            if (functionError) throw new Error(functionError.message);
            
            const { data: fullConvData, error: convError } = await supabase
                .from('chat_conversations')
                .select('status, closed_at, closed_by, support_agents(display_name)')
                .eq('client_id', user.id)
                .single();
            if (convError) throw new Error(`Error al cargar conversación: ${convError.message}`);

            setAgent(convData);
            setConversationStatus(fullConvData.status);

            if (fullConvData.status === 'solucionado') {
                setMessages([]);
                setClosingInfo({
                    adminName: fullConvData.support_agents?.display_name || 'Soporte',
                    closedAt: fullConvData.closed_at,
                });
            } else {
                setClosingInfo(null);
                const { data: messagesData, error: messagesError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${convData.agent_id}),and(sender_id.eq.${convData.agent_id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: true });
                if (messagesError) throw messagesError;
                setMessages(messagesData || []);
            }
        } catch (error) {
            console.error("Error al inicializar el chat:", error);
            toast({ variant: "destructive", title: "Error al cargar chat", description: error.message });
        } finally {
            setLoading(false);
            scrollToBottom();
        }
    }, [user, supabase, toast]);

    useEffect(() => {
        if (user) loadInitialData();
    }, [user, loadInitialData]);

    useEffect(() => {
        if (!user) return;
        const handleNewMessage = (payload) => {
             if (agent && payload.new.sender_id === agent.agent_id) {
                setMessages((prev) => [...prev, payload.new]);
                scrollToBottom();
            }
        };
        const handleStatusChange = (payload) => {
            const newStatus = payload.new.status;
            setConversationStatus(newStatus);
            if (newStatus === 'solucionado') {
                loadInitialData();
                toast({ title: "Conversación finalizada", description: "Un administrador ha marcado esta conversación como solucionada." });
            }
        };
        const messagesChannel = supabase.channel(`client-chat-${user.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${user.id}` }, handleNewMessage).subscribe();
        const statusChannel = supabase.channel(`client-status-${user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations', filter: `client_id=eq.${user.id}` }, handleStatusChange).subscribe();
        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(statusChannel);
        };
    }, [user, agent, supabase, loadInitialData, toast]);

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
        if ((!newMessage.trim() && !fileToSend) || !user || isSending || !agent) return;

        if (conversationStatus === 'solucionado') {
            setClosingInfo(null);
            await loadInitialData(); // Recarga los datos para obtener el nuevo agente si cambió
        }
        
        setIsSending(true);
        const messageContent = newMessage.trim();
        const fileToUpload = fileToSend;
        setNewMessage('');
        clearFileSelection();

        try {
            let filePath = null, fileType = null;
            if (fileToUpload) {
                const uniquePath = `${user.id}/${Date.now()}_${fileToUpload.name}`;
                const { error: uploadError } = await supabase.storage.from('chatdocuments').upload(uniquePath, fileToUpload);
                if (uploadError) throw uploadError;
                filePath = uniquePath;
                fileType = fileToUpload.type;
            }
            const messageToInsert = { sender_id: user.id, receiver_id: agent.agent_id, content: messageContent, file_path: filePath, file_type: fileType, is_read: false };
            const { data: sentMessage, error: insertError } = await supabase.from('chat_messages').insert(messageToInsert).select().single();
            if (insertError) throw insertError;
            setMessages((prev) => [...prev, sentMessage]);
            scrollToBottom();
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            toast({ variant: "destructive", title: "Error al Enviar", description: "No se pudo enviar tu mensaje." });
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
        return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Cargando tu conversación...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-foreground">Chat de Soporte</h1>
                <p className="text-muted-foreground">Comunícate directamente con nuestro equipo de soporte.</p>
            </div>

            <Card className="bg-card border-border shadow-lg">
                <CardHeader className="border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Avatar><AvatarImage src="/support-avatar.jpg" alt="Soporte" /><AvatarFallback className="bg-primary text-primary-foreground">S</AvatarFallback></Avatar>
                            <div>
                                <CardTitle className="text-lg">{agent?.display_name || 'Soporte Opulent'}</CardTitle>
                                <CardDescription className="text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>En línea</CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="p-0">
                    <ScrollArea ref={scrollAreaRef} className="h-96 p-4">
                        {conversationStatus === 'solucionado' && closingInfo ? (
                            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
                                <p className="font-semibold text-foreground">Esta conversación fue solucionada</p>
                                {closingInfo.adminName && closingInfo.closedAt && (
                                    <p className="text-sm mt-1">
                                        Cerrada por {closingInfo.adminName} el {new Date(closingInfo.closedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                )}
                                <p className="text-sm mt-6">Si tienes una nueva pregunta, envía un mensaje para reabrir la conversación.</p>
                            </div>
                        ) : (
                            <AnimatePresence>
                                {messages.map((msg) => (
                                    <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex my-2 ${isOwnMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-3 rounded-2xl ${isOwnMessage(msg.sender_id) ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-secondary text-secondary-foreground rounded-bl-lg'}`}>
                                            {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                                            {msg.file_path && <ChatMessageFile filePath={msg.file_path} fileType={msg.file_type} />}
                                            <p className={`text-xs text-right mt-1 ${isOwnMessage(msg.sender_id) ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{formatTimeAgo(msg.created_at)}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </ScrollArea>
                    
                    <div className="p-4 border-t border-border bg-background">
                        <AnimatePresence>
                            {filePreviewUrl && fileToSend && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="relative w-fit max-w-xs p-2 border rounded-lg bg-secondary/50">
                                    <div className="flex items-center space-x-2">
                                        {fileToSend.type.startsWith('image/') ? <img src={filePreviewUrl} alt="Previsualización" className="object-cover w-16 h-16 rounded-md" /> : <div className="flex items-center justify-center w-16 h-16 rounded-md bg-secondary"><FileIcon className="w-8 h-8 text-muted-foreground" /></div>}
                                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate text-foreground">{fileToSend.name}</p><p className="text-xs text-muted-foreground">{(fileToSend.size / 1024).toFixed(1)} KB</p></div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="absolute top-0 right-0 w-6 h-6 rounded-full -mt-2 -mr-2 bg-muted hover:bg-destructive/80" onClick={clearFileSelection}><X className="w-4 h-4" /></Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}><Paperclip className="w-5 h-5" /></Button>
                            <Input
                                placeholder={conversationStatus === 'solucionado' ? "Escribe para reabrir la conversación..." : "Escribe tu mensaje..."}
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
                </CardContent>
            </Card>
        </div>
    );
};

export default ChatPage;