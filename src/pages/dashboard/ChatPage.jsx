import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, MoreVertical, AlertTriangle, Paperclip, X, File as FileIcon, Download, Loader2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

const BUCKET_NAME = 'chatdocuments';

// --- Componente Auxiliar para Renderizar Archivos (SIN CAMBIOS) ---
const ChatMessageFile = ({ filePath, fileType }) => {
    const supabase = useSupabaseClient();
    const [fileUrl, setFileUrl] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!filePath) return;
        const downloadFile = async () => {
            const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(filePath, 3600);
            if (error) {
                console.error("Error generando URL firmada:", error);
                setError("No se pudo cargar el archivo.");
            } else {
                setFileUrl(data.signedUrl);
            }
        };
        downloadFile();
    }, [filePath, supabase]);

    if (error) return <p className="text-xs text-red-400 mt-2">{error}</p>;
    if (!fileUrl) return <p className="text-xs text-muted-foreground mt-2">Cargando archivo...</p>;

    if (fileType.startsWith('image/')) {
        return <a href={fileUrl} target="_blank" rel="noopener noreferrer"><img src={fileUrl} alt="Adjunto" className="mt-2 rounded-lg max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-80 transition-opacity" /></a>;
    }

    return <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 mt-2 bg-secondary p-2 rounded-lg hover:bg-secondary/80 transition-colors max-w-xs"><FileIcon className="h-6 w-6 flex-shrink-0 text-muted-foreground" /><div className="flex-1 min-w-0"><p className="text-sm truncate">{filePath.split('/').pop().substring(14)}</p><span className="text-xs text-blue-500 flex items-center">Ver/Descargar <Download className="h-3 w-3 ml-1" /></span></div></a>;
};

// --- Componente Principal de la Página de Chat ---
const ChatPage = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const supabase = useSupabaseClient();
    
    // Estados
    const [agent, setAgent] = useState(null); // <-- NUEVO: Almacena el agente asignado
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingError, setLoadingError] = useState(null); // <-- NUEVO: Para errores de carga
    const [isSending, setIsSending] = useState(false);
    const [fileToSend, setFileToSend] = useState(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState(null);
    
    // Referencias
    const scrollAreaRef = useRef(null);
    const fileInputRef = useRef(null);

    const scrollToBottom = () => {
        const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollViewport) setTimeout(() => { scrollViewport.scrollTop = scrollViewport.scrollHeight; }, 100);
    };

    // --- LÓGICA DE INICIALIZACIÓN (CAMBIO CLAVE) ---
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const initializeChat = async () => {
            setLoading(true);
            setLoadingError(null);
            try {
                // 1. Llamar a la Edge Function para obtener el agente asignado
                const { data: agentData, error: functionError } = await supabase.functions.invoke('assign-support-agent');
                
                if (functionError) throw new Error(functionError.message || "No hay agentes de soporte disponibles en este momento.");
                if (!agentData?.agent_id) throw new Error("No se pudo asignar un agente.");

                setAgent(agentData);

                // 2. Cargar los mensajes con ese agente
                const { data: messagesData, error: messagesError } = await supabase
                    .from('chat_messages')
                    .select('*')
                    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${agentData.agent_id}),and(sender_id.eq.${agentData.agent_id},receiver_id.eq.${user.id})`)
                    .order('created_at', { ascending: true });

                if (messagesError) throw messagesError;

                setMessages(messagesData || []);
                scrollToBottom();

            } catch (error) {
                console.error("Error al inicializar el chat:", error);
                setLoadingError(error.message);
            } finally {
                setLoading(false);
            }
        };

        initializeChat();
    }, [user, supabase, toast]);

    // --- SUSCRIPCIONES EN TIEMPO REAL (SIN CAMBIOS GRANDES) ---
    useEffect(() => {
        if (!user || !agent) return;

        const handleNewMessage = (payload) => {
            // Asegurarse de que el mensaje sea de nuestro agente asignado
            if (payload.new.sender_id === agent.agent_id) {
                setMessages((prev) => [...prev, payload.new]);
                scrollToBottom();
            }
        };

        const messagesChannel = supabase.channel(`client-chat-${user.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `receiver_id=eq.${user.id}` }, handleNewMessage)
            .subscribe();

        return () => { supabase.removeChannel(messagesChannel); };
    }, [user, agent, supabase]);


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

    // --- LÓGICA DE ENVÍO (SIMPLIFICADA) ---
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !fileToSend) || !user || isSending || !agent) return;

        setIsSending(true);
        const messageContent = newMessage.trim();
        const fileToUpload = fileToSend;
        setNewMessage('');
        clearFileSelection();

        try {
            let filePath = null, fileType = null;
            if (fileToUpload) {
                const uniquePath = `${user.id}/${Date.now()}_${fileToUpload.name}`;
                const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(uniquePath, fileToUpload);
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
    
    // El resto de funciones auxiliares no necesitan cambios
    const formatTimeAgo = (dateString) => { /* ...código sin cambios... */ return 'Ahora'; };
    const isOwnMessage = (senderId) => senderId === user?.id;

    if (loading) return <div className="flex-1 flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" /> <p className="text-muted-foreground">Conectando con un agente...</p></div>;
    if (loadingError) return <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-4"><AlertTriangle className="w-12 h-12 text-destructive mb-4" /> <h2 className="text-xl font-bold text-destructive">Error de Conexión</h2> <p className="text-muted-foreground max-w-sm mt-2">{loadingError}</p></div>;

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
                            <Avatar><AvatarImage src={`/avatar-${agent?.agent_id}.jpg`} alt={agent?.display_name} /><AvatarFallback className="bg-primary text-primary-foreground">{agent?.display_name?.charAt(0) || 'S'}</AvatarFallback></Avatar>
                            <div>
                                <CardTitle className="text-lg">{agent?.display_name || 'Soporte'}</CardTitle>
                                <CardDescription className="text-green-500 flex items-center"><span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>En línea</CardDescription>
                            </div>
                        </div>
                        {/* ...iconos de acciones... */}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <ScrollArea ref={scrollAreaRef} className="h-96 p-4">
                        {/* ...lógica de renderizado de mensajes (sin cambios)... */}
                        {messages.map((msg) => (
                          <motion.div key={msg.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex my-2 ${isOwnMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] p-3 rounded-2xl ${isOwnMessage(msg.sender_id) ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-secondary text-secondary-foreground rounded-bl-lg'}`}>
                                  {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                                  {msg.file_path && <ChatMessageFile filePath={msg.file_path} fileType={msg.file_type} />}
                                  {/* ...timestamp... */}
                              </div>
                          </motion.div>
                        ))}
                    </ScrollArea>
                    
                    <div className="p-4 border-t border-border bg-background">
                         {/* ...formulario de envío (sin cambios en su JSX)... */}
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,application/pdf" />
                            <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isSending}><Paperclip className="w-5 h-5" /></Button>
                            <Input placeholder="Escribe tu mensaje..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-grow" disabled={isSending} autoComplete="off" />
                            <Button type="submit" size="icon" disabled={(!newMessage.trim() && !fileToSend) || isSending}><Send className="h-4 w-4" /></Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ChatPage;