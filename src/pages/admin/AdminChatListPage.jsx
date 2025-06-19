import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from 'react-router-dom';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminData } from '@/hooks/useAdminData';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const AdminChatListPage = () => {
  const { fetchChatMessages, loading } = useAdminData();
  const { user } = useSupabaseAuth();
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    const result = await fetchChatMessages();
    if (result.success) {
      // Group messages by client and get the latest message for each
      const chatMap = new Map();
      
      result.data.forEach(message => {
        // Determine if this is a client message (sender is not admin) or admin message (receiver is not admin)
        const isClientMessage = message.sender_id !== user?.id;
        const clientId = isClientMessage ? message.sender_id : message.receiver_id;
        const clientInfo = isClientMessage ? message.sender : message.receiver;
        
        if (clientId && clientInfo) {
          const existingChat = chatMap.get(clientId);
          if (!existingChat || new Date(message.created_at) > new Date(existingChat.timestamp)) {
            chatMap.set(clientId, {
              id: clientId,
              name: clientInfo.full_name || 'Usuario Sin Nombre',
              email: clientInfo.email || '',
              lastMessage: message.content,
              timestamp: message.created_at,
              unread: message.is_read ? 0 : 1, // Simplified unread count
              avatar: null
            });
          }
        }
      });

      const chatList = Array.from(chatMap.values()).sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setChats(chatList);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Ahora';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else if (diffInHours < 48) {
      return 'Ayer';
    } else {
      return `${Math.floor(diffInHours / 24)}d`;
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-10rem)] flex flex-col">
      <div className="flex-shrink-0">
        <h1 className="text-3xl font-bold text-foreground">Chats con Clientes</h1>
        <p className="text-muted-foreground">Gestiona las conversaciones con los clientes en tiempo real.</p>
      </div>

      <Card className="bg-card border-border shadow-lg flex-grow flex flex-col">
        <CardHeader className="border-b border-border flex-shrink-0">
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent className="p-0 flex-grow">
          <ScrollArea className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Cargando chats...</p>
              </div>
            ) : filteredChats.length > 0 ? filteredChats.map((chat) => (
              <Link key={chat.id} to={`/admin/chat/${chat.id}`} className="block hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4 p-4 border-b border-border last:border-b-0">
                  <Avatar>
                    <AvatarImage src={chat.avatar} alt={chat.name} />
                    <AvatarFallback>{chat.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div className="flex-grow">
                    <p className="font-medium text-foreground">{chat.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-[calc(100%-50px)]">{chat.lastMessage}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted-foreground">{formatTimestamp(chat.timestamp)}</p>
                    {chat.unread > 0 && (
                      <span className="mt-1 inline-block bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            )) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground italic">No se encontraron chats.</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminChatListPage;