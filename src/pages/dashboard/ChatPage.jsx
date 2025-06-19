
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Phone, Video, MoreVertical } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useSupabaseData } from '@/hooks/useSupabaseData';

const ChatPage = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { createChatMessage, fetchRecords } = useSupabaseData();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;

    const result = await fetchRecords('chat_messages', {}, {
      orderBy: { column: 'created_at', ascending: true }
    });

    if (result.success) {
      // Filter messages for current user
      const userMessages = (result.data || []).filter(msg => 
        msg.sender_id === user.id || msg.receiver_id === user.id
      );
      setMessages(userMessages);
    }
    setLoading(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !user || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      // Create message in database
      const result = await createChatMessage(
        user.id,
        'support-user-id', // This would be the actual support user ID
        messageContent
      );

      if (result.success) {
        // Add message to local state immediately
        const newMsg = {
          id: result.data.id,
          sender_id: user.id,
          receiver_id: 'support-user-id',
          content: messageContent,
          created_at: new Date().toISOString(),
          is_read: true
        };
        
        setMessages(prev => [...prev, newMsg]);

        // Simulate auto-reply from support
        setIsTyping(true);
        setTimeout(async () => {
          try {
            const replyResult = await createChatMessage(
              'support-user-id',
              user.id,
              'Gracias por tu mensaje. Un agente especializado te responderá en breve. Mientras tanto, puedes revisar nuestras FAQ en el portal.'
            );

            if (replyResult.success) {
              const replyMsg = {
                id: replyResult.data.id,
                sender_id: 'support-user-id',
                receiver_id: user.id,
                content: 'Gracias por tu mensaje. Un agente especializado te responderá en breve. Mientras tanto, puedes revisar nuestras FAQ en el portal.',
                created_at: new Date().toISOString(),
                is_read: false
              };
              
              setMessages(prev => [...prev, replyMsg]);
            }
          } catch (error) {
            console.error('Error sending auto-reply:', error);
          } finally {
            setIsTyping(false);
          }
        }, 2000);

        toast({
          title: "Mensaje Enviado",
          description: "Tu mensaje ha sido enviado exitosamente.",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Error al Enviar Mensaje",
        description: "No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.",
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const isOwnMessage = (senderId) => {
    return senderId === user?.id;
  };

  if (loading) {
    return (
      <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Cargando chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground">Chat de Soporte</h1>
        <p className="text-muted-foreground">
          Comunícate directamente con nuestro equipo de soporte especializado.
        </p>
      </div>

      <Card className="bg-card border-border shadow-lg flex-grow flex flex-col">
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
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  En línea - Tiempo de respuesta: ~5 min
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Phone className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Video className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 flex-grow flex flex-col">
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No hay mensajes aún. ¡Inicia la conversación!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${isOwnMessage(msg.sender_id) ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-lg ${
                        isOwnMessage(msg.sender_id) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className={`text-xs ${
                            isOwnMessage(msg.sender_id) 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {formatTimeAgo(msg.created_at)}
                          </p>
                          {!msg.is_read && !isOwnMessage(msg.sender_id) && (
                            <span className="w-2 h-2 bg-primary rounded-full ml-2"></span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-secondary text-secondary-foreground p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t border-border flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <Input
                placeholder="Escribe tu mensaje..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow"
                maxLength={1000}
                disabled={isSending}
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Nuestro equipo de soporte está disponible 24/7 para ayudarte con tus consultas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatPage;
