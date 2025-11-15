
import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Mic2, Plus, Trash2, Save, ArrowLeft, Play, Settings, Sparkles, Upload, AlertCircle, Activity, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { appParams } from "@/lib/app-params";


// --- START: NEW API LOGIC ---
const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const token = appParams.token;

const fetcher = async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error on ${path}: ${errorText}`);
        throw new Error(`Request failed: ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
};

const getDjConfig = () => fetcher('/dj_config');
const updateDjConfig = (data) => fetcher('/dj_config', { method: 'POST', body: JSON.stringify(data) });
const getDjInterventions = () => fetcher('/dj_interventions?sort=-created_date');
const deleteDjIntervention = (id) => fetcher(`/dj_interventions/${id}`, { method: 'DELETE' });

const generateDjScript = (type) => fetcher(`/dj_interventions/generate-script`, { method: 'POST', body: JSON.stringify({ type }) });
const generateDjAudio = (data) => fetcher(`/dj_interventions/generate-audio`, { method: 'POST', body: JSON.stringify(data) });
const uploadDjAudio = (data) => fetcher(`/dj_interventions/upload-audio`, { method: 'POST', body: JSON.stringify(data) });
const checkDjSystem = () => fetcher('/dj_interventions/check-system');
const getElevenLabsVoices = () => fetcher('/dj_interventions/get-voices');
// --- END: NEW API LOGIC ---


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
  
  const [formState, setFormState] = useState({
    dj_name: 'DJ Spirit',
    dj_personality: 'Un DJ pentecostal carismático y lleno del Espíritu Santo, que inspira y motiva a los oyentes con palabras de fe',
    voice_id: 'JBFqnCBsd6RMkjVDRZzb',
    stability: 60,
    similarity_boost: 75,
    style: 50,
    use_speaker_boost: true,
    intervention_frequency: 3,
    enabled: false,
    auto_schedule: true,
    language: 'es',
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

  const { data: djConfig } = useQuery({
    queryKey: ['djConfig'],
    queryFn: getDjConfig,
  });

  useEffect(() => {
    if (djConfig) {
      setFormState({
        dj_name: djConfig.dj_name || 'DJ Spirit',
        dj_personality: djConfig.dj_personality || 'Un DJ pentecostal carismático',
        voice_id: djConfig.voice_id || 'JBFqnCBsd6RMkjVDRZzb',
        stability: djConfig.voice_settings?.stability !== undefined ? Math.round(djConfig.voice_settings.stability * 100) : 60,
        similarity_boost: djConfig.voice_settings?.similarity_boost !== undefined ? Math.round(djConfig.voice_settings.similarity_boost * 100) : 75,
        style: djConfig.voice_settings?.style !== undefined ? Math.round(djConfig.voice_settings.style * 100) : 50,
        use_speaker_boost: djConfig.voice_settings?.use_speaker_boost !== false,
        intervention_frequency: djConfig.intervention_frequency || 3,
        enabled: djConfig.enabled || false,
        auto_schedule: djConfig.auto_schedule !== false,
        language: djConfig.language || 'es',
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

  const { data: interventions, isLoading: isLoadingInterventions } = useQuery({
    queryKey: ['djInterventions'],
    queryFn: getDjInterventions,
    initialData: [],
  });

  const updateConfigMutation = useMutation({
    mutationFn: updateDjConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djConfig'] });
      toast.success("✅ Configuración actualizada exitosamente");
      handleCheckSystemStatus();
    },
    onError: (error) => toast.error("Error al actualizar: " + error.message)
  });

  const deleteInterventionMutation = useMutation({
    mutationFn: deleteDjIntervention,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['djInterventions'] });
      toast.success("Intervención eliminada");
    },
    onError: (error) => toast.error("Error al eliminar: " + error.message)
  });

  const handleCheckSystemStatus = async () => {
    setIsCheckingSystem(true);
    setSystemStatus(null);
    try {
      const status = await checkDjSystem();
      setSystemStatus(status);
    } catch (error) {
      toast.error('Error ejecutando diagnóstico: ' + error.message);
    } finally {
      setIsCheckingSystem(false);
    }
  };

  useEffect(() => {
    if (djConfig) {
        handleCheckSystemStatus();
    }
  }, [djConfig?.id]);

  const handleGenerateScript = async (type) => {
    setIsGenerating(true);
    setCurrentScript('');
    try {
      const response = await generateDjScript(type);
      setCurrentScript(response.script);
      toast.success("Script generado con IA");
    } catch (error) {
      toast.error("Error al generar script: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!currentScript) return toast.error("Primero genera un script");
    setIsGeneratingAudio(true);
    setGenerationError(null);
    setPreviewAudio(null);
    setCurrentAudioData(null);
    try {
      const audioData = await generateDjAudio({ script: currentScript });
      const audioBlob = new Blob([Uint8Array.from(atob(audioData.audio_base64), c => c.charCodeAt(0))],{ type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      setPreviewAudio(audioUrl);
      setCurrentAudioData(audioData);
      toast.success(`✅ Audio generado: ${audioData.size_kb} KB (~${audioData.estimated_duration_seconds}s)`);
      queryClient.invalidateQueries({ queryKey: ['djInterventions'] });
    } catch (error) {
      setGenerationError(error.message);
      toast.error("Error al generar audio: " + error.message);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleUploadToRadioBoss = async () => {
    if (!previewAudio || !currentAudioData) return toast.error("Primero genera el audio");
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadData = await uploadDjAudio({ audio_base64: currentAudioData.audio_base64 });
      toast.success(`✅ Subido a RadioBOSS: ${uploadData.size_kb} KB`);
      queryClient.invalidateQueries({ queryKey: ['djInterventions'] });
      setPreviewAudio(null);
      setCurrentAudioData(null);
      setCurrentScript('');
    } catch (error) {
      setUploadError(error.message);
      toast.error("Error al subir a RadioBOSS: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleGetVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const voices = await getElevenLabsVoices();
      setAvailableVoices(voices);
      toast.success(`✅ ${voices.total_voices} voces encontradas`);
    } catch (error) {
      toast.error('Error al obtener voces: ' + error.message);
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const data = {
      ...formState,
      voice_settings: {
        stability: parseFloat(formState.stability) / 100,
        similarity_boost: parseFloat(formState.similarity_boost) / 100,
        style: parseFloat(formState.style) / 100,
        use_speaker_boost: formState.use_speaker_boost
      },
      ftp_config: {
        ...formState.ftp_config,
        port: parseInt(formState.ftp_port),
      },
    };
    updateConfigMutation.mutate(data);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link to={createPageUrl("Admin")}>
                <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white"><ArrowLeft className="w-4 h-4 mr-2" />Volver al Panel</Button>
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3"><Mic2 className="w-10 h-10 text-[#006cf0]" />DJ Virtual con IA</h1>
                    <p className="text-gray-400">Genera intervenciones automáticas del DJ usando OpenAI + ElevenLabs</p>
                </div>
                {djConfig && (
                    <div className={`px-4 py-2 rounded-lg ${djConfig.enabled ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-400'}`}>
                        {djConfig.enabled ? '🟢 DJ Activo' : '⚪ DJ Inactivo'}
                    </div>
                )}
            </div>
        </motion.div>

        {systemStatus && (
            <Card className="bg-white/5 border-white/10 p-6 mb-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4"><Activity className="w-6 h-6" />Estado del Sistema</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(systemStatus).map(([key, status]) => {
                        const icons = { openai: Sparkles, elevenlabs: Mic2, radioboss_ftp: Upload, dj_config: Settings };
                        const Icon = icons[key];
                        const labels = { openai: 'OpenAI (Scripts)', elevenlabs: 'ElevenLabs (Audio)', radioboss_ftp: 'RadioBOSS FTP', dj_config: 'Configuración DJ' };
                        return (
                            <Card key={key} className={`p-4 ${status.status === 'ok' ? 'bg-green-500/10 border-green-500/30' : status.status === 'error' ? 'bg-red-500/10 border-red-500/30' : status.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                                <div className="flex items-start gap-3">
                                    {Icon && <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${status.status === 'ok' ? 'text-green-400' : status.status === 'error' ? 'text-red-400' : status.status === 'warning' ? 'text-yellow-400' : 'text-gray-400'}`} />}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-white text-sm mb-1">{labels[key]}</h4>
                                        <p className="text-xs text-gray-300">{status.message}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-white/5 border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="w-6 h-6" />Configuración</h2>
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="space-y-2">
                  <Label htmlFor="dj_name" className="text-white">Nombre del DJ *</Label>
                  <Input id="dj_name" value={formState.dj_name} onChange={(e) => setFormState({...formState, dj_name: e.target.value})} className="bg-white/10 border-white/20 text-white" required />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="dj_personality" className="text-white">Personalidad del DJ</Label>
                  <Textarea id="dj_personality" value={formState.dj_personality} onChange={(e) => setFormState({...formState, dj_personality: e.target.value})} className="bg-white/10 border-white/20 text-white" rows={3} />
              </div>
              <div className="space-y-2">
                  <Label htmlFor="voice_id" className="text-white">Voice ID de ElevenLabs *</Label>
                  {availableVoices ? (
                      <select id="voice_id" value={formState.voice_id} onChange={(e) => setFormState({...formState, voice_id: e.target.value})} className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white" required>
                          {availableVoices.multilingual_voices?.length > 0 && <optgroup label="🌍 Voces Multilingües / Español">{availableVoices.multilingual_voices.map(v => <option key={v.voice_id} value={v.voice_id}>{v.name} - {v.description}</option>)}</optgroup>}
                          {availableVoices.other_voices?.length > 0 && <optgroup label="🎤 Otras Voces">{availableVoices.other_voices.map(v => <option key={v.voice_id} value={v.voice_id}>{v.name} - {v.description}</option>)}</optgroup>}
                      </select>
                  ) : (
                      <Input id="voice_id" value={formState.voice_id} onChange={(e) => setFormState({...formState, voice_id: e.target.value})} className="bg-white/10 border-white/20 text-white" required />
                  )}
                  <Button type="button" onClick={handleGetVoices} disabled={isLoadingVoices} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      {isLoadingVoices ? 'Cargando...' : (availableVoices ? 'Recargar Voces' : 'Ver Mis Voces Disponibles')}
                  </Button>
              </div>
              
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Label className="text-white font-semibold">⚙️ Configuración de Voz</Label>
                  <div className="space-y-2">
                      <div className="flex items-center justify-between"><Label htmlFor="stability" className="text-sm text-gray-300">Estabilidad</Label><span className="text-white font-semibold text-sm">{formState.stability}%</span></div>
                      <Input type="range" id="stability" min="0" max="100" value={formState.stability} onChange={(e) => setFormState({...formState, stability: Number(e.target.value)})} className="w-full" />
                  </div>
                  <div className="space-y-2">
                      <div className="flex items-center justify-between"><Label htmlFor="similarity_boost" className="text-sm text-gray-300">Similaridad</Label><span className="text-white font-semibold text-sm">{formState.similarity_boost}%</span></div>
                      <Input type="range" id="similarity_boost" min="0" max="100" value={formState.similarity_boost} onChange={(e) => setFormState({...formState, similarity_boost: Number(e.target.value)})} className="w-full" />
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                      <Switch id="use_speaker_boost" checked={formState.use_speaker_boost} onCheckedChange={(checked) => setFormState({...formState, use_speaker_boost: checked})} />
                      <Label htmlFor="use_speaker_boost" className="text-white cursor-pointer">Speaker Boost</Label>
                  </div>
              </div>

              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center justify-between"><Label className="text-white font-semibold">📤 Configuración FTP</Label><Switch id="ftp_enabled" checked={formState.ftp_enabled} onCheckedChange={(checked) => setFormState({...formState, ftp_enabled: checked})} /></div>
                  {formState.ftp_enabled && (
                      <div className="space-y-4 pt-4">
                          <div className="grid md:grid-cols-2 gap-4">
                              <Input value={formState.ftp_host} onChange={(e) => setFormState({...formState, ftp_host: e.target.value})} placeholder="Host" className="bg-white/10 border-white/20 text-white" />
                              <Input type="number" value={formState.ftp_port} onChange={(e) => setFormState({...formState, ftp_port: Number(e.target.value)})} placeholder="Puerto" className="bg-white/10 border-white/20 text-white" />
                          </div>
                          <Input value={formState.ftp_username} onChange={(e) => setFormState({...formState, ftp_username: e.target.value})} placeholder="Usuario" className="bg-white/10 border-white/20 text-white" />
                          <Input value={formState.ftp_remote_folder} onChange={(e) => setFormState({...formState, ftp_remote_folder: e.target.value})} placeholder="Carpeta Remota" className="bg-white/10 border-white/20 text-white" />
                      </div>
                  )}
              </div>

              <div className="flex items-center gap-3">
                  <Switch id="enabled" checked={formState.enabled} onCheckedChange={(checked) => setFormState({...formState, enabled: checked})} />
                  <Label htmlFor="enabled" className="text-white cursor-pointer">DJ Virtual Habilitado</Label>
              </div>

              <Button type="submit" disabled={updateConfigMutation.isPending} className="w-full bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white">
                  {updateConfigMutation.isPending ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </form>
          </Card>

          <Card className="bg-white/5 border-white/10 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><Sparkles className="w-6 h-6" />Generar Intervención</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => handleGenerateScript('greeting')} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">🌅 Saludo</Button>
                  <Button onClick={() => handleGenerateScript('song_intro')} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">🎵 Intro Canción</Button>
                  <Button onClick={() => handleGenerateScript('blessing')} disabled={isGenerating} className="bg-green-600 hover:bg-green-700">🙏 Bendición</Button>
                  <Button onClick={() => handleGenerateScript('scripture')} disabled={isGenerating} className="bg-yellow-600 hover:bg-yellow-700">📖 Escritura</Button>
              </div>

              {currentScript && (
                <div className="space-y-4">
                  <Label className="text-white">Script Generado:</Label>
                  <Textarea value={currentScript} onChange={(e) => setCurrentScript(e.target.value)} className="bg-white/10 border-white/20 text-white" rows={6} />
                  <Button onClick={handleGenerateAudio} disabled={isGeneratingAudio} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    {isGeneratingAudio ? 'Generando Audio...' : 'Generar Audio con IA'}
                  </Button>
                  {generationError && <Card className="bg-red-500/10 border-red-500/30 p-4"><p className="text-red-300 font-semibold mb-1">Error:</p><p className="text-red-200 text-sm">{generationError}</p></Card>}
                </div>
              )}

              {previewAudio && (
                <div className="space-y-4">
                  <Label className="text-white">Preview:</Label>
                  <audio controls src={previewAudio} className="w-full" />
                  <Button onClick={handleUploadToRadioBoss} disabled={isUploading} className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800">
                    {isUploading ? 'Subiendo a RadioBOSS...' : 'Subir a RadioBOSS Cloud'}
                  </Button>
                  {uploadError && <Card className="bg-red-500/10 border-red-500/30 p-4"><p className="text-red-300 font-semibold mb-1">Error:</p><p className="text-red-200 text-sm">{uploadError}</p></Card>}
                </div>
              )}

              {isGenerating && <div className="text-center text-gray-400">Generando script...</div>}
            </div>
          </Card>
        </div>

        <Card className="bg-white/5 border-white/10 p-6 mt-8">
          <h2 className="text-2xl font-bold text-white mb-6">Historial de Intervenciones ({interventions.length})</h2>
          <div className="space-y-3">
            {isLoadingInterventions ? (
              [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />)
            ) : interventions.length > 0 ? (
              interventions.map((intervention) => (
                <Card key={intervention.id} className="bg-white/5 border-white/10 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-white font-semibold">{intervention.title}</h3>
                        <Badge className={`${intervention.status === 'uploaded' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>{intervention.status}</Badge>
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-2">{intervention.script}</p>
                    </div>
                    <div className="flex gap-2">
                      {intervention.audio_url && <Button size="sm" variant="ghost" onClick={() => window.open(intervention.audio_url, '_blank')} className="text-blue-400 hover:text-blue-300"><Play className="w-4 h-4" /></Button>}
                      <Button size="sm" variant="ghost" onClick={() => deleteInterventionMutation.mutate(intervention.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400"><Mic2 className="w-16 h-16 mx-auto mb-4 opacity-50" /><p>No hay intervenciones generadas aún</p></div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
