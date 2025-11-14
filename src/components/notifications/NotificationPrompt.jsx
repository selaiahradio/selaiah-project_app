import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFirebaseMessaging } from "./FirebaseConfig";
import { toast } from "sonner";

export default function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState(["all"]);
  const { permission, isSupported, subscribe, unsubscribe } = useFirebaseMessaging();

  const topics = [
    { id: "all", name: "Todas las notificaciones", icon: "🔔" },
    { id: "news", name: "Noticias", icon: "📰" },
    { id: "events", name: "Eventos", icon: "🎉" },
    { id: "shows", name: "Programas", icon: "🎙️" },
    { id: "music", name: "Música", icon: "🎵" }
  ];

  useEffect(() => {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    // Verificar si ya se pidieron permisos o si el usuario cerró el prompt
    const promptDismissed = localStorage.getItem('notification-prompt-dismissed');
    const hasSubscription = localStorage.getItem('has-push-subscription');

    if (isSupported && permission === "default" && !promptDismissed && !hasSubscription) {
      // Mostrar el prompt después de 5 segundos
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [permission, isSupported]);

  const handleSubscribe = async () => {
    try {
      const result = await subscribe(base44, selectedTopics);
      
      if (result.success) {
        toast.success("¡Notificaciones activadas! Te mantendremos informado.");
        if (typeof window !== 'undefined') {
          localStorage.setItem('has-push-subscription', 'true');
        }
        setShowPrompt(false);
      } else {
        toast.error("No se pudieron activar las notificaciones: " + result.error);
      }
    } catch (error) {
      toast.error("Error al activar notificaciones");
      console.error(error);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-prompt-dismissed', 'true');
    }
    setShowPrompt(false);
  };

  const toggleTopic = (topicId) => {
    if (topicId === "all") {
      setSelectedTopics(["all"]);
    } else {
      setSelectedTopics(prev => {
        const filtered = prev.filter(t => t !== "all");
        if (filtered.includes(topicId)) {
          return filtered.filter(t => t !== topicId);
        } else {
          return [...filtered, topicId];
        }
      });
    }
  };

  // No mostrar nada si no está soportado o si el permiso no es "default"
  if (!isSupported || permission !== "default") {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-24 right-4 z-50 max-w-md"
        >
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-none shadow-2xl p-6">
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  ¡Mantente Conectado!
                </h3>
                <p className="text-white/90 text-sm">
                  Activa las notificaciones para recibir las últimas noticias, eventos y música de SELAIAH RADIO
                </p>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <p className="text-white/90 text-xs font-medium mb-2">Quiero recibir notificaciones sobre:</p>
              <div className="space-y-1">
                {topics.map(topic => (
                  <button
                    key={topic.id}
                    onClick={() => toggleTopic(topic.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                      selectedTopics.includes(topic.id)
                        ? "bg-white/30 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    <span className="text-lg">{topic.icon}</span>
                    <span className="text-sm flex-1 text-left">{topic.name}</span>
                    {selectedTopics.includes(topic.id) && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubscribe}
                disabled={selectedTopics.length === 0}
                className="flex-1 bg-white text-blue-600 hover:bg-gray-100 font-semibold"
              >
                <Bell className="w-4 h-4 mr-2" />
                Activar
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
              Puedes cambiar estas preferencias en cualquier momento
            </p>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}