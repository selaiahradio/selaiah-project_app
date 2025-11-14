import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Calendar, 
  Mic2, 
  TrendingUp, 
  ChevronRight,
  ThumbsUp,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "../components/player/AudioContext";
import { useLanguage } from "../components/LanguageContext";

export default function HomePage() {
  const { t } = useLanguage();
  const [currentUser, setCurrentUser] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Usar el contexto de audio global
  const {
    isPlaying,
    volume,
    isMuted,
    isLoading,
    streamConfig,
    nowPlaying,
    togglePlay,
    toggleMute,
    handleVolumeChange
  } = useAudio();

  // Imágenes para el slideshow
  const slideImages = [
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80",
    "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&q=80",
    "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80",
  ];

  const slideTexts = [
    "Unidos en adoración",
    "La Palabra de Dios",
    "Comunión en oración",
    "El poder de la cruz",
    "Celebrando juntos",
    "Alabanza y adoración"
  ];

  // Obtener usuario actual
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [slideImages.length]);

  const { data: featuredShows } = useQuery({
    queryKey: ['featuredShows'],
    queryFn: () => base44.entities.RadioShow.filter({ is_featured: true, status: "active" }),
    initialData: [],
  });

  const { data: featuredDJ } = useQuery({
    queryKey: ['featuredDJ'],
    queryFn: async () => {
      const djs = await base44.entities.RadioJockey.filter({ is_featured: true, status: "active" });
      return djs[0] || null;
    },
    initialData: null,
  });

  const { data: latestPosts } = useQuery({
    queryKey: ['latestPosts'],
    queryFn: () => base44.entities.BlogPost.filter({ is_published: true }, "-published_date", 3),
    initialData: [],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.home.greeting.morning;
    if (hour < 19) return t.home.greeting.afternoon;
    return t.home.greeting.evening;
  };

  const artistImage = nowPlaying?.cover_art_url || 
                      nowPlaying?.artist_image_url || 
                      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e2/default-radio-image.webp";
  
  return (
    <div className="min-h-screen">
      {/* Mobile Player Screen */}
      <section className="lg:hidden relative min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-[340px] mb-6"
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl bg-slate-800">
              <img 
                key={artistImage}
                src={artistImage}
                alt={nowPlaying?.artist || "SELAIAH RADIO"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e2/default-radio-image.webp";
                }}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full mb-4"
          >
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 text-center mb-1 line-clamp-2">
              {nowPlaying?.artist || "SELAIAH RADIO"}
            </h2>
            <p className="text-lg text-gray-300 text-center line-clamp-2">
              {nowPlaying?.song_title || t.home.subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-8 mb-6"
          >
            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition">
              <ThumbsUp className="w-6 h-6" />
              <span className="text-xs">{t.common?.like || 'Me gusta'}</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition">
              <Share2 className="w-6 h-6" />
              <span className="text-xs">{t.sacredTexts?.share || 'Compartir'}</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-red-400">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <span className="text-xs">{t.common?.live || 'En Vivo'}</span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <a href="https://youtube.com/@selaiahradio" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-gray-800 hover:bg-red-600 flex items-center justify-center transition-all">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>

            <a href="https://twitter.com/selaiahradio" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-gray-800 hover:bg-cyan-500 flex items-center justify-center transition-all">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>

            <button
              onClick={togglePlay}
              disabled={isLoading || !streamConfig}
              className="w-20 h-20 rounded-full bg-[#006cf0] hover:bg-[#00479e] flex items-center justify-center transition-all active:scale-95 shadow-lg disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-10 h-10 text-white fill-white" />
              ) : (
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              )}
            </button>

            <a href="https://instagram.com/selaiahradio" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-gray-800 hover:bg-pink-600 flex items-center justify-center transition-all">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>

            <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="w-12 h-12 rounded-full bg-gray-800 hover:bg-green-600 flex items-center justify-center transition-all">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full max-w-md mb-6"
          >
            <div className="flex items-center gap-4">
              <button
                onClick={toggleMute}
                className="text-gray-400 hover:text-white transition"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-6 h-6" />
                ) : (
                  <Volume2 className="w-6 h-6" />
                )}
              </button>
              <div className="flex-1 relative h-3 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                  style={{ width: `${isMuted ? 0 : volume}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
              </div>
              <span className="text-white text-sm font-medium w-10 text-right">
                {Math.round(isMuted ? 0 : volume)}%
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <p className="text-sm text-gray-500">{t.home.transmitting}</p>
            <p className="text-lg font-bold text-white">SELAIAH RADIO</p>
            <p className="text-xs text-gray-500">{t.home.subtitle}</p>
          </motion.div>
        </div>
      </section>

      {/* Desktop Hero */}
      <section className="hidden lg:block relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 0.6, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 2 }}
              className="absolute inset-0"
            >
              <img
                src={slideImages[currentSlide]}
                alt={slideTexts[currentSlide]}
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-slate-900/90" />
        </div>

        <div className="relative container mx-auto px-4 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              {getGreeting()}{currentUser ? `, ${currentUser.full_name}` : ""}
            </h1>
            <p className="text-xl md:text-2xl text-blue-300 mb-4">
              {t.home.welcome}
            </p>
            <p className="text-gray-300 mb-8 text-lg italic">
              "Cantad alegres a Dios, habitantes de toda la tierra" - Salmos 100:1
            </p>
            <p className="text-gray-400 mb-8">
              {t.home.subtitle}
            </p>

            <div className="mb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 1 }}
                  className="text-center"
                >
                  <p className="text-white text-3xl md:text-4xl font-bold drop-shadow-2xl">
                    {slideTexts[currentSlide]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-2 mb-8">
              {slideImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`transition-all duration-300 ${
                    index === currentSlide 
                      ? "bg-white w-12 h-3" 
                      : "bg-white/40 hover:bg-white/60 w-3 h-3"
                  } rounded-full`}
                />
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
                <Link to={createPageUrl("Shows")}>
                  <Calendar className="mr-2 h-6 w-6" />
                  {t.home.programming}
                </Link>
              </Button>
              {!currentUser ? (
                <Button 
                  size="lg" 
                  onClick={() => base44.auth.redirectToLogin(window.location.pathname)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6"
                >
                  {t.home.joinCommunity}
                </Button>
              ) : (
                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
                  <Link to={createPageUrl("Feed")}>
                    {t.nav.community}
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Shows */}
      {featuredShows.length > 0 && (
        <section className="py-8 lg:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">{t.nav.shows} {t.common?.featured || 'Destacados'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredShows.map((show) => (
                <Card key={show.id} className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                  {show.cover_image_url && (
                    <img src={show.cover_image_url} alt={show.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{show.title}</h3>
                    <p className="text-gray-400 mb-4">{show.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{show.day_of_week}</span>
                      <span>{show.time_slot}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                <Link to={createPageUrl("Shows")}>
                  {t.common.viewMore} <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured DJ */}
      {featuredDJ && (
        <section className="py-8 lg:py-16 bg-gradient-to-r from-blue-900/20 to-blue-900/20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {featuredDJ.profile_image_url && (
                  <img 
                    src={featuredDJ.profile_image_url} 
                    alt={featuredDJ.stage_name}
                    className="w-48 h-48 rounded-full object-cover ring-4 ring-blue-500/50"
                  />
                )}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-blue-400 uppercase tracking-wide text-sm mb-2">DJ {t.common?.featured || 'Destacado'}</p>
                  <h2 className="text-4xl font-bold text-white mb-4">{featuredDJ.stage_name}</h2>
                  <p className="text-gray-300 mb-6">{featuredDJ.bio}</p>
                  <Button asChild className="bg-blue-600 hover:bg-blue-700">
                    <Link to={createPageUrl("RadioJockeys")}>
                      <Mic2 className="mr-2 h-4 w-4" />
                      {t.common.viewMore} {t.nav.djs}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Blog Posts */}
      {latestPosts.length > 0 && (
        <section className="py-8 lg:py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">{t.nav.blog} - {t.common?.latest || 'Últimas Publicaciones'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestPosts.map((post) => (
                <Card key={post.id} className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                  {post.featured_image_url && (
                    <img src={post.featured_image_url} alt={post.title} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                        {post.category}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(post.published_date).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                    <p className="text-gray-400 mb-4 line-clamp-3">{post.excerpt}</p>
                    <Button variant="link" asChild className="text-blue-400 hover:text-blue-300 p-0">
                      <Link to={`${createPageUrl("BlogPost")}?id=${post.id}`}>
                        {t.common?.readMore || 'Leer más'} <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="outline" asChild className="border-white/20 text-white hover:bg-white/10">
                <Link to={createPageUrl("Blog")}>
                  {t.common.viewMore} <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-12 lg:py-20 bg-gradient-to-r from-blue-600 to-blue-700 mb-6 lg:mb-0">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {t.common?.needPrayer || '¿Necesitas oración? ¿Tienes un testimonio que compartir?'}
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            {t.common?.prayerText || 'Estamos aquí para orar contigo'}
          </p>
          <Button size="lg" variant="secondary" asChild className="bg-white text-blue-600 hover:bg-gray-100">
            <Link to={createPageUrl("Contact")}>
              <TrendingUp className="mr-2 h-5 w-5" />
              {t.nav.contact}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}