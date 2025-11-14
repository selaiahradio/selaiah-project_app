import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TrendingUp, Plus, Trash2, Save, ArrowLeft, Music } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminChartsPage() {
  const [editingChart, setEditingChart] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [songs, setSongs] = useState([{ position: 1, title: "", artist: "", album: "", cover_url: "", previous_position: null, weeks_on_chart: 1 }]);
  const queryClient = useQueryClient();

  const { data: charts, isLoading } = useQuery({
    queryKey: ['adminCharts'],
    queryFn: () => base44.entities.Chart.list("-created_date"),
    initialData: [],
  });

  const createChartMutation = useMutation({
    mutationFn: (data) => base44.entities.Chart.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharts'] });
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      toast.success("Chart creado exitosamente");
      setShowForm(false);
      setEditingChart(null);
      setSongs([{ position: 1, title: "", artist: "", album: "", cover_url: "", previous_position: null, weeks_on_chart: 1 }]);
    },
    onError: () => toast.error("Error al crear el chart"),
  });

  const updateChartMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Chart.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharts'] });
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      toast.success("Chart actualizado exitosamente");
      setShowForm(false);
      setEditingChart(null);
      setSongs([{ position: 1, title: "", artist: "", album: "", cover_url: "", previous_position: null, weeks_on_chart: 1 }]);
    },
    onError: () => toast.error("Error al actualizar el chart"),
  });

  const deleteChartMutation = useMutation({
    mutationFn: (id) => base44.entities.Chart.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCharts'] });
      queryClient.invalidateQueries({ queryKey: ['charts'] });
      toast.success("Chart eliminado");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      week_number: formData.get('week_number') ? parseInt(formData.get('week_number')) : null,
      year: formData.get('year') ? parseInt(formData.get('year')) : new Date().getFullYear(),
      songs: songs.filter(s => s.title && s.artist),
      is_current: formData.get('is_current') === 'on',
    };

    if (editingChart) {
      updateChartMutation.mutate({ id: editingChart.id, data });
    } else {
      createChartMutation.mutate(data);
    }
  };

  const handleEdit = (chart) => {
    setEditingChart(chart);
    setSongs(chart.songs || [{ position: 1, title: "", artist: "", album: "", cover_url: "", previous_position: null, weeks_on_chart: 1 }]);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este chart?")) {
      deleteChartMutation.mutate(id);
    }
  };

  const addSong = () => {
    setSongs([...songs, { position: songs.length + 1, title: "", artist: "", album: "", cover_url: "", previous_position: null, weeks_on_chart: 1 }]);
  };

  const removeSong = (index) => {
    setSongs(songs.filter((_, i) => i !== index).map((song, i) => ({ ...song, position: i + 1 })));
  };

  const updateSong = (index, field, value) => {
    const newSongs = [...songs];
    newSongs[index] = { ...newSongs[index], [field]: value };
    setSongs(newSongs);
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
                <TrendingUp className="w-10 h-10 text-[#006cf0]" />
                Gestión de Charts
              </h1>
              <p className="text-gray-400">
                Rankings de música cristiana más popular
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingChart(null);
                setSongs([{ position: 1, title: "", artist: "", album: "", cover_url: "", previous_position: null, weeks_on_chart: 1 }]);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Chart
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
                {editingChart ? "Editar Chart" : "Nuevo Chart"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Título *</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingChart?.title}
                      placeholder="Top 20 Alabanzas de la Semana"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingChart?.slug}
                      placeholder="top-20-alabanzas"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="week_number" className="text-white">Semana</Label>
                    <Input
                      id="week_number"
                      name="week_number"
                      type="number"
                      defaultValue={editingChart?.week_number}
                      placeholder="1-52"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-white">Año</Label>
                    <Input
                      id="year"
                      name="year"
                      type="number"
                      defaultValue={editingChart?.year || new Date().getFullYear()}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <Switch
                      id="is_current"
                      name="is_current"
                      defaultChecked={editingChart?.is_current || false}
                    />
                    <Label htmlFor="is_current" className="text-white cursor-pointer">
                      Chart Actual
                    </Label>
                  </div>
                </div>

                {/* Songs Section */}
                <div className="border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Canciones</h3>
                    <Button type="button" onClick={addSong} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar Canción
                    </Button>
                  </div>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {songs.map((song, index) => (
                      <Card key={index} className="bg-white/5 border-white/10 p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-bold">#{song.position}</span>
                            {songs.length > 1 && (
                              <Button 
                                type="button" 
                                size="sm" 
                                variant="ghost"
                                onClick={() => removeSong(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <Input
                              placeholder="Título de la canción *"
                              value={song.title}
                              onChange={(e) => updateSong(index, 'title', e.target.value)}
                              className="bg-white/10 border-white/20 text-white"
                            />
                            <Input
                              placeholder="Artista *"
                              value={song.artist}
                              onChange={(e) => updateSong(index, 'artist', e.target.value)}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>

                          <div className="grid md:grid-cols-3 gap-3">
                            <Input
                              placeholder="Álbum"
                              value={song.album || ""}
                              onChange={(e) => updateSong(index, 'album', e.target.value)}
                              className="bg-white/10 border-white/20 text-white"
                            />
                            <Input
                              placeholder="Posición anterior"
                              type="number"
                              value={song.previous_position || ""}
                              onChange={(e) => updateSong(index, 'previous_position', e.target.value ? parseInt(e.target.value) : null)}
                              className="bg-white/10 border-white/20 text-white"
                            />
                            <Input
                              placeholder="Semanas en chart"
                              type="number"
                              value={song.weeks_on_chart || 1}
                              onChange={(e) => updateSong(index, 'weeks_on_chart', parseInt(e.target.value))}
                              className="bg-white/10 border-white/20 text-white"
                            />
                          </div>

                          <Input
                            placeholder="URL de la carátula"
                            value={song.cover_url || ""}
                            onChange={(e) => updateSong(index, 'cover_url', e.target.value)}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createChartMutation.isPending || updateChartMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingChart ? "Actualizar" : "Crear"} Chart
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingChart(null);
                      setSongs([{ position: 1, title: "", artist: "", album: "", cover_url: "", previous_position: null, weeks_on_chart: 1 }]);
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

        {/* Charts List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : charts.length > 0 ? (
            charts.map((chart) => (
              <Card key={chart.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{chart.title}</h3>
                      {chart.is_current && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">
                          Actual
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                      {chart.week_number && <span>Semana {chart.week_number}</span>}
                      {chart.year && <span>• Año {chart.year}</span>}
                      {chart.songs && <span>• {chart.songs.length} canciones</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(chart)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(chart.id)}
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
              <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay charts creados</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Chart
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}