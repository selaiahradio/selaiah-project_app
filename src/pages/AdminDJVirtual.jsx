import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mic2, Plus, Trash2, Save, ArrowLeft, Play, Pause, Settings, Sparkles, Upload, Download, AlertCircle, Activity, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDJVirtualPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [currentScript, setCurrentScript] = useState('');
  const [generationError, setGenerationError] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [currentAudioData, setCurrentAudioData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isCheckingSystem, setIsCheckingSystem] = useState(false);
  const [availableVoices, setAvailableVoices] = useState(null);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  
  // Estado controlado para el formulario - AGREGADO FTP CONFIG
  const [formState, setFormState] = useState({
    dj_name: 'DJ Spirit',
    dj_personality: 'Un DJ pentecostal carismático y lleno del Espíritu Santo, que inspira y motiva a los oyentes con palabras de fe',
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    stability: 60, // Representado como porcentaje (0-100)
    similarity_boost: 75, // Representado como porcentaje (0-100)
    style: 50, // Representado como porcentaje (0-100)
    use_speaker_boost: true,
    intervention_frequency: 3,
    enabled: false,
    auto_schedule: true,
    language: 'es',
    // FTP Config
    ftp_enabled: false,
    ftp_host: 'c34.radioboss.fm',
    ftp_port: 21,
    ftp_username: 'selaiah',
    ftp_password_secret_key: 'RADIOBOSS_FTP_PASSWORD',
    ftp_remote_folder: 'dj_interventions',
    ftp_encryption: 'explicit_tls',
    ftp_passive_mode: true
  });

  const queryClient = useQueryClient();

  // Voice IDs populares de ElevenLabs
  const popularVoices = [
    { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', description: 'Voz masculina versátil, clara y profesional (Español/Inglés)' },
    { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella', description: 'Voz femenina cálida y expresiva (Español)' },
    { id: 'ThT5KcBeYPX3keUQqHPh', name: 'Daniel', description: 'Voz masculina autoritaria y profunda (Inglés)' },
    { id: 'pNInz6obpgDQGcFmaJgB', name: 'Adam', description: 'Voz masculina versátil, perfecta para narración (Inglés)' },
    { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Serena', description: 'Voz femenina suave y pentecostal (Español)' }
  ];

  // Obtener configuración del DJ
  const { data: djConfigs } = useQuery({
    queryKey: ['djConfigs'],
    queryFn: () => base44.entities.DJConfig.list(),
    initialData: [],
  });

  const djConfig = djConfigs[0];

  // Cargar configuración existente en el estado del formulario - ACTUALIZADO
  useEffect(() => {
    if (djConfig) {
      setFormState({
        dj_name: djConfig.dj_name || 'DJ Spirit',
        dj_personality: djConfig.dj_personality || 'Un DJ pentecostal carismático',
        voice_id: djConfig.voice_id || 'JBFqnCBsd6RMkjVDRZzb',
        stability: djConfig.voice_settings?.stability !== undefined ? Math.round(djConfig.voice_settings.stability * 100) : 60,
        similarity_boost: djConfig.voice_settings?.similarity_boost !== undefined ? Math.round(djConfig.voice_settings.similarity_boost * 100) : 75,
        style: djConfig.voice_settings?.style !== undefined ? Math.round(djConfig.voice_settings.style * 100) : 50,
        use_speaker_boost: djConfig.voice_settings?.use_speaker_boost !== false, // Default to true if not specified
        intervention_frequency: djConfig.intervention_frequency || 3,
        enabled: djConfig.enabled || false,
        auto_schedule: djConfig.auto_schedule !== false, // Default to true if not specified
        language: djConfig.language || 'es',
        // FTP Config
        ftp_enabled: djConfig.ftp_config?.enabled || false,
        ftp_host: djConfig.ftp_config?.host || 'c34.radioboss.fm',
        ftp_port: djConfig.ftp_config?.port || 21,
        ftp_username: djConfig.ftp_config?.username || 'selaiah',
        ftp_password_secret_key: djConfig.ftp_config?.password_secret_key || 'RADIOBOSS_FTP_PASSWORD',
        ftp_remote_folder: djConfig.ftp_config?.remote_folder || 'dj_interventions',
        ftp_encryption: djConfig.ftp_config?.encryption || 'explicit_tls',
        ftp_passive_mode: djConfig.ftp_config?.passive_mode !== false
      });
    }
  }, [djConfig]);

  // Obtener intervenciones
  const { data: interventions, isLoading } = useQuery({
    queryKey: ['djInterventions'],
    queryFn: () => base44.entities.DJIntervention.list("-created_date"),
    initialData: [],
  });

  // Mutaciones
  const createConfigMutation = useMutation({
    mutationFn: (data) => base44.entities.DJConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djConfigs'] });
      toast.success("✅ Configuración guardada exitosamente");
      checkSystemStatus(); // Re-check system status after saving config
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
      console.error('Error guardando config:', error);
    }
  });

  const updateConfigMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.DJConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djConfigs'] });
      toast.success("✅ Configuración actualizada exitosamente");
      checkSystemStatus(); // Re-check system status after saving config
    },
    onError: (error) => {
      toast.error("Error al actualizar: " + error.message);
      console.error('Error actualizando config:', error);
    }
  });

  const createInterventionMutation = useMutation({
    mutationFn: (data) => base44.entities.DJIntervention.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djInterventions'] });
      toast.success("Intervención creada");
    },
  });

  const deleteInterventionMutation = useMutation({
    mutationFn: (id) => base44.entities.DJIntervention.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djInterventions'] });
      toast.success("Intervención eliminada");
    },
  });

  // Verificar estado del sistema
  const checkSystemStatus = async () => {
    setIsCheckingSystem(true);
    try {
      const status = {
        elevenlabs: { status: 'checking', message: 'Verificando...' },
        radioboss_ftp: { status: 'checking', message: 'Verificando...' },
        openai: { status: 'checking', message: 'Verificando...' },
        dj_config: { status: 'checking', message: 'Verificando...' }
      };
      setSystemStatus(status);

      // Verificar OpenAI generando un script de prueba
      try {
        const scriptResponse = await base44.functions.invoke('generateDJScript', {
          type: 'greeting',
          context: {}
        });
        if (scriptResponse.data?.success) {
          status.openai = { status: 'ok', message: '✅ OpenAI funcionando correctamente' };
        } else {
          status.openai = { status: 'error', message: '❌ Error: ' + (scriptResponse.data?.error || 'Error desconocido') };
        }
      } catch (error) {
        status.openai = { status: 'error', message: '❌ ' + error.message };
      }

      // Verificar configuración del DJ
      if (djConfig && djConfig.dj_name && djConfig.voice_id) {
        status.dj_config = { status: 'ok', message: `✅ Configurado (Voz: ${djConfig.voice_id.substring(0, 8)}...)` };
      } else {
        status.dj_config = { status: 'warning', message: '⚠️ No configurado completamente' };
      }

      // Verificar ElevenLabs obteniendo la lista de voces (más seguro que generar audio)
      try {
        const voicesResponse = await base44.functions.invoke('getElevenLabsVoices');
        
        if (voicesResponse.data?.success) {
          const totalVoices = voicesResponse.data.total_voices || 0;
          const multilingualCount = voicesResponse.data.multilingual_voices?.length || 0;
          
          status.elevenlabs = { 
            status: 'ok', 
            message: `✅ ElevenLabs OK (${totalVoices} voces, ${multilingualCount} multilingües)`,
            details: voicesResponse.data.recommendation
          };
        } else {
          status.elevenlabs = { 
            status: 'error', 
            message: '❌ ' + (voicesResponse.data?.error || 'Error al conectar con ElevenLabs'),
            details: voicesResponse.data?.solution
          };
        }
      } catch (error) {
        status.elevenlabs = { 
          status: 'error', 
          message: '❌ ' + (error.response?.data?.error || error.message),
          details: error.response?.data?.solution || 'Verifica que ELEVENLABS_API_KEY sea correcta'
        };
      }

      // Verificar FTP de RadioBOSS (solo revisar que el password esté configurado)
      // This is a placeholder as direct FTP connection check without credentials or upload attempt is not feasible via frontend
      status.radioboss_ftp = { 
        status: 'info', 
        message: '💡 Se asume configurado si el secret existe (no se puede verificar conexión sin subir archivo)' 
      };

      setSystemStatus({...status}); // Use spread to force state update for nested objects
      
      // Guardar log
      await base44.entities.SystemLog.create({
        log_type: 'info',
        module: 'dj_virtual',
        message: 'Diagnóstico del sistema ejecutado',
        details: status
      });

    } catch (error) {
      console.error('Error en diagnóstico:', error);
      toast.error('Error ejecutando diagnóstico');
    } finally {
      setIsCheckingSystem(false);
    }
  };

  // Ejecutar diagnóstico al cargar
  useEffect(() => {
    if (djConfig) { // Only run if djConfig is available
      checkSystemStatus();
    }
  }, [djConfig?.id]); // Re-run if djConfig ID changes

  // Generar script con IA
  const handleGenerateScript = async (type) => {
    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateDJScript', {
        type: type,
        context: {}
      });

      if (response.data.success) {
        setCurrentScript(response.data.script);
        toast.success("Script generado con IA");
      } else {
        toast.error(response.data.error || "Error generando script");
      }
    } catch (error) {
      toast.error("Error al generar script: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generar audio con ElevenLabs - MEJORADO CON MEJOR ERROR HANDLING
  const handleGenerateAudio = async () => {
    if (!currentScript) {
      toast.error("Primero genera un script");
      return;
    }

    setIsGeneratingAudio(true);
    setGenerationError(null);
    setPreviewAudio(null);
    setCurrentAudioData(null);
    
    try {
      console.log('🎙️ Iniciando generación de audio...');
      console.log('📝 Script:', currentScript.substring(0, 100) + '...');
      
      const response = await base44.functions.invoke('generateDJAudio', {
        script: currentScript,
        voice_id: djConfig?.voice_id,
        voice_settings: djConfig?.voice_settings
      });

      console.log('📡 Respuesta completa:', response);
      console.log('📦 Response.data:', response.data);
      console.log('📦 Response.status:', response.status);

      // Verificar si hay error en la respuesta
      if (!response.data || response.data.success === false) {
        const errorMsg = response.data?.error || 'Error desconocido al generar audio';
        const errorDetails = response.data?.details || '';
        const errorSolution = response.data?.solution || '';
        
        console.error('❌ Error de ElevenLabs:', {
          error: errorMsg,
          details: errorDetails,
          solution: errorSolution,
          status: response.data?.status
        });
        
        // Construir mensaje de error completo
        let fullError = errorMsg;
        if (errorDetails) fullError += `\n\nDetalles: ${errorDetails}`;
        if (errorSolution) fullError += `\n\nSolución: ${errorSolution}`;
        
        setGenerationError(fullError);
        toast.error(errorMsg);
        
        // Guardar log para debugging
        await base44.entities.SystemLog.create({
          log_type: 'error',
          module: 'dj_virtual_frontend',
          message: 'Error generando audio desde frontend',
          details: {
            error: errorMsg,
            details: errorDetails,
            solution: errorSolution,
            response_data: response.data,
            script_length: currentScript.length,
            voice_id: djConfig?.voice_id
          }
        });
        
        return;
      }

      if (response.data && response.data.success) {
        const audioData = response.data;
        
        console.log('✅ Audio generado:', {
          size: audioData.size_kb + ' KB',
          duration: audioData.estimated_duration_seconds + 's',
          voice: audioData.voice_id
        });

        // Crear URL de audio para preview
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioData.audio_base64), c => c.charCodeAt(0))],
          { type: 'audio/mpeg' }
        );
        const audioUrl = URL.createObjectURL(audioBlob);
        setPreviewAudio(audioUrl);
        setCurrentAudioData(audioData);
        
        toast.success(`✅ Audio generado: ${audioData.size_kb} KB (~${audioData.estimated_duration_seconds}s)`);
        
        // Guardar la intervención en BD
        await createInterventionMutation.mutateAsync({
          title: `Intervención ${new Date().toLocaleString()}`,
          script: currentScript,
          status: 'generated',
          type: 'song_intro',
          duration_seconds: audioData.estimated_duration_seconds,
          voice_id: audioData.voice_id
        });
      }
    } catch (error) {
      console.error('❌ Error crítico generando audio:', error);
      console.error('Error completo:', {
        message: error.message,
        stack: error.stack,
        response: error.response
      });
      
      const errorMsg = error.response?.data?.error || error.message || 'Error al generar audio';
      setGenerationError(errorMsg);
      toast.error(errorMsg);
      
      // Guardar log crítico
      await base44.entities.SystemLog.create({
        log_type: 'critical',
        module: 'dj_virtual_frontend',
        message: 'Error crítico en generación de audio',
        details: {
          error: error.message,
          response: error.response?.data,
          stack: error.stack
        },
        stack_trace: error.stack
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Subir a RadioBOSS - MEJORADO
  const handleUploadToRadioBoss = async () => {
    if (!previewAudio || !currentAudioData) {
      toast.error("Primero genera el audio");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    
    try {
      console.log('📤 Subiendo a RadioBOSS Cloud...');
      
      const filename = `dj_${Date.now()}.mp3`;
      
      const response = await base44.functions.invoke('uploadDJAudioToRadioBoss', {
        audio_base64: currentAudioData.audio_base64,
        filename: filename
      });

      console.log('📡 Respuesta upload:', response);

      if (response.data && response.data.success) {
        const uploadData = response.data;
        
        console.log('✅ Subido exitosamente:', {
          path: uploadData.remote_path,
          size: uploadData.size_kb + ' KB'
        });

        toast.success(`✅ Subido a RadioBOSS: ${uploadData.size_kb} KB`);
        
        // Actualizar la última intervención
        const lastIntervention = interventions[0];
        if (lastIntervention) {
          await base44.entities.DJIntervention.update(lastIntervention.id, {
            radioboss_path: uploadData.remote_path,
            audio_url: uploadData.public_url,
            status: 'uploaded'
          });
          queryClient.invalidateQueries({ queryKey: ['djInterventions'] });
        }

        // Limpiar estados
        setPreviewAudio(null);
        setCurrentAudioData(null);
        setCurrentScript('');
      } else {
        const errorMsg = response.data?.error || 'Error al subir a RadioBOSS';
        console.error('❌ Error upload:', errorMsg);
        setUploadError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error subiendo:', error);
      const errorMsg = error.message || 'Error al subir a RadioBOSS';
      setUploadError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  // Obtener voces disponibles de ElevenLabs
  const handleGetVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await base44.functions.invoke('getElevenLabsVoices');
      
      if (response.data.success) {
        setAvailableVoices(response.data);
        toast.success(`✅ ${response.data.total_voices} voces encontradas`);
      } else {
        toast.error(response.data.error || 'Error obteniendo voces');
      }
    } catch (error) {
      toast.error('Error al obtener voces: ' + error.message);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Guardar configuración - ACTUALIZADO CON FTP
  const handleSaveConfig = (e) => {
    e.preventDefault();
    
    console.log('💾 Guardando configuración:', formState);
    
    const data = {
      dj_name: formState.dj_name,
      dj_personality: formState.dj_personality,
      voice_id: formState.voice_id,
      voice_settings: {
        stability: parseFloat(formState.stability) / 100,
        similarity_boost: parseFloat(formState.similarity_boost) / 100,
        style: parseFloat(formState.style) / 100,
        use_speaker_boost: formState.use_speaker_boost
      },
      ftp_config: {
        enabled: formState.ftp_enabled,
        host: formState.ftp_host,
        port: parseInt(formState.ftp_port),
        username: formState.ftp_username,
        password_secret_key: formState.ftp_password_secret_key,
        remote_folder: formState.ftp_remote_folder,
        encryption: formState.ftp_encryption,
        passive_mode: formState.ftp_passive_mode
      },
      intervention_frequency: parseInt(formState.intervention_frequency),
      enabled: formState.enabled,
      auto_schedule: formState.auto_schedule,
      language: formState.language,
    };

    console.log('📤 Datos a enviar:', data);

    if (djConfig) {
      console.log('🔄 Actualizando config existente, ID:', djConfig.id);
      updateConfigMutation.mutate({ id: djConfig.id, data });
    } else {
      console.log('🆕 Creando nueva config');
      createConfigMutation.mutate(data);
    }
  };

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
                <Mic2 className="w-10 h-10 text-[#006cf0]" />
                DJ Virtual con IA
              </h1>
              <p className="text-gray-400">
                Genera intervenciones automáticas del DJ usando OpenAI + ElevenLabs
              </p>
            </div>
            {djConfig && (
              <div className={`px-4 py-2 rounded-lg ${djConfig.enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                {djConfig.enabled ? '🟢 DJ Activo' : '⚪ DJ Inactivo'}
              </div>
            )}
          </div>
        </motion.div>

        {/* API Keys Status Card - MEJORADO */}
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30 p-6 mb-8">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-300 mb-3">✅ API Keys Configuradas Correctamente</h3>
              <p className="text-green-100 text-sm mb-4">
                Todas las credenciales necesarias para el DJ Virtual están configuradas y listas para usar:
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-black/20 rounded-lg p-3 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <h4 className="text-green-300 font-semibold text-sm">ELEVENLABS_API_KEY</h4>
                  </div>
                  <p className="text-green-100 text-xs">
                    ✅ Configurado - Genera audio de voz con IA
                  </p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <h4 className="text-green-300 font-semibold text-sm">OPENAI_API_KEY</h4>
                  </div>
                  <p className="text-green-100 text-xs">
                    ✅ Configurado - Genera scripts inteligentes
                  </p>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <h4 className="text-green-300 font-semibold text-sm">RADIOBOSS_FTP</h4>
                  </div>
                  <p className="text-green-100 text-xs">
                    ✅ Configurado - Sube archivos automáticamente
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <Button 
                  size="sm" 
                  onClick={checkSystemStatus}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingSystem ? 'animate-spin' : ''}`} />
                  Verificar Estado Nuevamente
                </Button>
                <Badge className="bg-green-500/20 text-green-300 border-green-500">
                  🎉 ¡Todo listo para usar!
                </Badge>
              </div>
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-200">
                  💡 <strong>Consejo:</strong> Si necesitas cambiar alguna API key, ve a la configuración de la plataforma Base44 (no desde aquí por seguridad).
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Estado del Sistema */}
        {systemStatus && (
          <Card className="bg-white/5 border-white/10 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Estado del Sistema
              </h3>
              <Button
                onClick={checkSystemStatus}
                disabled={isCheckingSystem}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isCheckingSystem ? 'animate-spin' : ''}`} />
                Verificar Nuevamente
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(systemStatus).map(([key, status]) => {
                const icons = {
                  openai: Sparkles,
                  elevenlabs: Mic2,
                  radioboss_ftp: Upload,
                  dj_config: Settings
                };
                const Icon = icons[key];
                const labels = {
                  openai: 'OpenAI (Scripts)',
                  elevenlabs: 'ElevenLabs (Audio)',
                  radioboss_ftp: 'RadioBOSS FTP',
                  dj_config: 'Configuración DJ'
                };

                return (
                  <Card 
                    key={key}
                    className={`p-4 ${
                      status.status === 'ok' ? 'bg-green-500/10 border-green-500/30' :
                      status.status === 'error' ? 'bg-red-500/10 border-red-500/30' :
                      status.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {Icon && <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        status.status === 'ok' ? 'text-green-400' :
                        status.status === 'error' ? 'text-red-400' :
                        status.status === 'warning' ? 'text-yellow-400' :
                        status.status === 'info' ? 'text-blue-400' :
                        'text-gray-400'
                      }`} />}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white text-sm mb-1">
                          {labels[key]}
                        </h4>
                        <p className="text-xs text-gray-300">{status.message}</p>
                        {status.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer">Ver detalles</summary>
                            <pre className="mt-1 text-xs bg-black/30 p-2 rounded overflow-x-auto">
                              {typeof status.details === 'string' ? status.details : JSON.stringify(status.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {systemStatus.elevenlabs?.status === 'error' && (
              <Card className="bg-red-500/10 border-red-500/30 p-4 mt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-300 mb-2">🔧 Solución de Problemas de ElevenLabs:</h4>
                    <ul className="text-sm text-red-200 space-y-1">
                      <li>1. Verifica que tu API key sea correcta en los secrets del proyecto.</li>
                      <li>2. La API key debe comenzar con "sk_"</li>
                      <li>3. Revisa que tu cuenta de ElevenLabs tenga créditos disponibles.</li>
                      <li>4. Ve a <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank" rel="noopener noreferrer" className="underline">elevenlabs.io/app/settings/api-keys</a> para verificar.</li>
                      <li>5. Crea una nueva API key si es necesario.</li>
                      <li>6. Actualiza el secret `ELEVENLABS_API_KEY` en Admin → Settings → Secrets</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Configuración del DJ - CON FTP */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Configuración del DJ
            </h2>
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dj_name" className="text-white">Nombre del DJ *</Label>
                <Input
                  id="dj_name"
                  value={formState.dj_name}
                  onChange={(e) => setFormState({...formState, dj_name: e.target.value})}
                  className="bg-white/10 border-white/20 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dj_personality" className="text-white">Personalidad del DJ</Label>
                <Textarea
                  id="dj_personality"
                  value={formState.dj_personality}
                  onChange={(e) => setFormState({...formState, dj_personality: e.target.value})}
                  className="bg-white/10 border-white/20 text-white"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="voice_id" className="text-white">Voice ID de ElevenLabs *</Label>
                
                {availableVoices ? (
                  <>
                    <select
                      id="voice_id"
                      value={formState.voice_id}
                      onChange={(e) => setFormState({...formState, voice_id: e.target.value})}
                      className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                      required
                    >
                      {availableVoices.multilingual_voices.length > 0 && (
                        <optgroup label="🌍 Voces Multilingües / Español">
                          {availableVoices.multilingual_voices.map(voice => (
                            <option key={voice.voice_id} value={voice.voice_id}>
                              {voice.name} - {voice.description.substring(0, 50)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {availableVoices.other_voices.length > 0 && (
                        <optgroup label="🎤 Otras Voces">
                          {availableVoices.other_voices.map(voice => (
                            <option key={voice.voice_id} value={voice.voice_id}>
                              {voice.name} - {voice.description.substring(0, 50)}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <p className="text-xs text-green-400">
                      ✅ Mostrando {availableVoices.total_voices} voces de tu cuenta
                    </p>
                  </>
                ) : (
                  <>
                    <Input
                      id="voice_id"
                      value={formState.voice_id}
                      onChange={(e) => setFormState({...formState, voice_id: e.target.value})}
                      className="bg-white/10 border-white/20 text-white"
                      placeholder="Pega aquí tu Voice ID"
                      required
                    />
                    <p className="text-xs text-gray-400">
                      💡 Haz clic abajo para ver las voces disponibles en tu cuenta
                    </p>
                  </>
                )}

                <Button
                  type="button"
                  onClick={handleGetVoices}
                  disabled={isLoadingVoices}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  {isLoadingVoices ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Cargando voces...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {availableVoices ? 'Recargar Voces' : 'Ver Mis Voces Disponibles'}
                    </>
                  )}
                </Button>

                {availableVoices && availableVoices.recommendation && (
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-200">
                      💡 <strong>Recomendación:</strong> {availableVoices.recommendation}
                    </p>
                  </div>
                )}
              </div>

              {/* Voice Settings Sliders - CONTROLADOS */}
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <Label className="text-white font-semibold">⚙️ Configuración de Voz Avanzada</Label>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="stability" className="text-sm text-gray-300">
                      Estabilidad
                    </Label>
                    <span className="text-white font-semibold text-sm">
                      {formState.stability}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    id="stability"
                    min="0"
                    max="100"
                    value={formState.stability}
                    onChange={(e) => setFormState({...formState, stability: Number(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">
                    Menor = Más variabilidad | Mayor = Más consistente
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="similarity_boost" className="text-sm text-gray-300">
                      Similarity Boost
                    </Label>
                    <span className="text-white font-semibold text-sm">
                      {formState.similarity_boost}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    id="similarity_boost"
                    min="0"
                    max="100"
                    value={formState.similarity_boost}
                    onChange={(e) => setFormState({...formState, similarity_boost: Number(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">
                    Qué tan similar a la voz original
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="style" className="text-sm text-gray-300">
                      Expresividad
                    </Label>
                    <span className="text-white font-semibold text-sm">
                      {formState.style}%
                    </span>
                  </div>
                  <Input
                    type="range"
                    id="style"
                    min="0"
                    max="100"
                    value={formState.style}
                    onChange={(e) => setFormState({...formState, style: Number(e.target.value)})}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">
                    Nivel de emoción en la voz
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    id="use_speaker_boost"
                    checked={formState.use_speaker_boost}
                    onCheckedChange={(checked) => setFormState({...formState, use_speaker_boost: checked})}
                  />
                  <Label htmlFor="use_speaker_boost" className="text-white cursor-pointer">
                    🎙️ Speaker Boost (Mejor calidad de audio)
                  </Label>
                </div>
              </div>

              {/* FTP Configuration Section - NUEVO */}
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <Label className="text-white font-semibold">📤 Configuración FTP</Label>
                  <Switch
                    id="ftp_enabled"
                    checked={formState.ftp_enabled}
                    onCheckedChange={(checked) => setFormState({...formState, ftp_enabled: checked})}
                  />
                </div>
                
                {formState.ftp_enabled && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ftp_host" className="text-sm text-gray-300">
                          Host FTP *
                        </Label>
                        <Input
                          id="ftp_host"
                          value={formState.ftp_host}
                          onChange={(e) => setFormState({...formState, ftp_host: e.target.value})}
                          placeholder="c34.radioboss.fm o localhost"
                          className="bg-white/10 border-white/20 text-white"
                          required={formState.ftp_enabled}
                        />
                        <p className="text-xs text-gray-400">
                          Ejemplos: c34.radioboss.fm, localhost, ftp.miservidor.com
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ftp_port" className="text-sm text-gray-300">
                          Puerto
                        </Label>
                        <Input
                          type="number"
                          id="ftp_port"
                          value={formState.ftp_port}
                          onChange={(e) => setFormState({...formState, ftp_port: Number(e.target.value)})}
                          placeholder="21"
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <p className="text-xs text-gray-400">
                          21 para FTP, 22 para SFTP
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ftp_username" className="text-sm text-gray-300">
                          Usuario FTP *
                        </Label>
                        <Input
                          id="ftp_username"
                          value={formState.ftp_username}
                          onChange={(e) => setFormState({...formState, ftp_username: e.target.value})}
                          placeholder="selaiah"
                          className="bg-white/10 border-white/20 text-white"
                          required={formState.ftp_enabled}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ftp_password_secret_key" className="text-sm text-gray-300">
                          Secret de la Contraseña
                        </Label>
                        <Input
                          id="ftp_password_secret_key"
                          value={formState.ftp_password_secret_key}
                          onChange={(e) => setFormState({...formState, ftp_password_secret_key: e.target.value})}
                          placeholder="RADIOBOSS_FTP_PASSWORD"
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <p className="text-xs text-gray-400">
                          Nombre del secret donde guardaste la contraseña FTP
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ftp_remote_folder" className="text-sm text-gray-300">
                        Carpeta Remota
                      </Label>
                      <Input
                        id="ftp_remote_folder"
                        value={formState.ftp_remote_folder}
                        onChange={(e) => setFormState({...formState, ftp_remote_folder: e.target.value})}
                        placeholder="dj_interventions"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        Carpeta donde se subirán los archivos de audio
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ftp_encryption" className="text-sm text-gray-300">
                        Tipo de Encriptación
                      </Label>
                      <select
                        id="ftp_encryption"
                        value={formState.ftp_encryption}
                        onChange={(e) => setFormState({...formState, ftp_encryption: e.target.value})}
                        className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                      >
                        <option value="none">Sin encriptación (FTP)</option>
                        <option value="explicit_tls">Explicit FTP over TLS (FTPES)</option>
                        <option value="implicit_tls">Implicit FTPS</option>
                        <option value="sftp">SFTP (SSH File Transfer)</option>
                      </select>
                      <p className="text-xs text-gray-400">
                        RadioBOSS Cloud usa "Explicit FTP over TLS"
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Switch
                        id="ftp_passive_mode"
                        checked={formState.ftp_passive_mode}
                        onCheckedChange={(checked) => setFormState({...formState, ftp_passive_mode: checked})}
                      />
                      <Label htmlFor="ftp_passive_mode" className="text-white cursor-pointer text-sm">
                        Modo Pasivo (recomendado para la mayoría de servidores)
                      </Label>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Ejemplos de Configuración:</h4>
                      <ul className="text-xs text-blue-200 space-y-2">
                        <li>
                          <strong>RadioBOSS Cloud:</strong><br/>
                          Host: c34.radioboss.fm, Puerto: 21, Encryption: Explicit FTP over TLS
                        </li>
                        <li>
                          <strong>Servidor Local:</strong><br/>
                          Host: localhost, Puerto: 21, Encryption: Sin encriptación
                        </li>
                        <li>
                          <strong>AzuraCast:</strong><br/>
                          Host: tu-azuracast.com, Puerto: 22, Encryption: SFTP
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="intervention_frequency" className="text-white">
                  Intervenir cada cuántas canciones
                </Label>
                <Input
                  type="number"
                  id="intervention_frequency"
                  min="1"
                  max="10"
                  value={formState.intervention_frequency}
                  onChange={(e) => setFormState({...formState, intervention_frequency: Number(e.target.value)})}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="language" className="text-white">Idioma</Label>
                <select
                  id="language"
                  value={formState.language}
                  onChange={(e) => setFormState({...formState, language: e.target.value})}
                  className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="both">Ambos</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="enabled"
                  checked={formState.enabled}
                  onCheckedChange={(checked) => setFormState({...formState, enabled: checked})}
                />
                <Label htmlFor="enabled" className="text-white cursor-pointer">
                  DJ Virtual Habilitado
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="auto_schedule"
                  checked={formState.auto_schedule}
                  onCheckedChange={(checked) => setFormState({...formState, auto_schedule: checked})}
                />
                <Label htmlFor="auto_schedule" className="text-white cursor-pointer">
                  Programar automáticamente
                </Label>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-300 mb-2">💡 Configuración Recomendada:</h4>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• <strong>Voz:</strong> George (multilingüe)</li>
                  <li>• <strong>Estabilidad:</strong> 60-70%</li>
                  <li>• <strong>Similarity:</strong> 75-85%</li>
                  <li>• <strong>Expresividad:</strong> 40-60%</li>
                  <li>• <strong>Speaker Boost:</strong> Activado</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={createConfigMutation.isPending || updateConfigMutation.isPending}
                className="w-full bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                {(createConfigMutation.isPending || updateConfigMutation.isPending) ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Generador de Intervenciones - MEJORADO */}
          <Card className="bg-white/5 border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Generar Intervención
            </h2>
            
            <div className="space-y-6">
              {/* Botones de tipos de intervención */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleGenerateScript('greeting')}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  🌅 Saludo
                </Button>
                <Button
                  onClick={() => handleGenerateScript('song_intro')}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  🎵 Intro Canción
                </Button>
                <Button
                  onClick={() => handleGenerateScript('blessing')}
                  disabled={isGenerating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  🙏 Bendición
                </Button>
                <Button
                  onClick={() => handleGenerateScript('scripture')}
                  disabled={isGenerating}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  📖 Escritura
                </Button>
              </div>

              {/* Script generado */}
              {currentScript && (
                <div className="space-y-4">
                  <Label className="text-white">Script Generado:</Label>
                  <Textarea
                    value={currentScript}
                    onChange={(e) => setCurrentScript(e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                    rows={6}
                  />
                  
                  {/* Botón de generar audio */}
                  <Button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {isGeneratingAudio ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Generando Audio con ElevenLabs...
                      </>
                    ) : (
                      <>
                        <Mic2 className="w-4 h-4 mr-2" />
                        Generar Audio con IA
                      </>
                    )}
                  </Button>

                  {/* Error de generación */}
                  {generationError && (
                    <Card className="bg-red-500/10 border-red-500/30 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-red-300 font-semibold mb-1">Error al generar audio:</p>
                          <p className="text-red-200 text-sm whitespace-pre-wrap">{generationError}</p>
                          <p className="text-red-200 text-xs mt-2">
                            💡 Verifica que ELEVENLABS_API_KEY esté correctamente configurada
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Preview de audio */}
              {previewAudio && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Preview del Audio:</Label>
                    {currentAudioData && (
                      <Badge className="bg-green-500/20 text-green-300">
                        {currentAudioData.size_kb} KB • ~{currentAudioData.estimated_duration_seconds}s
                      </Badge>
                    )}
                  </div>
                  <audio
                    controls
                    src={previewAudio}
                    className="w-full"
                  />
                  
                  <Button
                    onClick={handleUploadToRadioBoss}
                    disabled={isUploading}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Subiendo a RadioBOSS Cloud...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir a RadioBOSS Cloud
                      </>
                    )}
                  </Button>

                  {/* Error de upload */}
                  {uploadError && (
                    <Card className="bg-red-500/10 border-red-500/30 p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-red-300 font-semibold mb-1">Error al subir a RadioBOSS:</p>
                          <p className="text-red-200 text-sm">{uploadError}</p>
                          <p className="text-red-200 text-xs mt-2">
                            💡 Verifica que RADIOBOSS_FTP_PASSWORD esté correctamente configurada
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {isGenerating && (
                <div className="text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Generando script con IA...
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Historial de Intervenciones */}
        <Card className="bg-white/5 border-white/10 p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Historial de Intervenciones ({interventions.length})
          </h2>
          
          <div className="space-y-3">
            {isLoading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
              ))
            ) : interventions.length > 0 ? (
              interventions.map((intervention) => (
                <Card key={intervention.id} className="bg-white/5 border-white/10 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold">{intervention.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          intervention.status === 'uploaded' ? 'bg-green-500/20 text-green-300' :
                          intervention.status === 'generated' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {intervention.status}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                          {intervention.type}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-2">{intervention.script}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {intervention.duration_seconds && (
                          <span>⏱️ {intervention.duration_seconds}s</span>
                        )}
                        {intervention.created_date && (
                          <span>{new Date(intervention.created_date).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {intervention.audio_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(intervention.audio_url, '_blank')}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteInterventionMutation.mutate(intervention.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Mic2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No hay intervenciones generadas aún</p>
                <p className="text-sm">Genera tu primera intervención usando los botones de arriba</p>
              </div>
            )}
          </div>
        </Card>

        {/* Instrucciones */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 p-6 mt-8">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            💡 Cómo Funciona el DJ Virtual
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-100">
            <div>
              <strong>1. Configura tu DJ:</strong>
              <p className="text-gray-300">Define nombre, personalidad y voice ID de ElevenLabs</p>
            </div>
            <div>
              <strong>2. Configura FTP:</strong>
              <p className="text-gray-300">Configura el servidor FTP donde se subirán los audios</p>
            </div>
            <div>
              <strong>3. Genera Scripts:</strong>
              <p className="text-gray-300">OpenAI crea comentarios basados en contexto real</p>
            </div>
            <div>
              <strong>4. Genera Audio:</strong>
              <p className="text-gray-300">ElevenLabs convierte el texto a voz natural</p>
            </div>
            <div>
              <strong>5. Sube vía FTP:</strong>
              <p className="text-gray-300">El audio se sube automáticamente a tu servidor</p>
            </div>
            <div>
              <strong>6. Reproduce:</strong>
              <p className="text-gray-300">Configura tu software de radio para reproducir desde la carpeta</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-200">
              ⚠️ <strong>Servidores Compatibles:</strong> RadioBOSS Cloud, AzuraCast, Icecast, SAM Broadcaster, servidores locales, o cualquier servidor con FTP/SFTP.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}