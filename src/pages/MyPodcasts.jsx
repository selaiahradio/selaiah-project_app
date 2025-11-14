import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import PodcastCard from "../components/podcasts/PodcastCard";
import PodcastDetailModal from "../components/podcasts/PodcastDetailModal";

export default function MyPodcastsPage() {
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const queryClient = useQueryClient();

  const { data: savedPodcasts, isLoading } = useQuery({
    queryKey: ['savedPodcasts'],
    queryFn: () => base44.entities.SavedPodcast.list("-created_date"),
    initialData: [],
  });

  const deletePodcastMutation = useMutation({
    mutationFn: (podcastId) => base44.entities.SavedPodcast.delete(podcastId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedPodcasts'] });
      toast.success("Podcast removed from favorites");
      setShowDetailModal(false);
    },
  });

  const handleRemovePodcast = (podcast) => {
    const savedPodcast = savedPodcasts.find(p => p.podcast_id === podcast.id || p.id === podcast.id);
    if (savedPodcast) {
      deletePodcastMutation.mutate(savedPodcast.id);
    }
  };

  const handleViewDetails = (podcast) => {
    setSelectedPodcast(podcast);
    setShowDetailModal(true);
  };

  // Convert saved podcasts to podcast format for the card
  const podcastsForDisplay = savedPodcasts.map(p => ({
    id: p.podcast_id,
    title: p.title,
    author: p.author,
    description: p.description,
    image_url: p.image_url,
    genres: p.genres,
    website: p.website,
    rss_feed: p.rss_feed,
    savedId: p.id
  }));

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            My Podcasts
          </h1>
          <p className="text-slate-600">
            {savedPodcasts.length} saved {savedPodcasts.length === 1 ? 'podcast' : 'podcasts'}
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : podcastsForDisplay.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {podcastsForDisplay.map((podcast) => (
              <PodcastCard
                key={podcast.savedId}
                podcast={podcast}
                onSave={handleRemovePodcast}
                onViewDetails={handleViewDetails}
                isSaved={true}
              />
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center mb-6">
              <Heart className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Saved Podcasts Yet
            </h3>
            <p className="text-slate-600 text-center max-w-md">
              Start discovering podcasts and save your favorites here!
            </p>
          </div>
        )}

        <PodcastDetailModal
          podcast={selectedPodcast}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          onSave={handleRemovePodcast}
          isSaved={true}
        />
      </div>
    </div>
  );
}