
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, Radio } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "./AudioContext";
import { useLocation } from "react-router-dom";

export default function AudioPlayer() {
  const location = useLocation();
  const isHomePage = location.pathname === '/Home' || location.pathname === '/';
  
  const {
    isPlaying,
    volume,
    isMuted,
    isLoading,
    error,
    streamConfig,
    nowPlaying,
    togglePlay,
    toggleMute,
    handleVolumeChange
  } = useAudio();

  const artistImage = nowPlaying?.cover_art_url || nowPlaying?.artist_image_url || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e8/8116342ff_IMG-20251102-WA0000.jpg";

  if (!streamConfig) {
    return null;
  }

  // En móvil, si estamos en Home, no mostramos la barra inferior
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  if (isMobile && isHomePage) {
    return null;
  }

  return (
    <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-2xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Imagen + Info + Play Button */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Imagen del artista */}
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 shrink-0 shadow-lg">
              <img 
                src={artistImage}
                alt={nowPlaying?.artist || "SELAIAH RADIO"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e8/8116342ff_IMG-20251102-WA0000.jpg";
                }}
              />
            </div>

            {/* Play Button */}
            <Button
              size="icon"
              onClick={togglePlay}
              disabled={isLoading}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm shrink-0 w-12 h-12 rounded-full transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-6 h-6 text-white fill-white" />
              ) : (
                <Play className="w-6 h-6 text-white fill-white ml-1" />
              )}
            </Button>
            
            {/* Song Info */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {error ? (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-white/80 text-sm truncate"
                  >
                    ⚠️ {error}
                  </motion.p>
                ) : nowPlaying ? (
                  <motion.div
                    key="nowplaying"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-white font-semibold truncate flex items-center gap-2">
                      {isPlaying && (
                        <span className="flex gap-1">
                          <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "0ms" }} />
                          <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "150ms" }} />
                          <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: "300ms" }} />
                        </span>
                      )}
                      {nowPlaying.song_title}
                    </p>
                    <p className="text-white/80 text-sm truncate">
                      {nowPlaying.artist || "SELAIAH RADIO"}
                      {nowPlaying.listeners ? ` • ${nowPlaying.listeners} oyentes` : ''}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-white font-semibold truncate flex items-center gap-2">
                      {isPlaying && <Radio className="w-4 h-4 animate-pulse" />}
                      {isPlaying ? "🔴 EN VIVO" : "SELAIAH RADIO"}
                    </p>
                    <p className="text-white/80 text-sm truncate">
                      Radio Cristiana • Alabanza y Adoración 24/7
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-3 w-40">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white/10 shrink-0"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-2 accent-white cursor-pointer"
              style={{
                background: `linear-gradient(to right, white ${isMuted ? 0 : volume}%, rgba(255,255,255,0.3) ${isMuted ? 0 : volume}%)`
              }}
            />
            <span className="text-white text-xs font-medium w-8 text-right">{Math.round(isMuted ? 0 : volume)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
