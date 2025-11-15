
import React, { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Minimize2, Search, Phone, Video, MoreVertical, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { appParams } from "@/lib/app-params";
import { useSocket } from "@/lib/SocketContext";

// API fetching logic remains for initial data load
const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const token = appParams.token;

const fetcher = async (path, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error on ${path}:`, errorBody);
    throw new Error(`Failed to fetch ${path}. Status: ${response.status}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return null;
};

const getMe = () => {
  if (!token) return Promise.resolve(null);
  return fetcher('/auth/me').catch(() => null);
};

const fetchConversations = (userEmail) => {
  if (!userEmail) return Promise.resolve([]);
  return fetcher(`/chat_conversations?participants_in=${userEmail}&sort=-last_message_at`);
};

const fetchMessages = (conversationId) => {
  if (!conversationId) return Promise.resolve([]);
  return fetcher(`/chat_messages?conversation_id=${conversationId}&sort=created_date`);
};

export default function UserChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();
  const socket = useSocket();

  useEffect(() => {
    getMe().then(setCurrentUser);
  }, []);

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', currentUser?.email],
    queryFn: () => fetchConversations(currentUser.email),
    enabled: !!currentUser,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: () => fetchMessages(selectedConversation.id),
    enabled: !!selectedConversation,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!socket || !currentUser) return;

    const handleNewMessage = (newMessage) => {
        queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.email]});

        if (newMessage.conversation_id === selectedConversation?.id) {
            queryClient.setQueryData(['messages', selectedConversation.id], (oldData) => {
                if (!oldData) return [newMessage];
                if (oldData.some(msg => msg.id === newMessage.id)) return oldData;
                return [...oldData, newMessage];
            });
        } else {
            const conversation = conversations.find(c => c.id === newMessage.conversation_id);
            const otherParticipant = getOtherParticipantForDisplay(conversation);
            toast.info(`Nuevo mensaje de ${otherParticipant?.name || 'un usuario'}` , {
                description: newMessage.message,
                action: {
                  label: 'Abrir',
                  onClick: () => {
                    setIsOpen(true);
                    setSelectedConversation(conversation);
                  }
                }
            });
        }
    };

    socket.on('private message', handleNewMessage);

    return () => {
      socket.off('private message', handleNewMessage);
    };
  }, [socket, currentUser, selectedConversation, queryClient, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputMessage.trim() || !selectedConversation || !socket) return;
    
    const tempId = `temp-${Date.now()}`;
    const messagePayload = {
      id: tempId,
      conversation_id: selectedConversation.id,
      sender_email: currentUser.email,
      sender_name: currentUser.full_name,
      sender_avatar: currentUser.avatar_url,
      message: inputMessage.trim(),
      created_at: new Date().toISOString(),
    };

    // Optimistically update UI
    queryClient.setQueryData(['messages', selectedConversation.id], (oldData) => [...(oldData || []), messagePayload]);
    queryClient.invalidateQueries({ queryKey: ['conversations', currentUser.email]});

    socket.emit('private message', messagePayload);
    setInputMessage("");
  };

   const getOtherParticipantForDisplay = (conversation) => {
     if (!conversation || !currentUser) return { name: 'Usuario' };
     const otherEmail = conversation.participants.find(p => p !== currentUser?.email);
     return {
        name: conversation.participant_names?.[otherEmail] || 'Usuario',
        avatar: conversation.participant_avatars?.[otherEmail],
        email: otherEmail
     }
  }

  if (!currentUser) return null;

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count?.[currentUser?.email] || 0), 0);

  return (
     <div className="hidden lg:block fixed bottom-0 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="mb-4"
          >
            <Card className="w-80 bg-slate-900 border-white/10 shadow-2xl overflow-hidden">
              {selectedConversation ? (
                <>
                  {/* Header de Conversación */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setSelectedConversation(null)} className="text-white hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {getOtherParticipantForDisplay(selectedConversation).name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">{getOtherParticipantForDisplay(selectedConversation).name}</p>
                        <p className="text-xs text-white/80">En línea</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Mensajes */}
                  <div className="h-80 overflow-y-auto p-3 space-y-2 bg-slate-950">
                    {messages.map((msg) => (
                      <div key={msg.id || msg.tempId} className={`flex ${msg.sender_email === currentUser.email ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${msg.sender_email === currentUser.email ? 'bg-blue-600 text-white' : 'bg-white/10 text-white'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-xs mt-1 opacity-60 text-right">{format(new Date(msg.created_at || msg.created_date), 'HH:mm')}</p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-3 border-t border-white/10 bg-slate-900">
                    <div className="flex gap-2">
                      <Input value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribe un mensaje..." className="bg-white/10 border-white/20 text-white text-sm" />
                      <Button onClick={handleSend} disabled={!inputMessage.trim()} size="icon" className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"><Send className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Header de Lista de Conversaciones */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between">
                    <h3 className="font-semibold text-white">Mensajes</h3>
                    <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="text-white hover:bg-white/10">
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Lista de Conversaciones */}
                  <div className="overflow-y-auto max-h-96">
                    {conversations.length > 0 ? (
                      conversations.map((conv) => {
                        const other = getOtherParticipantForDisplay(conv);
                        const unread = conv.unread_count?.[currentUser.email] || 0;
                        return (
                          <button key={conv.id} onClick={() => setSelectedConversation(conv)} className="w-full p-3 hover:bg-white/5 transition flex items-center gap-3 border-b border-white/5 text-left">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {other.avatar ? <img src={other.avatar} alt={other.name} className="w-full h-full rounded-full object-cover" /> : other.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-semibold text-white text-sm truncate">{other.name}</p>
                                {conv.last_message_at && <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{format(new Date(conv.last_message_at), 'HH:mm')}</span>}
                              </div>
                              <p className={`text-xs truncate ${unread > 0 ? 'text-white font-bold' : 'text-gray-400'}`}>{conv.last_message || 'Sin mensajes'}</p>
                            </div>
                            {unread > 0 && <Badge className="bg-blue-600 text-white ml-2">{unread}</Badge>}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center"><MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" /><p className="text-gray-400 text-sm">No hay conversaciones</p></div>
                    )}
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <Button onClick={() => setIsOpen(true)} className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg relative">
            <MessageCircle className="w-7 h-7 text-white" />
            {totalUnread > 0 && <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold border-2 border-slate-900">{totalUnread > 9 ? '9+' : totalUnread}</span>}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
