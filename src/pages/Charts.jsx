
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, Music, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { motion } from "framer-motion";

export default function ChartsPage() {
  const { data: charts, isLoading } = useQuery({
    queryKey: ['charts'],
    queryFn: () => base44.entities.Chart.list("-created_date"),
    initialData: [],
  });

  const currentChart = charts.find(c => c.is_current) || charts[0];

  const getPositionChange = (song) => {
    if (!song.previous_position) return null;
    const change = song.previous_position - song.position;
    if (change > 0) return { type: "up", value: change };
    if (change < 0) return { type: "down", value: Math.abs(change) };
    return { type: "same", value: 0 };
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
            Charts de Música Cristiana
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Las alabanzas y canciones cristianas más populares de la semana
          </p>
        </motion.div>

        {/* Chart Selector */}
        {charts.length > 1 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex gap-2 flex-wrap justify-center">
              {charts.slice(0, 5).map(chart => (
                <Link key={chart.id} to={createPageUrl(`ChartDetail?slug=${chart.slug}`)}>
                  <Card className={`px-4 py-2 cursor-pointer transition-all ${
                    chart.is_current 
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 border-transparent" 
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}>
                    <span className="text-white font-medium text-sm">
                      {chart.title}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="max-w-4xl mx-auto space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : currentChart && currentChart.songs?.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-4xl mx-auto"
          >
            <Card className="bg-white/5 border-white/10 p-4 md:p-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-pink-400" />
                {currentChart.title}
              </h2>

              <div className="space-y-3">
                {currentChart.songs.map((song, index) => {
                  const change = getPositionChange(song);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex items-center gap-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                    >
                      {/* Position */}
                      <div className="flex items-center gap-3 w-20 shrink-0">
                        <span className={`text-2xl font-bold ${
                          song.position <= 3 
                            ? "bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent" 
                            : "text-white"
                        }`}>
                          {song.position}
                        </span>
                        {change && (
                          <div className="flex flex-col items-center">
                            {change.type === "up" && (
                              <div className="flex items-center text-green-400">
                                <ChevronUp className="w-4 h-4" />
                                <span className="text-xs font-bold">{change.value}</span>
                              </div>
                            )}
                            {change.type === "down" && (
                              <div className="flex items-center text-red-400">
                                <ChevronDown className="w-4 h-4" />
                                <span className="text-xs font-bold">{change.value}</span>
                              </div>
                            )}
                            {change.type === "same" && (
                              <Minus className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cover */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-600/20 shrink-0">
                        {song.cover_url ? (
                          <img src={song.cover_url} alt={song.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-purple-400" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate group-hover:text-pink-400 transition">
                          {song.title}
                        </h3>
                        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                        {song.album && (
                          <p className="text-xs text-gray-500 truncate">{song.album}</p>
                        )}
                      </div>

                      {/* Weeks on chart */}
                      {song.weeks_on_chart && (
                        <div className="hidden md:block text-right shrink-0">
                          <p className="text-xs text-gray-400">Semanas</p>
                          <p className="text-sm font-bold text-white">{song.weeks_on_chart}</p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">
              Próximamente publicaremos los charts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
