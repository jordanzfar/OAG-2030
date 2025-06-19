import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, ArrowLeft } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useAdminData } from '@/hooks/useAdminData';
import { supabase } from '@/lib/supabase';

const AdminChatInstancePage = () => {
  const { clientId } = useParams();
  const { user } = useSupabaseAuth();
  const { sendAdminMessage } = useAdminData();
  
  const [clientInfo, setClientInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId && user) {
      loadChatData();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel(`chat_${clientId}`)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chat_messages',
            filter: `or(and(sender_id.eq.${clientId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${clientId}))`
          }, 
          (payload) => {
            setMessages(prev => [...prev, payload.new]);
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [clientId, user]);

  const loadChatData = async () => {
    try {
      // Load client info
      const { data: clientData, error: clientError } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', clientId)
        .single();

      if (clientError) {
        console.error('Error loading client info:', clientError);
        setClientInfo({ id: clientId, full_name: 'Cliente Desconocido', email: '' });
      } else {
        setClientInfo(clientData);
      }

      // Load chat messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${clientId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${clientId})`)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
      } else {
        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !clientInfo || !user) return;

    const result = await sendAdminMessage(clientId, newMessage);
    if (result.success) {
      setNewMessage('');
      // Message will be added via real-time subscription
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando chat...</p>
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cliente no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex items-center space-x-4 flex-shrink-0">
        <Button variant="outline" size="icon" asChild>
          <Link to="/admin/chat">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat con {clientInfo.full_name}</h1>
          <p className="text-muted-foreground text-sm">{clientInfo.email}</p>
        </div>
      </div>

      <Card className="bg-card border-border shadow-lg flex-grow flex flex-col">
        <CardHeader className="border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={null} alt={clientInfo.full_name} />
              <AvatarFallback>{clientInfo.full_name?.split(' ').map(n => n[0]).join('') || 'C'}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{clientInfo.full_name}</CardTitle>
              <CardDescription className="text-green-500">En línea</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex flex-col">
          <ScrollArea className="flex-grow p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-lg ${
                    msg.sender_id === user.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender_id === user.id 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    } text-right`}>
                      {formatTimestamp(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-border flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <Input
                placeholder="Escribe tu respuesta..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatInstancePage;