
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, Save, ArrowLeft, Send, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminNotificationsPage() {
  const [editingNotif, setEditingNotif] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['adminNotifications'],
    queryFn: () => base44.entities.PushNotification.list("-created_date"),
    initialData: [],
  });

  const createNotifMutation = useMutation({
    mutationFn: (data) => base44.entities.PushNotification.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      toast.success("Notificación creada");
      setShowForm(false);
      setEditingNotif(null);
    },
    onError: () => toast.error("Error al crear la notificación"),
  });

  const updateNotifMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PushNotification.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      toast.success("Notificación actualizada");
      setShowForm(false);
      setEditingNotif(null);
    },
    onError: () => toast.error("Error al actualizar la notificación"),
  });

  const deleteNotifMutation = useMutation({
    mutationFn: (id) => base44.entities.PushNotification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      toast.success("Notificación eliminada");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      body: formData.get('body'),
      image_url: formData.get('image_url') || null,
      icon_url: formData.get('icon_url') || null,
      click_action: formData.get('click_action') || '/',
      topic: formData.get('topic'),
      status: formData.get('schedule') === 'on' ? 'scheduled' : 'draft',
      scheduled_for: formData.get('schedule') === 'on' ? formData.get('scheduled_for') : null,
    };

    if (editingNotif) {
      updateNotifMutation.mutate({ id: editingNotif.id, data });
    } else {
      createNotifMutation.mutate(data);
    }
  };

  const handleSendNow = async (notificationId) => {
    if (!confirm("¿Enviar esta notificación ahora a todos los suscriptores?")) return;
    
    setIsSending(true);
    try {
      const result = await base44.functions.invoke('sendPushNotification', {
        notificationId,
        immediate: true
      });
      
      if (result.data.success) {
        toast.success(`Notificación enviada a ${result.data.sent} usuarios`);
        queryClient.invalidateQueries({ queryKey: ['adminNotifications'] });
      } else {
        toast.error("Error enviando notificación");
      }
    } catch (error) {
      toast.error("Error enviando notificación");
    } finally {
      setIsSending(false);
    }
  };

  const handleEdit = (notif) => {
    setEditingNotif(notif);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar esta notificación?")) {
      deleteNotifMutation.mutate(id);
    }
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Bell className="w-10 h-10 text-[#006cf0]" />
                Notificaciones Push
              </h1>
              <p className="text-gray-400">
                Envía notificaciones a los usuarios de la app
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingNotif(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Notificación
            </Button>
          </div>
        </motion.div>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingNotif ? "Editar Notificación" : "Nueva Notificación"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Título *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingNotif?.title}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Nuevo show cristiano"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body" className="text-white">Mensaje *</Label>
                  <Textarea
                    id="body"
                    name="body"
                    defaultValue={editingNotif?.body}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                    placeholder="Sintoniza nuestro nuevo programa de alabanza..."
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-white">URL de Imagen</Label>
                    <Input
                      id="image_url"
                      name="image_url"
                      type="url"
                      defaultValue={editingNotif?.image_url}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon_url" className="text-white">URL de Icono</Label>
                    <Input
                      id="icon_url"
                      name="icon_url"
                      type="url"
                      defaultValue={editingNotif?.icon_url}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="click_action" className="text-white">URL de Acción</Label>
                    <Input
                      id="click_action"
                      name="click_action"
                      defaultValue={editingNotif?.click_action || '/'}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="/"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topic" className="text-white">Tópico</Label>
                    <Select name="topic" defaultValue={editingNotif?.topic || "all"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="news">Noticias</SelectItem>
                        <SelectItem value="events">Eventos</SelectItem>
                        <SelectItem value="shows">Shows</SelectItem>
                        <SelectItem value="music">Música</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Switch id="schedule" name="schedule" />
                    <Label htmlFor="schedule" className="text-white cursor-pointer">
                      Programar envío
                    </Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_for" className="text-white">Fecha y Hora</Label>
                    <Input
                      id="scheduled_for"
                      name="scheduled_for"
                      type="datetime-local"
                      defaultValue={editingNotif?.scheduled_for ? new Date(editingNotif.scheduled_for).toISOString().slice(0, 16) : ''}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createNotifMutation.isPending || updateNotifMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingNotif(null);
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <Card key={notif.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{notif.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        notif.status === 'sent' ? 'bg-green-500/20 text-green-300' :
                        notif.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
                        notif.status === 'failed' ? 'bg-red-500/20 text-red-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {notif.status === 'sent' && 'Enviada'}
                        {notif.status === 'scheduled' && 'Programada'}
                        {notif.status === 'failed' && 'Fallida'}
                        {notif.status === 'draft' && 'Borrador'}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300">
                        {notif.topic}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-2">{notif.body}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                      {notif.sent_at && (
                        <span>Enviada: {format(new Date(notif.sent_at), "d/MM/yyyy HH:mm")}</span>
                      )}
                      {notif.scheduled_for && notif.status === 'scheduled' && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Programada: {format(new Date(notif.scheduled_for), "d/MM/yyyy HH:mm")}
                        </span>
                      )}
                      {notif.sent_count > 0 && <span>👥 {notif.sent_count} enviadas</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(notif.status === 'draft' || notif.status === 'scheduled') && (
                      <Button
                        size="sm"
                        onClick={() => handleSendNow(notif.id)}
                        disabled={isSending}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Enviar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleEdit(notif)}
                      disabled={notif.status === 'sent'}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(notif.id)}
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
              <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay notificaciones</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Notificación
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
