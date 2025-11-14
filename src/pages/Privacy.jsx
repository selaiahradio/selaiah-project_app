import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Política de Privacidad
          </h1>
          <p className="text-gray-400">Última actualización: Enero 2025</p>
        </motion.div>

        <Card className="bg-white/5 border-white/10 p-8">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Información que Recopilamos</h2>
                <p>
                  En SELAIAH RADIO, recopilamos la siguiente información:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li><strong>Información de cuenta:</strong> nombre, email, contraseña</li>
                  <li><strong>Información de uso:</strong> programas escuchados, preferencias musicales</li>
                  <li><strong>Información técnica:</strong> dirección IP, tipo de navegador, dispositivo</li>
                  <li><strong>Cookies:</strong> para mejorar tu experiencia de usuario</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Cómo Usamos tu Información</h2>
                <p>
                  Utilizamos tu información para:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Proporcionar y mejorar nuestros servicios de radio</li>
                  <li>Personalizar tu experiencia de escucha</li>
                  <li>Comunicarnos contigo sobre actualizaciones y novedades</li>
                  <li>Analizar el uso del servicio para mejoras continuas</li>
                  <li>Proteger contra fraudes y usos indebidos</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Compartir Información</h2>
                <p>
                  No vendemos tu información personal a terceros. Podemos compartir información con:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Proveedores de servicios que nos ayudan a operar la plataforma</li>
                  <li>Autoridades legales cuando sea requerido por ley</li>
                  <li>Socios de análisis para mejorar el servicio (datos agregados y anónimos)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Seguridad de Datos</h2>
                <p>
                  Implementamos medidas de seguridad técnicas y organizativas apropiadas para proteger 
                  tu información personal contra acceso no autorizado, alteración o destrucción.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Tus Derechos</h2>
                <p>
                  Tienes derecho a:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Acceder a tu información personal</li>
                  <li>Corregir información inexacta</li>
                  <li>Solicitar la eliminación de tu información</li>
                  <li>Oponerte al procesamiento de tus datos</li>
                  <li>Retirar tu consentimiento en cualquier momento</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Cookies</h2>
                <p>
                  Utilizamos cookies para mejorar tu experiencia. Puedes configurar tu navegador para 
                  rechazar cookies, aunque esto puede afectar algunas funcionalidades del sitio.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Cambios a esta Política</h2>
                <p>
                  Podemos actualizar esta política de privacidad periódicamente. Te notificaremos 
                  sobre cambios significativos publicando la nueva política en esta página.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Contacto</h2>
                <p>
                  Si tienes preguntas sobre esta política de privacidad, contáctanos en: privacy@selaiahradio.com
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}