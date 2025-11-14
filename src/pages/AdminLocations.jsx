import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, ArrowLeft, Search, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

export default function AdminLocationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: locations, isLoading } = useQuery({
    queryKey: ['adminLocations'],
    queryFn: () => base44.entities.UserLocation.list("-created_date"),
    initialData: [],
  });

  const filteredLocations = locations.filter(loc =>
    loc.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.state?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.country?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group locations by city
  const locationsByCity = filteredLocations.reduce((acc, loc) => {
    const key = `${loc.city}, ${loc.state}, ${loc.country}`;
    if (!acc[key]) {
      acc[key] = {
        city: loc.city,
        state: loc.state,
        country: loc.country,
        count: 0,
        locations: []
      };
    }
    acc[key].count++;
    acc[key].locations.push(loc);
    return acc;
  }, {});

  const citiesArray = Object.values(locationsByCity).sort((a, b) => b.count - a.count);

  const stats = {
    total: locations.length,
    cities: citiesArray.length,
    countries: [...new Set(locations.map(l => l.country))].length,
    primary: locations.filter(l => l.is_primary).length,
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Globe className="w-10 h-10 text-[#006cf0]" />
              Ubicaciones de Usuarios
            </h1>
            <p className="text-gray-400">
              Usuarios registrados por ubicación geográfica
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Total Ubicaciones</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Ciudades</p>
            <p className="text-2xl font-bold text-blue-400">{stats.cities}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Países</p>
            <p className="text-2xl font-bold text-green-400">{stats.countries}</p>
          </Card>
          <Card className="bg-white/5 border-white/10 p-4">
            <p className="text-gray-400 text-sm mb-1">Primarias</p>
            <p className="text-2xl font-bold text-purple-400">{stats.primary}</p>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por email, ciudad, estado o país..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
        </Card>

        {/* Cities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {citiesArray.map((cityData, index) => (
            <Card key={index} className="bg-white/5 border-white/10 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{cityData.city}</h3>
                    <p className="text-sm text-gray-400">{cityData.state}, {cityData.country}</p>
                  </div>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300">
                  {cityData.count} {cityData.count === 1 ? 'usuario' : 'usuarios'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        {/* Detailed List */}
        <h2 className="text-2xl font-bold text-white mb-4">Todas las Ubicaciones</h2>
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
            ))
          ) : filteredLocations.length > 0 ? (
            filteredLocations.map((location) => (
              <Card key={location.id} className="bg-white/5 border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-white font-semibold">{location.user_email || 'Usuario anónimo'}</p>
                        {location.is_primary && (
                          <Badge className="bg-green-500/20 text-green-300">Primaria</Badge>
                        )}
                        <Badge className={`${
                          location.location_type === 'gps' ? 'bg-blue-500/20 text-blue-300' :
                          location.location_type === 'manual' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {location.location_type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {location.city}, {location.state}, {location.country}
                        </span>
                        {location.postal_code && <span>📮 {location.postal_code}</span>}
                        {location.timezone && <span>🕐 {location.timezone}</span>}
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                        <span>Lat: {location.latitude?.toFixed(4)}</span>
                        <span>Lng: {location.longitude?.toFixed(4)}</span>
                        <span>Registrada: {format(new Date(location.created_date), "d/MM/yyyy HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400">
                {searchQuery ? "No se encontraron ubicaciones" : "No hay ubicaciones registradas"}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}