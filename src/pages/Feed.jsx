import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Video,
  MapPin,
  Send,
  Smile,
  MoreHorizontal,
  HandHeart
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function FeedPage() {
  const [newPostContent, setNewPostContent] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  const { data: posts, isLoading } = useQuery({
    queryKey: ['socialPosts'],
    queryFn: () => base44.entities.SocialPost.filter({ is_approved: true }, "-created_date", 50),
    initialData: [],
  });

  const createPostMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialPost.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
      setNewPostContent("");
      toast.success("¡Publicación compartida!");
    },
    onError: () => toast.error("Error al publicar"),
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId }) => {
      if (!currentUser) return;
      
      const existing = await base44.entities.SocialLike.filter({
        post_id: postId,
        user_email: currentUser.email
      });

      const currentPost = posts.find(p => p.id === postId);
      
      if (existing.length > 0) {
        await base44.entities.SocialLike.delete(existing[0].id);
        await base44.entities.SocialPost.update(postId, {
          likes_count: Math.max(0, (currentPost?.likes_count || 1) - 1)
        });
      } else {
        await base44.entities.SocialLike.create({
          post_id: postId,
          user_email: currentUser.email,
          reaction_type: "like"
        });
        await base44.entities.SocialPost.update(postId, {
          likes_count: (currentPost?.likes_count || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socialPosts'] });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) {
      toast.error("Escribe algo antes de publicar");
      return;
    }

    if (!currentUser) {
      toast.error("Debes iniciar sesión para publicar");
      return;
    }

    createPostMutation.mutate({
      author_email: currentUser.email,
      author_name: currentUser.full_name,
      content: newPostContent,
      type: "text",
      visibility: "public",
      is_approved: true
    });
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            Comunidad Cristiana
          </h1>
          <p className="text-gray-400">
            Comparte testimonios, eventos y momentos de fe
          </p>
        </motion.div>

        <Card className="bg-white/5 border-white/10 p-6 mb-8">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {currentUser?.full_name?.[0] || "U"}
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Comparte algo con la comunidad..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="bg-white/10 border-white/20 text-white resize-none mb-3"
                rows={3}
              />
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                <Button
                  onClick={handleCreatePost}
                  disabled={createPostMutation.isPending || !newPostContent.trim()}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <AnimatePresence>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-64 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/10 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {post.author_name?.[0] || "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{post.author_name}</p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(post.created_date), "d MMM, HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>

                      <p className="text-white mb-4 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {post.media_urls && post.media_urls.length > 0 && (
                        <div className="mb-4 grid grid-cols-2 gap-2">
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

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                        <span>{post.likes_count || 0} me gusta</span>
                        <span>{post.comments_count || 0} comentarios</span>
                        <span>{post.shares_count || 0} compartidos</span>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                        <Button
                          onClick={() => currentUser && toggleLikeMutation.mutate({ postId: post.id })}
                          variant="ghost"
                          className="flex-1 text-gray-300 hover:text-red-400 hover:bg-red-500/10"
                        >
                          <Heart className="w-4 h-4 mr-2" />
                          Me gusta
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex-1 text-gray-300 hover:text-blue-400 hover:bg-blue-500/10"
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Comentar
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex-1 text-gray-300 hover:text-green-400 hover:bg-green-500/10"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          Compartir
                        </Button>
                        <Button
                          variant="ghost"
                          className="flex-1 text-gray-300 hover:text-purple-400 hover:bg-purple-500/10"
                        >
                          <HandHeart className="w-4 h-4 mr-2" />
                          Orar
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">
                Aún no hay publicaciones
              </p>
              <p className="text-gray-500">
                Sé el primero en compartir algo con la comunidad
              </p>
            </Card>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}