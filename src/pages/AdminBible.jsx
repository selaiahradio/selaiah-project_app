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
import { BookOpen, Plus, Trash2, Save, ArrowLeft, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminBiblePage() {
  const [editingVerse, setEditingVerse] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: verses, isLoading } = useQuery({
    queryKey: ['adminBibleVerses'],
    queryFn: () => base44.entities.BibleVerse.list("-created_date"),
    initialData: [],
  });

  const createVerseMutation = useMutation({
    mutationFn: (data) => base44.entities.BibleVerse.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBibleVerses'] });
      queryClient.invalidateQueries({ queryKey: ['bibleVerses'] });
      queryClient.invalidateQueries({ queryKey: ['dailyVerse'] });
      toast.success("Versículo creado exitosamente");
      setShowForm(false);
      setEditingVerse(null);
    },
    onError: () => toast.error("Error al crear el versículo"),
  });

  const updateVerseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BibleVerse.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBibleVerses'] });
      queryClient.invalidateQueries({ queryKey: ['bibleVerses'] });
      queryClient.invalidateQueries({ queryKey: ['dailyVerse'] });
      toast.success("Versículo actualizado");
      setShowForm(false);
      setEditingVerse(null);
    },
    onError: () => toast.error("Error al actualizar"),
  });

  const deleteVerseMutation = useMutation({
    mutationFn: (id) => base44.entities.BibleVerse.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBibleVerses'] });
      queryClient.invalidateQueries({ queryKey: ['bibleVerses'] });
      toast.success("Versículo eliminado");
    },
  });

  const generatePentecostalVerses = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 20 powerful PENTECOSTAL Bible verses from the Reina-Valera 1960 (RVR1960) version.

Focus on these PENTECOSTAL themes:
- Baptism in the Holy Spirit
- Speaking in tongues (glossolalia)
- Spiritual gifts (1 Corinthians 12)
- Healing and miracles
- Power of the Holy Spirit
- Manifestations of God
- Prophecy and revelations
- Fire of God
- Signs and wonders
- Laying on of hands
- Deliverance and spiritual warfare

Include verses from:
- Acts (especially about Pentecost and Holy Spirit)
- 1 Corinthians 12-14 (spiritual gifts)
- Joel 2:28-29 (prophecy about Holy Spirit)
- Mark 16:17-18 (signs following believers)
- John 14-16 (promise of the Holy Spirit)
- Romans 8 (life in the Spirit)
- Ephesians (spiritual armor and power)

