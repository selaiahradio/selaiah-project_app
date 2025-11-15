
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { appParams } from "@/lib/app-params";

const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const token = appParams.token;

// --- START: New Data Fetching Functions ---
const fetcher = async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        // For 204 No Content, we don't expect a JSON body, so we can return early.
        if (response.status === 204) return null;
        const errorText = await response.text();
        console.error(`API Error on ${path}: ${errorText}`);
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
};

const fetchStreamConfig = async () => {
  try {
    // Use the new fetcher to get stream configs
    const activeStreams = await fetcher('/stream_configs?is_active=true');
    if (Array.isArray(activeStreams) && activeStreams.length > 0) {
      // Prioritize the primary stream
      const primaryStream = activeStreams.find(s => s.is_primary);
      return primaryStream || activeStreams[0];
    }
  } catch (error) {
    console.error("Error fetching stream configuration:", error);
  }
  return null; // Return null if no config is found or if an error occurs
};

const getNowPlaying = async ({ queryKey }) => {
    const [_key, streamId] = queryKey;
    if (!streamId) return null;
    try {
        const data = await fetcher(`/now_playing?stream_id=${streamId}`);
        if (data && data.song_title) {
            if (data.cover_art_url && !data.cover_art_url.includes('?t=')) {
                data.cover_art_url += `?t=${Date.now()}`;
            }
            return data;
        }
        // If API returns empty or invalid data, use fallback
        throw new Error("No valid 'now playing' data received from API.");
    } catch (error) {
        console.warn("Could not fetch 'now playing' data, using fallback.", error);
        return {
            song_title: 'En Vivo',
            artist: 'SELAIAH RADIO',
            cover_art_url: `https://c34.radioboss.fm/w/artwork/888.jpg?t=${Date.now()}`,
            stream_id: streamId,
        };
    }
};
// --- END: New Data Fetching Functions ---

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

  const { data: streamConfig } = useQuery({
    queryKey: ['streamConfig'],
    queryFn: fetchStreamConfig,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 55000, // Consider data stale after 55 seconds
  });

  const { data: nowPlaying } = useQuery({
    queryKey: ['nowPlaying', streamConfig?.id],
    queryFn: getNowPlaying,
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: !!streamConfig, // Only run if streamConfig is available
  });

  useEffect(() => {
    if (audioRef.current) {
      const newVolume = isMuted ? 0 : volume / 100;
      audioRef.current.volume = newVolume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && streamConfig?.stream_url) {
        if (audioRef.current.src !== streamConfig.stream_url) {
            console.log("Changing audio source to:", streamConfig.stream_url);
            const wasPlaying = !audioRef.current.paused;
            audioRef.current.src = streamConfig.stream_url;
            audioRef.current.load();
            
            if (wasPlaying) {
                setTimeout(() => {
                    audioRef.current?.play()
                        .then(() => setIsPlaying(true))
                        .catch((err) => handlePlayError(err, "retrying play after stream change"));
                }, 250);
            }
        }
    }
  }, [streamConfig?.stream_url]);

  const handlePlayError = (err, context = "general play") => {
    console.error(`Audio playback error (${context}):`, err);
    setError("No se pudo conectar al stream.");
    setIsPlaying(false);
    setIsLoading(false);
    toast.error("Error al conectar con el stream.");
  };

  const togglePlay = async () => {
    if (!audioRef.current || !streamConfig?.stream_url) {
      toast.error("Stream de audio no disponible.");
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        // Ensure the source is set before playing
        if (audioRef.current.src !== streamConfig.stream_url) {
            audioRef.current.src = streamConfig.stream_url;
            audioRef.current.load();
        }
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        handlePlayError(err, "togglePlay");
      } finally {
        setIsLoading(false);
      }
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
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
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
      <audio 
        ref={audioRef} 
        preload="metadata"
        onError={(e) => handlePlayError(e, 'audio element onError')}
        onCanPlay={() => setIsLoading(false)}
        onPlaying={() => {
          setIsLoading(false);
          setIsPlaying(true);
          setError(null);
        }}
        onPause={() => setIsPlaying(false)}
        onStalled={() => setIsLoading(true)}
      />
    </AudioContext.Provider>
  );
};
