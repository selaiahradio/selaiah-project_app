import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAudio } from '@/components/player/AudioContext';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/components/LanguageContext';
import { getPagePath } from '@/pages.config';

import { Play, Pause, Heart, Share2, Radio, Music, Users, ArrowRight } from 'lucide-react';

// Mock API calls for featured content
const fetchFeaturedShows = async () => {
  // In a real app, you'd fetch this from your backend
  return Promise.resolve([
    { id: 1, title: 'Encuentro con Dios', description: 'Un espacio de reflexión y música para empezar el día.' },
    { id: 2, title: 'Alabanza Contagiosa', description: 'Las mejores alabanzas que levantan el espíritu.' },
    { id: 3, title: 'Noche de Oración', description: 'Únete en oración por las necesidades de nuestra comunidad.' },
  ]);
};

const fetchFeaturedDJ = async () => {
  return Promise.resolve({ id: 1, name: 'DJ Emanuel', bio: 'Llevando la palabra de Dios a través de la música. Conéctate y siente la presencia del Señor.', photo_url: 'https://images.unsplash.com/photo-1597589827317-4c6d6e0a90bd?w=800&q=80' });
};

const fetchLatestPosts = async () => {
  return Promise.resolve([
    { id: 1, title: 'El Poder de la Oración en Tiempos de Crisis', excerpt: 'Descubre cómo la oración puede ser tu mayor fortaleza...', category: 'Devocionales', slug: 'poder-oracion' },
    { id: 2, title: 'Testimonio: Sanidad Divina', excerpt: 'Una historia impactante de fe y milagros...', category: 'Testimonios', slug: 'testimonio-sanidad' },
    { id: 3, title: 'Próximo Concierto de Adoración', excerpt: 'No te pierdas nuestra gran noche de alabanza...', category: 'Eventos', slug: 'concierto-adoracion' },
  ]);
};

