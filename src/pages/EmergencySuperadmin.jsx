import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EmergencySuperadminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleMakeSuperadmin = async () => {
    if (!currentUser) {
      toast.error("No hay usuario autenticado");
      return;
    }

    if (currentUser.role === 'superadmin') {
      toast.info("Ya eres superadmin");
      return;
    }

    const confirmed = confirm(
      `⚠️ IMPORTANTE\n\n` +
      `¿Convertir a ${currentUser.full_name} (${currentUser.email}) en SUPERADMIN?\n\n` +
      `Esto te dará acceso TOTAL al sistema.`
    );

    if (!confirmed) return;

    setProcessing(true);

    try {
      await base44.auth.updateMe({
        role: 'superadmin'
      });

      toast.success("¡Eres superadmin ahora!");
      setSuccess(true);

      setTimeout(async () => {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        setTimeout(() => {
          window.location.href = '/Admin';
        }, 2000);
      }, 1000);

    } catch (error) {
      console.error("Error:", error);
      toast.error("Error: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Sin Autenticación</h2>
          <p className="text-gray-400 mb-6">
            Debes iniciar sesión para usar esta página de emergencia
          </p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Iniciar Sesión
          </Button>
        </Card>
      </div>
    );
  }

  if (currentUser.role === 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="bg-white/5 border-white/10 p-8 text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Ya Eres Superadmin</h2>
          <p className="text-gray-400 mb-6">
            Tu cuenta ya tiene el rol de superadmin
          </p>
          <Button onClick={() => window.location.href = '/Admin'}>
            Ir al Panel Admin
          </Button>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30 p-12 text-center max-w-md">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-white mb-4">¡Éxito!</h2>
            <p className="text-gray-300 mb-2">
              Ahora eres <span className="text-green-400 font-bold">SUPERADMIN</span>
            </p>
            <p className="text-sm text-gray-400">
              Redirigiendo al panel de administración...
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-2xl w-full"
      >
        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/30 p-8">
          <div className="text-center mb-8">
            <Shield className="w-20 h-20 text-red-400 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">
              🚨 Página de Emergencia - Superadmin
            </h1>
            <p className="text-gray-400">
              Asígnate el rol de superadmin ahora mismo
            </p>
          </div>

          <Card className="bg-white/5 border-white/10 p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Tu Cuenta Actual</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Nombre:</span>
                <span className="text-white font-medium">{currentUser.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email:</span>
                <span className="text-white font-medium">{currentUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Rol Actual:</span>
                <span className={`font-medium ${
                  currentUser.role === 'admin' ? 'text-purple-400' : 'text-gray-400'
                }`}>
                  {currentUser.role === 'admin' ? 'Administrador' : currentUser.role}
                </span>
              </div>
            </div>
          </Card>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-semibold mb-2">⚠️ Importante:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Esta página es una solución de emergencia</li>
                  <li>Te permitirá asignarte el rol de superadmin directamente</li>
                  <li>Una vez superadmin, podrás gestionar todos los usuarios</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleMakeSuperadmin}
              disabled={processing}
              className="w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white py-6 text-lg font-semibold"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  Procesando...
                </>
              ) : (
                <>
                  <Shield className="w-6 h-6 mr-3" />
                  Convertirme en SUPERADMIN
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-500">
              Después de convertirte en superadmin, esta página ya no será necesaria
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}