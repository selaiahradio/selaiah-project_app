
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Trash2, Save, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { appParams } from "@/lib/app-params";

// --- START: NEW API LOGIC ---
const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const token = appParams.token;

const fetcher = async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error on ${path}: ${errorText}`);
        throw new Error(`Request failed: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

const getLocalNews = () => fetcher('/local_news?sort=-published_date');
const createLocalNew = (data) => fetcher('/local_news', { method: 'POST', body: JSON.stringify(data) });
const updateLocalNew = ({ id, data }) => fetcher(`/local_news/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const deleteLocalNew = (id) => fetcher(`/local_news/${id}`, { method: 'DELETE' });
// --- END: NEW API LOGIC ---

export default function AdminLocalNewsPage() {
  const [editingNews, setEditingNews] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: news, isLoading } = useQuery({
    queryKey: ['adminLocalNews'],
    queryFn: getLocalNews,
    initialData: [],
  });

  const createNewsMutation = useMutation({
    mutationFn: createLocalNew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocalNews'] });
      queryClient.invalidateQueries({ queryKey: ['localNews'] });
      toast.success("Noticia creada exitosamente");
      setShowForm(false);
      setEditingNews(null);
    },
    onError: () => toast.error("Error al crear la noticia"),
  });

  const updateNewsMutation = useMutation({
    mutationFn: updateLocalNew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocalNews'] });
      queryClient.invalidateQueries({ queryKey: ['localNews'] });
      toast.success("Noticia actualizada exitosamente");
      setShowForm(false);
      setEditingNews(null);
    },
    onError: () => toast.error("Error al actualizar la noticia"),
  });

  const deleteNewsMutation = useMutation({
    mutationFn: deleteLocalNew,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocalNews'] });
      queryClient.invalidateQueries({ queryKey: ['localNews'] });
      toast.success("Noticia eliminada");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      content: formData.get('content'),
      summary: formData.get('summary') || null,
      source: formData.get('source') || null,
      source_url: formData.get('source_url') || null,
      image_url: formData.get('image_url') || null,
      category: formData.get('category'),
      published_date: formData.get('published_date') || new Date().toISOString(),
      relevance_score: formData.get('relevance_score') ? parseInt(formData.get('relevance_score')) : 50,
      location: {
        city: formData.get('city'),
        state: formData.get('state'),
        country: formData.get('country'),
        latitude: formData.get('latitude') ? parseFloat(formData.get('latitude')) : null,
        longitude: formData.get('longitude') ? parseFloat(formData.get('longitude')) : null,
      }
    };

    if (editingNews) {
      updateNewsMutation.mutate({ id: editingNews.id, data });
    } else {
      createNewsMutation.mutate(data);
    }
  };

  const handleEdit = (newsItem) => {
    setEditingNews(newsItem);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar esta noticia?")) {
      deleteNewsMutation.mutate(id);
    }
  };

  const filteredNews = news.filter(item =>
    item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location?.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <MapPin className="w-10 h-10 text-[#006cf0]" />
                Noticias Locales
              </h1>
              <p className="text-gray-400">
                Gestiona noticias cristianas locales por ubicación
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingNews(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Noticia
            </Button>
          </div>
        </motion.div>

        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por título o ciudad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
        </Card>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingNews ? "Editar Noticia" : "Nueva Noticia"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-white">Título *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={editingNews?.title}
                    className="bg-white/10 border-white/20 text-white"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="summary" className="text-white">Resumen</Label>
                  <Textarea
                    id="summary"
                    name="summary"
                    defaultValue={editingNews?.summary}
                    className="bg-white/10 border-white/20 text-white"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-white">Contenido *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={editingNews?.content}
                    className="bg-white/10 border-white/20 text-white"
                    rows={6}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">Ciudad *</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={editingNews?.location?.city}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">Estado/Provincia *</Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={editingNews?.location?.state}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">País *</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={editingNews?.location?.country}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-white">Latitud</Label>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      defaultValue={editingNews?.location?.latitude}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-white">Longitud</Label>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      defaultValue={editingNews?.location?.longitude}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Categoría</Label>
                    <Select name="category" defaultValue={editingNews?.category || "comunidad"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="eventos_cristianos">Eventos Cristianos</SelectItem>
                        <SelectItem value="iglesias">Iglesias</SelectItem>
                        <SelectItem value="ministerios">Ministerios</SelectItem>
                        <SelectItem value="musica_cristiana">Música Cristiana</SelectItem>
                        <SelectItem value="comunidad">Comunidad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relevance_score" className="text-white">Relevancia (0-100)</Label>
                    <Input
                      id="relevance_score"
                      name="relevance_score"
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={editingNews?.relevance_score || 50}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="source" className="text-white">Fuente</Label>
                    <Input
                      id="source"
                      name="source"
                      defaultValue={editingNews?.source}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source_url" className="text-white">URL de Fuente</Label>
                    <Input
                      id="source_url"
                      name="source_url"
                      type="url"
                      defaultValue={editingNews?.source_url}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-white">URL de Imagen</Label>
                    <Input
                      id="image_url"
                      name="image_url"
                      type="url"
                      defaultValue={editingNews?.image_url}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="published_date" className="text-white">Fecha de Publicación</Label>
                    <Input
                      id="published_date"
                      name="published_date"
                      type="datetime-local"
                      defaultValue={editingNews?.published_date ? new Date(editingNews.published_date).toISOString().slice(0, 16) : ''}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createNewsMutation.isPending || updateNewsMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingNews ? "Actualizar" : "Crear"} Noticia
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingNews(null);
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

        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredNews.length > 0 ? (
            filteredNews.map((newsItem) => (
              <Card key={newsItem.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {newsItem.image_url && (
                      <img
                        src={newsItem.image_url}
                        alt={newsItem.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{newsItem.title}</h3>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300">
                          {newsItem.category}
                        </span>
                        {newsItem.relevance_score >= 80 && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-300">
                            Alta Relevancia
                          </span>
                        )}
                      </div>
                      {newsItem.summary && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{newsItem.summary}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {newsItem.location?.city}, {newsItem.location?.state}
                        </span>
                        {newsItem.published_date && (
                          <span>
                            {format(new Date(newsItem.published_date), "d/MM/yyyy")}
                          </span>
                        )}
                        {newsItem.source && <span>📰 {newsItem.source}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(newsItem)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(newsItem.id)}
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
              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay noticias locales</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Noticia
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
