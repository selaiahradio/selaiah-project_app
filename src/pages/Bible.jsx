import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Search, 
  Star, 
  Share2, 
  Heart,
  Sparkles,
  Flame,
  Wind,
  Cross
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

export default function BiblePage() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: dailyVerse } = useQuery({
    queryKey: ['dailyVerse'],
    queryFn: () => base44.entities.BibleVerse.filter({ is_daily: true }, "-scheduled_date", 1),
    initialData: [],
  });

  const { data: verses, isLoading } = useQuery({
    queryKey: ['bibleVerses', selectedCategory],
    queryFn: () => {
      if (selectedCategory === "all") {
        return base44.entities.BibleVerse.list("-created_date", 50);
      }
      return base44.entities.BibleVerse.filter({ category: selectedCategory }, "-created_date", 50);
    },
    initialData: [],
  });

  const categories = [
    { value: "all", label: t.common.all, icon: BookOpen, color: "from-blue-500 to-cyan-500" },
    { value: "pentecostal", label: "Pentecostal", icon: Flame, color: "from-red-500 to-orange-500" },
    { value: "holy_spirit", label: "Espíritu Santo", icon: Wind, color: "from-purple-500 to-pink-500" },
    { value: "healing", label: "Sanidad", icon: Cross, color: "from-green-500 to-emerald-500" },
    { value: "miracles", label: "Milagros", icon: Sparkles, color: "from-yellow-500 to-amber-500" },
    { value: "faith", label: "Fe", icon: Star, color: "from-indigo-500 to-blue-500" },
    { value: "worship", label: "Adoración", icon: Heart, color: "from-pink-500 to-rose-500" },
    { value: "psalms", label: "Salmos", icon: BookOpen, color: "from-teal-500 to-cyan-500" }
  ];

  const filteredVerses = verses.filter(verse =>
    verse.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    verse.book.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shareVerse = (verse) => {
    const text = `${verse.text}\n\n${verse.book} ${verse.chapter}:${verse.verse} (${verse.version})`;
    navigator.clipboard.writeText(text);
    toast.success(t.sacredTexts.copied);
  };

  const currentDailyVerse = dailyVerse[0];

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-12 h-12 text-[#006cf0]" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              {t.sacredTexts.title}
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            "El Espíritu del Señor está sobre mí" - Lucas 4:18
          </p>
        </motion.div>

        {/* Daily Verse */}
        {currentDailyVerse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12"
          >
            <Card className="bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-pink-600/20 border-purple-500/30 p-8 md:p-12">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <span className="text-yellow-400 font-semibold text-lg">{t.sacredTexts.verseOfDay}</span>
              </div>
              
              <p className="text-2xl md:text-3xl font-serif text-white mb-6 leading-relaxed italic">
                "{currentDailyVerse.text}"
              </p>
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-blue-300 font-semibold text-lg">
                    {currentDailyVerse.book} {currentDailyVerse.chapter}:{currentDailyVerse.verse}
                  </p>
                  <p className="text-gray-400 text-sm">{currentDailyVerse.version}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={() => shareVerse(currentDailyVerse)}
                    size="sm"
                    className="bg-white/10 hover:bg-white/20 text-white"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {t.sacredTexts.share}
                  </Button>
                </div>
              </div>

              {currentDailyVerse.commentary && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-gray-300 leading-relaxed">
                    💭 {currentDailyVerse.commentary}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder={t.sacredTexts.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 bg-white/5 border-white/20 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  className={selectedCategory === cat.value 
                    ? `bg-gradient-to-r ${cat.color} hover:opacity-90 text-white`
                    : "border-white/20 text-gray-300 hover:bg-white/5"
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {cat.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Verses Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredVerses.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredVerses.map((verse, index) => {
              const category = categories.find(c => c.value === verse.category);
              const Icon = category?.icon || BookOpen;
              
              return (
                <motion.div
                  key={verse.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`bg-gradient-to-r ${category?.color || 'from-gray-500 to-gray-700'} text-white`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {category?.label || verse.category}
                      </Badge>
                      <span className="text-xs text-gray-500">{verse.version}</span>
                    </div>

                    <p className="text-white text-lg mb-4 flex-1 leading-relaxed font-serif italic">
                      "{verse.text}"
                    </p>

                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-blue-400 font-semibold">
                          {verse.book} {verse.chapter}:{verse.verse}
                        </p>
                        <Button
                          size="sm"
                          onClick={() => shareVerse(verse)}
                          className="bg-white/10 hover:bg-white/20 text-white"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {verse.tags && verse.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {verse.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <Card className="bg-white/5 border-white/10 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400 mb-4">
              {searchQuery ? "No se encontraron versículos" : "No hay versículos disponibles"}
            </p>
            <p className="text-gray-500">
              Los versículos se agregarán desde el panel de administración
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}