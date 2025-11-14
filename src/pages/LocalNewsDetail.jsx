import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  ExternalLink,
  Share2,
  Facebook,
  Twitter,
  Mail
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

export default function LocalNewsDetailPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const newsId = urlParams.get("id");

  const { data: newsItem, isLoading } = useQuery({
    queryKey: ['localNewsDetail', newsId],
    queryFn: async () => {
      const news = await base44.entities.LocalNews.filter({ id: newsId });
      return news[0] || null;
    },
    enabled: !!newsId,
    initialData: null,
  });

  const { data: relatedNews } = useQuery({
    queryKey: ['relatedLocalNews', newsItem?.location?.city],
    queryFn: () => base44.entities.LocalNews.filter({ 
      "location.city": newsItem.location.city 
    }, "-published_date", 4),
    enabled: !!newsItem,
    initialData: [],
  });

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = newsItem ? `${newsItem.title} - SELAIAH RADIO` : '';
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = newsItem ? newsItem.title : 'Noticia de SELAIAH RADIO';
    const body = newsItem ? `Te comparto esta noticia: ${newsItem.title}\n\n${window.location.href}` : '';
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const categoryLabels = {
    eventos_cristianos: "Eventos Cristianos",
    iglesias: "Iglesias",
    ministerios: "Ministerios",
    musica_cristiana: "Música Cristiana",
    comunidad: "Comunidad"
  };

  const categoryColors = {
    eventos_cristianos: "from-blue-500 to-cyan-500",
    iglesias: "from-purple-500 to-pink-500",
    ministerios: "from-orange-500 to-red-500",
    musica_cristiana: "from-green-500 to-emerald-500",
    comunidad: "from-gray-500 to-slate-500"
  };

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

  if (!newsItem) {
    return (
      <div className="min-h-screen py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Noticia no encontrada</h1>
          <Link to={createPageUrl("LocalNews")}>
            <Button className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white">
              Volver a Noticias Locales
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to={createPageUrl("LocalNews")}>
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Noticias Locales
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
            {/* News Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <span className={`px-4 py-2 rounded-full bg-gradient-to-r ${categoryColors[newsItem.category]} text-white font-medium uppercase text-sm`}>
                  {categoryLabels[newsItem.category]}
                </span>
                {newsItem.published_date && (
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(newsItem.published_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                )}
                {newsItem.relevance_score >= 80 && (
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                    Alta Relevancia
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                {newsItem.title}
              </h1>

              {newsItem.summary && (
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  {newsItem.summary}
                </p>
              )}

              {/* Location & Share Bar */}
              <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-y border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {newsItem.location?.city}, {newsItem.location?.state}
                    </p>
                    <p className="text-sm text-gray-400">{newsItem.location?.country}</p>
                  </div>
                </div>
                
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
                </div>
              </div>
            </div>

            {/* Featured Image */}
            {newsItem.image_url && (
              <div className="mb-8 rounded-2xl overflow-hidden">
                <img 
                  src={newsItem.image_url} 
                  alt={newsItem.title} 
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Content */}
            <Card className="bg-white/5 border-white/10 p-8 md:p-10 mb-8">
              <div className="prose prose-invert prose-lg max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {newsItem.content}
                </div>
              </div>

              {/* Source */}
              {newsItem.source && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-sm text-gray-400 mb-2">Fuente:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{newsItem.source}</p>
                    {newsItem.source_url && (
                      <a
                        href={newsItem.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        Ver fuente original
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </Card>
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
                Compartir Noticia
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
              </div>
            </Card>

            {/* Related News */}
            {relatedNews.filter(n => n.id !== newsItem.id).length > 0 && (
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Más Noticias de {newsItem.location?.city}
                </h3>
                <div className="space-y-4">
                  {relatedNews.filter(n => n.id !== newsItem.id).slice(0, 3).map(relatedItem => (
                    <Link key={relatedItem.id} to={createPageUrl(`LocalNewsDetail?id=${relatedItem.id}`)}>
                      <div className="group cursor-pointer">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500/20 to-cyan-500/20 shrink-0">
                            {relatedItem.image_url ? (
                              <img 
                                src={relatedItem.image_url} 
                                alt={relatedItem.title} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-blue-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold text-sm group-hover:text-blue-400 transition line-clamp-2 mb-1">
                              {relatedItem.title}
                            </h4>
                            {relatedItem.published_date && (
                              <p className="text-xs text-gray-500">
                                {format(new Date(relatedItem.published_date), "d MMM yyyy", { locale: es })}
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

            {/* Location Info */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Ubicación
              </h3>
              <div className="space-y-2 text-gray-300">
                <p><strong>Ciudad:</strong> {newsItem.location?.city}</p>
                <p><strong>Estado:</strong> {newsItem.location?.state}</p>
                <p><strong>País:</strong> {newsItem.location?.country}</p>
              </div>
            </Card>
          </motion.aside>
        </div>
      </div>
    </div>
  );
}