export default function Home() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { isPlaying, volume, isMuted, isLoading, streamConfig, nowPlaying, togglePlay, toggleMute, handleVolumeChange } = useAudio();

  const backgroundImages = [
      'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80',
      'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1200&q=80',
      'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1200&q=80',
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80',
  ];
  const backgroundTexts = [
    'Unidos en adoración',
    'La Palabra de Dios',
    'Comunión y oración',
    'Alabanza que transforma',
  ];


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const { data: featuredShows = [] } = useQuery({ queryKey: ['featuredShows'], queryFn: fetchFeaturedShows });
  const { data: featuredDJ } = useQuery({ queryKey: ['featuredDJ'], queryFn: fetchFeaturedDJ });
  const { data: latestPosts = [] } = useQuery({ queryKey: ['latestPosts'], queryFn: fetchLatestPosts });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.home.greeting.morning;
    if (hour < 19) return t.home.greeting.afternoon;
    return t.home.greeting.evening;
  };

  const coverArt = nowPlaying?.cover_art_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e2/default-radio-image.webp';

  return (
    <div className="min-h-screen">
      {/* Mobile Player Section */}
      <section className="lg:hidden relative min-h-screen flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 px-6 py-8">
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[340px] mb-6"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl bg-slate-800">
                  <img src={coverArt} alt={nowPlaying?.artist || 'SELAIAH RADIO'} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e2/default-radio-image.webp'; }} />
              </div>
            </motion.div>

            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: .2}} className="w-full mb-4">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 text-center mb-1 line-clamp-2">
                {nowPlaying?.artist || 'SELAIAH RADIO'}
              </h2>
              <p className="text-lg text-gray-300 text-center line-clamp-2">
                {nowPlaying?.song_title || t.home.subtitle}
              </p>
            </motion.div>

             <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay: .3}} className="flex items-center justify-center gap-8 mb-6">
                <button className='flex flex-col items-center gap-1 text-gray-400 hover:text-white transition'>
                    <Heart className='w-6 h-6' />
                    <span className='text-xs'>{t.common?.like || 'Me gusta'}</span>
                </button>
                 <button className='flex flex-col items-center gap-1 text-gray-400 hover:text-white transition'>
                    <Share2 className='w-6 h-6' />
                    <span className='text-xs'>{t.sacredTexts?.share || 'Compartir'}</span>
                </button>
            </motion.div>


            <motion.div initial={{opacity:0, scale:.8}} animate={{opacity:1, scale:1}} transition={{delay: .4}} className="flex items-center justify-center gap-4 mb-6">
                 <button onClick={togglePlay} disabled={isLoading || !streamConfig} className="w-20 h-20 rounded-full bg-[#006cf0] hover:bg-[#00479e] flex items-center justify-center transition-all active:scale-95 shadow-lg disabled:opacity-50">
                    {isLoading ? (
                        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="w-10 h-10 text-white fill-white" />
                    ) : (
                        <Play className="w-10 h-10 text-white fill-white ml-1" />
                    )}
                </button>
            </motion.div>
          </div>
      </section>

      {/* Hero Section */}
      <section className="hidden lg:block relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
            <AnimatePresence mode="wait">
                 <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    transition={{ duration: 2 }}
                    className="absolute inset-0"
                    >
                    <img src={backgroundImages[currentImageIndex]} alt={backgroundTexts[currentImageIndex]} className="w-full h-full object-cover" />
                </motion.div>
            </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-slate-900/90"></div>
        </div>
        <div className="relative container mx-auto px-4 text-center z-10">
          <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration: 0.8}} className="text-5xl md:text-7xl font-bold text-white mb-6">
            {getGreeting()}{user ? `, ${user.full_name}` : ''}
          </motion.h1>
          <motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration: 0.8, delay: 0.1}} className="text-xl md:text-2xl text-blue-300 mb-8">{t.home.welcome}</motion.p>
          {!user && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration: 0.8, delay: 0.2}}>
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-6">
                <Link to={getPagePath("Login")}>{t.home.joinCommunity}</Link>
              </Button>
            </motion.div>
          )}
        </div>
      </section>

       <div className="bg-slate-900 py-16">
        {/* Featured Shows */}
        {featuredShows.length > 0 && (
            <section className="container mx-auto px-4 mb-16">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">{t.nav.shows} {t.common?.featured || 'Destacados'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredShows.map((show) => (
                    <Card key={show.id} className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">{show.title}</h3>
                            <p className="text-gray-400 mb-4 line-clamp-2">{show.description}</p>
                        </CardContent>
                    </Card>
                ))}
                </div>
            </section>
        )}

        {/* Featured DJ */}
        {featuredDJ && (
             <section className="container mx-auto px-4 mb-16">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">DJ {t.common?.featured || 'Destacado'}</h2>
                 <div className="max-w-4xl mx-auto bg-white/5 rounded-lg p-8">
                    <div className='flex flex-col md:flex-row items-center gap-8'>
                        <img src={featuredDJ.photo_url || ''} alt={featuredDJ.name} className='w-48 h-48 rounded-full object-cover ring-4 ring-blue-500/50' />
                        <div className='flex-1 text-center md:text-left'>
                             <h3 className='text-4xl font-bold text-white mb-4'>{featuredDJ.name}</h3>
                            <p className='text-gray-300 mb-6'>{featuredDJ.bio}</p>
                        </div>
                    </div>
                </div>
            </section>
        )}

        {/* Latest Blog Posts */}
        {latestPosts.length > 0 && (
            <section className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-white mb-8 text-center">{t.nav.blog} - {t.common?.latest || 'Últimas Publicaciones'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestPosts.map((post) => (
                     <Card key={post.id} className="bg-white/5 border-white/10 overflow-hidden hover:bg-white/10 transition-all">
                        <CardContent className="p-6">
                            <h3 className="text-xl font-bold text-white mb-2">{post.title}</h3>
                            <p className="text-gray-400 mb-4 line-clamp-3">{post.excerpt}</p>
                            <Button variant="link" asChild className='text-blue-400 hover:text-blue-300 p-0'>
                                <Link to={`${getPagePath("BlogPost")}?id=${post.id}`}>{t.common?.readMore || 'Leer más'} <ArrowRight className='ml-1 h-4 w-4'/></Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                </div>
            </section>
        )}
      </div>
    </div>
  );
}