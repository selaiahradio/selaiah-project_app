import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Info } from "lucide-react";
import { motion } from "framer-motion";

export default function PodcastCard({ podcast, onSave, onViewDetails, isSaved }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="group overflow-hidden bg-white/80 backdrop-blur-sm border-slate-200/60 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
          {podcast.image_url ? (
            <img
              src={podcast.image_url}
              alt={podcast.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(podcast);
              }}
            >
              <Info className="h-4 w-4 text-slate-700" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className={`h-9 w-9 rounded-full shadow-lg ${
                isSaved
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-white/90 backdrop-blur-sm hover:bg-white"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onSave(podcast);
              }}
            >
              <Heart className={`h-4 w-4 ${isSaved ? "text-white fill-white" : "text-slate-700"}`} />
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 mb-1 leading-tight">
            {podcast.title}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1">
            {podcast.author || podcast.publisher}
          </p>
          {podcast.genres && podcast.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {podcast.genres.slice(0, 2).map((genre, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}