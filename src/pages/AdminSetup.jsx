import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Radio,
  Bell,
  MapPin,
  Settings,
  Palette,
  Zap,
  CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function AdminSetupPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupComplete, setSetupComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const queryClient = useQueryClient();

  const [setupData, setSetupData] = useState({
    // General
    appName: "SELAIAH RADIO",
    adminEmail: "",
    adminPhone: "",
    contactEmail: "",
    
    // Stream
    streamName: "Stream Principal HD",
    streamUrl: "",
    streamBitrate: "128kbps",
    
    // Regional
    defaultCountry: "US",
    defaultTimezone: "America/New_York",
    defaultLanguage: "es",
    
    // Theme
    primaryColor: "#006cf0",
    secondaryColor: "#00479e",
    logoUrl: "",
    
    // Notifications
    enablePushNotifications: true,
    firebaseConfigured: false
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setSetupData(prev => ({
          ...prev,
          adminEmail: user.email,
          contactEmail: user.email
        }));
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  // Verificar si hay configuraciones existentes
  const { data: existingSettings } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => base44.entities.SystemSetting.list(),
    initialData: []
  });

  const { data: existingStreams } = useQuery({
    queryKey: ['streams'],
    queryFn: () => base44.entities.StreamConfig.filter({ is_active: true }),
    initialData: []
  });

  const hasExistingSetup = existingSettings.length > 0 || existingStreams.length > 0;

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Guardar configuraciones generales
      const settings = [
        { setting_group: 'general', setting_key: 'app_name', setting_value: data.appName, label: 'Nombre de la App' },
        { setting_group: 'general', setting_key: 'admin_email', setting_value: data.adminEmail, label: 'Email Admin' },
        { setting_group: 'general', setting_key: 'admin_phone', setting_value: data.adminPhone, label: 'Teléfono Admin' },
        { setting_group: 'general', setting_key: 'contact_email', setting_value: data.contactEmail, label: 'Email de Contacto' },
        { setting_group: 'regional', setting_key: 'default_country', setting_value: data.defaultCountry, label: 'País' },
        { setting_group: 'regional', setting_key: 'default_timezone', setting_value: data.defaultTimezone, label: 'Zona Horaria' },
        { setting_group: 'regional', setting_key: 'default_language', setting_value: data.defaultLanguage, label: 'Idioma' },
        { setting_group: 'theme', setting_key: 'primary_color', setting_value: data.primaryColor, label: 'Color Primario' },
        { setting_group: 'theme', setting_key: 'secondary_color', setting_value: data.secondaryColor, label: 'Color Secundario' }
      ];

      for (const setting of settings) {
        await base44.entities.SystemSetting.create(setting);
      }

      // Crear stream si se proporcionó
      if (data.streamUrl) {
        await base44.entities.StreamConfig.create({
          name: data.streamName,
          stream_url: data.streamUrl,
          bitrate: data.streamBitrate,
          format: 'mp3',
          is_active: true,
          is_primary: true
        });
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings'] });
      queryClient.invalidateQueries({ queryKey: ['streams'] });
      toast.success("Configuración guardada exitosamente");
      setSetupComplete(true);
    },
    onError: (error) => {
      toast.error("Error al guardar: " + error.message);
    }
  });

  const steps = [
    {
      id: 'welcome',
      title: 'Bienvenido',
      icon: Zap,
      description: 'Configuración inicial de SELAIAH RADIO'
    },
    {
      id: 'general',
      title: 'Información General',
      icon: Settings,
      description: 'Datos básicos de tu radio'
    },
    {
      id: 'stream',
      title: 'Configuración de Stream',
      icon: Radio,
      description: 'URL del streaming de audio'
    },
    {
      id: 'regional',
      title: 'Configuración Regional',
      icon: MapPin,
      description: 'Idioma y zona horaria'
    },
    {
      id: 'theme',
      title: 'Apariencia',
      icon: Palette,
      description: 'Colores y branding'
    },
    {
      id: 'complete',
      title: 'Completado',
      icon: CheckCircle,
      description: 'Todo listo para comenzar'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    saveMutation.mutate(setupData);
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring" }}
            >
              <Zap className="w-24 h-24 text-[#006cf0] mx-auto mb-6" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-4">
              ¡Bienvenido a SELAIAH RADIO!
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Este asistente te ayudará a configurar tu radio cristiana en pocos minutos.
              Configuraremos lo esencial para que puedas comenzar a transmitir.
            </p>
            
            {hasExistingSetup && (
              <Card className="bg-yellow-500/10 border-yellow-500/30 p-6 max-w-2xl mx-auto mb-8">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="text-left">
                    <p className="font-semibold text-yellow-300 mb-2">
                      Ya tienes configuraciones existentes
                    </p>
                    <p className="text-sm text-yellow-200">
                      Este asistente creará nuevas configuraciones. Puedes editar las existentes desde el panel de administración.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <Card className="bg-white/5 border-white/10 p-4">
                <Settings className="w-8 h-8 text-[#006cf0] mb-2" />
                <h3 className="font-semibold text-white mb-1">Información General</h3>
                <p className="text-sm text-gray-400">Nombre y contacto</p>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <Radio className="w-8 h-8 text-purple-400 mb-2" />
                <h3 className="font-semibold text-white mb-1">Stream de Audio</h3>
                <p className="text-sm text-gray-400">URL de transmisión</p>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <MapPin className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="font-semibold text-white mb-1">Regional</h3>
                <p className="text-sm text-gray-400">Idioma y zona horaria</p>
              </Card>
              <Card className="bg-white/5 border-white/10 p-4">
                <Palette className="w-8 h-8 text-pink-400 mb-2" />
                <h3 className="font-semibold text-white mb-1">Apariencia</h3>
                <p className="text-sm text-gray-400">Colores y logo</p>
              </Card>
            </div>
          </div>
        );

      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Información General</h3>
              <p className="text-gray-400">Configura los datos básicos de tu radio cristiana</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white">Nombre de la Radio *</Label>
                <Input
                  value={setupData.appName}
                  onChange={(e) => setSetupData({ ...setupData, appName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="SELAIAH RADIO"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Email del Administrador *</Label>
                <Input
                  type="email"
                  value={setupData.adminEmail}
                  onChange={(e) => setSetupData({ ...setupData, adminEmail: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="admin@selaiahradio.com"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Teléfono del Administrador</Label>
                <Input
                  value={setupData.adminPhone}
                  onChange={(e) => setSetupData({ ...setupData, adminPhone: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Email de Contacto Público *</Label>
                <Input
                  type="email"
                  value={setupData.contactEmail}
                  onChange={(e) => setSetupData({ ...setupData, contactEmail: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="info@selaiahradio.com"
                />
              </div>
            </div>
          </div>
        );

      case 'stream':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Configuración de Stream</h3>
              <p className="text-gray-400">Configura la URL de tu transmisión de audio en vivo</p>
            </div>

            <Card className="bg-blue-500/10 border-blue-500/30 p-4">
              <div className="flex items-start gap-3">
                <Radio className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">¿No tienes un servidor de streaming?</p>
                  <p>Puedes configurarlo más tarde desde el panel de administración.</p>
                </div>
              </div>
            </Card>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Nombre del Stream</Label>
                <Input
                  value={setupData.streamName}
                  onChange={(e) => setSetupData({ ...setupData, streamName: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="Stream Principal HD"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">URL del Stream</Label>
                <Input
                  value={setupData.streamUrl}
                  onChange={(e) => setSetupData({ ...setupData, streamUrl: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="https://tu-servidor.com:8000/radio.mp3"
                />
                <p className="text-xs text-gray-500">
                  Ejemplo: https://c34.radioboss.fm/stream/888/;stream.mp3
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Calidad (Bitrate)</Label>
                <select
                  value={setupData.streamBitrate}
                  onChange={(e) => setSetupData({ ...setupData, streamBitrate: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                >
                  <option value="64kbps">64 kbps (Baja)</option>
                  <option value="128kbps">128 kbps (Media)</option>
                  <option value="192kbps">192 kbps (Alta)</option>
                  <option value="320kbps">320 kbps (Muy Alta)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'regional':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Configuración Regional</h3>
              <p className="text-gray-400">Idioma y zona horaria de tu radio</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-white">Idioma Principal</Label>
                <select
                  value={setupData.defaultLanguage}
                  onChange={(e) => setSetupData({ ...setupData, defaultLanguage: e.target.value })}
                  className="w-full h-10 px-3 rounded-md bg-white/10 border border-white/20 text-white"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">País</Label>
                <select
                  value={setupData.defaultCountry}
                  onChange={(e) => setSetupData({ ...setupData, defaultCountry: e.target.value })}
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
                <Label className="text-white">Zona Horaria</Label>
                <select
                  value={setupData.defaultTimezone}
                  onChange={(e) => setSetupData({ ...setupData, defaultTimezone: e.target.value })}
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
            </div>
          </div>
        );

      case 'theme':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Personalización de Apariencia</h3>
              <p className="text-gray-400">Colores y branding de tu radio</p>
            </div>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Color Primario</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={setupData.primaryColor}
                      onChange={(e) => setSetupData({ ...setupData, primaryColor: e.target.value })}
                      className="w-20 h-12 p-1 bg-white/10 border-white/20"
                    />
                    <Input
                      value={setupData.primaryColor}
                      onChange={(e) => setSetupData({ ...setupData, primaryColor: e.target.value })}
                      className="flex-1 bg-white/10 border-white/20 text-white"
                      placeholder="#006cf0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Color Secundario</Label>
                  <div className="flex gap-3">
                    <Input
                      type="color"
                      value={setupData.secondaryColor}
                      onChange={(e) => setSetupData({ ...setupData, secondaryColor: e.target.value })}
                      className="w-20 h-12 p-1 bg-white/10 border-white/20"
                    />
                    <Input
                      value={setupData.secondaryColor}
                      onChange={(e) => setSetupData({ ...setupData, secondaryColor: e.target.value })}
                      className="flex-1 bg-white/10 border-white/20 text-white"
                      placeholder="#00479e"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white">URL del Logo (Opcional)</Label>
                <Input
                  value={setupData.logoUrl}
                  onChange={(e) => setSetupData({ ...setupData, logoUrl: e.target.value })}
                  className="bg-white/10 border-white/20 text-white"
                  placeholder="https://tu-dominio.com/logo.png"
                />
                <p className="text-xs text-gray-500">
                  Puedes subir tu logo más tarde desde el panel de administración
                </p>
              </div>

              {/* Preview */}
              <Card className="bg-white/5 border-white/10 p-6">
                <p className="text-sm text-gray-400 mb-4">Vista Previa:</p>
                <div className="space-y-3">
                  <Button
                    style={{
                      background: `linear-gradient(to right, ${setupData.primaryColor}, ${setupData.secondaryColor})`
                    }}
                    className="text-white"
                  >
                    Botón de Ejemplo
                  </Button>
                  <div 
                    className="h-2 rounded-full"
                    style={{ backgroundColor: setupData.primaryColor }}
                  />
                </div>
              </Card>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            {setupComplete ? (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <CheckCircle className="w-24 h-24 text-green-400 mx-auto mb-6" />
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-4">
                  ¡Configuración Completada!
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Tu radio cristiana SELAIAH está lista para comenzar a transmitir.
                  Puedes personalizar más desde el panel de administración.
                </p>
                
                <div className="flex gap-4 justify-center">
                  <Link to={createPageUrl("Admin")}>
                    <Button className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white">
                      Ir al Panel Admin
                    </Button>
                  </Link>
                  <Link to={createPageUrl("Home")}>
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      Ver Radio
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-24 h-24 text-[#006cf0] mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-white mb-4">
                  ¿Todo Listo?
                </h2>
                <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                  Revisemos tu configuración antes de finalizar.
                </p>

                <Card className="bg-white/5 border-white/10 p-6 max-w-2xl mx-auto text-left space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-gray-400">Nombre:</span>
                    <span className="text-white font-semibold">{setupData.appName}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-gray-400">Email Admin:</span>
                    <span className="text-white">{setupData.adminEmail}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-gray-400">Stream:</span>
                    <span className="text-white">{setupData.streamUrl || 'No configurado'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-gray-400">Idioma:</span>
                    <span className="text-white">{setupData.defaultLanguage === 'es' ? 'Español' : 'English'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Color Primario:</span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded"
                        style={{ backgroundColor: setupData.primaryColor }}
                      />
                      <span className="text-white">{setupData.primaryColor}</span>
                    </div>
                  </div>
                </Card>

                <Button
                  onClick={handleFinish}
                  disabled={saveMutation.isPending}
                  className="mt-8 bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white px-8 py-6 text-lg"
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5 mr-2" />
                      Finalizar Configuración
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Link to={createPageUrl("Admin")}>
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Panel
            </Button>
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep || setupComplete;

              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all mb-2 ${
                        isCompleted
                          ? "bg-green-500"
                          : isActive
                          ? "bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                          : "bg-white/10"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-white" />
                      ) : (
                        <Icon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <p className={`text-xs text-center max-w-[80px] ${isActive ? "text-white font-semibold" : "text-gray-500"}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded ${isCompleted ? "bg-green-500" : "bg-white/10"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <Card className="bg-white/5 border-white/10 p-8 mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </Card>

        {/* Navigation */}
        {!setupComplete && (
          <div className="flex justify-between">
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>
            
            {currentStep < steps.length - 1 && (
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white"
              >
                Siguiente
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}