import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Minimize2,
  Search,
  Phone,
  Video,
  MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function UserChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // Obtener conversaciones
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      const convs = await base44.entities.ChatConversation.filter(
        { participants: { $in: [currentUser.email] } },
        '-last_message_at'
      );
      return convs;
    },
    enabled: !!currentUser,
    refetchInterval: 5000
  });

  // Obtener mensajes de la conversación seleccionada
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', selectedConversation?.id],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const msgs = await base44.entities.ChatMessage.filter(
        { conversation_id: selectedConversation.id },
        'created_date'
      );
      return msgs;
    },
    enabled: !!selectedConversation,
    refetchInterval: 2000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message }) => {
      const msg = await base44.entities.ChatMessage.create({
        conversation_id: conversationId,
        sender_email: currentUser.email,
        sender_name: currentUser.full_name,
        sender_avatar: currentUser.avatar_url,
        message,
        message_type: 'text'
      });

      // Actualizar la conversación
      await base44.entities.ChatConversation.update(conversationId, {
        last_message: message,
        last_message_at: new Date().toISOString(),
        last_message_sender: currentUser.email
      });

      return msg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setInputMessage("");
    },
    onError: () => {
      toast.error("Error al enviar mensaje");
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      message: inputMessage
    });
  };

  const getOtherParticipant = (conversation) => {
    const otherEmail = conversation.participants.find(p => p !== currentUser?.email);
    return {
      name: conversation.participant_names?.[otherEmail] || 'Usuario',
      avatar: conversation.participant_avatars?.[otherEmail],
      email: otherEmail
    };
  };

  if (!currentUser) return null;

  return (
    <div className="hidden lg:block fixed bottom-0 right-6 z-50">
      {/* Lista de conversaciones */}
      <AnimatePresence>
        {isOpen && !selectedConversation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mb-4"
          >
            <Card className="w-80 bg-slate-900 border-white/10 shadow-2xl max-h-96 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between">
                <h3 className="font-semibold text-white">Mensajes</h3>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-2">
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Buscar conversaciones..."
                    className="pl-8 bg-white/10 border-white/20 text-white text-sm"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-64">
                {conversations.length > 0 ? (
                  conversations.map((conv) => {
                    const other = getOtherParticipant(conv);
                    const unread = conv.unread_count?.[currentUser.email] || 0;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className="w-full p-3 hover:bg-white/5 transition flex items-center gap-3 border-b border-white/5"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                          {other.avatar ? (
                            <img src={other.avatar} alt={other.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            other.name[0]
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-white text-sm truncate">{other.name}</p>
                            {conv.last_message_at && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(conv.last_message_at), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate">{conv.last_message || 'Sin mensajes'}</p>
                        </div>
                        {unread > 0 && (
                          <Badge className="bg-blue-600 text-white">{unread}</Badge>
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No hay conversaciones</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Ventana de conversación */}
        {selectedConversation && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="mb-4"
          >
            <Card className="w-80 bg-slate-900 border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSelectedConversation(null)}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                    {getOtherParticipant(selectedConversation).name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">
                      {getOtherParticipant(selectedConversation).name}
                    </p>
                    <p className="text-xs text-white/80">En línea</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/10">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="h-80 overflow-y-auto p-3 space-y-2 bg-slate-950">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_email === currentUser.email ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                        msg.sender_email === currentUser.email
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-60">
                        {format(new Date(msg.created_date), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                ))}
                {sendMessageMutation.isPending && (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 rounded-2xl px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-white/10 bg-slate-900">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Escribe un mensaje..."
                    className="bg-white/10 border-white/20 text-white text-sm"
                    disabled={sendMessageMutation.isPending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputMessage.trim() || sendMessageMutation.isPending}
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante */}
      {!isOpen && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg relative"
          >
            <MessageCircle className="w-6 h-6 text-white" />
            {conversations.some(c => c.unread_count?.[currentUser?.email] > 0) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {conversations.reduce((acc, c) => acc + (c.unread_count?.[currentUser?.email] || 0), 0)}
              </span>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}