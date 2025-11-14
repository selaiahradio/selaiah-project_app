import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Book,
  Search,
  FileText,
  Download,
  ExternalLink,
  ArrowLeft,
  Code,
  Database,
  Zap,
  Globe,
  Shield,
  Settings,
  Users,
  Radio,
  Bell
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function DocumentationPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("intro");

  const sections = [
    { id: "intro", title: "Introducción", icon: Book },
    { id: "architecture", title: "Arquitectura", icon: Code },
    { id: "entities", title: "Entidades (32)", icon: Database },
    { id: "functions", title: "Funciones Backend", icon: Zap },
    { id: "integrations", title: "Integraciones", icon: Globe },
    { id: "auth", title: "Autenticación", icon: Shield },
    { id: "admin", title: "Panel Admin", icon: Settings },
    { id: "users", title: "Gestión Usuarios", icon: Users },
    { id: "streaming", title: "Streaming", icon: Radio },
    { id: "notifications", title: "Notificaciones", icon: Bell }
  ];

  const content = {
    intro: `
# 📻 SELAIAH RADIO - Documentación Completa

**Radio Cristiana Pentecostal 24/7 - Música, Alabanza y Adoración**

## 🎯 Descripción General

SELAIAH RADIO es una plataforma de radio cristiana pentecostal construida 100% en Base44, ofreciendo:

- 📡 **Streaming 24/7** de música cristiana
- 🎵 **Now Playing** en tiempo real con RadioBoss Cloud
- 🔔 **Notificaciones Push** con Firebase Cloud Messaging
- 📍 **Noticias Locales** basadas en geolocalización
- 📖 **Biblia Digital** con versículos pentecostales
- 🛍️ **Tienda Online** con merchandise cristiano
- 💬 **Red Social** para la comunidad
- 🤖 **DJ Virtual con IA** usando ElevenLabs + OpenAI

## ⚠️ IMPORTANTE: Base44 es una Plataforma Cerrada

- ❌ NO puedes exportar el código
- ❌ NO puedes hostear en AWS, Google Cloud, VPS
- ❌ NO puedes crear apps nativas (Android/iOS)
- ✅ SOLO funciona en Base44: \`https://selaiah-radio.base44.app\`

## 📊 Estadísticas del Proyecto

- **32 Entidades** de datos
- **8 Funciones Backend** (Deno)
- **40+ Páginas** React
- **6 Integraciones** externas
- **4 Roles** de usuario
- **PWA** habilitada
`,
    architecture: `
# 🏗️ Arquitectura del Sistema

## Stack Tecnológico

### Frontend
\`\`\`javascript
{
  "framework": "React 18",
  "styling": "Tailwind CSS + shadcn/ui",
  "state": "React Query + Context API",
  "routing": "React Router DOM",
  "animations": "Framer Motion",
  "icons": "Lucide React",
  "charts": "Recharts"
}
\`\`\`

### Backend
\`\`\`javascript
{
  "runtime": "Deno Deploy",
  "functions": "Serverless Functions",
  "sdk": "Base44 SDK @0.7.1",
  "database": "Base44 Database (NoSQL)"
}
\`\`\`

## Flujo de Datos

\`\`\`
Usuario → React UI → Base44 SDK → Backend Functions → External APIs
                      ↓
                 Base44 Database
\`\`\`

## Estructura de Carpetas

\`\`\`
selaiah-radio/
├── entities/         (32 JSON schemas)
├── pages/           (40+ páginas React)
├── components/      (Audio, Notifications, Location)
├── functions/       (8 backend functions)
└── layout.js        (Layout principal)
\`\`\`
`,
    entities: `
# 🗄️ Entidades del Sistema (32 total)

## Streaming & Audio (3)
- \`StreamConfig\` - Configuración de streams
- \`NowPlaying\` - Canción actual
- \`Chart\` - Rankings musicales

## Contenido de Radio (4)
- \`RadioShow\` - Programas
- \`RadioJockey\` - DJs
- \`Event\` - Eventos
- \`BlogPost\` - Blog

## Notificaciones (2)
- \`PushNotification\` - Notificaciones
- \`PushSubscription\` - Suscripciones

## Geolocalización (2)
- \`UserLocation\` - Ubicaciones
- \`LocalNews\` - Noticias locales

## Biblia (2)
- \`BibleVerse\` - Versículos
- \`BibleBook\` - Libros

## Comercio (3)
- \`Product\` - Productos
- \`Order\` - Órdenes
- \`Donation\` - Donaciones

## Red Social (3)
- \`SocialPost\` - Publicaciones
- \`SocialComment\` - Comentarios
- \`SocialLike\` - Reacciones

## DJ Virtual IA (2)
- \`DJIntervention\` - Intervenciones
- \`DJConfig\` - Configuración

## Sistema (6)
- \`User\` - Usuarios
- \`Contact\` - Mensajes
- \`Category\` - Categorías
- \`SitePage\` - Páginas
- \`SiteSettings\` - Configuración
- \`Integration\` - Integraciones

## Verificación (1)
- \`VerificationExercise\` - Ejercicios

## Ejemplo: StreamConfig

\`\`\`json
{
  "name": "Stream Principal HD",
  "stream_url": "https://c34.radioboss.fm/stream/888/;stream.mp3",
  "format": "mp3",
  "bitrate": "128kbps",
  "is_active": true,
  "is_primary": true
}
\`\`\`
`,
    functions: `
# ⚡ Funciones Backend (8 total)

## 1. getNowPlaying
Obtiene información de la canción actual en tiempo real.

\`\`\`javascript
// Entrada: ninguna
// Salida: { song_title, artist, cover_art_url, listeners }
\`\`\`

## 2. sendPushNotification
Envía notificaciones push masivas usando Firebase.

\`\`\`javascript
// Entrada: { notificationId, immediate }
// Salida: { success: true, sent: 150, failed: 2 }
\`\`\`

## 3. generateDJScript
Genera scripts para DJ Virtual con OpenAI GPT-4.

\`\`\`javascript
// Entrada: { type, context }
// Salida: { script: "¡Buenos días hermanos!..." }
\`\`\`

## 4. generateDJAudio
Convierte script a audio con ElevenLabs.

\`\`\`javascript
// Entrada: { script, voice_id, voice_settings }
// Salida: { audio_url: "https://..." }
\`\`\`

## 5. uploadDJAudioToRadioBoss
Sube audio a RadioBoss Cloud vía FTP.

\`\`\`javascript
// Entrada: { audio_base64, filename }
// Salida: { remote_path, public_url }
\`\`\`

## 6. getFirebaseConfig
Retorna configuración pública de Firebase.

## 7. getGoogleMapsConfig
Retorna API key de Google Maps.

## 8. updateUserRole
Actualiza rol de usuarios (solo superadmin).
`,
    integrations: `
# 🔌 Integraciones Externas (6 total)

## 1. RadioBoss Cloud
**Proveedor:** https://radioboss.fm  
**Propósito:** Streaming + metadatos en tiempo real

**Secrets:**
- \`RADIOBOSS_FTP_PASSWORD\`

## 2. Firebase Cloud Messaging
**Proveedor:** https://firebase.google.com  
**Propósito:** Notificaciones push

**Secrets (8):**
- \`FIREBASE_API_KEY\`
- \`FIREBASE_AUTH_DOMAIN\`
- \`FIREBASE_PROJECT_ID\`
- \`FIREBASE_STORAGE_BUCKET\`
- \`FIREBASE_MESSAGING_SENDER_ID\`
- \`FIREBASE_APP_ID\`
- \`FIREBASE_VAPID_KEY\`
- \`FIREBASE_SERVICE_ACCOUNT_JSON\`

## 3. Google Maps API
**Propósito:** Geolocalización + mapas

**Secrets:**
- \`GOOGLE_MAPS_API_KEY\`

## 4. OpenAI GPT-4
**Propósito:** Generación de scripts para DJ Virtual

**Secrets:**
- \`OPENAI_API_KEY\`

## 5. ElevenLabs
**Propósito:** Text-to-Speech de alta calidad

**Secrets:**
- \`ELEVENLABS_API_KEY\`

## 6. RadioBoss FTP
**Propósito:** Upload de audios generados

**Configuración:**
- Host: \`ftp.radioboss.fm\`
- Port: 21
- User: configurado
`,
    auth: `
# 🔐 Sistema de Autenticación

## Roles Disponibles

### 1. user (Nivel 0)
- Ver contenido público
- Crear posts
- Comentar y reaccionar
- Donar y comprar

### 2. verified_user (Nivel 20)
- Todo de \`user\`
- Badge de verificado
- Crear versículos del día
- Testimonios destacados

### 3. admin (Nivel 80)
- Todo de \`verified_user\`
- Acceso al panel admin
- Gestionar contenido
- Moderar posts
- Ver analytics

### 4. superadmin (Nivel 100)
- Todo de \`admin\`
- Gestionar usuarios y roles
- Configurar integraciones
- DJ Virtual
- Configuración de streams
- Acceso total

## Autenticación con Base44

\`\`\`javascript
// Obtener usuario actual
const user = await base44.auth.me();

// Actualizar usuario
await base44.auth.updateMe({ bio: "..." });

// Logout
base44.auth.logout();

// Login redirect
base44.auth.redirectToLogin();

// Check auth
const isAuth = await base44.auth.isAuthenticated();
\`\`\`
`,
    admin: `
# ⚙️ Panel de Administración

## Acceso
URL: \`/Admin\`  
Requiere: \`admin\` o \`superadmin\`

## Secciones Principales

### Configuración
- \`/StreamSettings\` - URLs de streaming
- \`/AdminIntegrations\` - Alexa, Siri, APIs
- \`/AdminDJVirtual\` - DJ Virtual IA

### Contenido
- \`/AdminShows\` - Programas radiales
- \`/AdminDJs\` - Radio Jockeys
- \`/AdminBible\` - Versículos bíblicos
- \`/AdminBlog\` - Blog y artículos
- \`/AdminCharts\` - Rankings musicales
- \`/AdminEvents\` - Eventos

### Comunicación
- \`/AdminNotifications\` - Push notifications
- \`/AdminSubscriptions\` - Suscriptores
- \`/AdminMessages\` - Mensajes

### Localización
- \`/AdminLocalNews\` - Noticias locales
- \`/AdminLocations\` - Ubicaciones

### Comercio
- \`/ShopAnalytics\` - Métricas
- \`/AdminShop\` - Productos
- \`/AdminOrders\` - Órdenes
- \`/AdminDonations\` - Donaciones

### Comunidad
- \`/AdminSocial\` - Red social
- \`/AdminUsers\` - Usuarios
- \`/AdminVerifications\` - Ejercicios
`,
    users: `
# 👥 Gestión de Usuarios

## Entidad User

La entidad User tiene campos built-in + custom:

### Built-in (automáticos)
- \`id\`
- \`email\`
- \`full_name\`
- \`created_date\`

### Custom (configurables)
- \`role\`: user | verified_user | admin | superadmin
- \`is_verified\`: boolean
- \`verification_level\`: 0-100
- \`denomination\`: pentecostal | evangelical | etc
- \`church_name\`: string
- \`bio\`: string
- \`avatar_url\`: string
- \`spiritual_gifts\`: array
- \`ministry_areas\`: array
- \`permissions\`: object

## Limitaciones

⚠️ **El creador de la app NO puede cambiar su propio rol**

Esto es una protección de Base44. Solución:
1. Contactar soporte de Base44
2. Solicitar asignación manual de superadmin

## Gestión desde Admin

\`/AdminUsers\` permite:
- Ver todos los usuarios
- Cambiar roles (solo superadmin)
- Ver estadísticas
- Filtrar por rol
`,
    streaming: `
# 📡 Sistema de Streaming

## Configuración

### 1. Crear Stream
Ir a \`/StreamSettings\` y configurar:

\`\`\`javascript
{
  "name": "Stream Principal HD",
  "stream_url": "https://servidor.com:8000/radio.mp3",
  "format": "mp3",
  "bitrate": "128kbps",
  "server_type": "radioboss"
}
\`\`\`

### 2. Activar Stream
Solo un stream puede estar activo y ser el principal.

### 3. Now Playing
El sistema consulta automáticamente cada 10 segundos:
- RadioBoss Cloud API
- AzuraCast API (si configurado)
- Fallback a caché de BD

## Servidores Soportados
- RadioBoss Cloud ✅
- AzuraCast ✅
- Icecast ✅
- Shoutcast ✅
- Custom ✅

## AudioPlayer

Componente global en \`components/player/AudioPlayer.js\`

Funcionalidades:
- Play/Pause
- Control de volumen
- Mute/Unmute
- Display de canción actual
- Artwork dinámico
- Indicador "En Vivo"
`,
    notifications: `
# 🔔 Sistema de Notificaciones

## Firebase Cloud Messaging

### Setup
1. Crear proyecto en Firebase
2. Activar Cloud Messaging
3. Configurar 8 secrets en Base44
4. Generar VAPID key para Web Push

### Flujo
1. Usuario acepta permiso
2. Se genera token del dispositivo
3. Token se guarda en \`PushSubscription\`
4. Admin crea notificación
5. Backend envía via Firebase Admin SDK
6. Usuario recibe (incluso con app cerrada)

## Crear Notificación

Desde \`/AdminNotifications\`:

\`\`\`javascript
{
  "title": "🎵 Nuevo Show",
  "body": "Comienza en 30 minutos",
  "image_url": "https://...",
  "topic": "shows",
  "scheduled_for": "2025-11-05T06:00:00Z"
}
\`\`\`

## Tópicos
- \`all\` - Todos los usuarios
- \`news\` - Noticias
- \`events\` - Eventos
- \`shows\` - Programas
- \`music\` - Música

## Estadísticas
- Ver en \`/AdminSubscriptions\`
- Cantidad de suscriptores
- Por dispositivo (web, iOS, Android)
- Tasa de entrega
`
  };

  const Icon = sections.find(s => s.id === selectedSection)?.icon || Book;

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
                <Book className="w-10 h-10 text-[#006cf0]" />
                Documentación del Sistema
              </h1>
              <p className="text-gray-400">
                Guía completa de SELAIAH RADIO - Arquitectura, APIs y más
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={createPageUrl("MigrationGuide")}>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
                  <FileText className="w-4 h-4 mr-2" />
                  Guía de Migración
                </Button>
              </Link>
              <Button
                onClick={() => window.print()}
                variant="outline"
                className="border-white/20 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <Card className="bg-white/5 border-white/10 p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar en la documentación..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white"
            />
          </div>
        </Card>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white/5 border-white/10 p-4 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Contenido</h3>
              <div className="space-y-1">
                {sections.map((section) => {
                  const SectionIcon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setSelectedSection(section.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        selectedSection === section.id
                          ? "bg-gradient-to-r from-[#006cf0] to-[#00479e] text-white"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <SectionIcon className="w-4 h-4" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card className="bg-white/5 border-white/10 p-8">
              <ReactMarkdown
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:text-white prose-headings:font-bold
                  prose-h1:text-3xl prose-h1:mb-6 prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-4
                  prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                  prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-300 prose-p:leading-relaxed
                  prose-a:text-[#006cf0] prose-a:no-underline hover:prose-a:text-[#00479e]
                  prose-strong:text-white prose-strong:font-bold
                  prose-code:bg-white/10 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-[#006cf0]
                  prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-lg
                  prose-ul:my-4 prose-li:text-gray-300
                  prose-blockquote:border-l-4 prose-blockquote:border-[#006cf0] prose-blockquote:pl-4 prose-blockquote:italic"
              >
                {content[selectedSection]}
              </ReactMarkdown>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}