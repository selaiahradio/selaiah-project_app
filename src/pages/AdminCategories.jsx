import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Folder, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminCategoriesPage() {
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => base44.entities.Category.list("-created_date"),
    initialData: [],
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast.success("Categoría creada exitosamente");
      setShowForm(false);
      setEditingCategory(null);
    },
    onError: () => toast.error("Error al crear la categoría"),
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast.success("Categoría actualizada exitosamente");
      setShowForm(false);
      setEditingCategory(null);
    },
    onError: () => toast.error("Error al actualizar la categoría"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      toast.success("Categoría eliminada");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description') || null,
      icon: formData.get('icon') || null,
      color: formData.get('color') || '#006cf0',
      image_url: formData.get('image_url') || null,
      order: formData.get('order') ? parseInt(formData.get('order')) : 0,
      is_active: formData.get('is_active') === 'on',
      seo_title: formData.get('seo_title') || null,
      seo_description: formData.get('seo_description') || null,
    };

    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar esta categoría?")) {
      deleteCategoryMutation.mutate(id);
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
                <Folder className="w-10 h-10 text-[#006cf0]" />
                Gestión de Categorías
              </h1>
              <p className="text-gray-400">
                Organiza tu contenido con categorías personalizadas
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingCategory(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Categoría
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
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nombre *</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingCategory?.name}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingCategory?.slug}
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
                    defaultValue={editingCategory?.description}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="icon" className="text-white">Icono (Lucide)</Label>
                    <Input
                      id="icon"
                      name="icon"
                      defaultValue={editingCategory?.icon}
                      placeholder="BookOpen"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-white">Color</Label>
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      defaultValue={editingCategory?.color || '#006cf0'}
                      className="bg-white/10 border-white/20 text-white h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="order" className="text-white">Orden</Label>
                    <Input
                      id="order"
                      name="order"
                      type="number"
                      defaultValue={editingCategory?.order || 0}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url" className="text-white">URL de Imagen</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    type="url"
                    defaultValue={editingCategory?.image_url}
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
                        defaultValue={editingCategory?.seo_title}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seo_description" className="text-white">Descripción SEO</Label>
                      <Textarea
                        id="seo_description"
                        name="seo_description"
                        defaultValue={editingCategory?.seo_description}
                        className="bg-white/10 border-white/20 text-white"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingCategory?.is_active !== false}
                  />
                  <Label htmlFor="is_active" className="text-white cursor-pointer">
                    Categoría Activa
                  </Label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingCategory ? "Actualizar" : "Crear"} Categoría
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingCategory(null);
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

        {/* Categories List */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : categories.length > 0 ? (
            categories.map((category) => (
              <Card key={category.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color || '#006cf0' }}
                  >
                    <Folder className="w-6 h-6 text-white" />
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    category.is_active
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-red-500/20 text-red-300'
                  }`}>
                    {category.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                {category.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">{category.description}</p>
                )}
                
                <div className="text-sm text-gray-400 mb-4">
                  <span>{category.posts_count || 0} posts</span>
                  {category.order !== undefined && <span> • Orden: {category.order}</span>}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(category)}
                    className="flex-1 bg-[#006cf0] hover:bg-[#00479e] text-white"
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="bg-white/5 border-white/10 p-12 text-center">
                <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-xl text-gray-400 mb-4">No hay categorías creadas</p>
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Categoría
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}