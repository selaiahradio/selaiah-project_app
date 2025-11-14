import React from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

const POPULAR_TOPICS = [
  "Technology", "Business", "Science", "Health & Fitness", "True Crime",
  "Comedy", "News", "Sports", "Arts", "Education", "History", "Music",
  "Politics", "Society & Culture", "Gaming", "Food", "Travel", "Parenting"
];

export default function TopicSelector({ selectedTopics, onTopicToggle }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {POPULAR_TOPICS.map((topic, index) => {
        const isSelected = selectedTopics.includes(topic);
        return (
          <motion.div
            key={topic}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
          >
            <Button
              variant="outline"
              onClick={() => onTopicToggle(topic)}
              className={`w-full h-auto py-3 px-4 text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
                  : "bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                {topic}
                {isSelected && <Check className="w-4 h-4" />}
              </span>
            </Button>
          </motion.div>
        );
      })}
    </div>
  );
}