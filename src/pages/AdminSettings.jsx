
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  ArrowLeft,
  Save,
  Globe,
  Smartphone,
  Bell,
  Palette,
  AlertCircle,
  Key,
  ExternalLink,
  CheckCircle2,
  XCircle,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const queryClient = useQueryClient();

  // AGREGADO: Estado para verificar secrets
  const [secretsStatus, setSecretsStatus] = React.useState({});
  const [isCheckingSecrets, setIsCheckingSecrets] = React.useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => base44.entities.SystemSetting.list(),
    initialData: [],
  });

  const getSetting = (key) => {
    return settings.find(s => s.setting_key === key)?.setting_value || '';
  };

  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value, group, label }) => {
      const existing = settings.find(s => s.setting_key === key);
      if (existing) {
        return base44.entities.SystemSetting.update(existing.id, {
          setting_value: value
        });
      } else {
        return base44.entities.SystemSetting.create({
          setting_group: group,
          setting_key: key,
          setting_value: value,
          label: label || key
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
    }
  });

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'app_name',
          value: formData.get('app_name'),
          group: 'general',
          label: 'Nombre de la App'
        }),
        saveSettingMutation.mutateAsync({
          key: 'admin_email',
          value: formData.get('admin_email'),
          group: 'general',
          label: 'Email Admin'
        }),
        saveSettingMutation.mutateAsync({
          key: 'admin_phone',
          value: formData.get('admin_phone'),
          group: 'general',
          label: 'Teléfono Admin'
        }),
        saveSettingMutation.mutateAsync({
          key: 'contact_email',
          value: formData.get('contact_email'),
          group: 'general',
          label: 'Email de Contacto'
        })
      ]);
      toast.success("Configuración general guardada");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    }
  };

  const handleRegionalSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'default_country',
          value: formData.get('default_country'),
          group: 'regional',
          label: 'País'
        }),
        saveSettingMutation.mutateAsync({
          key: 'default_timezone',
          value: formData.get('default_timezone'),
          group: 'regional',
          label: 'Zona Horaria'
        }),
        saveSettingMutation.mutateAsync({
          key: 'default_language',
          value: formData.get('default_language'),
          group: 'regional',
          label: 'Idioma'
        }),
        saveSettingMutation.mutateAsync({
          key: 'default_currency',
          value: formData.get('default_currency'),
          group: 'regional',
          label: 'Moneda'
        })
      ]);
      toast.success("Configuración regional guardada");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    }
  };

  const handleNotificationsSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'notifications_enabled',
          value: formData.get('notifications_enabled') === 'on' ? 'true' : 'false',
          group: 'notifications',
          label: 'Notificaciones Habilitadas'
        }),
        saveSettingMutation.mutateAsync({
          key: 'email_notifications',
          value: formData.get('email_notifications') === 'on' ? 'true' : 'false',
          group: 'notifications',
          label: 'Notificaciones por Email'
        }),
        saveSettingMutation.mutateAsync({
          key: 'push_notifications',
          value: formData.get('push_notifications') === 'on' ? 'true' : 'false',
          group: 'notifications',
          label: 'Notificaciones Push'
        })
      ]);
      toast.success("Configuración de notificaciones guardada");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    }
  };

  const handleThemeSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'primary_color',
          value: formData.get('primary_color'),
          group: 'theme',
          label: 'Color Primario'
        }),
        saveSettingMutation.mutateAsync({
          key: 'secondary_color',
          value: formData.get('secondary_color'),
          group: 'theme',
          label: 'Color Secundario'
        }),
        saveSettingMutation.mutateAsync({
          key: 'dark_mode_enabled',
          value: formData.get('dark_mode_enabled') === 'on' ? 'true' : 'false',
          group: 'theme',
          label: 'Modo Oscuro'
        })
      ]);
      toast.success("Configuración de tema guardada");
    } catch (error) {
      toast.error("Error al guardar la configuración");
    }
  };

  // AGREGADO: Función para verificar secrets
  const checkSecretsStatus = async () => {
    setIsCheckingSecrets(true);
    try {
      // Verificar Firebase
      const firebaseResponse = await base44.functions.invoke('getFirebaseConfig');
      const hasFirebase = firebaseResponse.data && Object.keys(firebaseResponse.data).length > 0 && !firebaseResponse.data.error;

      // Verificar Google Maps
      const mapsResponse = await base44.functions.invoke('getGoogleMapsConfig');
      const hasMaps = mapsResponse.data && Object.keys(mapsResponse.data).length > 0 && !mapsResponse.data.error;

      // Verificar OpenAI
      const openaiResponse = await base44.functions.invoke('getOpenAIConfig');
      const hasOpenAI = openaiResponse.data && Object.keys(openaiResponse.data).length > 0 && !openaiResponse.data.error;

      // Verificar ElevenLabs
      const elevenlabsResponse = await base44.functions.invoke('getElevenLabsConfig');
      const hasElevenLabs = elevenlabsResponse.data && Object.keys(elevenlabsResponse.data).length > 0 && !elevenlabsResponse.data.error;

      // Verificar RadioBoss
      const radiobossResponse = await base44.functions.invoke('getRadioBossConfig');
      const hasRadioBoss = radiobossResponse.data && Object.keys(radiobossResponse.data).length > 0 && !radiobossResponse.data.error;
      
      // Verificar API_KEY (general app API key)
      const generalApiKeyResponse = await base44.functions.invoke('getGeneralApiKey');
      const hasGeneralApiKey = generalApiKeyResponse.data && Object.keys(generalApiKeyResponse.data).length > 0 && !generalApiKeyResponse.data.error;


      setSecretsStatus({
        FIREBASE_API_KEY: hasFirebase,
        FIREBASE_AUTH_DOMAIN: hasFirebase,
        FIREBASE_PROJECT_ID: hasFirebase,
        FIREBASE_STORAGE_BUCKET: hasFirebase,
        FIREBASE_MESSAGING_SENDER_ID: hasFirebase,
        FIREBASE_APP_ID: hasFirebase,
        FIREBASE_VAPID_KEY: hasFirebase,
        FIREBASE_SERVICE_ACCOUNT_JSON: hasFirebase,
        GOOGLE_MAPS_API_KEY: hasMaps,
        OPENAI_API_KEY: hasOpenAI,
        ELEVENLABS_API_KEY: hasElevenLabs,
        RADIOBOSS_FTP_PASSWORD: hasRadioBoss,
        API_KEY: hasGeneralApiKey
      });
      toast.success("Estado de secrets verificado correctamente.");
    } catch (error) {
      console.error('Error verificando secrets:', error);
      toast.error("Error al verificar el estado de los secrets.");
    } finally {
      setIsCheckingSecrets(false);
    }
  };

  // AGREGADO: Verificar secrets al cargar
  React.useEffect(() => {
    if (activeTab === 'secrets') {
      checkSecretsStatus();
    }
  }, [activeTab]);

  // AGREGADO: Definición de secrets requeridos
  const requiredSecrets = [
    {
      name: 'ELEVENLABS_API_KEY',
      description: 'API Key de ElevenLabs para text-to-speech del DJ Virtual',
      howToGet: 'https://elevenlabs.io/app/settings/api-keys',
      category: 'DJ Virtual',
      required: true
    },
    {
      name: 'OPENAI_API_KEY',
      description: 'API Key de OpenAI para generación de scripts del DJ',
      howToGet: 'https://platform.openai.com/api-keys',
      category: 'DJ Virtual',
      required: true
    },
    {
      name: 'RADIOBOSS_FTP_PASSWORD',
      description: 'Contraseña FTP para subir audios a RadioBoss Cloud',
      howToGet: 'https://radioboss.fm/cloud',
      category: 'DJ Virtual',
      required: true
    },
    {
      name: 'FIREBASE_API_KEY',
      description: 'API Key de Firebase para notificaciones push',
      howToGet: 'https://console.firebase.google.com',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'FIREBASE_AUTH_DOMAIN',
      description: 'Auth Domain de Firebase',
      howToGet: 'https://console.firebase.google.com',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'FIREBASE_PROJECT_ID',
      description: 'Project ID de Firebase',
      howToGet: 'https://console.firebase.google.com',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'FIREBASE_STORAGE_BUCKET',
      description: 'Storage Bucket de Firebase',
      howToGet: 'https://console.firebase.google.com',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'FIREBASE_MESSAGING_SENDER_ID',
      description: 'Messaging Sender ID de Firebase',
      howToGet: 'https://console.firebase.google.com',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'FIREBASE_APP_ID',
      description: 'App ID de Firebase',
      howToGet: 'https://console.firebase.google.com',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'FIREBASE_VAPID_KEY',
      description: 'VAPID Key de Firebase para Web Push',
      howToGet: 'https://console.firebase.google.com',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'FIREBASE_SERVICE_ACCOUNT_JSON',
      description: 'Service Account JSON de Firebase (completo)',
      howToGet: 'https://console.firebase.google.com/project/_/settings/serviceaccounts/adminsdk',
      category: 'Notificaciones',
      required: true
    },
    {
      name: 'GOOGLE_MAPS_API_KEY',
      description: 'API Key de Google Maps para geolocalización',
      howToGet: 'https://console.cloud.google.com/google/maps-apis',
      category: 'Localización',
      required: false
    },
    {
      name: 'API_KEY',
      description: 'API Key general de la aplicación (para acceso a funciones)',
      howToGet: null,
      category: 'General',
      required: false
    }
  ];

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
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Settings className="w-10 h-10 text-[#006cf0]" />
                Configuración del Sistema
              </h1>
              <p className="text-gray-400">
                Ajustes generales de SELAIAH RADIO
              </p>
            </div>
          </div>
        </motion.div>

        <Card className="bg-white/5 border-white/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-white/10">
              <TabsList className="bg-transparent p-0 h-auto border-0 w-full justify-start">
                <TabsTrigger 
                  value="general" 
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger 
                  value="regional"
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Regional
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Notificaciones
                </TabsTrigger>
                <TabsTrigger 
                  value="theme"
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Palette className="w-4 h-4 mr-2" />
                  Tema
                </TabsTrigger>
                <TabsTrigger 
                  value="secrets"
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Secrets & API Keys
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 md:p-8">
              {/* General Settings */}
              <TabsContent value="general" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuración General</h2>
                  <p className="text-gray-400 mb-6">Información básica de tu aplicación</p>
                </div>

                <form onSubmit={handleGeneralSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="app_name" className="text-white">Nombre de la App</Label>
                      <Input
                        id="app_name"
                        name="app_name"
                        defaultValue={getSetting('app_name') || 'SELAIAH RADIO'}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_email" className="text-white">Email del Administrador</Label>
                      <Input
                        id="admin_email"
                        name="admin_email"
                        type="email"
                        defaultValue={getSetting('admin_email')}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="admin_phone" className="text-white">Teléfono del Administrador</Label>
                      <Input
                        id="admin_phone"
                        name="admin_phone"
                        defaultValue={getSetting('admin_phone')}
                        placeholder="+1 (555) 123-4567"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_email" className="text-white">Email de Contacto Público</Label>
                      <Input
                        id="contact_email"
                        name="contact_email"
                        type="email"
                        defaultValue={getSetting('contact_email') || 'info@selaiahradio.com'}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveSettingMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </form>
              </TabsContent>

              {/* Regional Settings */}
              <TabsContent value="regional" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuración Regional</h2>
                  <p className="text-gray-400 mb-6">Idioma, moneda y zona horaria</p>
                </div>

                <form onSubmit={handleRegionalSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default_country" className="text-white">País Predeterminado</Label>
                      <select
                        id="default_country"
                        name="default_country"
                        defaultValue={getSetting('default_country') || 'US'}
                        className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                      >
                        <option value="US">Estados Unidos</option>
                        <option value="MX">México</option>
                        <option value="CO">Colombia</option>
                        <option value="AR">Argentina</option>
                        <option value="CL">Chile</option>
                        <option value="PE">Perú</option>
                        <option value="ES">España</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default_language" className="text-white">Idioma</Label>
                      <select
                        id="default_language"
                        name="default_language"
                        defaultValue={getSetting('default_language') || 'es'}
                        className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                      >
                        <option value="es">Español</option>
                        <option value="en">English</option>
                        <option value="pt">Português</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="default_timezone" className="text-white">Zona Horaria</Label>
                      <select
                        id="default_timezone"
                        name="default_timezone"
                        defaultValue={getSetting('default_timezone') || 'America/New_York'}
                        className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                      >
                        <option value="America/New_York">Este (ET) - New York</option>
                        <option value="America/Chicago">Central (CT) - Chicago</option>
                        <option value="America/Denver">Montaña (MT) - Denver</option>
                        <option value="America/Los_Angeles">Pacífico (PT) - Los Angeles</option>
                        <option value="America/Mexico_City">Ciudad de México</option>
                        <option value="America/Bogota">Bogotá</option>
                        <option value="America/Lima">Lima</option>
                        <option value="America/Santiago">Santiago</option>
                        <option value="America/Buenos_Aires">Buenos Aires</option>
                        <option value="Europe/Madrid">Madrid</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="default_currency" className="text-white">Moneda</Label>
                      <select
                        id="default_currency"
                        name="default_currency"
                        defaultValue={getSetting('default_currency') || 'USD'}
                        className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                      >
                        <option value="USD">USD - Dólar Estadounidense</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="MXN">MXN - Peso Mexicano</option>
                        <option value="COP">COP - Peso Colombiano</option>
                        <option value="ARS">ARS - Peso Argentino</option>
                        <option value="CLP">CLP - Peso Chileno</option>
                        <option value="PEN">PEN - Sol Peruano</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveSettingMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </form>
              </TabsContent>

              {/* Notifications Settings */}
              <TabsContent value="notifications" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuración de Notificaciones</h2>
                  <p className="text-gray-400 mb-6">Gestiona cómo y cuándo se envían las notificaciones</p>
                </div>

                <form onSubmit={handleNotificationsSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">Habilitar Notificaciones</h3>
                          <p className="text-sm text-gray-400">Activar sistema de notificaciones</p>
                        </div>
                        <Switch
                          name="notifications_enabled"
                          defaultChecked={getSetting('notifications_enabled') === 'true'}
                        />
                      </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">Notificaciones por Email</h3>
                          <p className="text-sm text-gray-400">Enviar notificaciones vía email</p>
                        </div>
                        <Switch
                          name="email_notifications"
                          defaultChecked={getSetting('email_notifications') === 'true'}
                        />
                      </div>
                    </Card>

                    <Card className="bg-white/5 border-white/10 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">Notificaciones Push</h3>
                          <p className="text-sm text-gray-400">Notificaciones push vía Firebase</p>
                        </div>
                        <Switch
                          name="push_notifications"
                          defaultChecked={getSetting('push_notifications') === 'true'}
                        />
                      </div>
                    </Card>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveSettingMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </form>
              </TabsContent>

              {/* Theme Settings */}
              <TabsContent value="theme" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuración de Tema</h2>
                  <p className="text-gray-400 mb-6">Colores y apariencia de la aplicación</p>
                </div>

                <form onSubmit={handleThemeSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color" className="text-white">Color Primario</Label>
                      <div className="flex gap-3">
                        <Input
                          type="color"
                          defaultValue={getSetting('primary_color') || '#006cf0'}
                          className="w-20 h-10 p-1 bg-white/10 border-white/20"
                        />
                        <Input
                          id="primary_color"
                          name="primary_color"
                          defaultValue={getSetting('primary_color') || '#006cf0'}
                          className="flex-1 bg-white/10 border-white/20 text-white"
                          placeholder="#006cf0"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="secondary_color" className="text-white">Color Secundario</Label>
                      <div className="flex gap-3">
                        <Input
                          type="color"
                          defaultValue={getSetting('secondary_color') || '#00479e'}
                          className="w-20 h-10 p-1 bg-white/10 border-white/20"
                        />
                        <Input
                          id="secondary_color"
                          name="secondary_color"
                          defaultValue={getSetting('secondary_color') || '#00479e'}
                          className="flex-1 bg-white/10 border-white/20 text-white"
                          placeholder="#00479e"
                        />
                      </div>
                    </div>
                  </div>

                  <Card className="bg-white/5 border-white/10 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">Habilitar Modo Oscuro</h3>
                        <p className="text-sm text-gray-400">Permitir a los usuarios usar modo oscuro</p>
                      </div>
                      <Switch
                        name="dark_mode_enabled"
                        defaultChecked={getSetting('dark_mode_enabled') === 'true'}
                      />
                    </div>
                  </Card>

                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-gray-400 mb-3">Vista Previa:</p>
                    <div className="flex gap-4 items-center">
                      <Button
                        type="button"
                        style={{
                          background: `linear-gradient(to right, ${getSetting('primary_color') || '#006cf0'}, ${getSetting('secondary_color') || '#00479e'})`
                        }}
                        className="text-white"
                      >
                        Botón de Ejemplo
                      </Button>
                      <div 
                        className="h-3 w-32 rounded-full"
                        style={{ backgroundColor: getSetting('primary_color') || '#006cf0' }}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveSettingMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </form>
              </TabsContent>

              {/* NUEVO TAB: Secrets */}
              <TabsContent value="secrets" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Gestión de Secrets & API Keys</h2>
                  <p className="text-gray-400 mb-6">
                    Configura las API keys y secrets necesarios para las integraciones del sistema
                  </p>
                </div>

                {/* Información importante */}
                <Card className="bg-blue-500/10 border-blue-500/30 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-300 mb-2">ℹ️ Cómo Configurar Secrets</h4>
                      <p className="text-sm text-blue-200 mb-3">
                        Los secrets se configuran de forma segura a través del panel de administración de la plataforma. No se pueden editar directamente desde esta interfaz por motivos de seguridad.
                      </p>
                      <div className="space-y-2 text-sm text-blue-200">
                        <p><strong>Para configurar un secret:</strong></p>
                        <ol className="list-decimal ml-5 space-y-1">
                          <li>Haz clic en el botón "Configurar Secret" del secret que necesites</li>
                          <li>Serás redirigido al panel de administración de la plataforma</li>
                          <li>Ve a Settings → Environment Variables</li>
                          <li>Agrega o edita el secret con el valor correcto</li>
                          <li>Guarda los cambios</li>
                          <li>Vuelve aquí y haz clic en "Verificar Estado" para confirmar</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Botón de verificación */}
                <div className="flex justify-end">
                  <Button
                    onClick={checkSecretsStatus}
                    disabled={isCheckingSecrets}
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    {isCheckingSecrets ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Verificar Estado
                      </>
                    )}
                  </Button>
                </div>

                {/* Lista de secrets por categoría */}
                {['DJ Virtual', 'Notificaciones', 'Localización', 'General'].map(category => {
                  const categorySecrets = requiredSecrets.filter(s => s.category === category);
                  if (categorySecrets.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {category === 'DJ Virtual' && '🎙️'}
                        {category === 'Notificaciones' && '🔔'}
                        {category === 'Localización' && '📍'}
                        {category === 'General' && '⚙️'}
                        {category}
                      </h3>

                      <div className="space-y-3">
                        {categorySecrets.map(secret => {
                          const status = secretsStatus[secret.name];
                          const isConfigured = status === true;
                          const isNotConfigured = status === false;
                          // isUnknown is implicit if status is undefined, null, or any other value not explicitly true/false

                          return (
                            <Card 
                              key={secret.name}
                              className={`p-4 ${
                                isConfigured ? 'bg-green-500/10 border-green-500/30' :
                                isNotConfigured ? 'bg-red-500/10 border-red-500/30' :
                                'bg-white/5 border-white/10'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <code className="text-sm font-mono text-white bg-black/30 px-2 py-1 rounded">
                                      {secret.name}
                                    </code>
                                    {secret.required && (
                                      <Badge className="bg-orange-500/20 text-orange-300 text-xs">
                                        Requerido
                                      </Badge>
                                    )}
                                    {isConfigured && (
                                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    )}
                                    {isNotConfigured && (
                                      <XCircle className="w-4 h-4 text-red-400" />
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-400 mb-2">
                                    {secret.description}
                                  </p>
                                  {secret.howToGet && (
                                    <a
                                      href={secret.howToGet}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                    >
                                      Obtener API Key
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <Button
                                  onClick={() => window.open('https://base44.com/dashboard/settings/environment-variables', '_blank')}
                                  size="sm"
                                  className="bg-[#006cf0] hover:bg-[#00479e] flex-shrink-0"
                                >
                                  Configurar Secret
                                </Button>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Guía rápida */}
                <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 p-6">
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    📚 Guía Rápida de Configuración
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div>
                      <strong className="text-white">Para el DJ Virtual:</strong>
                      <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>ELEVENLABS_API_KEY - desde elevenlabs.io</li>
                        <li>OPENAI_API_KEY - desde platform.openai.com</li>
                        <li>RADIOBOSS_FTP_PASSWORD - tu contraseña FTP</li>
                      </ul>
                    </div>
                    <div>
                      <strong className="text-white">Para Notificaciones Push:</strong>
                      <ul className="list-disc ml-5 mt-2 space-y-1">
                        <li>8 secrets de Firebase desde console.firebase.google.com</li>
                        <li>Activa Cloud Messaging en Firebase</li>
                        <li>Descarga el Service Account JSON</li>
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-200">
                      💡 <strong>Tip:</strong> Después de configurar cada secret, vuelve aquí y verifica que esté funcionando correctamente con el botón "Verificar Estado".
                    </p>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
