import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Heart, CreditCard, Building2, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function DonationsPage() {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const amounts = [10, 25, 50, 100, 250, 500];

  const createDonationMutation = useMutation({
    mutationFn: (data) => base44.entities.Donation.create(data),
    onSuccess: () => {
      toast.success("¡Gracias por tu generosa donación! 🙏");
    },
    onError: () => toast.error("Error procesando donación"),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const amount = selectedAmount || parseFloat(customAmount);
    if (!amount || amount <= 0) {
      toast.error("Por favor ingresa un monto válido");
      return;
    }

    const donationData = {
      donor_name: isAnonymous ? "Anónimo" : formData.get('name'),
      donor_email: formData.get('email'),
      amount,
      currency: formData.get('currency'),
      payment_method: formData.get('payment_method'),
      frequency: formData.get('frequency'),
      purpose: formData.get('purpose'),
      message: formData.get('message') || null,
      is_anonymous: isAnonymous,
      payment_status: "pending"
    };

    createDonationMutation.mutate(donationData);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            <Heart className="w-12 h-12 text-red-400 fill-red-400 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Apoya Nuestro Ministerio
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            "Cada uno dé como propuso en su corazón: no con tristeza, ni por necesidad, 
            porque Dios ama al dador alegre" - 2 Corintios 9:7
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7">
            <Card className="bg-white/5 border-white/10 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-400" />
                Haz tu Donación
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Amount Selection */}
                <div>
                  <Label className="text-white mb-3 block">Selecciona un Monto</Label>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    {amounts.map(amount => (
                      <Button
                        key={amount}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amount);
                          setCustomAmount("");
                        }}
                        className={selectedAmount === amount
                          ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                        }
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                  <Input
                    type="number"
                    placeholder="Otro monto"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount(null);
                    }}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-white">Moneda</Label>
                    <Select name="currency" defaultValue="USD">
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - Dólar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                        <SelectItem value="COP">COP - Peso Colombiano</SelectItem>
                        <SelectItem value="ARS">ARS - Peso Argentino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-white">Frecuencia</Label>
                    <Select name="frequency" defaultValue="one-time">
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="one-time">Una vez</SelectItem>
                        <SelectItem value="monthly">Mensual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-white">Propósito</Label>
                  <Select name="purpose" defaultValue="general">
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="ministry">Ministerio</SelectItem>
                      <SelectItem value="missions">Misiones</SelectItem>
                      <SelectItem value="building">Edificio</SelectItem>
                      <SelectItem value="technology">Tecnología</SelectItem>
                      <SelectItem value="community">Comunidad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    checked={isAnonymous}
                    onCheckedChange={setIsAnonymous}
                  />
                  <Label className="text-white cursor-pointer">
                    Donación anónima
                  </Label>
                </div>

                {!isAnonymous && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white">Nombre *</Label>
                      <Input
                        id="name"
                        name="name"
                        required={!isAnonymous}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                )}

                {isAnonymous && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email (para recibo) *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white">Mensaje (Opcional)</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={3}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Comparte un mensaje de bendición..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-white">Método de Pago</Label>
                  <Select name="payment_method" defaultValue="paypal">
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paypal">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          PayPal
                        </div>
                      </SelectItem>
                      <SelectItem value="stripe">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          Tarjeta de Crédito/Débito
                        </div>
                      </SelectItem>
                      <SelectItem value="bank_transfer">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Transferencia Bancaria
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  disabled={createDonationMutation.isPending}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-lg py-6"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  {createDonationMutation.isPending ? "Procesando..." : "Donar Ahora"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-blue-500/30 p-6">
              <h3 className="text-xl font-bold text-white mb-4">💝 ¿Por qué Donar?</h3>
              <ul className="space-y-3 text-gray-200">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Mantener la radio 24/7 transmitiendo el evangelio</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Apoyar ministerios y misiones cristianas</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Eventos y conciertos cristianos gratuitos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Tecnología y mejoras en la transmisión</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                  <span>Alcanzar más almas con el mensaje de Cristo</span>
                </li>
              </ul>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">📊 Impacto Reciente</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Oyentes mensuales</span>
                  <span className="text-2xl font-bold text-blue-400">50K+</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Eventos realizados</span>
                  <span className="text-2xl font-bold text-green-400">24</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Vidas transformadas</span>
                  <span className="text-2xl font-bold text-purple-400">1,200+</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-xl font-bold text-white mb-4">🔒 Seguridad</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Todas las transacciones son procesadas de forma segura a través de 
                PayPal y Stripe. Tu información financiera está protegida con 
                encriptación de nivel bancario. Recibirás un recibo por email 
                para fines de deducción de impuestos.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}