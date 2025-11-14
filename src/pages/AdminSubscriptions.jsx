import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Search, Trash2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminSubscriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ['adminSubscriptions'],
    queryFn: () => base44.entities.PushSubscription.list("-created_date"),
    initialData: [],
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.PushSubscription.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      toast.success("Suscripción actualizada");
    },
  });

  const deleteSubscriptionMutation = useMutation({
    mutationFn: (id) => base44.entities.PushSubscription.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSubscriptions'] });
      toast.success("Suscripción eliminada");
    },
  });

  const handleToggleActive = (subscription) => {
    toggleActiveMutation.mutate({
      id: subscription.id,
      is_active: !subscription.is_active
    });
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar esta suscripción?")) {
      deleteSubscriptionMutation.mutate(id);
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => 
    sub.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.device_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.is_active).length,
    inactive: subscriptions.filter(s => !s.is_active).length,
    web: subscriptions.filter(s => s.device_type === 'web').length,
    mobile: subscriptions.filter(s => s.device_type === 'ios' || s.device_type === 'android').length,
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
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
              <Users className="w-10 h-10 text-[#006cf0]" />
              Suscripciones Push
            </h1>
            <p className="text-gray-400">
              Usuarios suscritos a notificaciones push
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Activas</p>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Inactivas</p>
            <p className="text-2xl font-bold text-red-400">{stats.inactive}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Web</p>
            <p className="text-2xl font-bold text-blue-400">{stats.web}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Móvil</p>
            <p className="text-2xl font-bold text-purple-400">{stats.mobile}</p>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por email o dispositivo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
        </Card>

        {/* Subscriptions List */}
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredSubscriptions.length > 0 ? (
            filteredSubscriptions.map((subscription) => (
              <Card key={subscription.id} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      subscription.is_active ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {subscription.is_active ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold">{subscription.user_email || 'Usuario anónimo'}</p>
                        <Badge className={`${
                          subscription.device_type === 'web' ? 'bg-blue-500/20 text-blue-300' :
                          subscription.device_type === 'ios' ? 'bg-gray-500/20 text-gray-300' :
                          'bg-green-500/20 text-green-300'
                        }`}>
                          {subscription.device_type}
                        </Badge>
                        {subscription.topics && subscription.topics.length > 0 && (
                          <Badge className="bg-purple-500/20 text-purple-300">
                            {subscription.topics.length} tópicos
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span>Creada: {format(new Date(subscription.created_date), "d/MM/yyyy")}</span>
                        {subscription.last_used && (
                          <span>Último uso: {format(new Date(subscription.last_used), "d/MM/yyyy HH:mm")}</span>
                        )}
                        {subscription.topics && subscription.topics.length > 0 && (
                          <span>Tópicos: {subscription.topics.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleToggleActive(subscription)}
                      className={subscription.is_active 
                        ? "bg-orange-600 hover:bg-orange-700 text-white"
                        : "bg-green-600 hover:bg-green-700 text-white"
                      }
                    >
                      {subscription.is_active ? 'Desactivar' : 'Activar'}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(subscription.id)}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {searchQuery ? "No se encontraron suscripciones" : "No hay suscripciones aún"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}