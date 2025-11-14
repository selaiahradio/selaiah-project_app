import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, X, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "./LocationService";
import { toast } from "sonner";

export default function LocationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { getLocation, saveLocation, loading, isSupported } = useGeolocation();

  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    const checkLocationStatus = async () => {
      try {
        // Verificar si ya se pidió ubicación
        const promptDismissed = localStorage.getItem('location-prompt-dismissed');
        if (promptDismissed) return;

        // Verificar si ya tiene ubicación guardada
        const user = await base44.auth.me().catch(() => null);
        if (!user) return;

        const locations = await base44.entities.UserLocation.filter({
          created_by: user.email,
          is_primary: true
        });

        if (locations.length === 0 && isSupported) {
          // Mostrar el prompt después de 3 segundos
          setTimeout(() => {
            setShowPrompt(true);
          }, 3000);
        }
      } catch (error) {
        console.error("Error verificando estado de ubicación:", error);
      }
    };

    checkLocationStatus();
  }, [isSupported]);

  const handleAllow = async () => {
    try {
      const locationData = await getLocation();
      if (locationData) {
        await saveLocation(locationData);
        toast.success("¡Ubicación guardada! Ahora puedes ver noticias locales.");
        setShowPrompt(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('location-prompt-dismissed', 'true');
        }
      }
    } catch (error) {
      toast.error("No se pudo obtener tu ubicación. " + (error.message || ""));
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('location-prompt-dismissed', 'true');
    }
    setShowPrompt(false);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 left-4 z-50 max-w-md"
        >
          <Card className="bg-gradient-to-br from-green-600 to-teal-700 border-none shadow-2xl p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Descubre tu Comunidad Cristiana
                </h3>
                <p className="text-white/90 text-sm">
                  Permítenos conocer tu ubicación para mostrarte eventos, iglesias y noticias cristianas de tu área
                </p>
              </div>
            </div>

            <div className="mb-4 bg-white/10 rounded-lg p-3">
              <p className="text-xs text-white/90">
                ✨ Verás contenido relevante de tu ciudad<br/>
                🙏 Conecta con iglesias y ministerios locales<br/>
                📅 Conoce eventos cristianos cerca de ti
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAllow}
                disabled={loading}
                className="flex-1 bg-white text-green-700 hover:bg-gray-100 font-semibold"
              >
                <Navigation className="w-4 h-4 mr-2" />
                {loading ? "Obteniendo..." : "Permitir Ubicación"}
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="text-white hover:bg-white/10"
              >
                Después
              </Button>
            </div>

            <p className="text-xs text-white/70 mt-3 text-center">
              Tu privacidad es importante. Solo usamos tu ubicación para mostrarte contenido local.
            </p>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}