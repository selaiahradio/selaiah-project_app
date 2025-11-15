
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, X, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "./LocationService";
import { toast } from "sonner";
import { appParams } from "@/lib/app-params"; // Import token provider

export default function LocationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  // The hook is already updated, we just need to use its new function
  const { getLocation, saveLocation, loading, isSupported, hasPrimaryLocation } = useGeolocation();

  useEffect(() => {
    // Only run in the browser and if a user is logged in
    if (typeof window === 'undefined' || !appParams.token) return;

    const checkLocationStatus = async () => {
      try {
        const promptDismissed = localStorage.getItem('location-prompt-dismissed');
        if (promptDismissed) return;

        // Use the new function from the updated hook
        const alreadyHasLocation = await hasPrimaryLocation();

        if (!alreadyHasLocation && isSupported) {
          // Show the prompt after a delay
          const timer = setTimeout(() => {
            setShowPrompt(true);
          }, 5000); // Increased delay to be less intrusive
          return () => clearTimeout(timer);
        }
      } catch (error) {
        console.error("Error checking location status:", error);
      }
    };

    checkLocationStatus();
  }, [isSupported, hasPrimaryLocation]);

  const handleAllow = async () => {
    try {
      const locationData = await getLocation();
      if (locationData) {
        await saveLocation(locationData);
        toast.success("¡Ubicación guardada! Ahora verás contenido local.");
        setShowPrompt(false);
        if (typeof window !== 'undefined') {
          localStorage.setItem('location-prompt-dismissed', 'true');
        }
      }
    } catch (error) {
      toast.error(error.message || "No se pudo obtener tu ubicación.");
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('location-prompt-dismissed', 'true');
    }
    setShowPrompt(false);
  };

  if (!isSupported || !showPrompt) {
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
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                        Descubre contenido local
                    </h3>
                    <p className="text-white/90 text-sm">
                        Permítenos usar tu ubicación para mostrarte eventos, iglesias y noticias cristianas en tu área.
                    </p>
                </div>
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
                Ahora no
              </Button>
            </div>

            <p className="text-xs text-white/70 mt-3 text-center">
              Tu privacidad es importante para nosotros.
            </p>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
