import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, ArrowLeft, Search, Trash2, Eye, Check } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminMessagesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['adminMessages'],
    queryFn: () => base44.entities.Contact.list("-created_date"),
    initialData: [],
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Contact.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      toast.success("Estado actualizado");
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminMessages'] });
      toast.success("Mensaje eliminado");
      setSelectedMessage(null);
    },
  });

  const handleMarkAsRead = (message) => {
    if (message.status === 'new') {
      updateStatusMutation.mutate({ id: message.id, status: 'read' });
    }
    setSelectedMessage(message);
  };

  const handleMarkAsReplied = (id) => {
    updateStatusMutation.mutate({ id, status: 'replied' });
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este mensaje?")) {
      deleteMessageMutation.mutate(id);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         msg.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         msg.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         msg.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || msg.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: messages.length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Mail className="w-10 h-10 text-[#006cf0]" />
              Mensajes de Contacto
            </h1>
            <p className="text-gray-400">
              Mensajes recibidos desde el formulario de contacto
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Nuevos</p>
            <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Leídos</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.read}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Respondidos</p>
            <p className="text-2xl font-bold text-green-400">{stats.replied}</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Messages List */}
          <div className="lg:col-span-5">
            {/* Search and Filter */}
            <Card className="bg-white/5 border-white/10 p-4 mb-4">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar mensajes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setFilter('all')}
                  variant={filter === 'all' ? 'default' : 'outline'}
                  className={filter === 'all' 
                    ? 'bg-[#006cf0] hover:bg-[#00479e]'
                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                  }
                >
                  Todos
                </Button>
                <Button
                  size="sm"
                  onClick={() => setFilter('new')}
                  variant={filter === 'new' ? 'default' : 'outline'}
                  className={filter === 'new'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                  }
                >
                  Nuevos
                </Button>
                <Button
                  size="sm"
                  onClick={() => setFilter('read')}
                  variant={filter === 'read' ? 'default' : 'outline'}
                  className={filter === 'read'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                  }
                >
                  Leídos
                </Button>
                <Button
                  size="sm"
                  onClick={() => setFilter('replied')}
                  variant={filter === 'replied' ? 'default' : 'outline'}
                  className={filter === 'replied'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'border-white/20 text-gray-300 hover:bg-white/10'
                  }
                >
                  Respondidos
                </Button>
              </div>
            </Card>

            {/* Messages */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
                ))
              ) : filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <Card
                    key={message.id}
                    onClick={() => handleMarkAsRead(message)}
                    className={`bg-white/5 border-white/10 p-4 cursor-pointer hover:bg-white/10 transition ${
                      selectedMessage?.id === message.id ? 'ring-2 ring-[#006cf0]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold">{message.name}</p>
                          <Badge className={`${
                            message.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                            message.status === 'read' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-green-500/20 text-green-300'
                          }`}>
                            {message.status === 'new' && 'Nuevo'}
                            {message.status === 'read' && 'Leído'}
                            {message.status === 'replied' && 'Respondido'}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm">{message.email}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(message.created_date), "d/MM HH:mm")}
                      </p>
                    </div>
                    {message.subject && (
                      <p className="text-white text-sm font-medium mb-1">{message.subject}</p>
                    )}
                    <p className="text-gray-400 text-sm line-clamp-2">{message.message}</p>
                  </Card>
                ))
              ) : (
                <Card className="bg-white/5 border-white/10 p-12 text-center">
                  <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">
                    {searchQuery ? "No se encontraron mensajes" : "No hay mensajes"}
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-7">
            {selectedMessage ? (
              <Card className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      {selectedMessage.subject || 'Sin asunto'}
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                      <span className="font-semibold text-white">{selectedMessage.name}</span>
                      <span>•</span>
                      <a href={`mailto:${selectedMessage.email}`} className="text-blue-400 hover:underline">
                        {selectedMessage.email}
                      </a>
                      {selectedMessage.phone && (
                        <>
                          <span>•</span>
                          <span>{selectedMessage.phone}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(selectedMessage.created_date), "d 'de' MMMM, yyyy 'a las' HH:mm")}
                    </p>
                  </div>
                  <Badge className={`${
                    selectedMessage.status === 'new' ? 'bg-blue-500/20 text-blue-300' :
                    selectedMessage.status === 'read' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {selectedMessage.status === 'new' && 'Nuevo'}
                    {selectedMessage.status === 'read' && 'Leído'}
                    {selectedMessage.status === 'replied' && 'Respondido'}
                  </Badge>
                </div>

                <div className="bg-white/5 rounded-lg p-6 mb-6 border border-white/10">
                  <p className="text-white leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'Tu mensaje'}`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-[#006cf0] hover:bg-[#00479e] text-white">
                      <Mail className="w-4 h-4 mr-2" />
                      Responder por Email
                    </Button>
                  </a>
                  
                  {selectedMessage.status !== 'replied' && (
                    <Button
                      onClick={() => handleMarkAsReplied(selectedMessage.id)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Marcar Respondido
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => handleDelete(selectedMessage.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="bg-white/5 border-white/10 p-12 text-center h-full flex items-center justify-center">
                <div>
                  <Eye className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-xl text-gray-400">
                    Selecciona un mensaje para ver los detalles
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}