
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAYS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function ShowsPage() {
  const [selectedDay, setSelectedDay] = useState("all");

  const { data: shows, isLoading } = useQuery({
    queryKey: ['shows'],
    queryFn: () => base44.entities.RadioShow.filter({ status: "active" }, "-created_date"),
    initialData: [],
  });

  const filteredShows = selectedDay === "all" 
    ? shows 
    : shows.filter(show => show.day_of_week === selectedDay);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Programación Cristiana
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Descubre nuestra programación de alabanza, adoración, enseñanza bíblica y música cristiana
          </p>
        </motion.div>

        <Tabs value={selectedDay} onValueChange={setSelectedDay} className="mb-8">
          <TabsList className="bg-white/5 border border-white/10 p-1 flex-wrap h-auto">
            <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-700">
              Todos
            </TabsTrigger>
            {DAYS.map((day, index) => (
              <TabsTrigger 
                key={day} 
                value={day}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-700"
              >
                {DAYS_ES[index]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredShows.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredShows.map((show, index) => (
              <motion.div
                key={show.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full">
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-blue-700/20">
                    {show.image_url ? (
                      <img 
                        src={show.image_url} 
                        alt={show.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-purple-400" />
                      </div>
                    )}
                    {show.is_featured && (
                      <div className="absolute top-3 right-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Destacado
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-400 transition">
                      {show.title}
                    </h3>
                    
                    {show.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                        {show.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {show.host_name && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-purple-400" />
                          {show.host_name}
                        </div>
                      )}
                      {show.day_of_week && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          {DAYS_ES[DAYS.indexOf(show.day_of_week)]}
                        </div>
                      )}
                      {show.start_time && show.end_time && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Clock className="w-4 h-4 text-purple-400" />
                          {show.start_time} - {show.end_time}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">
              No hay programas disponibles para este día
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
