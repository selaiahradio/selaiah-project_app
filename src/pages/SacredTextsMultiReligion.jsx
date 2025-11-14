import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Search, 
  Star, 
  Share2,
  Cross,
  Moon as Crescent,
  Star as StarOfDavid,
  Wind,
  Flame,
  Sparkles,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";

export default function SacredTextsMultiReligionPage() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReligion, setSelectedReligion] = useState("all");
  const [searchReference, setSearchReference] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      // Auto-seleccionar religión del usuario
      if (user.religion && user.religion !== 'none') {
        setSelectedReligion(user.religion);
      }
    } catch (error) {
      console.log('Usuario no autenticado');
    }
  };

  // Búsqueda de escritura por API
  const searchScriptureMutation = useMutation({
    mutationFn: async ({ type, reference, lang }) => {
      const response = await base44.functions.invoke('fetchScriptureFromAPI', {
        type,
        reference,
        language: lang || language
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`✅ ${data.reference} encontrado`);
      } else {
        toast.error(data.error || 'No se pudo obtener el texto');
      }
    },
    onError: (error) => {
      toast.error('Error buscando escritura: ' + error.message);
    }
  });

  const religions = [
    {
      id: 'all',
      name: 'Todas las Religiones',
      icon: Globe,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'christianity',
      name: t.sacredTexts.bible,
      icon: Cross,
      color: 'from-blue-500 to-cyan-500',
      searchPlaceholder: 'Ej: Juan 3:16, Génesis 1:1',
      type: 'bible'
    },
    {
      id: 'islam',
      name: t.sacredTexts.quran,
      icon: Crescent,
      color: 'from-green-500 to-emerald-500',
      searchPlaceholder: 'Ej: 2:255, 1:1',
      type: 'quran'
    },
    {
      id: 'judaism',
      name: t.sacredTexts.torah,
      icon: StarOfDavid,
      color: 'from-indigo-500 to-blue-500',
      searchPlaceholder: 'Ej: Genesis 1:1, Exodus 20:1',
      type: 'torah'
    },
    {
      id: 'buddhism',
      name: t.sacredTexts.sutras,
      icon: Wind,
      color: 'from-orange-500 to-amber-500',
      searchPlaceholder: 'Ej: Dhammapada 1, Lotus Sutra 2',
      type: 'buddhist_sutra'
    },
    {
      id: 'hinduism',
      name: t.sacredTexts.vedas,
      icon: Flame,
      color: 'from-red-500 to-pink-500',
      searchPlaceholder: 'Ej: Bhagavad Gita 2.47',
      type: 'hindu_scripture'
    }
  ];

  const currentReligion = religions.find(r => r.id === selectedReligion);

  const handleSearchByReference = () => {
    if (!searchReference.trim() || !currentReligion || currentReligion.id === 'all') {
      toast.error('Selecciona una religión específica y escribe una referencia');
      return;
    }

    searchScriptureMutation.mutate({
      type: currentReligion.type,
      reference: searchReference,
      lang: language
    });
  };

  // Obtener versículos de la base de datos
  const { data: verses, isLoading } = useQuery({
    queryKey: ['sacredTexts', selectedReligion],
    queryFn: async () => {
      if (selectedReligion === "all") {
        return await base44.entities.BibleVerse.list("-created_date", 50);
      }
      return await base44.entities.BibleVerse.filter({ 
        category: selectedReligion 
      }, "-created_date", 50);
    },
    initialData: [],
  });

  const filteredVerses = verses.filter(verse =>
    verse.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    verse.book?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const shareVerse = (verse) => {
    const text = `${verse.text}\n\n${verse.book} ${verse.chapter}:${verse.verse}`;
    navigator.clipboard.writeText(text);
    toast.success(t.sacredTexts.copied);
  };

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
            5 Religiones • 10 Idiomas • Búsqueda Inteligente con IA
          </p>
        </motion.div>

        {/* Religion Tabs */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {religions.map(religion => {
              const Icon = religion.icon;
              return (
                <Button
                  key={religion.id}
                  onClick={() => setSelectedReligion(religion.id)}
                  variant={selectedReligion === religion.id ? "default" : "outline"}
                  className={selectedReligion === religion.id 
                    ? `bg-gradient-to-r ${religion.color} hover:opacity-90 text-white`
                    : "border-white/20 text-gray-300 hover:bg-white/5"
                  }
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {religion.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search by Reference - Solo si hay religión específica */}
        {selectedReligion !== 'all' && currentReligion && (
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 p-6 mb-8">
            <div className="flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-3">
                  🔍 Búsqueda Directa por Referencia
                </h3>
                <div className="flex gap-3">
                  <Input
                    placeholder={currentReligion.searchPlaceholder}
                    value={searchReference}
                    onChange={(e) => setSearchReference(e.target.value)}
                    className="bg-white/10 border-white/20 text-white flex-1"
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchByReference()}
                  />
                  <Button
                    onClick={handleSearchByReference}
                    disabled={searchScriptureMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {searchScriptureMutation.isPending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-blue-200 mt-2">
                  💡 Busca cualquier versículo directamente desde las APIs oficiales
                </p>
              </div>
            </div>

            {/* Resultado de búsqueda */}
            {searchScriptureMutation.data && searchScriptureMutation.data.success && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-6 border-t border-white/20"
              >
                <div className="bg-white/10 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-green-500/20 text-green-300">
                      {searchScriptureMutation.data.reference}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(searchScriptureMutation.data.text);
                        toast.success(t.sacredTexts.copied);
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {t.sacredTexts.share}
                    </Button>
                  </div>
                  <p className="text-white text-lg leading-relaxed font-serif italic">
                    "{searchScriptureMutation.data.text}"
                  </p>
                  <p className="text-xs text-gray-400 mt-4">
                    Fuente: {searchScriptureMutation.data.source} • {searchScriptureMutation.data.version || searchScriptureMutation.data.edition}
                  </p>
                </div>
              </motion.div>
            )}
          </Card>
        )}

        {/* General Search */}
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

        {/* Verses Grid from Database */}
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
              const religionData = religions.find(r => r.id === verse.category) || religions[0];
              const Icon = religionData.icon;
              
              return (
                <motion.div
                  key={verse.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <Badge className={`bg-gradient-to-r ${religionData.color} text-white`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {religionData.name}
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
              {searchQuery ? "No se encontraron textos" : "Usa la búsqueda por referencia arriba"}
            </p>
            <p className="text-gray-500 text-sm">
              O selecciona una religión específica para ver contenido guardado
            </p>
          </Card>
        )}

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 p-6 mt-8">
          <div className="flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-green-300 mb-2">
                📚 Biblioteca Espiritual Completa
              </h3>
              <div className="grid md:grid-cols-2 gap-3 text-sm text-green-100">
                <div>
                  <strong>✅ Biblia:</strong> Bible API, Labs.Bible, Bolls.life
                </div>
                <div>
                  <strong>✅ Corán:</strong> Alquran.cloud (multiidioma oficial)
                </div>
                <div>
                  <strong>✅ Torá:</strong> Sefaria.org (textos judaicos completos)
                </div>
                <div>
                  <strong>✅ Sutras:</strong> SuttaCentral, BuddhaNet
                </div>
                <div>
                  <strong>✅ Bhagavad Gita:</strong> API oficial
                </div>
                <div>
                  <strong>🌍 Idiomas:</strong> 10+ soportados
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}