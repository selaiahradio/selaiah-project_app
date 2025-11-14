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
import { FileText, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminPagesPage() {
  const [editingPage, setEditingPage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: pages, isLoading } = useQuery({
    queryKey: ['adminPages'],
    queryFn: () => base44.entities.SitePage.list("-created_date"),
    initialData: [],
  });

  const createPageMutation = useMutation({
    mutationFn: (data) => base44.entities.SitePage.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPages'] });
      toast.success("Página creada exitosamente");
      setShowForm(false);
      setEditingPage(null);
    },
    onError: () => toast.error("Error al crear la página"),
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SitePage.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPages'] });
      toast.success("Página actualizada exitosamente");
      setShowForm(false);
      setEditingPage(null);
    },
    onError: () => toast.error("Error al actualizar la página"),
  });

  const deletePageMutation = useMutation({
    mutationFn: (id) => base44.entities.SitePage.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPages'] });
      toast.success("Página eliminada");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      template: formData.get('template'),
      featured_image: formData.get('featured_image') || null,
      show_in_menu: formData.get('show_in_menu') === 'on',
      menu_order: formData.get('menu_order') ? parseInt(formData.get('menu_order')) : 0,
      is_published: formData.get('is_published') === 'on',
      seo_title: formData.get('seo_title') || null,
      seo_description: formData.get('seo_description') || null,
    };

    if (editingPage) {
      updatePageMutation.mutate({ id: editingPage.id, data });
    } else {
      createPageMutation.mutate(data);
    }
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar esta página?")) {
      deletePageMutation.mutate(id);
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
                <FileText className="w-10 h-10 text-[#006cf0]" />
                Gestión de Páginas
              </h1>
              <p className="text-gray-400">
                Crea páginas personalizadas para tu sitio
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingPage(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Página
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
                {editingPage ? "Editar Página" : "Nueva Página"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Título *</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingPage?.title}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingPage?.slug}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-white">Contenido *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={editingPage?.content}
                    className="bg-white/10 border-white/20 text-white"
                    rows={12}
                    placeholder="Escribe el contenido aquí... (soporta Markdown)"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="template" className="text-white">Template</Label>
                    <Select name="template" defaultValue={editingPage?.template || "default"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="full-width">Full Width</SelectItem>
                        <SelectItem value="landing">Landing</SelectItem>
                        <SelectItem value="two-column">Two Column</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menu_order" className="text-white">Orden en Menú</Label>
                    <Input
                      id="menu_order"
                      name="menu_order"
                      type="number"
                      defaultValue={editingPage?.menu_order || 0}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <Switch
                      id="show_in_menu"
                      name="show_in_menu"
                      defaultChecked={editingPage?.show_in_menu !== false}
                    />
                    <Label htmlFor="show_in_menu" className="text-white cursor-pointer">
                      Mostrar en Menú
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured_image" className="text-white">Imagen Destacada</Label>
                  <Input
                    id="featured_image"
                    name="featured_image"
                    type="url"
                    defaultValue={editingPage?.featured_image}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">SEO</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="seo_title" className="text-white">Título SEO</Label>
                      <Input
                        id="seo_title"
                        name="seo_title"
                        defaultValue={editingPage?.seo_title}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo_description" className="text-white">Descripción SEO</Label>
                      <Textarea
                        id="seo_description"
                        name="seo_description"
                        defaultValue={editingPage?.seo_description}
                        className="bg-white/10 border-white/20 text-white"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="is_published"
                    name="is_published"
                    defaultChecked={editingPage?.is_published || false}
                  />
                  <Label htmlFor="is_published" className="text-white cursor-pointer">
                    Publicar Página
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createPageMutation.isPending || updatePageMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPage ? "Actualizar" : "Crear"} Página
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPage(null);
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

        {/* Pages List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : pages.length > 0 ? (
            pages.map((page) => (
              <Card key={page.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white">{page.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        page.is_published
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}>
                        {page.is_published ? 'Publicada' : 'Borrador'}
                      </span>
                      {page.show_in_menu && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300">
                          En Menú
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-2">/{page.slug}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                      <span>Template: {page.template}</span>
                      {page.menu_order > 0 && <span>• Orden: {page.menu_order}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(page)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(page.id)}
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
              <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">No hay páginas personalizadas</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Página
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}