For each verse provide:
- book (name in Spanish)
- chapter (number)
- verse (number or range)
- text (exact text from RVR1960 in Spanish)
- category (pentecostal, holy_spirit, healing, miracles, gifts, prophecy)
- tags (3-5 relevant tags in Spanish)
- commentary (2-3 sentences explaining the Pentecostal significance)`,
        response_json_schema: {
          type: "object",
          properties: {
            verses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  book: { type: "string" },
                  chapter: { type: "number" },
                  verse: { type: "number" },
                  verse_range: { type: "string" },
                  text: { type: "string" },
                  category: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  commentary: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.verses) {
        for (const verse of result.verses) {
          await base44.entities.BibleVerse.create({
            ...verse,
            version: "RVR1960",
            testament: verse.book.match(/Génesis|Éxodo|Levítico|Números|Deuteronomio|Josué|Jueces|Rut|Samuel|Reyes|Crónicas|Esdras|Nehemías|Ester|Job|Salmos|Proverbios|Eclesiastés|Cantares|Isaías|Jeremías|Lamentaciones|Ezequiel|Daniel|Oseas|Joel|Amós|Abdías|Jonás|Miqueas|Nahúm|Habacuc|Sofonías|Hageo|Zacarías|Malaquías/) ? "old" : "new"
          });
        }

        queryClient.invalidateQueries({ queryKey: ['adminBibleVerses'] });
        toast.success(`${result.verses.length} versículos pentecostales generados`);
      }
    } catch (error) {
      toast.error("Error generando versículos");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const tagsString = formData.get('tags');
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

    const data = {
      book: formData.get('book'),
      chapter: parseInt(formData.get('chapter')),
      verse: parseInt(formData.get('verse')),
      verse_range: formData.get('verse_range') || null,
      text: formData.get('text'),
      version: formData.get('version'),
      testament: formData.get('testament'),
      category: formData.get('category'),
      tags,
      commentary: formData.get('commentary') || null,
      image_url: formData.get('image_url') || null,
      is_daily: formData.get('is_daily') === 'on',
      scheduled_date: formData.get('scheduled_date') || null,
    };

    if (editingVerse) {
      updateVerseMutation.mutate({ id: editingVerse.id, data });
    } else {
      createVerseMutation.mutate(data);
    }
  };

  const handleEdit = (verse) => {
    setEditingVerse(verse);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este versículo?")) {
      deleteVerseMutation.mutate(id);
    }
  };

  const filteredVerses = verses.filter(v =>
    v.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.book?.toLowerCase().includes(searchQuery.toLowerCase())
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <BookOpen className="w-10 h-10 text-[#006cf0]" />
                Gestión de Biblia
              </h1>
              <p className="text-gray-400">
                Versículos, Salmos y enseñanzas pentecostales
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={generatePentecostalVerses}
                disabled={isGenerating}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "Generando..." : "Generar Versículos IA"}
              </Button>
              <Button
                onClick={() => {
                  setEditingVerse(null);
                  setShowForm(true);
                }}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Versículo
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar versículos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
        </Card>

        {/* Form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                {editingVerse ? "Editar Versículo" : "Nuevo Versículo"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="book" className="text-white">Libro *</Label>
                    <Input
                      id="book"
                      name="book"
                      defaultValue={editingVerse?.book}
                      placeholder="Hechos"
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chapter" className="text-white">Capítulo *</Label>
                    <Input
                      id="chapter"
                      name="chapter"
                      type="number"
                      defaultValue={editingVerse?.chapter}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verse" className="text-white">Versículo *</Label>
                    <Input
                      id="verse"
                      name="verse"
                      type="number"
                      defaultValue={editingVerse?.verse}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text" className="text-white">Texto del Versículo *</Label>
                  <Textarea
                    id="text"
                    name="text"
                    defaultValue={editingVerse?.text}
                    className="bg-white/10 border-white/20 text-white"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="version" className="text-white">Versión</Label>
                    <Select name="version" defaultValue={editingVerse?.version || "RVR1960"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RVR1960">RVR1960</SelectItem>
                        <SelectItem value="NVI">NVI</SelectItem>
                        <SelectItem value="TLA">TLA</SelectItem>
                        <SelectItem value="DHH">DHH</SelectItem>
                        <SelectItem value="LBLA">LBLA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testament" className="text-white">Testamento</Label>
                    <Select name="testament" defaultValue={editingVerse?.testament || "new"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="old">Antiguo Testamento</SelectItem>
                        <SelectItem value="new">Nuevo Testamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Categoría</Label>
                    <Select name="category" defaultValue={editingVerse?.category || "pentecostal"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pentecostal">Pentecostal</SelectItem>
                        <SelectItem value="holy_spirit">Espíritu Santo</SelectItem>
                        <SelectItem value="healing">Sanidad</SelectItem>
                        <SelectItem value="miracles">Milagros</SelectItem>
                        <SelectItem value="faith">Fe</SelectItem>
                        <SelectItem value="worship">Adoración</SelectItem>
                        <SelectItem value="prayer">Oración</SelectItem>
                        <SelectItem value="salvation">Salvación</SelectItem>
                        <SelectItem value="psalms">Salmos</SelectItem>
                        <SelectItem value="prophecy">Profecía</SelectItem>
                        <SelectItem value="gifts">Dones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commentary" className="text-white">Comentario Pentecostal</Label>
                  <Textarea
                    id="commentary"
                    name="commentary"
                    defaultValue={editingVerse?.commentary}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                    placeholder="Reflexión sobre el significado pentecostal..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-white">Etiquetas</Label>
                  <Input
                    id="tags"
                    name="tags"
                    defaultValue={editingVerse?.tags?.join(', ')}
                    placeholder="espíritu santo, poder, fuego (separadas por comas)"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="image_url" className="text-white">URL de Imagen</Label>
                    <Input
                      id="image_url"
                      name="image_url"
                      type="url"
                      defaultValue={editingVerse?.image_url}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date" className="text-white">Fecha Programada</Label>
                    <Input
                      id="scheduled_date"
                      name="scheduled_date"
                      type="date"
                      defaultValue={editingVerse?.scheduled_date}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="is_daily"
                    name="is_daily"
                    defaultChecked={editingVerse?.is_daily || false}
                  />
                  <Label htmlFor="is_daily" className="text-white cursor-pointer">
                    Versículo del Día
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createVerseMutation.isPending || updateVerseMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingVerse ? "Actualizar" : "Crear"} Versículo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingVerse(null);
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

        {/* Verses List */}
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredVerses.length > 0 ? (
            filteredVerses.map((verse) => (
              <Card key={verse.id} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-blue-400 font-semibold">
                        {verse.book} {verse.chapter}:{verse.verse}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                        {verse.category}
                      </span>
                      {verse.is_daily && (
                        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
                          Versículo del Día
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm mb-2 line-clamp-2 italic">"{verse.text}"</p>
                    {verse.tags && verse.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {verse.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(verse)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(verse.id)}
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
              <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay versículos</p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={generatePentecostalVerses}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generar con IA
                </Button>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Manualmente
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}