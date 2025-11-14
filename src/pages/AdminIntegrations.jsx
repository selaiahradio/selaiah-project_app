import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Mic, 
  Music, 
  Share2, 
  BarChart3, 
  CreditCard, 
  Mail, 
  Phone, 
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Copy,
  Settings,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminIntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: integrations, isLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.Integration.list(),
    initialData: [],
  });

  const { data: streamConfig } = useQuery({
    queryKey: ['streamConfig'],
    queryFn: async () => {
      const configs = await base44.entities.StreamConfig.filter({ 
        is_active: true, 
        is_primary: true 
      });
      return configs[0] || null;
    },
  });

  const createIntegrationMutation = useMutation({
    mutationFn: (data) => base44.entities.Integration.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success("Integración creada");
      setShowConfigModal(false);
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Integration.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
      toast.success("Integración actualizada");
      setShowConfigModal(false);
    },
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: ({ id, enabled }) => base44.entities.Integration.update(id, { is_enabled: enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });

  // Integraciones disponibles pre-configuradas
  const availableIntegrations = [
    {
      name: "Amazon Alexa",
      slug: "alexa",
      type: "voice_assistant",
      provider: "alexa",
      description: "Permite a los usuarios escuchar tu radio con comandos de voz en dispositivos Alexa",
      icon: "🔵",
      features: ["Comando de voz 'Alexa, abre SELAIAH RADIO'", "Control de reproducción", "Información de canción actual"],
      setup_instructions: `
## Configuración de Amazon Alexa Skill

### Paso 1: Crear Alexa Skill
1. Ve a [Alexa Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Crea un nuevo Skill:
   - **Nombre:** SELAIAH RADIO
   - **Modelo:** Custom
   - **Hosting:** Alexa-hosted (Python o Node.js)

### Paso 2: Configurar el Skill
En el **Interaction Model**, agrega estos intents:

**LaunchRequest (Intent de inicio):**
\`\`\`json
{
  "type": "LaunchRequest"
}
\`\`\`

**PlayRadioIntent:**
\`\`\`json
{
  "name": "PlayRadioIntent",
  "slots": [],
  "samples": [
    "reproduce la radio",
    "pon música",
    "comienza a reproducir",
    "escuchar radio"
  ]
}
\`\`\`

### Paso 3: Código del Backend (Lambda)
En el código de tu Alexa Skill (Python):

\`\`\`python
from ask_sdk_core.skill_builder import SkillBuilder
from ask_sdk_core.dispatch_components import AbstractRequestHandler
from ask_sdk_core.handler_input import HandlerInput
from ask_sdk_model import Response
from ask_sdk_model.interfaces.audioplayer import (
    PlayDirective, PlayBehavior, AudioItem, Stream
)

STREAM_URL = "${streamConfig?.stream_url || 'TU_STREAM_URL_AQUI'}"

class LaunchRequestHandler(AbstractRequestHandler):
    def can_handle(self, handler_input):
        return handler_input.request_envelope.request.object_type == "LaunchRequest"
    
    def handle(self, handler_input):
        speech_text = "Bienvenido a SELAIAH RADIO. Donde el cielo toca la tierra. Reproduciendo música cristiana."
        
        handler_input.response_builder.speak(speech_text)
        handler_input.response_builder.add_directive(
            PlayDirective(
                play_behavior=PlayBehavior.REPLACE_ALL,
                audio_item=AudioItem(
                    stream=Stream(
                        token="selaiah-radio-stream",
                        url=STREAM_URL,
                        offset_in_milliseconds=0
                    ),
                    metadata=None
                )
            )
        )
        
        return handler_input.response_builder.response

sb = SkillBuilder()
sb.add_request_handler(LaunchRequestHandler())
# ... agregar más handlers
\`\`\`

### Paso 4: Publicar
1. Completa la información de certificación
2. Agrega íconos (512x512 y 108x108)
3. Envía para revisión de Amazon

### URL del Stream
**Tu Stream URL:** \`${streamConfig?.stream_url || 'Configura tu stream primero'}\`
      `,
      documentation_url: "https://developer.amazon.com/docs/custom-skills/audioplayer-interface-reference.html"
    },
    {
      name: "Apple Siri / CarPlay",
      slug: "siri",
      type: "voice_assistant",
      provider: "siri",
      description: "Escucha la radio con Siri y en CarPlay de Apple",
      icon: "🍎",
      features: ["Comando 'Hey Siri, reproduce SELAIAH RADIO'", "Integración con CarPlay", "Shortcuts personalizados"],
      setup_instructions: `
## Configuración de Siri y CarPlay

### Opción 1: Siri Shortcuts (Más Fácil)

**Para los usuarios:**
1. Abre la app **Shortcuts** en iPhone
2. Crea un nuevo Shortcut:
   - Nombre: "SELAIAH RADIO"
   - Agregar acción: **"Reproducir Audio desde URL"**
   - URL: \`${streamConfig?.stream_url || 'TU_STREAM_URL'}\`
3. Agregar a Siri: "Hey Siri, SELAIAH RADIO"

**Comparte este shortcut:**
1. Crea el shortcut
2. Toca los 3 puntos → Share → Copy iCloud Link
3. Comparte el link en tu sitio web

### Opción 2: App Nativa con CarPlay (Avanzado)

Para crear una app iOS con CarPlay:

**1. Xcode Project Setup:**
\`\`\`swift
// ContentView.swift
import SwiftUI
import AVFoundation

class RadioPlayer: ObservableObject {
    private var player: AVPlayer?
    @Published var isPlaying = false
    
    let streamURL = URL(string: "${streamConfig?.stream_url || 'STREAM_URL'}")!
    
    func play() {
        player = AVPlayer(url: streamURL)
        player?.play()
        isPlaying = true
    }
    
    func stop() {
        player?.pause()
        player = nil
        isPlaying = false
    }
}

struct ContentView: View {
    @StateObject var radioPlayer = RadioPlayer()
    
    var body: some View {
        VStack {
            Text("SELAIAH RADIO")
                .font(.largeTitle)
            
            Button(radioPlayer.isPlaying ? "Detener" : "Reproducir") {
                if radioPlayer.isPlaying {
                    radioPlayer.stop()
                } else {
                    radioPlayer.play()
                }
            }
            .padding()
        }
    }
}
\`\`\`

**2. CarPlay Template:**
\`\`\`swift
// CarPlaySceneDelegate.swift
import CarPlay

class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    var interfaceController: CPInterfaceController?
    
    func templateApplicationScene(_ templateApplicationScene: CPTemplateApplicationScene,
                                   didConnect interfaceController: CPInterfaceController) {
        self.interfaceController = interfaceController
        
        let nowPlayingTemplate = CPNowPlayingTemplate.shared
        interfaceController.setRootTemplate(nowPlayingTemplate, animated: true)
    }
}
\`\`\`

**3. Info.plist - Agregar CarPlay capability:**
\`\`\`xml
<key>UIApplicationSceneManifest</key>
<dict>
    <key>CPTemplateApplicationSceneSessionRoleApplication</key>
    <string>CarPlaySceneDelegate</string>
</dict>
\`\`\`

### Opción 3: Widget de Siri (iOS 14+)

Crea un Widget que permita reproducir con un tap:

\`\`\`swift
// RadioWidget.swift
import WidgetKit
import SwiftUI

struct RadioWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: "RadioWidget", provider: Provider()) { entry in
            RadioWidgetView(entry: entry)
        }
        .configurationDisplayName("SELAIAH RADIO")
        .description("Reproduce música cristiana")
    }
}
\`\`\`

### URL del Stream
**Tu Stream URL:** \`${streamConfig?.stream_url || 'Configura tu stream primero'}\`

**Formato M3U para mejor compatibilidad:**
\`\`\`
#EXTM3U
#EXTINF:-1,SELAIAH RADIO - Donde el cielo toca la tierra
${streamConfig?.stream_url || 'TU_STREAM_URL'}
\`\`\`
      `,
      documentation_url: "https://developer.apple.com/documentation/sirikit"
    },
    {
      name: "Google Assistant",
      slug: "google_assistant",
      type: "voice_assistant",
      provider: "google_assistant",
      description: "Escucha con 'Ok Google' en dispositivos Android y Google Home",
      icon: "🔴",
      features: ["Comando 'Ok Google, reproduce SELAIAH RADIO'", "Integración con Android Auto", "Chromecast"],
      setup_instructions: `
## Configuración de Google Assistant

### Paso 1: Actions on Google Console
1. Ve a [Actions Console](https://console.actions.google.com/)
2. Crea un nuevo proyecto: "SELAIAH RADIO"

### Paso 2: Configurar Media Response
\`\`\`javascript
const {conversation} = require('@assistant/conversation');
const functions = require('firebase-functions');

const app = conversation();

app.handle('start_radio', conv => {
  conv.add('Reproduciendo SELAIAH RADIO. Música cristiana las 24 horas.');
  conv.add(new Media({
    mediaObjects: [
      {
        name: 'SELAIAH RADIO',
        description: 'Donde el cielo toca la tierra',
        url: '${streamConfig?.stream_url || 'STREAM_URL'}',
        image: {
          large: {
            url: 'URL_DE_TU_LOGO_512x512'
          }
        }
      }
    ],
    mediaType: 'AUDIO',
    optionalMediaControls: ['PAUSED', 'STOPPED']
  }));
});

exports.ActionsOnGoogleFulfillment = functions.https.onRequest(app);
\`\`\`

### URL del Stream
\`${streamConfig?.stream_url || 'Configura tu stream primero'}\`
      `,
      documentation_url: "https://developers.google.com/assistant"
    },
    {
      name: "Spotify",
      slug: "spotify",
      type: "streaming",
      provider: "spotify",
      description: "Publica tu radio en Spotify (Requiere acuerdo con Spotify)",
      icon: "🟢",
      features: ["Perfil de artista", "Playlists", "Podcasts"],
      documentation_url: "https://www.spotify.com/podcasters/"
    },
    {
      name: "TuneIn",
      slug: "tunein",
      type: "streaming",
      provider: "custom",
      description: "Agrega tu estación al directorio de TuneIn",
      icon: "📻",
      features: ["Directorio global", "Apps móviles", "Alexa y CarPlay automático"],
      setup_instructions: `
## Agregar a TuneIn

1. Ve a [TuneIn Broadcaster](https://help.tunein.com/contact/add-radio-station-S19TR9Sdf)
2. Completa el formulario:
   - **Station Name:** SELAIAH RADIO
   - **Stream URL:** ${streamConfig?.stream_url || 'TU_STREAM_URL'}
   - **Website:** Tu sitio web
   - **Genre:** Christian / Gospel
   - **Description:** Radio cristiana pentecostal 24/7
3. Espera aprobación (1-2 semanas)

**Ventaja:** Una vez en TuneIn, tu radio estará disponible automáticamente en Alexa, CarPlay, Sonos, y más dispositivos.
      `,
      documentation_url: "https://help.tunein.com/contact/add-radio-station-S19TR9Sdf"
    }
  ];

  const handleInitializeIntegration = async (template) => {
    const existing = integrations.find(i => i.slug === template.slug);
    
    if (existing) {
      setSelectedIntegration(existing);
      setShowConfigModal(true);
    } else {
      await createIntegrationMutation.mutateAsync({
        ...template,
        is_enabled: false,
        is_configured: false,
        status: "inactive",
        config: {},
        endpoints: {},
        usage_stats: {
          total_calls: 0,
          successful_calls: 0,
          failed_calls: 0
        }
      });
      toast.success(`${template.name} agregada. Configúrala ahora.`);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
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
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Sparkles className="w-10 h-10 text-[#006cf0]" />
              Integraciones
            </h1>
            <p className="text-gray-400">
              Conecta SELAIAH RADIO con plataformas y servicios externos
            </p>
          </div>
        </motion.div>

        {/* Alert si no hay stream configurado */}
        {!streamConfig && (
          <Card className="bg-yellow-500/10 border-yellow-500/30 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-400 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-300 mb-2">
                  Configura tu Stream primero
                </h3>
                <p className="text-yellow-200 mb-4">
                  Necesitas configurar tu stream URL antes de poder integrar con asistentes de voz y otras plataformas.
                </p>
                <Link to={createPageUrl("StreamSettings")}>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    Configurar Stream
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="voice" className="space-y-8">
          <TabsList className="bg-white/5 border-white/10">
            <TabsTrigger value="voice" className="data-[state=active]:bg-[#006cf0]">
              <Mic className="w-4 h-4 mr-2" />
              Asistentes de Voz
            </TabsTrigger>
            <TabsTrigger value="streaming" className="data-[state=active]:bg-[#006cf0]">
              <Music className="w-4 h-4 mr-2" />
              Plataformas Streaming
            </TabsTrigger>
            <TabsTrigger value="social" className="data-[state=active]:bg-[#006cf0]">
              <Share2 className="w-4 h-4 mr-2" />
              Redes Sociales
            </TabsTrigger>
            <TabsTrigger value="other" className="data-[state=active]:bg-[#006cf0]">
              <Settings className="w-4 h-4 mr-2" />
              Otras
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {availableIntegrations
                .filter(i => i.type === "voice_assistant")
                .map((integration) => {
                  const existing = integrations.find(i => i.slug === integration.slug);
                  
                  return (
                    <Card key={integration.slug} className="bg-white/5 border-white/10 p-6 hover:bg-white/10 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{integration.icon}</div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                            {existing && (
                              <Badge className={existing.is_enabled ? "bg-green-500/20 text-green-300" : "bg-gray-500/20 text-gray-400"}>
                                {existing.is_enabled ? "Activa" : "Inactiva"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {existing ? (
                          <Switch
                            checked={existing.is_enabled}
                            onCheckedChange={(checked) => {
                              toggleIntegrationMutation.mutate({
                                id: existing.id,
                                enabled: checked
                              });
                            }}
                          />
                        ) : null}
                      </div>

                      <p className="text-gray-400 mb-4 text-sm">{integration.description}</p>

                      <div className="space-y-2 mb-4">
                        {integration.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-gray-300">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setSelectedIntegration(existing || integration);
                            setShowConfigModal(true);
                          }}
                          className="flex-1 bg-[#006cf0] hover:bg-[#00479e]"
                        >
                          {existing ? "Ver Configuración" : "Configurar"}
                        </Button>
                        {integration.documentation_url && (
                          <Button
                            variant="outline"
                            onClick={() => window.open(integration.documentation_url, '_blank')}
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="streaming" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {availableIntegrations
                .filter(i => i.type === "streaming")
                .map((integration) => {
                  const existing = integrations.find(i => i.slug === integration.slug);
                  
                  return (
                    <Card key={integration.slug} className="bg-white/5 border-white/10 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-4xl">{integration.icon}</div>
                          <div>
                            <h3 className="text-xl font-bold text-white">{integration.name}</h3>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-400 mb-4 text-sm">{integration.description}</p>

                      <Button
                        onClick={() => {
                          setSelectedIntegration(integration);
                          setShowConfigModal(true);
                        }}
                        className="w-full bg-[#006cf0] hover:bg-[#00479e]"
                      >
                        Ver Instrucciones
                      </Button>
                    </Card>
                  );
                })}
            </div>
          </TabsContent>

          <TabsContent value="social">
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Share2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">Próximamente</p>
              <p className="text-gray-500">Integraciones con Facebook, Instagram, Twitter, y más</p>
            </Card>
          </TabsContent>

          <TabsContent value="other">
            <Card className="bg-white/5 border-white/10 p-12 text-center">
              <Settings className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-xl text-gray-400 mb-4">Integración Personalizada</p>
              <p className="text-gray-500 mb-6">¿Necesitas integrar con otra plataforma? Contáctanos.</p>
              <Link to={createPageUrl("Contact")}>
                <Button className="bg-[#006cf0] hover:bg-[#00479e]">
                  Contactar Soporte
                </Button>
              </Link>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Configuración */}
        {showConfigModal && selectedIntegration && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900 rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{selectedIntegration.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedIntegration.name}</h2>
                    <p className="text-gray-400 text-sm">{selectedIntegration.description}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </Button>
              </div>

              <div className="p-6">
                {selectedIntegration.setup_instructions ? (
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-gray-300 space-y-4"
                      dangerouslySetInnerHTML={{
                        __html: selectedIntegration.setup_instructions
                          .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-slate-800 p-4 rounded-lg overflow-x-auto"><code>$2</code></pre>')
                          .replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-2 py-1 rounded text-blue-300">$1</code>')
                          .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
                          .replace(/^### (.+)$/gm, '<h3 class="text-xl font-bold text-white mt-6 mb-3">$1</h3>')
                          .replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-white mt-8 mb-4">$1</h2>')
                          .replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>')
                          .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                          .replace(/\n\n/g, '<br/><br/>')
                      }}
                    />

                    {streamConfig && (
                      <Card className="bg-blue-500/10 border-blue-500/30 p-4 mt-6">
                        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                          <Music className="w-5 h-5" />
                          Tu Stream URL (Copia y pega)
                        </h4>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 bg-slate-800 px-4 py-2 rounded text-blue-300 text-sm break-all">
                            {streamConfig.stream_url}
                          </code>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(streamConfig.stream_url)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    )}

                    {selectedIntegration.documentation_url && (
                      <div className="mt-6">
                        <Button
                          onClick={() => window.open(selectedIntegration.documentation_url, '_blank')}
                          variant="outline"
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Ver Documentación Oficial
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-400">
                      Instrucciones de configuración próximamente
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
                  <Button
                    onClick={() => {
                      if (!selectedIntegration.id) {
                        handleInitializeIntegration(selectedIntegration);
                      }
                      setShowConfigModal(false);
                    }}
                    className="flex-1 bg-[#006cf0] hover:bg-[#00479e]"
                  >
                    {selectedIntegration.id ? "Cerrar" : "Guardar Integración"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}