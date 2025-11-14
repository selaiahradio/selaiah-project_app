import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

/**
 * Componente para proteger rutas que requieren roles específicos
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a mostrar si está autorizado
 * @param {string[]} props.allowedRoles - Roles permitidos (ej: ['admin', 'superadmin'])
 * @param {string} props.redirectTo - URL a donde redirigir si no está autorizado (opcional)
 */
export default function ProtectedRoute({ children, allowedRoles = ['admin', 'superadmin'], redirectTo = null }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        
        // Verificar si el usuario tiene uno de los roles permitidos
        if (allowedRoles.includes(user.role)) {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          toast.error("No tienes permisos para acceder a esta página");
          
          // Redirigir si se especificó una URL
          setTimeout(() => {
            if (redirectTo) {
              window.location.href = redirectTo;
            } else {
              window.location.href = createPageUrl("Home");
            }
          }, 2000);
        }
      } catch (error) {
        setCurrentUser(null);
        setIsAuthorized(false);
        toast.error("Debes iniciar sesión");
        
        setTimeout(() => {
          base44.auth.redirectToLogin(window.location.pathname);
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [allowedRoles, redirectTo]);

  // Mostrar loader mientras verifica
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autorizado, mostrar mensaje de acceso denegado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/5 border-red-500/30 p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-4">
            No tienes permisos para acceder a esta página.
          </p>
          <div className="flex flex-col gap-2">
            <Badge className="bg-red-500/20 text-red-300 mx-auto">
              {currentUser?.role ? `Tu rol: ${currentUser.role}` : 'No autenticado'}
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 mx-auto">
              Roles permitidos: {allowedRoles.join(', ')}
            </Badge>
            <p className="text-xs text-gray-500 mt-2">
              Serás redirigido en unos segundos...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Si está autorizado, mostrar el contenido
  return <>{children}</>;
}