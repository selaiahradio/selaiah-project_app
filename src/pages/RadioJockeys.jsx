
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Mic2, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { motion } from "framer-motion";

export default function RadioJockeysPage() {
  const { data: djs, isLoading } = useQuery({
    queryKey: ['radioJockeys'],
    queryFn: () => base44.entities.RadioJockey.filter({ status: "active" }, "-created_date"),
    initialData: [],
  });

  const getSocialIcon = (platform) => {
    switch(platform) {
      case 'facebook': return Facebook;
      case 'twitter': return Twitter;
      case 'instagram': return Instagram;
      case 'youtube': return Youtube;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Nuestros DJs y Locutores Cristianos
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Conoce a los siervos de Dios que llevan alabanza y adoración a tu corazón
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : djs.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {djs.map((dj, index) => (
              <motion.div
                key={dj.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                  <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-600/20">
                    {dj.photo_url ? (
                      <img 
                        src={dj.photo_url} 
                        alt={dj.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Mic2 className="w-20 h-20 text-purple-400" />
                      </div>
                    )}
                    {dj.is_featured && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Destacado
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-pink-400 transition">
                      {dj.name}
                    </h3>
                    
                    {dj.role && (
                      <p className="text-purple-400 font-medium mb-3">
                        {dj.role}
                      </p>
                    )}
                    
                    {dj.bio && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                        {dj.bio}
                      </p>
                    )}
                    
                    {dj.social_links && Object.keys(dj.social_links).length > 0 && (
                      <div className="flex gap-2 mt-4">
                        {Object.entries(dj.social_links).map(([platform, url]) => {
                          if (!url) return null;
                          const Icon = getSocialIcon(platform);
                          if (!Icon) return null;
                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-8 h-8 rounded-full bg-white/10 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 flex items-center justify-center transition-all"
                            >
                              <Icon className="w-4 h-4 text-white" />
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <Mic2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">
              Próximamente conocerás a nuestros DJs
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
