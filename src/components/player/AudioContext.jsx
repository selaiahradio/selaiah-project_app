
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const AudioContext = createContext(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within AudioProvider');
  }
  return context;
};

export const AudioProvider = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  const previousVolumeRef = useRef(70);

  // Obtener configuración del stream
  const { data: streamConfig } = useQuery({
    queryKey: ['streamConfig'],
    queryFn: async () => {
      const configs = await base44.entities.StreamConfig.filter({ 
        is_active: true, 
        is_primary: true 
      });
      if (configs.length > 0) return configs[0];
      
      const allConfigs = await base44.entities.StreamConfig.filter({ is_active: true });
      return allConfigs[0] || null;
    },
    refetchInterval: 60000,
    initialData: null,
  });

  // Obtener información de Now Playing - ARREGLADO
  const { data: nowPlaying } = useQuery({
    queryKey: ['nowPlaying', streamConfig?.id],
    queryFn: async () => {
      if (!streamConfig?.id) {
        console.log('⚠️ No hay stream configurado');
        return null;
      }
      
      try {
        console.log('🎵 Obteniendo Now Playing...');
        
        // Llamar a la función del backend
        const response = await base44.functions.invoke('getNowPlaying');
        
        console.log('📡 Respuesta completa:', response);
        console.log('📡 Response.data:', response.data);
        
        if (response.data?.success && response.data?.data) {
          const npData = response.data.data;
          
          // Agregar timestamp SOLO UNA VEZ para forzar actualización de imagen
          if (npData.cover_art_url && !npData.cover_art_url.includes('?t=')) {
            npData.cover_art_url = `${npData.cover_art_url}?t=${Date.now()}`;
          }
          
          console.log('✅ Now Playing procesado:', {
            artist: npData.artist,
            title: npData.song_title,
            image: npData.cover_art_url,
            source: npData.source
          });
          
          return { 
            ...npData, 
            stream_id: streamConfig.id
          };
        }
        
        // Fallback a BD
        console.log('📦 Buscando en BD...');
        const tracks = await base44.entities.NowPlaying.filter(
          { stream_id: streamConfig.id },
          "-created_date",
          1
        );
        
        if (tracks && tracks.length > 0) {
          console.log('✅ Encontrado en BD:', tracks[0]);
          return tracks[0];
        }
        
        // Default
        console.log('⚠️ Usando datos por defecto');
        return {
          song_title: 'En Vivo',
          artist: 'SELAIAH RADIO',
          cover_art_url: `https://c34.radioboss.fm/w/artwork/888.jpg?t=${Date.now()}`,
          stream_id: streamConfig.id
        };
        
      } catch (error) {
        console.error('❌ Error obteniendo Now Playing:', error);
        return {
          song_title: 'En Vivo',
          artist: 'SELAIAH RADIO',
          cover_art_url: `https://c34.radioboss.fm/w/artwork/888.jpg?t=${Date.now()}`,
          stream_id: streamConfig.id
        };
      }
    },
    refetchInterval: 10000, // Actualizar cada 10 segundos
    enabled: !!streamConfig,
    initialData: null,
  });

  // Configurar volumen - MEJORADO con logs
  useEffect(() => {
    if (audioRef.current) {
      const newVolume = isMuted ? 0 : volume / 100;
      audioRef.current.volume = newVolume;
      console.log('🔊 Volumen ajustado:', {
        volume: volume,
        isMuted: isMuted,
        actualVolume: newVolume,
        audioElement: !!audioRef.current
      });
    }
  }, [volume, isMuted]);

  // Configurar stream URL
  useEffect(() => {
    if (audioRef.current && streamConfig?.stream_url) {
      const wasPlaying = isPlaying;
      audioRef.current.src = streamConfig.stream_url;
      audioRef.current.load();
      
      if (wasPlaying) {
        setTimeout(() => {
          audioRef.current?.play()
            .then(() => setIsPlaying(true))
            .catch((err) => console.error("Error al retomar reproducción:", err));
        }, 100);
      }
    }
  }, [streamConfig?.stream_url]);

  const handlePlayError = (err) => {
    console.error("Error al reproducir:", err);
    setError("No se pudo conectar al stream");
    setIsPlaying(false);
    setIsLoading(false);
    toast.error("Error al conectar con el stream");
    
    if (streamConfig?.fallback_url && audioRef.current) {
      setTimeout(() => {
        audioRef.current.src = streamConfig.fallback_url;
        audioRef.current.load();
        setError(null);
      }, 2000);
    }
  };

  const togglePlay = async () => {
    if (!audioRef.current || !streamConfig) {
      toast.error("No hay stream configurado");
      return;
    }

    setIsLoading(true);

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      handlePlayError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      setVolume(previousVolumeRef.current);
    } else {
      previousVolumeRef.current = volume;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (newVolume) => {
    console.log('🎚️ Cambiando volumen a:', newVolume);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
      console.log('🔊 Desmutear porque volumen > 0');
    }
    if (newVolume === 0) {
      setIsMuted(true);
      console.log('🔇 Mutear porque volumen = 0');
    }
  };

  const value = {
    audioRef,
    isPlaying,
    volume,
    isMuted,
    isLoading,
    error,
    streamConfig,
    nowPlaying,
    togglePlay,
    toggleMute,
    handleVolumeChange,
    setIsPlaying
  };

  return (
    <AudioContext.Provider value={value}>
      {children}
      {/* Audio Element Global - Solo uno en toda la app */}
      <audio 
        ref={audioRef} 
        preload="metadata"
        onError={handlePlayError}
        onCanPlay={() => {
          setIsLoading(false);
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setError(null);
        }}
        onPause={() => {
          if (audioRef.current && !audioRef.current.ended) {
            setIsPlaying(false);
          }
        }}
      />
    </AudioContext.Provider>
  );
};
