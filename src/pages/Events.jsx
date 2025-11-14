
import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Ticket, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EventsPage() {
  const [filter, setFilter] = React.useState("upcoming");

  const { data: events, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list("-event_date"),
    initialData: [],
  });

  const filteredEvents = filter === "all" 
    ? events 
    : events.filter(event => event.status === filter);

  const statusLabels = {
    all: "Todos",
    upcoming: "Próximos",
    ongoing: "En Curso",
    completed: "Finalizados"
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
            Eventos Cristianos
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Conciertos, conferencias, retiros y actividades de nuestra comunidad cristiana
          </p>
        </motion.div>

        {/* Filter */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-8">
          <TabsList className="bg-white/5 border border-white/10 p-1">
            {Object.keys(statusLabels).map(status => (
              <TabsTrigger 
                key={status}
                value={status}
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-700"
              >
                {statusLabels[status]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 h-full flex flex-col">
                  <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-600/20">
                    {event.image_url ? (
                      <img 
                        src={event.image_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Calendar className="w-16 h-16 text-purple-400" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {event.status === "upcoming" && "Próximo"}
                      {event.status === "ongoing" && "En Curso"}
                      {event.status === "completed" && "Finalizado"}
                      {event.status === "cancelled" && "Cancelado"}
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-pink-400 transition">
                      {event.title}
                    </h3>
                    
                    {event.description && (
                      <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                        {event.description}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        {format(new Date(event.event_date), "d 'de' MMMM, yyyy - HH:mm", { locale: es })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-purple-400" />
                          {event.location}
                        </div>
                      )}
                      {event.price && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Ticket className="w-4 h-4 text-purple-400" />
                          {event.price}
                        </div>
                      )}
                    </div>

                    {event.ticket_url && event.status === "upcoming" && (
                      <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800">
                          <Ticket className="w-4 h-4 mr-2" />
                          Comprar Tickets
                          <ExternalLink className="w-3 h-3 ml-2" />
                        </Button>
                      </a>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-xl text-gray-400">
              No hay eventos {statusLabels[filter].toLowerCase()} en este momento
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
