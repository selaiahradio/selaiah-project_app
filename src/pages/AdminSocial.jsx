import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowLeft, Search, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminSocialPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['adminSocialPosts'],
    queryFn: () => base44.entities.SocialPost.list("-created_date"),
    initialData: [],
  });

  const approvePostMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.update(id, { is_approved: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      toast.success("Post aprobado");
    },
  });

  const rejectPostMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.update(id, { is_approved: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      toast.success("Post rechazado");
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (id) => base44.entities.SocialPost.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      toast.success("Post eliminado");
    },
  });

  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, is_featured }) => base44.entities.SocialPost.update(id, { is_featured }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialPosts'] });
      toast.success("Post actualizado");
    },
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "approved" && post.is_approved) ||
                         (filterStatus === "pending" && !post.is_approved);
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: posts.length,
    approved: posts.filter(p => p.is_approved).length,
    pending: posts.filter(p => !p.is_approved).length,
    featured: posts.filter(p => p.is_featured).length,
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
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
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <MessageSquare className="w-10 h-10 text-[#006cf0]" />
              Gestión de Red Social
            </h1>
            <p className="text-gray-400">
              Moderar publicaciones de la comunidad
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Aprobados</p>
            <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Pendientes</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Destacados</p>
            <p className="text-2xl font-bold text-purple-400">{stats.featured}</p>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar por contenido o autor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setFilterStatus("all")}
                variant={filterStatus === "all" ? "default" : "outline"}
                className={filterStatus === "all" ? "bg-[#006cf0]" : "border-white/20 text-white"}
              >
                Todos
              </Button>
              <Button
                onClick={() => setFilterStatus("approved")}
                variant={filterStatus === "approved" ? "default" : "outline"}
                className={filterStatus === "approved" ? "bg-green-600" : "border-white/20 text-white"}
              >
                Aprobados
              </Button>
              <Button
                onClick={() => setFilterStatus("pending")}
                variant={filterStatus === "pending" ? "default" : "outline"}
                className={filterStatus === "pending" ? "bg-yellow-600" : "border-white/20 text-white"}
              >
                Pendientes
              </Button>
            </div>
          </div>
        </Card>

        {/* Posts List */}
        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-40 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                      {post.author_name?.[0] || "U"}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-white font-semibold">{post.author_name}</p>
                        <span className="text-gray-500 text-sm">
                          {format(new Date(post.created_date), "d MMM, HH:mm", { locale: es })}
                        </span>
                        {post.is_approved ? (
                          <Badge className="bg-green-500/20 text-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Aprobado
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-300">
                            Pendiente
                          </Badge>
                        )}
                        {post.is_featured && (
                          <Badge className="bg-purple-500/20 text-purple-300">
                            Destacado
                          </Badge>
                        )}
                        <Badge className="bg-blue-500/20 text-blue-300">
                          {post.type}
                        </Badge>
                      </div>
                      
                      <p className="text-white mb-3 leading-relaxed">
                        {post.content}
                      </p>

                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {post.media_urls.slice(0, 4).map((url, i) => (
                            <img
                              key={i}
                              src={url}
                              alt=""
                              className="rounded-lg w-full aspect-square object-cover"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>❤️ {post.likes_count || 0} likes</span>
                        <span>💬 {post.comments_count || 0} comentarios</span>
                        <span>👁️ {post.views_count || 0} vistas</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {!post.is_approved && (
                      <Button
                        size="sm"
                        onClick={() => approvePostMutation.mutate(post.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprobar
                      </Button>
                    )}
                    
                    {post.is_approved && (
                      <Button
                        size="sm"
                        onClick={() => rejectPostMutation.mutate(post.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rechazar
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={() => toggleFeaturedMutation.mutate({ 
                        id: post.id, 
                        is_featured: !post.is_featured 
                      })}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {post.is_featured ? "Quitar Destacado" : "Destacar"}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => {
                        if (confirm("¿Eliminar esta publicación?")) {
                          deletePostMutation.mutate(post.id);
                        }
                      }}
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
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {searchQuery ? "No se encontraron publicaciones" : "No hay publicaciones aún"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}