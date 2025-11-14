import React from "react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-gray-400">Última actualización: Enero 2025</p>
        </motion.div>

        <Card className="bg-white/5 border-white/10 p-8">
          <div className="prose prose-invert max-w-none">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Aceptación de los Términos</h2>
                <p>
                  Al acceder y utilizar SELAIAH RADIO, aceptas estar sujeto a estos términos y condiciones. 
                  Si no estás de acuerdo con alguna parte de estos términos, no debes usar nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Uso del Servicio</h2>
                <p>
                  SELAIAH RADIO proporciona servicios de transmisión de audio en línea. El servicio está disponible 
                  para tu uso personal y no comercial. No puedes:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-2">
                  <li>Redistribuir o revender el contenido de nuestra transmisión</li>
                  <li>Usar el servicio para actividades ilegales</li>
                  <li>Intentar interrumpir o dañar el servicio</li>
                  <li>Usar bots o sistemas automatizados sin autorización</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. Propiedad Intelectual</h2>
                <p>
                  Todo el contenido transmitido por SELAIAH RADIO, incluyendo música, logotipos, y marca, 
                  está protegido por derechos de autor y otras leyes de propiedad intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Registro de Usuario</h2>
                <p>
                  Al crear una cuenta, te comprometes a proporcionar información precisa y mantener 
                  la seguridad de tu cuenta. Eres responsable de todas las actividades que ocurran bajo tu cuenta.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Limitación de Responsabilidad</h2>
                <p>
                  SELAIAH RADIO no será responsable por daños indirectos, incidentales o consecuentes 
                  que resulten del uso o la imposibilidad de usar nuestros servicios.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Modificaciones</h2>
                <p>
                  Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                  Los cambios entrarán en vigor inmediatamente después de su publicación en el sitio web.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Contacto</h2>
                <p>
                  Si tienes preguntas sobre estos términos, por favor contáctanos en: info@selaiahradio.com
                </p>
              </section>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}