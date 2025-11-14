
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useGeolocation } from "../components/location/LocationService";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function LocalNewsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { getLocation, saveLocation, loading: locationLoading } = useGeolocation();

  const { data: userLocation } = useQuery({
    queryKey: ['userLocation'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const locations = await base44.entities.UserLocation.filter({
        created_by: user.email,
        is_primary: true
      });
      return locations[0] || null;
    },
    initialData: null,
  });

  const { data: localNews, isLoading: newsLoading } = useQuery({
    queryKey: ['localNews', userLocation?.city],
    queryFn: async () => {
      if (!userLocation) return [];
      
      const news = await base44.entities.LocalNews.filter(
        {
          "location.city": userLocation.city
        },
        "-published_date",
        20
      );
      return news;
    },
    enabled: !!userLocation,
    initialData: [],
  });

  const handleGetLocation = async () => {
    try {
      const locationData = await getLocation();
      if (locationData) {
        await saveLocation(locationData);
        queryClient.invalidateQueries({ queryKey: ['userLocation'] });
        toast.success("Ubicación actualizada");
      }
    } catch (error) {
      toast.error("Error obteniendo ubicación");
    }
  };

  const generateLocalNews = async () => {
    if (!userLocation) {
      toast.error("Primero necesitamos tu ubicación");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 recent and highly relevant local PENTECOSTAL/CHRISTIAN news articles for ${userLocation.city}, ${userLocation.state}, ${userLocation.country}. 

IMPORTANT - PENTECOSTAL FOCUS:
- Events, conferences, revivals and crusades in Pentecostal churches
- Healing services, miracle testimonies and manifestations of the Holy Spirit
- Worship concerts, Christian music events with Pentecostal artists
- Baptisms in the Holy Spirit, speaking in tongues testimonies
- Ministry activities: evangelism, missions, prayer vigils
- Local Pentecostal pastors and ministers
- Youth and children's ministry activities
- Community service and social impact by Pentecostal churches
- Prophecy, spiritual gifts and signs & wonders testimonies
- Bible study groups and discipleship programs

Make sure the news is:
- RECENT (within last 2 weeks)
- Related to PENTECOSTAL/CHARISMATIC Christian community
- Specific to the location: ${userLocation.city}, ${userLocation.state}
- AUTHENTIC and verifiable (use real church names and events if available)
- Positive, faith-building and uplifting
- Include emphasis on Holy Spirit baptism, spiritual gifts, healing, miracles

For each news article provide:
- title (engaging, faith-focused, emphasizing Pentecostal themes)
- content (detailed article, 250-350 words, include specific details about the event/testimony)
- summary (brief 2-3 sentence summary)
- source (credible local Pentecostal church, ministry or Christian news source)
- category (eventos_cristianos/iglesias/ministerios/musica_cristiana/comunidad)
- published_date (ISO format, within last 2 weeks)
- relevance_score (80-100 for highly relevant Pentecostal content)`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            news_articles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  content: { type: "string" },
                  summary: { type: "string" },
                  source: { type: "string" },
                  category: { type: "string" },
                  published_date: { type: "string" },
                  relevance_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (result.news_articles) {
        // Guardar noticias en la base de datos
        for (const article of result.news_articles) {
          await base44.entities.LocalNews.create({
            ...article,
            location: {
              city: userLocation.city,
              state: userLocation.state,
              country: userLocation.country,
              latitude: userLocation.latitude,
              longitude: userLocation.longitude
            }
          });
        }

        queryClient.invalidateQueries({ queryKey: ['localNews'] });
        toast.success(`${result.news_articles.length} noticias pentecostales generadas`);
      }
    } catch (error) {
      console.error("Error generando noticias:", error);
      toast.error("Error generando noticias locales");
    } finally {
      setIsGenerating(false);
    }
  };

  const categoryColors = {
    eventos_cristianos: "from-blue-500 to-cyan-500",
    iglesias: "from-purple-500 to-pink-500",
    ministerios: "from-orange-500 to-red-500",
    musica_cristiana: "from-green-500 to-emerald-500",
    comunidad: "from-gray-500 to-slate-500"
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Noticias Cristianas Locales
          </h1>
          <p className="text-xl text-gray-400">
            Descubre lo que Dios está haciendo en tu ciudad
          </p>
        </motion.div>

        {/* Location Card */}
        <Card className="bg-white/5 border-white/10 p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-blue-400" />
              <div>
                {userLocation ? (
                  <>
                    <p className="text-white font-semibold text-lg">
                      {userLocation.city}, {userLocation.state}
                    </p>
                    <p className="text-gray-400 text-sm">{userLocation.country}</p>
                  </>
                ) : (
                  <p className="text-gray-400">No se ha detectado tu ubicación</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleGetLocation}
                disabled={locationLoading}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                {locationLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 mr-2" />
                )}
                {userLocation ? "Actualizar" : "Obtener"} Ubicación
              </Button>

              {userLocation && (
                <Button
                  onClick={generateLocalNews}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Generar Noticias
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* News Grid */}
        {!userLocation ? (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Activa tu Ubicación
            </h3>
            <p className="text-gray-400 mb-6">
              Necesitamos conocer tu ubicación para mostrarte noticias locales relevantes
            </p>
            <Button
              onClick={handleGetLocation}
              disabled={locationLoading}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Permitir Ubicación
            </Button>
          </Card>
        ) : newsLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : localNews.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 gap-6"
          >
            {localNews.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full flex flex-col">
                  {article.image_url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`text-xs px-3 py-1 rounded-full bg-gradient-to-r ${categoryColors[article.category] || categoryColors.comunidad} text-white font-medium uppercase`}>
                        {article.category}
                      </span>
                      {article.relevance_score && article.relevance_score >= 80 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 font-medium">
                          Muy Relevante
                        </span>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                      {article.title}
                    </h3>

                    <p className="text-gray-400 text-sm mb-4 line-clamp-3 flex-1">
                      {article.summary || article.content.substring(0, 150) + "..."}
                    </p>

                    <div className="flex items-center justify-between text-sm pt-4 border-t border-white/10">
                      <div>
                        <p className="font-medium text-white">{article.source}</p>
                        {article.published_date && (
                          <p className="text-xs text-gray-400">
                            {format(new Date(article.published_date), "d MMM yyyy", { locale: es })}
                          </p>
                        )}
                      </div>
                      <Link to={createPageUrl(`LocalNewsDetail?id=${article.id}`)}>
                        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                          Leer más
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <h3 className="text-2xl font-bold text-white mb-2">
              No hay noticias aún
            </h3>
            <p className="text-gray-400 mb-6">
              Genera noticias locales usando inteligencia artificial
            </p>
            <Button
              onClick={generateLocalNews}
              disabled={isGenerating}
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Generar Noticias
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
