import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart, ExternalLink, Globe } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function PodcastDetailModal({ podcast, isOpen, onClose, onSave, isSaved }) {
  if (!podcast) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          <div className="h-64 overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
            {podcast.image_url ? (
              <img
                src={podcast.image_url}
                alt={podcast.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
          
          <div className="absolute bottom-4 left-4 right-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white drop-shadow-lg">
                {podcast.title}
              </DialogTitle>
              <p className="text-white/90 text-sm drop-shadow">
                {podcast.author || podcast.publisher}
              </p>
            </DialogHeader>
          </div>
        </div>

        <ScrollArea className="max-h-[400px]">
          <div className="p-6 space-y-4">
            {podcast.genres && podcast.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {podcast.genres.map((genre, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-medium"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h4 className="font-semibold text-slate-900 mb-2">About</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                {podcast.description || "No description available."}
              </p>
            </div>

            {podcast.website && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Links</h4>
                <a
                  href={podcast.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  <Globe className="w-4 h-4" />
                  Visit Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div className="pt-4 flex gap-3">
              <Button
                onClick={() => onSave(podcast)}
                className={`flex-1 ${
                  isSaved
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                }`}
              >
                <Heart className={`w-4 h-4 mr-2 ${isSaved ? "fill-white" : ""}`} />
                {isSaved ? "Remove from Favorites" : "Save to Favorites"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}