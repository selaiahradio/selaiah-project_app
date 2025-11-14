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
import { BookOpen, Plus, Trash2, Save, ArrowLeft, Calendar } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminBlogPage() {
  const [editingPost, setEditingPost] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['adminBlogPosts'],
    queryFn: () => base44.entities.BlogPost.list("-created_date"),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.BlogPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      toast.success("Post creado exitosamente");
      setShowForm(false);
      setEditingPost(null);
    },
    onError: () => toast.error("Error al crear el post"),
  });

  const updatePostMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BlogPost.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      toast.success("Post actualizado exitosamente");
      setShowForm(false);
      setEditingPost(null);
    },
    onError: () => toast.error("Error al actualizar el post"),
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.BlogPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogPosts'] });
      queryClient.invalidateQueries({ queryKey: ['blogPosts'] });
      toast.success("Post eliminado");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const tagsString = formData.get('tags');
    const tags = tagsString ? tagsString.split(',').map(t => t.trim()).filter(t => t) : [];

    const data = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      excerpt: formData.get('excerpt') || null,
      content: formData.get('content'),
      featured_image: formData.get('featured_image') || null,
      category: formData.get('category'),
      tags: tags,
      author_name: formData.get('author_name') || null,
      is_published: formData.get('is_published') === 'on',
      published_date: formData.get('published_date') || new Date().toISOString().split('T')[0],
    };

    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, data });
    } else {
      createPostMutation.mutate(data);
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm("¿Estás seguro de eliminar este post?")) {
      deletePostMutation.mutate(id);
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
                <BookOpen className="w-10 h-10 text-[#006cf0]" />
                Gestión de Blog
              </h1>
              <p className="text-gray-400">
                Administra artículos, testimonios y contenido cristiano
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingPost(null);
                setShowForm(true);
              }}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Post
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
                {editingPost ? "Editar Post" : "Nuevo Post"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-white">Título *</Label>
                    <Input
                      id="title"
                      name="title"
                      defaultValue={editingPost?.title}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-white">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      defaultValue={editingPost?.slug}
                      className="bg-white/10 border-white/20 text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt" className="text-white">Extracto</Label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    defaultValue={editingPost?.excerpt}
                    className="bg-white/10 border-white/20 text-white"
                    rows={2}
                    placeholder="Resumen breve del artículo..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content" className="text-white">Contenido *</Label>
                  <Textarea
                    id="content"
                    name="content"
                    defaultValue={editingPost?.content}
                    className="bg-white/10 border-white/20 text-white"
                    rows={10}
                    placeholder="Escribe el contenido completo aquí... (soporta Markdown)"
                    required
                  />
                  <p className="text-xs text-gray-400">
                    Puedes usar Markdown para dar formato al contenido
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">Categoría</Label>
                    <Select name="category" defaultValue={editingPost?.category || "general"}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="testimonios">Testimonios</SelectItem>
                        <SelectItem value="devocionales">Devocionales</SelectItem>
                        <SelectItem value="sermones">Sermones</SelectItem>
                        <SelectItem value="eventos">Eventos</SelectItem>
                        <SelectItem value="musica">Música Cristiana</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="author_name" className="text-white">Autor</Label>
                    <Input
                      id="author_name"
                      name="author_name"
                      defaultValue={editingPost?.author_name}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Nombre del autor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="featured_image" className="text-white">URL de Imagen Destacada</Label>
                  <Input
                    id="featured_image"
                    name="featured_image"
                    type="url"
                    defaultValue={editingPost?.featured_image}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="https://ejemplo.com/imagen.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags" className="text-white">Etiquetas</Label>
                  <Input
                    id="tags"
                    name="tags"
                    defaultValue={editingPost?.tags?.join(', ')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="fe, esperanza, amor (separadas por comas)"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="published_date" className="text-white">Fecha de Publicación</Label>
                    <Input
                      id="published_date"
                      name="published_date"
                      type="date"
                      defaultValue={editingPost?.published_date || new Date().toISOString().split('T')[0]}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-8">
                    <Switch
                      id="is_published"
                      name="is_published"
                      defaultChecked={editingPost?.is_published || false}
                    />
                    <Label htmlFor="is_published" className="text-white cursor-pointer">
                      Publicar Post
                    </Label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createPostMutation.isPending || updatePostMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? "Actualizar" : "Crear"} Post
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingPost(null);
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

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Card key={post.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="text-xl font-bold text-white">{post.title}</h3>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          post.is_published
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                          {post.is_published ? 'Publicado' : 'Borrador'}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300 capitalize">
                          {post.category}
                        </span>
                      </div>
                      {post.excerpt && (
                        <p className="text-gray-400 text-sm mb-2 line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-300">
                        {post.author_name && <span>✍️ {post.author_name}</span>}
                        {post.published_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(post.published_date).toLocaleDateString()}
                          </span>
                        )}
                        {post.tags && post.tags.length > 0 && (
                          <span>🏷️ {post.tags.length} etiquetas</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleEdit(post)}
                      className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDelete(post.id)}
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
              <p className="text-xl text-gray-400 mb-4">No hay posts de blog</p>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Post
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}