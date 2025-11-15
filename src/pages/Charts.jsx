
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { TrendingUp, Music, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { appParams } from "@/lib/app-params";

// --- START: NEW API LOGIC ---
const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const token = appParams.token;

const fetcher = async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        if (response.status === 204) return []; // Return empty array for No Content
        const errorText = await response.text();
        console.error(`API Error on ${path}: ${errorText}`);
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
};

const getCharts = () => fetcher('/charts?sort=-created_date&is_current=true&limit=1');
// --- END: NEW API LOGIC ---

export default function ChartsPage() {
  const { data: charts, isLoading } = useQuery({
    queryKey: ['charts'],
    queryFn: getCharts,
    initialData: [],
  });

  const currentChart = charts && charts.length > 0 ? charts[0] : null;

  const getPositionChange = (song) => {
    if (song.previous_position === null || song.previous_position === undefined) return null;
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
