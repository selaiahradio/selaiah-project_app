
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
import { Calendar, Plus, Trash2, Save, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function AdminShowsPage() {
  const [editingShow, setEditingShow] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: shows, isLoading } = useQuery({
    queryKey: ['adminShows'],
    queryFn: () => base44.entities.RadioShow.list("-created_date"),
    initialData: [],
  });

  const createShowMutation = useMutation({
    mutationFn: (data) => base44.entities.RadioShow.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShows'] });
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['featuredShows'] });
      toast.success("Show creado exitosamente");
      setShowForm(false);
      setEditingShow(null);
    },
    onError: () => toast.error("Error al crear el show"),
  });

  const updateShowMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RadioShow.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShows'] });
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['featuredShows'] });
      toast.success("Show actualizado exitosamente");
      setShowForm(false);
      setEditingShow(null);
    },
    onError: () => toast.error("Error al actualizar el show"),
  });

  const deleteShowMutation = useMutation({
    mutationFn: (id) => base44.entities.RadioShow.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminShows'] });
      queryClient.invalidateQueries({ queryKey: ['shows'] });
      queryClient.invalidateQueries({ queryKey: ['featuredShows'] });
      toast.success("Show eliminado");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      image_url: formData.get('image_url') || null,
      host_name: formData.get('host_name') || null,
      day_of_week: formData.get('day_of_week'),
      start_time: formData.get('start_time') || null,
      end_time: formData.get('end_time') || null,
      is_featured: formData.get('is_featured') === 'on',
      status: formData.get('status'),
    };

    if (editingShow) {
      updateShowMutation.mutate({ id: editingShow.id, data });
    } else {
      createShowMutation.mutate(data);
    }
  };

  const handleEdit = (show) => {
    setEditingShow(show);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este show?")) {
      deleteShowMutation.mutate(id);
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
                <Calendar className="w-10 h-10 text-[#006cf0]" />
                Gestión de Shows
              </h1>
              <p className="text-gray-400">
                Administra los programas de tu radio cristiana
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingShow(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#0056c0] hover:from-[#0056c0] hover:to-[#0045a0] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Show
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
                {editingShow ? "Editar Show" : "Nuevo Show"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Título *</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingShow?.title}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingShow?.slug}
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
                    defaultValue={editingShow?.description}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="host_name" className="text-white">Nombre del Host</Label>
                    <Input
                      id="host_name"
                      name="host_name"
                      defaultValue={editingShow?.host_name}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-white">URL de Imagen</Label>
                    <Input
                      id="image_url"
                      name="image_url"
                      type="url"
                      defaultValue={editingShow?.image_url}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="day_of_week" className="text-white">Día de la Semana</Label>
                    <Select name="day_of_week" defaultValue={editingShow?.day_of_week || "Monday"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS.map((day, index) => (
                          <SelectItem key={day} value={day}>{DAYS_ES[index]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start_time" className="text-white">Hora de Inicio</Label>
                    <Input
                      id="start_time"
                      name="start_time"
                      type="time"
                      defaultValue={editingShow?.start_time}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_time" className="text-white">Hora de Fin</Label>
                    <Input
                      id="end_time"
                      name="end_time"
                      type="time"
                      defaultValue={editingShow?.end_time}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <Switch
                      id="is_featured"
                      name="is_featured"
                      defaultChecked={editingShow?.is_featured || false}
                    />
                    <Label htmlFor="is_featured" className="text-white cursor-pointer">
                      Show Destacado
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-white">Estado</Label>
                    <Select name="status" defaultValue={editingShow?.status || "active"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="inactive">Inactivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createShowMutation.isPending || updateShowMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#0056c0] hover:from-[#0056c0] hover:to-[#0045a0] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingShow ? "Actualizar" : "Crear"} Show
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingShow(null);
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

        {/* Shows List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : shows.length > 0 ? (
            shows.map((show) => (
              <Card key={show.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {show.image_url && (
                      <img
                        src={show.image_url}
                        alt={show.title}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{show.title}</h3>
                        {show.is_featured && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300">
                            Destacado
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          show.status === 'active'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {show.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {show.description && (
                        <p className="text-gray-400 text-sm mb-2">{show.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        {show.host_name && <span>🎙️ {show.host_name}</span>}
                        {show.day_of_week && <span>📅 {DAYS_ES[DAYS.indexOf(show.day_of_week)]}</span>}
                        {show.start_time && show.end_time && (
                          <span>🕐 {show.start_time} - {show.end_time}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(show)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(show.id)}
                      className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay shows configurados</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#0056c0] hover:from-[#0056c0] hover:to-[#0045a0] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Show
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
