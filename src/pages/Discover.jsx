import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import PodcastCard from "../components/podcasts/PodcastCard";
import PodcastDetailModal from "../components/podcasts/PodcastDetailModal";

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: userPrefs } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const prefs = await base44.entities.UserPreference.filter({ created_by: user.email });
      return prefs[0] || null;
    },
    initialData: null,
  });

  const { data: savedPodcasts } = useQuery({
    queryKey: ['savedPodcasts'],
    queryFn: () => base44.entities.SavedPodcast.list("-created_date"),
    initialData: [],
  });

  const savePodcastMutation = useMutation({
    mutationFn: (podcast) => base44.entities.SavedPodcast.create({
      podcast_id: podcast.id,
      title: podcast.title,
      author: podcast.author || podcast.publisher,
      description: podcast.description,
      image_url: podcast.image_url,
      genres: podcast.genres || [],
      rss_feed: podcast.rss_feed,
      website: podcast.website,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPodcasts'] });
      toast.success("Podcast saved to favorites!");
    },
  });

  const deletePodcastMutation = useMutation({
    mutationFn: (podcastId) => base44.entities.SavedPodcast.delete(podcastId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPodcasts'] });
      toast.success("Podcast removed from favorites");
    },
  });

  const trackHistoryMutation = useMutation({
    mutationFn: (data) => base44.entities.ListeningHistory.create(data),
  });

  const getRecommendations = async () => {
    if (!userPrefs || !userPrefs.topics || userPrefs.topics.length === 0) {
      toast.error("Please set your preferences first!");
      return;
    }

    setIsLoadingRecs(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Based on these interests: ${userPrefs.topics.join(", ")}, recommend 8 real, popular podcasts that exist. 
        Include a mix of well-known and emerging shows. 
        For each podcast provide: title, author/publisher, description, genres (as array), and if available: image_url, website, rss_feed.
        Make sure these are REAL podcasts that actually exist.`,
        response_json_schema: {
          type: "object",
          properties: {
            podcasts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  author: { type: "string" },
                  publisher: { type: "string" },
                  description: { type: "string" },
                  genres: { type: "array", items: { type: "string" } },
                  image_url: { type: "string" },
                  website: { type: "string" },
                  rss_feed: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.podcasts) {
        const podcastsWithIds = result.podcasts.map((p, idx) => ({
          ...p,
          id: p.id || `rec-${Date.now()}-${idx}`
        }));
        setRecommendations(podcastsWithIds);
      }
    } catch (error) {
      toast.error("Failed to get recommendations");
      console.error(error);
    }
    setIsLoadingRecs(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoadingRecs(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Find real podcasts matching this search: "${searchQuery}". 
        Return 8 relevant podcasts that actually exist.
        For each podcast provide: title, author/publisher, description, genres (as array), and if available: image_url, website, rss_feed.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            podcasts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  title: { type: "string" },
                  author: { type: "string" },
                  publisher: { type: "string" },
                  description: { type: "string" },
                  genres: { type: "array", items: { type: "string" } },
                  image_url: { type: "string" },
                  website: { type: "string" },
                  rss_feed: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (result.podcasts) {
        const podcastsWithIds = result.podcasts.map((p, idx) => ({
          ...p,
          id: p.id || `search-${Date.now()}-${idx}`
        }));
        setRecommendations(podcastsWithIds);
        
        trackHistoryMutation.mutate({
          podcast_id: "search",
          podcast_title: searchQuery,
          action: "searched",
          search_query: searchQuery
        });
      }
    } catch (error) {
      toast.error("Search failed");
      console.error(error);
    }
    setIsLoadingRecs(false);
  };

  const handleSavePodcast = (podcast) => {
    const existing = savedPodcasts.find(p => p.podcast_id === podcast.id);
    if (existing) {
      deletePodcastMutation.mutate(existing.id);
    } else {
      savePodcastMutation.mutate(podcast);
      trackHistoryMutation.mutate({
        podcast_id: podcast.id,
        podcast_title: podcast.title,
        action: "saved"
      });
    }
  };

  const handleViewDetails = (podcast) => {
    setSelectedPodcast(podcast);
    setShowDetailModal(true);
    trackHistoryMutation.mutate({
      podcast_id: podcast.id,
      podcast_title: podcast.title,
      action: "viewed"
    });
  };

  const isPodcastSaved = (podcastId) => {
    return savedPodcasts.some(p => p.podcast_id === podcastId);
  };

  useEffect(() => {
    if (userPrefs && userPrefs.topics && userPrefs.topics.length > 0 && recommendations.length === 0) {
      getRecommendations();
    }
  }, [userPrefs]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Discover Podcasts
          </h1>
          <p className="text-slate-600">Find your next favorite show</p>
        </motion.div>

        <div className="mb-8 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search for podcasts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-12 h-12 bg-white/80 backdrop-blur-sm border-slate-200 focus:border-indigo-300 focus:ring-indigo-200"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoadingRecs || !searchQuery.trim()}
              className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              Search
            </Button>
          </div>

          <Button
            onClick={getRecommendations}
            disabled={isLoadingRecs || !userPrefs?.topics?.length}
            variant="outline"
            className="bg-white/80 backdrop-blur-sm border-slate-200 hover:bg-slate-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Get Personalized Recommendations
          </Button>
        </div>

        {isLoadingRecs ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-slate-600">Finding amazing podcasts for you...</p>
          </div>
        ) : recommendations.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {recommendations.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast}
                onSave={handleSavePodcast}
                onViewDetails={handleViewDetails}
                isSaved={isPodcastSaved(podcast.id)}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
              <Sparkles className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Ready to Discover?
            </h3>
            <p className="text-slate-600 text-center max-w-md">
              {!userPrefs?.topics?.length 
                ? "Set your preferences first to get personalized recommendations"
                : "Click the button above to get recommendations or search for something specific"
              }
            </p>
          </div>
        )}

        <PodcastDetailModal
          podcast={selectedPodcast}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onSave={handleSavePodcast}
          isSaved={selectedPodcast ? isPodcastSaved(selectedPodcast.id) : false}
        />
      </div>
    </div>
  );
}