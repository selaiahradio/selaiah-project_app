import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag, 
  Share2, 
  Facebook, 
  Twitter, 
  Mail,
  Clock,
  Bookmark,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function BlogPostPage() {
  const [copied, setCopied] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get("slug");

  const { data: post, isLoading } = useQuery({
    queryKey: ['blogPost', slug],
    queryFn: async () => {
      const posts = await base44.entities.BlogPost.filter({ slug, is_published: true });
      return posts[0] || null;
    },
    enabled: !!slug,
    initialData: null,
  });

  const { data: relatedPosts } = useQuery({
    queryKey: ['relatedPosts', post?.category],
    queryFn: () => base44.entities.BlogPost.filter({ 
      category: post.category, 
      is_published: true 
    }, "-published_date", 4),
    enabled: !!post,
    initialData: [],
  });

  const { data: allPosts } = useQuery({
    queryKey: ['allBlogPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ is_published: true }, "-published_date"),
    enabled: !!post,
    initialData: [],
  });

  const currentIndex = allPosts.findIndex(p => p.id === post?.id);
  const previousPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const nextPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    toast.success("Enlace copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = post ? `${post.title} - SELAIAH RADIO` : '';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = post ? post.title : 'Artículo de SELAIAH RADIO';
    const body = post ? `Te comparto este artículo: ${post.title}\n\n${window.location.href}` : '';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const estimatedReadTime = post ? Math.ceil(post.content.split(' ').length / 200) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-4">
            <div className="h-12 bg-white/5 rounded animate-pulse" />
            <div className="h-96 bg-white/5 rounded animate-pulse" />
            <div className="h-64 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Artículo no encontrado</h1>
          <Link to={createPageUrl("Blog")}>
            <Button className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white">
              Volver al Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabels = {
    testimonios: "Testimonios",
    devocionales: "Devocionales",
    sermones: "Sermones",
    eventos: "Eventos",
    musica: "Música Cristiana",
    general: "General"
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to={createPageUrl("Blog")}>
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Blog
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Content */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8"
          >
            {/* Post Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className="px-4 py-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-700 text-white font-medium uppercase text-sm">
                  {categoryLabels[post.category]}
                </span>
                {post.published_date && (
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(post.published_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                )}
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {estimatedReadTime} min de lectura
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
              )}

              {/* Author & Share Bar */}
              <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-y border-white/10">
                {post.author_name && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{post.author_name}</p>
                      <p className="text-sm text-gray-400">Autor</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={shareOnFacebook}
                    size="sm"
                    className="bg-[#1877f2] hover:bg-[#1877f2]/90 text-white"
                  >
                    <Facebook className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={shareOnTwitter}
                    size="sm"
                    className="bg-[#1da1f2] hover:bg-[#1da1f2]/90 text-white"
                  >
                    <Twitter className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={shareByEmail}
                    size="sm"
                    className="bg-gray-600 hover:bg-gray-700 text-white"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    className="bg-[#006cf0] hover:bg-[#00479e] text-white"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img 
                  src={post.featured_image} 
                  alt={post.title} 
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Content */}
            <Card className="bg-white/5 border-white/10 p-8 md:p-10 mb-8">
              <ReactMarkdown 
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:text-white prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4
                  prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl
                  prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-4
                  prose-a:text-purple-400 prose-a:no-underline hover:prose-a:text-purple-300
                  prose-strong:text-white prose-strong:font-bold
                  prose-em:text-gray-300 prose-em:italic
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4
                  prose-li:text-gray-300 prose-li:my-2
                  prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400
                  prose-code:bg-white/10 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-purple-300
                  prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                  prose-img:rounded-lg prose-img:my-6"
                components={{
                  h1: ({children}) => <h1 className="text-3xl font-bold text-white mt-8 mb-4">{children}</h1>,
                  h2: ({children}) => <h2 className="text-2xl font-bold text-white mt-8 mb-4">{children}</h2>,
                  h3: ({children}) => <h3 className="text-xl font-bold text-white mt-6 mb-3">{children}</h3>,
                  p: ({children}) => <p className="text-gray-300 leading-relaxed mb-4">{children}</p>,
                  a: ({children, href}) => (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                      {children}
                    </a>
                  ),
                  blockquote: ({children}) => (
                    <blockquote className="border-l-4 border-purple-500 pl-4 py-2 my-6 italic text-gray-400 bg-white/5 rounded-r">
                      {children}
                    </blockquote>
                  ),
                  code: ({inline, children}) => {
                    if (inline) {
                      return <code className="bg-white/10 px-2 py-1 rounded text-purple-300">{children}</code>;
                    }
                    return <code className="block bg-slate-900 p-4 rounded-lg overflow-x-auto">{children}</code>;
                  }
                }}
              >
                {post.content}
              </ReactMarkdown>
            </Card>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Etiquetas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-4 py-2 rounded-full bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {previousPost && (
                <Link to={createPageUrl(`BlogPost?slug=${previousPost.slug}`)}>
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition p-4 group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <ChevronLeft className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
                      <div className="flex-1">
                        <p className="text-xs text-gray-400 mb-1">Artículo Anterior</p>
                        <p className="text-white font-semibold line-clamp-2">{previousPost.title}</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              )}
              {nextPost && (
                <Link to={createPageUrl(`BlogPost?slug=${nextPost.slug}`)}>
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition p-4 group cursor-pointer md:col-start-2">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-right">
                        <p className="text-xs text-gray-400 mb-1">Siguiente Artículo</p>
                        <p className="text-white font-semibold line-clamp-2">{nextPost.title}</p>
                      </div>
                      <ChevronRight className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
                    </div>
                  </Card>
                </Link>
              )}
            </div>
          </motion.article>

          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Share Card */}
            <Card className="bg-white/5 border-white/10 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Compartir Artículo
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={shareOnFacebook}
                  className="w-full bg-[#1877f2] hover:bg-[#1877f2]/90 text-white justify-start"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Compartir en Facebook
                </Button>
                <Button
                  onClick={shareOnTwitter}
                  className="w-full bg-[#1da1f2] hover:bg-[#1da1f2]/90 text-white justify-start"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Compartir en Twitter
                </Button>
                <Button
                  onClick={shareByEmail}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white justify-start"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Enviar por Email
                </Button>
                <Button
                  onClick={copyToClipboard}
                  className="w-full bg-[#006cf0] hover:bg-[#00479e] text-white justify-start"
                >
                  {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  {copied ? 'Enlace Copiado' : 'Copiar Enlace'}
                </Button>
              </div>
            </Card>

            {/* Related Posts */}
            {relatedPosts.filter(p => p.id !== post.id).length > 0 && (
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Artículos Relacionados
                </h3>
                <div className="space-y-4">
                  {relatedPosts.filter(p => p.id !== post.id).slice(0, 3).map(relatedPost => (
                    <Link key={relatedPost.id} to={createPageUrl(`BlogPost?slug=${relatedPost.slug}`)}>
                      <div className="group cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-600/20 shrink-0">
                            {relatedPost.featured_image ? (
                              <img 
                                src={relatedPost.featured_image} 
                                alt={relatedPost.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Tag className="w-8 h-8 text-purple-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-sm group-hover:text-purple-400 transition line-clamp-2 mb-1">
                              {relatedPost.title}
                            </h4>
                            {relatedPost.published_date && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(relatedPost.published_date), "d MMM yyyy", { locale: es })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            )}

            {/* Categories */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Categorías
              </h3>
              <div className="space-y-2">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <Link key={key} to={createPageUrl("Blog")}>
                    <div className="text-gray-300 hover:text-white transition py-2 border-b border-white/5 last:border-0">
                      {label}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}