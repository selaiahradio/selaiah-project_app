import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, Trash2, Save, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminEventsPage() {
  const [editingEvent, setEditingEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ['adminEvents'],
    queryFn: () => base44.entities.Event.list("-event_date"),
    initialData: [],
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success("Evento creado exitosamente");
      setShowForm(false);
      setEditingEvent(null);
    },
    onError: () => toast.error("Error al crear el evento"),
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success("Evento actualizado exitosamente");
      setShowForm(false);
      setEditingEvent(null);
    },
    onError: () => toast.error("Error al actualizar el evento"),
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminEvents'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success("Evento eliminado");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      event_date: formData.get('event_date'),
      location: formData.get('location') || null,
      image_url: formData.get('image_url') || null,
      ticket_url: formData.get('ticket_url') || null,
      price: formData.get('price') || null,
      status: formData.get('status'),
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data });
    } else {
      createEventMutation.mutate(data);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este evento?")) {
      deleteEventMutation.mutate(id);
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
                <CalendarIcon className="w-10 h-10 text-[#006cf0]" />
                Gestión de Eventos
              </h1>
              <p className="text-gray-400">
                Conciertos, conferencias y actividades cristianas
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingEvent(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Evento
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
                {editingEvent ? "Editar Evento" : "Nuevo Evento"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Título *</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingEvent?.title}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingEvent?.slug}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descripción</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingEvent?.description}
                    className="bg-white/10 border-white/20 text-white"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="event_date" className="text-white">Fecha y Hora *</Label>
                    <Input
                      id="event_date"
                      name="event_date"
                      type="datetime-local"
                      defaultValue={editingEvent?.event_date ? new Date(editingEvent.event_date).toISOString().slice(0, 16) : ''}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white">Estado</Label>
                    <Select name="status" defaultValue={editingEvent?.status || "upcoming"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Próximo</SelectItem>
                        <SelectItem value="ongoing">En Curso</SelectItem>
                        <SelectItem value="completed">Finalizado</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-white">Ubicación</Label>
                    <Input
                      id="location"
                      name="location"
                      defaultValue={editingEvent?.location}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Iglesia Central, Ciudad"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-white">Precio</Label>
                    <Input
                      id="price"
                      name="price"
                      defaultValue={editingEvent?.price}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Gratis / $20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-white">URL de Imagen</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    defaultValue={editingEvent?.image_url}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ticket_url" className="text-white">URL de Tickets</Label>
                  <Input
                    id="ticket_url"
                    name="ticket_url"
                    type="url"
                    defaultValue={editingEvent?.ticket_url}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="https://tickets.com/evento"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createEventMutation.isPending || updateEventMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingEvent ? "Actualizar" : "Crear"} Evento
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEvent(null);
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

        {/* Events List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : events.length > 0 ? (
            events.map((event) => (
              <Card key={event.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {event.image_url && (
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{event.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                          event.status === 'ongoing' ? 'bg-green-500/20 text-green-300' :
                          event.status === 'completed' ? 'bg-gray-500/20 text-gray-300' :
                          'bg-red-500/20 text-red-300'
                        }`}>
                          {event.status === 'upcoming' && 'Próximo'}
                          {event.status === 'ongoing' && 'En Curso'}
                          {event.status === 'completed' && 'Finalizado'}
                          {event.status === 'cancelled' && 'Cancelado'}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{event.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {format(new Date(event.event_date), "d/MM/yyyy HH:mm")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                        {event.price && <span>💵 {event.price}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(event)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(event.id)}
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
              <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay eventos creados</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Evento
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}