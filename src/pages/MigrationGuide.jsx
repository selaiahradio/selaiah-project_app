import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Rocket,
  Search,
  Download,
  ArrowLeft,
  Server,
  Database,
  Code,
  Cloud,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Copy,
  Package
} from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

export default function MigrationGuidePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("vercel");

  const platforms = [
    { id: "vercel", name: "Vercel + Supabase", icon: Cloud, difficulty: "Fácil", cost: "$0-45/mes", time: "2 horas" },
    { id: "railway", name: "Railway", icon: Server, difficulty: "Muy Fácil", cost: "$11-20/mes", time: "30 min" },
    { id: "vps", name: "VPS (DigitalOcean)", icon: Server, difficulty: "Difícil", cost: "$12-27/mes", time: "6-12 horas" },
    { id: "aws", name: "AWS Amplify", icon: Cloud, difficulty: "Medio", cost: "$30-50/mes", time: "4-6 horas" },
  ];

  const content = {
    vercel: `
# 🚀 Migrar a Vercel + Supabase

## ⭐ Recomendado para la mayoría de casos

**Tiempo:** 1-2 horas  
**Costo:** $0-45/mes  
**Dificultad:** ⭐⭐ Fácil

## Ventajas

- ✅ **$0 para empezar** (tier gratuito generoso)
- ✅ **Setup en 1-2 horas** (más rápido)
- ✅ **Escala automáticamente**
- ✅ **Deploy automático** desde GitHub
- ✅ **SSL gratis** incluido
- ✅ **Edge Functions** similares a Base44

## Stack Tecnológico

\`\`\`javascript
{
  "frontend": "Next.js 14 (App Router)",
  "backend": "Next.js API Routes",
  "database": "PostgreSQL (Supabase)",
  "auth": "NextAuth.js v5",
  "storage": "Supabase Storage",
  "deployment": "Vercel"
}
\`\`\`

## Paso 1: Crear Proyecto Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Selecciona región más cercana
4. Copia la \`DATABASE_URL\` del proyecto

\`\`\`
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
\`\`\`

## Paso 2: Crear Proyecto Next.js

\`\`\`bash
npx create-next-app@latest selaiah-radio
cd selaiah-radio
npm install @prisma/client prisma
npm install @tanstack/react-query
npm install next-auth
\`\`\`

## Paso 3: Configurar Prisma

\`\`\`bash
npx prisma init
\`\`\`

Copia el esquema de Prisma desde la documentación (32 entidades).

\`\`\`bash
npx prisma migrate dev --name init
\`\`\`

## Paso 4: Deploy a Vercel

\`\`\`bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Producción
vercel --prod
\`\`\`

## Paso 5: Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

\`\`\`env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=https://tu-dominio.vercel.app

# Firebase
FIREBASE_API_KEY=...
FIREBASE_PROJECT_ID=...
# ... todas las demás

# Otras APIs
GOOGLE_MAPS_API_KEY=...
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
\`\`\`

## Costos Mensuales

| Servicio | Costo |
|----------|-------|
| Vercel (Hobby) | $0 |
| Supabase (Free) | $0 |
| **Total** | **$0/mes** |

O con planes Pro:
- Vercel Pro: $20/mes
- Supabase Pro: $25/mes
- **Total: $45/mes**

## Links Útiles

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
`,
    railway: `
# 🚄 Migrar a Railway

## Más Fácil y Rápido

**Tiempo:** 30 minutos  
**Costo:** $11-20/mes  
**Dificultad:** ⭐ Muy Fácil

## Ventajas

- ✅ Setup más simple
- ✅ Base de datos incluida
- ✅ Deploy automático desde GitHub
- ✅ Un solo dashboard para todo
- ✅ No requiere configuración de DevOps

## Pasos

### 1. Crear Cuenta en Railway

1. Ve a [https://railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Crea nuevo proyecto

### 2. Agregar PostgreSQL

1. Clic en "New" → "Database" → "PostgreSQL"
2. Railway crea automáticamente la BD
3. Copia la \`DATABASE_URL\`

### 3. Deploy desde GitHub

1. "New" → "GitHub Repo"
2. Selecciona tu repositorio
3. Railway detecta Next.js automáticamente
4. Agrega variables de entorno
5. ¡Deploy automático!

### 4. Variables de Entorno

Railway te permite agregar todas las variables desde su dashboard.

## Costos

- **$5/mes** (Starter plan)
- PostgreSQL: \`$0.000231/GB-hour\`
- **Total: ~$11-20/mes**

## Links

- [Railway Docs](https://docs.railway.app)
`,
    vps: `
# 🖥️ Migrar a VPS (DigitalOcean, Vultr, etc.)

## Control Total

**Tiempo:** 6-12 horas  
**Costo:** $12-27/mes  
**Dificultad:** ⭐⭐⭐⭐ Difícil

## Requisitos

- Experiencia con Linux
- Conocimientos de Nginx
- Manejo de PM2
- Seguridad básica

## Stack

- **OS:** Ubuntu 22.04 LTS
- **Web Server:** Nginx
- **Process Manager:** PM2
- **Database:** PostgreSQL 15
- **Runtime:** Node.js 20

## Paso 1: Crear Droplet

\`\`\`bash
# SSH al servidor
ssh root@your-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Instalar PostgreSQL
apt install -y postgresql postgresql-contrib

# Instalar PM2
npm install -g pm2

# Instalar Nginx
apt install -y nginx
\`\`\`

## Paso 2: Configurar PostgreSQL

\`\`\`bash
sudo -u postgres psql

CREATE DATABASE selaiah_radio;
CREATE USER selaiah WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE selaiah_radio TO selaiah;
\\q
\`\`\`

## Paso 3: Deploy Aplicación

\`\`\`bash
# Clonar repositorio
cd /var/www
git clone https://github.com/your-repo/selaiah-radio.git
cd selaiah-radio

# Instalar dependencias
npm install

# Build
npm run build

# Configurar .env
nano .env.production

# Iniciar con PM2
pm2 start npm --name "selaiah-radio" -- start
pm2 save
pm2 startup
\`\`\`

## Paso 4: Configurar Nginx

\`\`\`nginx
# /etc/nginx/sites-available/selaiah-radio
server {
    listen 80;
    server_name selaiah-radio.com www.selaiah-radio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

\`\`\`bash
# Activar sitio
ln -s /etc/nginx/sites-available/selaiah-radio /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
\`\`\`

## Paso 5: SSL con Let's Encrypt

\`\`\`bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d selaiah-radio.com -d www.selaiah-radio.com
\`\`\`

## Costos

- Droplet 2GB RAM: **$12/mes**
- Managed DB (opcional): **$15/mes**
- Dominio: **$10/año**
- **Total: $12-27/mes**

## Mantenimiento

Necesitarás mantener:
- Actualizaciones de seguridad
- Backups de base de datos
- Monitoreo de servidor
- Certificados SSL
`,
    aws: `
# ☁️ Migrar a AWS Amplify

## Solución Enterprise

**Tiempo:** 4-6 horas  
**Costo:** $30-50/mes  
**Dificultad:** ⭐⭐⭐ Medio

## Arquitectura

\`\`\`
┌──────────────────┐
│  CloudFront CDN  │
└────────┬─────────┘
         │
┌────────▼─────────┐
│  AWS Amplify     │  (Frontend + API)
└────────┬─────────┘
         │
┌────────▼─────────┐
│  RDS PostgreSQL  │  (Database)
└──────────────────┘
┌──────────────────┐
│  S3 Bucket       │  (Storage)
└──────────────────┘
\`\`\`

## Paso 1: Crear RDS PostgreSQL

\`\`\`bash
aws rds create-db-instance \\
  --db-instance-identifier selaiah-radio-db \\
  --db-instance-class db.t3.micro \\
  --engine postgres \\
  --master-username admin \\
  --master-user-password YOUR_PASSWORD \\
  --allocated-storage 20
\`\`\`

## Paso 2: Configurar AWS Amplify

1. Conectar repositorio de GitHub
2. Configurar build settings:

\`\`\`yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
\`\`\`

## Costos

- **RDS db.t3.micro:** $15/mes
- **Amplify:** $5/mes
- **S3:** $1/mes
- **CloudFront:** $10/mes
- **Total: ~$30-50/mes**

## Links

- [AWS Amplify Docs](https://docs.amplify.aws)
`
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
          <Link to={createPageUrl("Documentation")}>
            <Button variant="ghost" className="mb-4 text-gray-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Documentación
            </Button>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
                <Rocket className="w-10 h-10 text-[#006cf0]" />
                Guía de Migración
              </h1>
              <p className="text-gray-400">
                Cómo migrar SELAIAH RADIO fuera de Base44
              </p>
            </div>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="border-white/20 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>
        </motion.div>

        {/* Warning */}
        <Card className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30 p-6 mb-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-red-300 mb-2">
                ⚠️ Advertencia Importante
              </h3>
              <p className="text-red-200 mb-4">
                Base44 NO permite exportar código ni migrar directamente. Esta guía te ayudará a **recrear la aplicación desde cero** usando tecnologías estándar.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-red-300 mb-2">❌ No Puedes:</p>
                  <ul className="space-y-1 text-red-200">
                    <li>• Exportar el código fuente</li>
                    <li>• Migrar automáticamente</li>
                    <li>• Usar herramientas de migración</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-green-300 mb-2">✅ Sí Puedes:</p>
                  <ul className="space-y-1 text-green-200">
                    <li>• Exportar datos manualmente</li>
                    <li>• Reescribir el código</li>
                    <li>• Recrear la arquitectura</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Platform Selector */}
        <Card className="bg-white/5 border-white/10 p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Selecciona tu Plataforma de Destino</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform) => {
              const Icon = platform.icon;
              return (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    selectedPlatform === platform.id
                      ? "border-[#006cf0] bg-[#006cf0]/20"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <Icon className={`w-8 h-8 mb-3 ${
                    selectedPlatform === platform.id ? "text-[#006cf0]" : "text-gray-400"
                  }`} />
                  <h4 className="font-semibold text-white mb-1">{platform.name}</h4>
                  <div className="space-y-1 text-xs">
                    <p className="text-gray-400">Dificultad: {platform.difficulty}</p>
                    <p className="text-gray-400">Costo: {platform.cost}</p>
                    <p className="text-gray-400">Tiempo: {platform.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Content */}
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
              prose-pre:bg-slate-900 prose-pre:p-4 prose-pre:rounded-lg prose-pre:relative
              prose-ul:my-4 prose-li:text-gray-300
              prose-table:border prose-table:border-white/10
              prose-th:bg-white/5 prose-th:p-3 prose-th:border prose-th:border-white/10
              prose-td:p-3 prose-td:border prose-td:border-white/10
              prose-blockquote:border-l-4 prose-blockquote:border-[#006cf0] prose-blockquote:pl-4"
          >
            {content[selectedPlatform]}
          </ReactMarkdown>
        </Card>

        {/* Cost Comparison */}
        <Card className="bg-white/5 border-white/10 p-6 mt-8">
          <h3 className="text-2xl font-bold text-white mb-6">Comparación de Costos Mensuales</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-3 text-white">Plataforma</th>
                  <th className="p-3 text-white">Hosting</th>
                  <th className="p-3 text-white">Base de Datos</th>
                  <th className="p-3 text-white">Storage</th>
                  <th className="p-3 text-white font-bold">Total/mes</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr className="border-b border-white/10">
                  <td className="p-3">Vercel + Supabase</td>
                  <td className="p-3">$0-20</td>
                  <td className="p-3">$0-25</td>
                  <td className="p-3">Incluido</td>
                  <td className="p-3 font-bold text-green-400">$0-45</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3">Railway</td>
                  <td className="p-3">$5</td>
                  <td className="p-3">$5</td>
                  <td className="p-3">$1</td>
                  <td className="p-3 font-bold text-green-400">$11-20</td>
                </tr>
                <tr className="border-b border-white/10">
                  <td className="p-3">DigitalOcean VPS</td>
                  <td className="p-3">$12</td>
                  <td className="p-3">$15*</td>
                  <td className="p-3">Incluido</td>
                  <td className="p-3 font-bold text-yellow-400">$12-27</td>
                </tr>
                <tr>
                  <td className="p-3">AWS Amplify</td>
                  <td className="p-3">$15</td>
                  <td className="p-3">$15</td>
                  <td className="p-3">$2</td>
                  <td className="p-3 font-bold text-orange-400">$30-50</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-gray-400 mt-4">* Opcional: puedes usar PostgreSQL en el mismo servidor VPS</p>
        </Card>
      </div>
    </div>
  );
}