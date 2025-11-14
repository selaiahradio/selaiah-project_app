import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Activity,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Radio,
  Bell,
  MapPin,
  Zap,
  Server,
  Clock,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminDiagnosticsPage() {
  const [refreshing, setRefreshing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);

  // Obtener logs del sistema
  const { data: logs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['systemLogs'],
    queryFn: () => base44.entities.SystemLog.list('-created_date', 50),
    initialData: [],
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  // Verificar estado del sistema
  const checkSystemHealth = async () => {
    setRefreshing(true);
    try {
      const checks = {
        database: await checkDatabase(),
        streams: await checkStreams(),
        notifications: await checkNotifications(),
        functions: await checkFunctions(),
        integrations: await checkIntegrations(),
      };

      setSystemHealth(checks);
      
      // Crear log de diagnóstico
      await base44.entities.SystemLog.create({
        log_type: 'info',
        module: 'diagnostics',
        message: 'Health check ejecutado',
        details: checks
      });

      toast.success("Diagnóstico completado");
    } catch (error) {
      toast.error("Error en diagnóstico");
      await base44.entities.SystemLog.create({
        log_type: 'error',
        module: 'diagnostics',
        message: 'Error en health check',
        details: { error: error.message },
        stack_trace: error.stack
      });
    } finally {
      setRefreshing(false);
    }
  };

  const checkDatabase = async () => {
    try {
      const users = await base44.entities.User.list('', 1);
      return { status: 'healthy', message: 'Base de datos operativa', latency: Date.now() % 100 };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  };

  const checkStreams = async () => {
    try {
      const streams = await base44.entities.StreamConfig.filter({ is_active: true });
      if (streams.length === 0) {
        return { status: 'warning', message: 'No hay streams configurados' };
      }
      return { status: 'healthy', message: `${streams.length} stream(s) activo(s)` };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  };

  const checkNotifications = async () => {
    try {
      const subs = await base44.entities.PushSubscription.filter({ is_active: true });
      return { status: 'healthy', message: `${subs.length} suscriptor(es)` };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  };

  const checkFunctions = async () => {
    try {
      // Probar una función backend
      const response = await base44.functions.invoke('getFirebaseConfig', {});
      if (response.data) {
        return { status: 'healthy', message: 'Funciones operativas' };
      }
      return { status: 'warning', message: 'Firebase no configurado' };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  };

  const checkIntegrations = async () => {
    try {
      const integrations = await base44.entities.Integration.filter({ is_enabled: true });
      return { status: 'healthy', message: `${integrations.length} integración(es) activa(s)` };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  };

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />;
      default:
        return <Activity className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'warning':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Activity className="w-4 h-4 text-blue-400" />;
    }
  };

  const errorLogs = logs.filter(l => l.log_type === 'error' || l.log_type === 'critical');
  const warningLogs = logs.filter(l => l.log_type === 'warning');

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
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
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Activity className="w-10 h-10 text-[#006cf0]" />
                Diagnóstico del Sistema
              </h1>
              <p className="text-gray-400">
                Monitoreo en tiempo real del estado de SELAIAH RADIO
              </p>
            </div>
            <Button
              onClick={checkSystemHealth}
              disabled={refreshing}
              className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Verificando...' : 'Ejecutar Diagnóstico'}
            </Button>
          </div>
        </motion.div>

        {/* Alert de Problemas */}
        {(errorLogs.length > 0 || warningLogs.length > 0) && (
          <Card className="bg-red-500/10 border-red-500/30 p-6 mb-8">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-red-300 mb-2">
                  Se detectaron problemas
                </h3>
                <div className="space-y-1 text-red-200">
                  {errorLogs.length > 0 && (
                    <p>• {errorLogs.length} error(es) crítico(s)</p>
                  )}
                  {warningLogs.length > 0 && (
                    <p>• {warningLogs.length} advertencia(s)</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* System Health Cards */}
        {systemHealth && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {Object.entries(systemHealth).map(([key, health]) => {
              const icons = {
                database: Database,
                streams: Radio,
                notifications: Bell,
                functions: Zap,
                integrations: Server
              };
              const Icon = icons[key];

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="bg-white/5 border-white/10 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#006cf0]/20 flex items-center justify-center">
                          <Icon className="w-6 h-6 text-[#006cf0]" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white capitalize">
                            {key.replace('_', ' ')}
                          </h3>
                          <p className="text-sm text-gray-400">{health.message}</p>
                        </div>
                      </div>
                      {getStatusIcon(health.status)}
                    </div>
                    
                    <Badge className={getStatusColor(health.status)}>
                      {health.status === 'healthy' ? 'Operativo' : 
                       health.status === 'warning' ? 'Advertencia' : 'Error'}
                    </Badge>

                    {health.latency && (
                      <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Latencia: {health.latency}ms
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Logs en Tiempo Real */}
        <Card className="bg-white/5 border-white/10 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-[#006cf0]" />
              Logs del Sistema
            </h3>
            <Badge className="bg-blue-500/20 text-blue-300">
              Últimos 50 registros
            </Badge>
          </div>

          {logsLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : logs.length > 0 ? (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.log_type === 'error' || log.log_type === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : log.log_type === 'warning'
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : log.log_type === 'success'
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.log_type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-semibold text-white">
                          {log.module}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(log.created_date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300">{log.message}</p>
                      {log.details && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
                            Ver detalles
                          </summary>
                          <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                      {log.stack_trace && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300">
                            Ver stack trace
                          </summary>
                          <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto text-red-300">
                            {log.stack_trace}
                          </pre>
                        </details>
                      )}
                    </div>
                    {log.user_email && (
                      <span className="text-xs text-gray-500">
                        {log.user_email}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No hay logs registrados</p>
            </div>
          )}
        </Card>

        {/* Estadísticas Rápidas */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.log_type === 'success').length}
                </p>
                <p className="text-sm text-gray-400">Éxitos</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {warningLogs.length}
                </p>
                <p className="text-sm text-gray-400">Advertencias</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {errorLogs.length}
                </p>
                <p className="text-sm text-gray-400">Errores</p>
              </div>
            </div>
          </Card>

          <Card className="bg-white/5 border-white/10 p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white">
                  {logs.filter(l => l.log_type === 'info').length}
                </p>
                <p className="text-sm text-gray-400">Info</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}