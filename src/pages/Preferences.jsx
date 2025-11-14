import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Save, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import TopicSelector from "../components/podcasts/TopicSelector";

export default function PreferencesPage() {
  const [selectedTopics, setSelectedTopics] = useState([]);
  const queryClient = useQueryClient();

  const { data: userPrefs, isLoading } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const prefs = await base44.entities.UserPreference.filter({ created_by: user.email });
      return prefs[0] || null;
    },
    initialData: null,
  });

  const savePrefsMutation = useMutation({
    mutationFn: async (topics) => {
      const user = await base44.auth.me();
      if (userPrefs) {
        return await base44.entities.UserPreference.update(userPrefs.id, {
          topics,
          genres: topics
        });
      } else {
        return await base44.entities.UserPreference.create({
          topics,
          genres: topics
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      toast.success("Preferences saved successfully!");
    },
  });

  useEffect(() => {
    if (userPrefs?.topics) {
      setSelectedTopics(userPrefs.topics);
    }
  }, [userPrefs]);

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => 
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSave = () => {
    if (selectedTopics.length === 0) {
      toast.error("Please select at least one topic");
      return;
    }
    savePrefsMutation.mutate(selectedTopics);
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Your Preferences
          </h1>
          <p className="text-slate-600">
            Select topics you're interested in to get personalized recommendations
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Select Your Interests
                <span className="text-sm font-normal text-slate-500">
                  ({selectedTopics.length} selected)
                </span>
              </h2>
              <TopicSelector
                selectedTopics={selectedTopics}
                onTopicToggle={handleTopicToggle}
              />
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={selectedTopics.length === 0 || savePrefsMutation.isPending}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-8 h-12"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </Button>
            </div>

            {selectedTopics.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100"
              >
                <h3 className="font-semibold text-slate-900 mb-3">
                  Your Selected Topics:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTopics.map((topic) => (
                    <span
                      key={topic}
                      className="px-4 py-2 rounded-full bg-white text-indigo-700 font-medium text-sm shadow-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}