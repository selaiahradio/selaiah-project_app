
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ArrowLeft, Search, CheckCircle, XCircle, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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

const getSocialPosts = () => fetcher('/social_posts?sort=-created_date');
const updateSocialPost = ({ id, data }) => fetcher(`/social_posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
const deleteSocialPost = (id) => fetcher(`/social_posts/${id}`, { method: 'DELETE' });
// --- END: NEW API LOGIC ---

export default function AdminSocialPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['adminSocialPosts'],
    queryFn: getSocialPosts,
    initialData: [],
  });

  const updatePostMutation = useMutation({
    mutationFn: updateSocialPost,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      if (variables.data.hasOwnProperty('is_approved')) {
        toast.success(variables.data.is_approved ? "Post aprobado" : "Post rechazado");
      } else {
        toast.success("Post actualizado");
      }
    },
    onError: (err) => toast.error(`Error al actualizar el post: ${err.message}`),
  });

  const deletePostMutation = useMutation({
    mutationFn: deleteSocialPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSocialPosts'] });
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      toast.success("Post eliminado");
    },
    onError: (err) => toast.error(`Error al eliminar el post: ${err.message}`),
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.author_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "approved" && post.is_approved) ||
                         (filterStatus === "pending" && post.is_approved === false) ||
                         (filterStatus === "null" && post.is_approved === null);

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: posts.length,
    approved: posts.filter(p => p.is_approved === true).length,
    pending: posts.filter(p => p.is_approved === false || p.is_approved === null).length,
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
           <Card className="bg-white/5 border-white/10 p-4"><p className="text-gray-400 text-sm mb-1">Total</p><p className="text-2xl font-bold text-white">{stats.total}</p></Card>
           <Card className="bg-white/5 border-white/10 p-4"><p className="text-gray-400 text-sm mb-1">Aprobados</p><p className="text-2xl font-bold text-green-400">{stats.approved}</p></Card>
           <Card className="bg-white/5 border-white/10 p-4"><p className="text-gray-400 text-sm mb-1">Pendientes</p><p className="text-2xl font-bold text-yellow-400">{stats.pending}</p></Card>
           <Card className="bg-white/5 border-white/10 p-4"><p className="text-gray-400 text-sm mb-1">Destacados</p><p className="text-2xl font-bold text-purple-400">{stats.featured}</p></Card>
        </div>

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
              <Button onClick={() => setFilterStatus("all")} variant={filterStatus === "all" ? "default" : "outline"} className={filterStatus === "all" ? "bg-[#006cf0] text-white" : "border-white/20 text-white"}>Todos</Button>
              <Button onClick={() => setFilterStatus("approved")} variant={filterStatus === "approved" ? "default" : "outline"} className={filterStatus === "approved" ? "bg-green-600 text-white" : "border-white/20 text-white"}>Aprobados</Button>
              <Button onClick={() => setFilterStatus("pending")} variant={filterStatus === "pending" ? "default" : "outline"} className={filterStatus === "pending" ? "bg-yellow-600 text-white" : "border-white/20 text-white"}>Pendientes</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, i) => <div key={i} className="h-40 bg-white/5 rounded-lg animate-pulse" />)
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <Card key={post.id} className="bg-white/5 border-white/10 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">{post.author_name?.[0] || "U"}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <p className="text-white font-semibold">{post.author_name}</p>
                        <span className="text-gray-500 text-sm">{format(new Date(post.created_date), "d MMM, HH:mm", { locale: es })}</span>
                        {post.is_approved === true && <Badge className="bg-green-500/20 text-green-300"><CheckCircle className="w-3 h-3 mr-1" />Aprobado</Badge>}
                        {(post.is_approved === false || post.is_approved === null) && <Badge className="bg-yellow-500/20 text-yellow-300">Pendiente</Badge>}
                        {post.is_featured && <Badge className="bg-purple-500/20 text-purple-300"><Star className="w-3 h-3 mr-1"/>Destacado</Badge>}
                      </div>
                      <p className="text-white mb-3 leading-relaxed">{post.content}</p>
                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {post.media_urls.slice(0, 4).map((url, i) => <img key={i} src={url} alt="" className="rounded-lg w-full aspect-square object-cover" />)}
                        </div>
                      )}
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>❤️ {post.likes_count || 0}</span>
                        <span>💬 {post.comments_count || 0}</span>
                        <span>👁️ {post.views_count || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-[150px]">
                    {post.is_approved !== true && <Button size="sm" onClick={() => updatePostMutation.mutate({ id: post.id, data: { is_approved: true } })} className="bg-green-600 hover:bg-green-700 text-white"><CheckCircle className="w-4 h-4 mr-1" />Aprobar</Button>}
                    {post.is_approved === true && <Button size="sm" onClick={() => updatePostMutation.mutate({ id: post.id, data: { is_approved: false } })} className="bg-yellow-600 hover:bg-yellow-700 text-white"><XCircle className="w-4 h-4 mr-1" />Rechazar</Button>}
                    <Button size="sm" onClick={() => updatePostMutation.mutate({ id: post.id, data: { is_featured: !post.is_featured }})} className="bg-purple-600 hover:bg-purple-700 text-white">
                        {post.is_featured ? <XCircle className="w-4 h-4 mr-1"/> : <Star className="w-4 h-4 mr-1"/>}
                        {post.is_featured ? "Quitar Destacado" : "Destacar"}
                    </Button>
                    <Button size="sm" onClick={() => { if (confirm("¿Eliminar esta publicación?")) { deletePostMutation.mutate(post.id); }}} className="bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-4 h-4 mr-1" />Eliminar</Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">{searchQuery ? "No se encontraron publicaciones" : "No hay publicaciones aún"}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
