
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Radio, Plus, Trash2, Save, Settings, Check, X, ArrowLeft, Power, Edit } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StreamSettingsPage() {
  const [editingStream, setEditingStream] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: streams, isLoading } = useQuery({
    queryKey: ['streamConfigs'],
    queryFn: () => base44.entities.StreamConfig.list("-created_date"),
    initialData: [],
  });

  const activeStream = streams.find(s => s.is_active && s.is_primary) || streams.find(s => s.is_active);

  const createStreamMutation = useMutation({
    mutationFn: (data) => base44.entities.StreamConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['streamConfig'] });
      toast.success("Stream configurado exitosamente");
      setShowForm(false);
      setEditingStream(null);
    },
    onError: () => {
      toast.error("Error al crear el stream");
    }
  });

  const updateStreamMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.StreamConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['streamConfig'] });
      toast.success("Stream actualizado exitosamente");
      setShowForm(false);
      setEditingStream(null);
    },
    onError: () => {
      toast.error("Error al actualizar el stream");
    }
  });

  const deleteStreamMutation = useMutation({
    mutationFn: (id) => base44.entities.StreamConfig.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['streamConfig'] });
      toast.success("Stream eliminado");
    },
  });

  const activateStreamMutation = useMutation({
    mutationFn: async (streamId) => {
      // Desactivar todos los streams
      for (const stream of streams) {
        if (stream.id !== streamId && (stream.is_active || stream.is_primary)) {
          await base44.entities.StreamConfig.update(stream.id, {
            is_active: false,
            is_primary: false
          });
        }
      }
      
      // Activar el stream seleccionado
      await base44.entities.StreamConfig.update(streamId, {
        is_active: true,
        is_primary: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['streamConfig'] });
      toast.success("Stream activado");
    },
  });

  const deactivateStreamMutation = useMutation({
    mutationFn: async (streamId) => {
      await base44.entities.StreamConfig.update(streamId, {
        is_active: false,
        is_primary: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streamConfigs'] });
      queryClient.invalidateQueries({ queryKey: ['streamConfig'] });
      toast.success("Stream desactivado");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      stream_url: formData.get('stream_url'),
      fallback_url: formData.get('fallback_url') || null,
      port: formData.get('port') ? parseInt(formData.get('port')) : null,
      mount_point: formData.get('mount_point') || null,
      format: formData.get('format'),
      bitrate: formData.get('bitrate') || null,
      is_active: editingStream ? editingStream.is_active : false,
      is_primary: editingStream ? editingStream.is_primary : false,
      azuracast_api_url: formData.get('azuracast_api_url') || null,
      azuracast_station_id: formData.get('azuracast_station_id') || null,
      metadata: {
        server_type: formData.get('server_type'),
        description: formData.get('description') || null
      }
    };

    if (editingStream) {
      updateStreamMutation.mutate({ id: editingStream.id, data });
    } else {
      createStreamMutation.mutate(data);
    }
  };

  const handleEdit = (stream) => {
    setEditingStream(stream);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este stream?")) {
      deleteStreamMutation.mutate(id);
    }
  };

  const handleActivate = (streamId) => {
    activateStreamMutation.mutate(streamId);
  };

  const handleDeactivate = (streamId) => {
    deactivateStreamMutation.mutate(streamId);
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
                <Settings className="w-10 h-10 text-[#006cf0]" />
                Configuración de Streams
              </h1>
              <p className="text-gray-400">
                Gestiona las URLs de transmisión de tu radio
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingStream(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Stream
            </Button>
          </div>
        </motion.div>

        {/* Active Stream Selector */}
        {streams.length > 1 && !showForm && (
          <Card className="bg-gradient-to-r from-[#006cf0]/20 to-[#00479e]/20 border-[#006cf0] p-6 mb-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Power className="w-5 h-5 text-green-400" />
                  Stream Activo Actual
                </h3>
                <p className="text-gray-400 text-sm">
                  {activeStream ? activeStream.name : "Ningún stream activo"}
                </p>
              </div>
              <Select
                value={activeStream?.id}
                onValueChange={handleActivate}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white w-64">
                  <SelectValue placeholder="Seleccionar stream..." />
                </SelectTrigger>
                <SelectContent>
                  {streams.map(stream => (
                    <SelectItem key={stream.id} value={stream.id}>
                      <div className="flex items-center gap-2">
                        {stream.is_active && <Check className="w-4 h-4 text-green-500" />}
                        {stream.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingStream ? "Editar Stream" : "Nuevo Stream"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nombre del Stream *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingStream?.name}
                      placeholder="Ej: Stream Principal HD"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                    <p className="text-xs text-gray-400">
                      Nombre para identificar este stream internamente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format" className="text-white">Formato</Label>
                    <Select name="format" defaultValue={editingStream?.format || "mp3"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mp3">MP3</SelectItem>
                        <SelectItem value="aac">AAC</SelectItem>
                        <SelectItem value="ogg">OGG</SelectItem>
                        <SelectItem value="opus">OPUS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stream_url" className="text-white">URL del Stream *</Label>
                  <Input
                    id="stream_url"
                    name="stream_url"
                    type="url"
                    defaultValue={editingStream?.stream_url}
                    placeholder="https://tu-servidor.com:8000/radio.mp3"
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    URL completa de tu stream (incluye puerto y punto de montaje)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fallback_url" className="text-white">URL de Respaldo (Opcional)</Label>
                  <Input
                    id="fallback_url"
                    name="fallback_url"
                    type="url"
                    defaultValue={editingStream?.fallback_url}
                    placeholder="https://backup-servidor.com:8000/radio.mp3"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="port" className="text-white">Puerto</Label>
                    <Input
                      id="port"
                      name="port"
                      type="number"
                      defaultValue={editingStream?.port}
                      placeholder="8000"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mount_point" className="text-white">Punto de Montaje</Label>
                    <Input
                      id="mount_point"
                      name="mount_point"
                      defaultValue={editingStream?.mount_point}
                      placeholder="/radio"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bitrate" className="text-white">Bitrate</Label>
                    <Input
                      id="bitrate"
                      name="bitrate"
                      defaultValue={editingStream?.bitrate}
                      placeholder="128kbps"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="server_type" className="text-white">Tipo de Servidor</Label>
                  <Select name="server_type" defaultValue={editingStream?.metadata?.server_type || "custom"}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="azuracast">AzuraCast</SelectItem>
                      <SelectItem value="shoutcast">Shoutcast</SelectItem>
                      <SelectItem value="icecast">Icecast</SelectItem>
                      <SelectItem value="radioboss">RadioBoss Cloud</SelectItem>
                      <SelectItem value="custom">Otro / Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Integración con AzuraCast (Opcional)</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Solo si usas AzuraCast. Para otros servidores, déjalo vacío.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="azuracast_api_url" className="text-white">API URL de AzuraCast</Label>
                      <Input
                        id="azuracast_api_url"
                        name="azuracast_api_url"
                        type="url"
                        defaultValue={editingStream?.azuracast_api_url}
                        placeholder="https://azuracast.example.com/api"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="azuracast_station_id" className="text-white">ID de Estación</Label>
                      <Input
                        id="azuracast_station_id"
                        name="azuracast_station_id"
                        defaultValue={editingStream?.azuracast_station_id}
                        placeholder="1"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descripción (Opcional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={editingStream?.metadata?.description}
                    placeholder="Notas sobre este stream..."
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createStreamMutation.isPending || updateStreamMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingStream ? "Actualizar" : "Crear"} Stream
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingStream(null);
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

        {/* Streams List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(2)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : streams.length > 0 ? (
            streams.map((stream) => (
              <Card key={stream.id} className={`bg-white/5 border-white/10 p-6 transition-all ${
                stream.is_active && stream.is_primary ? "ring-2 ring-[#006cf0]" : ""
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${
                      stream.is_active && stream.is_primary
                        ? "bg-gradient-to-br from-[#006cf0] to-[#00479e] ring-2 ring-green-400"
                        : "bg-gray-700"
                    }`}>
                      <Radio className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{stream.name}</h3>
                        {stream.is_active && stream.is_primary && (
                          <span className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">
                            <Power className="w-3 h-3" />
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300 text-sm mb-2 break-all">{stream.stream_url}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                        {stream.format && (
                          <span className="px-2 py-1 rounded bg-white/5">
                            {stream.format.toUpperCase()}
                          </span>
                        )}
                        {stream.bitrate && (
                          <span className="px-2 py-1 rounded bg-white/5">
                            {stream.bitrate}
                          </span>
                        )}
                        {stream.metadata?.server_type && (
                          <span className="px-2 py-1 rounded bg-white/5 capitalize">
                            {stream.metadata.server_type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {stream.is_active && stream.is_primary ? (
                      <Button
                        size="sm"
                        onClick={() => handleDeactivate(stream.id)}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Power className="w-4 h-4 mr-1" />
                        Desactivar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleActivate(stream.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Power className="w-4 h-4 mr-1" />
                        Activar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleEdit(stream)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(stream.id)}
                      disabled={stream.is_active && stream.is_primary}
                      className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Radio className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay streams configurados</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Stream
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
