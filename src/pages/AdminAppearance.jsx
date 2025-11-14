import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Palette,
  ArrowLeft,
  Save,
  Eye,
  Layout,
  FileImage,
  Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function AdminAppearancePage() {
  const [activeTab, setActiveTab] = useState("header");
  const queryClient = useQueryClient();

  const { data: settings = [] } = useQuery({
    queryKey: ['appearanceSettings'],
    queryFn: () => base44.entities.SystemSetting.filter({ setting_group: 'appearance' }),
    initialData: [],
  });

  const getSetting = (key) => {
    return settings.find(s => s.setting_key === key)?.setting_value || '';
  };

  const saveSettingMutation = useMutation({
    mutationFn: async ({ key, value, label }) => {
      const existing = settings.find(s => s.setting_key === key);
      if (existing) {
        return base44.entities.SystemSetting.update(existing.id, {
          setting_value: value
        });
      } else {
        return base44.entities.SystemSetting.create({
          setting_group: 'appearance',
          setting_key: key,
          setting_value: value,
          label: label || key
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appearanceSettings'] });
    }
  });

  const handleHeaderSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'logo_url',
          value: formData.get('logo_url'),
          label: 'URL del Logo'
        }),
        saveSettingMutation.mutateAsync({
          key: 'logo_dark_url',
          value: formData.get('logo_dark_url'),
          label: 'URL del Logo (Modo Oscuro)'
        }),
        saveSettingMutation.mutateAsync({
          key: 'site_title',
          value: formData.get('site_title'),
          label: 'Título del Sitio'
        }),
        saveSettingMutation.mutateAsync({
          key: 'site_tagline',
          value: formData.get('site_tagline'),
          label: 'Eslogan'
        }),
        saveSettingMutation.mutateAsync({
          key: 'header_bg_color',
          value: formData.get('header_bg_color'),
          label: 'Color de Fondo del Header'
        })
      ]);
      toast.success("Header actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar el header");
    }
  };

  const handleFooterSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'footer_copyright',
          value: formData.get('footer_copyright'),
          label: 'Texto de Copyright'
        }),
        saveSettingMutation.mutateAsync({
          key: 'contact_email',
          value: formData.get('contact_email'),
          label: 'Email de Contacto'
        }),
        saveSettingMutation.mutateAsync({
          key: 'contact_phone',
          value: formData.get('contact_phone'),
          label: 'Teléfono de Contacto'
        }),
        saveSettingMutation.mutateAsync({
          key: 'contact_address',
          value: formData.get('contact_address'),
          label: 'Dirección'
        })
      ]);
      toast.success("Footer actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar el footer");
    }
  };

  const handleSocialSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'facebook_url',
          value: formData.get('facebook_url'),
          label: 'Facebook URL'
        }),
        saveSettingMutation.mutateAsync({
          key: 'instagram_url',
          value: formData.get('instagram_url'),
          label: 'Instagram URL'
        }),
        saveSettingMutation.mutateAsync({
          key: 'twitter_url',
          value: formData.get('twitter_url'),
          label: 'Twitter/X URL'
        }),
        saveSettingMutation.mutateAsync({
          key: 'youtube_url',
          value: formData.get('youtube_url'),
          label: 'YouTube URL'
        }),
        saveSettingMutation.mutateAsync({
          key: 'whatsapp_number',
          value: formData.get('whatsapp_number'),
          label: 'WhatsApp'
        })
      ]);
      toast.success("Redes sociales actualizadas");
    } catch (error) {
      toast.error("Error al actualizar redes sociales");
    }
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      await Promise.all([
        saveSettingMutation.mutateAsync({
          key: 'favicon_url',
          value: formData.get('favicon_url'),
          label: 'Favicon URL'
        }),
        saveSettingMutation.mutateAsync({
          key: 'og_image',
          value: formData.get('og_image'),
          label: 'Open Graph Image'
        }),
        saveSettingMutation.mutateAsync({
          key: 'meta_description',
          value: formData.get('meta_description'),
          label: 'Meta Description'
        }),
        saveSettingMutation.mutateAsync({
          key: 'custom_css',
          value: formData.get('custom_css'),
          label: 'CSS Personalizado'
        })
      ]);
      toast.success("Configuración general actualizada");
    } catch (error) {
      toast.error("Error al actualizar");
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
                <Palette className="w-10 h-10 text-[#006cf0]" />
                Configuración de Apariencia
              </h1>
              <p className="text-gray-400">
                Personaliza el look and feel de tu sitio web
              </p>
            </div>
            <Link to={createPageUrl("Home")} target="_blank">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Eye className="w-4 h-4 mr-2" />
                Vista Previa del Sitio
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Tip Card */}
        <Card className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 p-6 mb-8">
          <div className="flex items-start gap-4">
            <Palette className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-blue-300 mb-2">💡 Consejo</h3>
              <p className="text-blue-200 text-sm">
                Después de guardar los cambios, haz clic en "Vista Previa del Sitio" para ver los cambios en vivo en tu sitio web.
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-white/10">
              <TabsList className="bg-transparent p-0 h-auto border-0 w-full justify-start">
                <TabsTrigger 
                  value="header" 
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Layout className="w-4 h-4 mr-2" />
                  Header
                </TabsTrigger>
                <TabsTrigger 
                  value="footer"
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Layout className="w-4 h-4 mr-2 rotate-180" />
                  Footer
                </TabsTrigger>
                <TabsTrigger 
                  value="social"
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Redes Sociales
                </TabsTrigger>
                <TabsTrigger 
                  value="general"
                  className="data-[state=active]:bg-white/5 data-[state=active]:border-b-2 data-[state=active]:border-[#006cf0] rounded-none px-6 py-4"
                >
                  <FileImage className="w-4 h-4 mr-2" />
                  General
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6 md:p-8">
              {/* Header Configuration */}
              <TabsContent value="header" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuración del Header</h2>
                  <p className="text-gray-400 mb-6">Personaliza el logo y la barra de navegación superior</p>
                </div>

                <form onSubmit={handleHeaderSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url" className="text-white">URL del Logo</Label>
                      <Input
                        id="logo_url"
                        name="logo_url"
                        type="url"
                        defaultValue={getSetting('logo_url')}
                        placeholder="https://tu-dominio.com/logo.png"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">Recomendado: 200x50px, fondo transparente</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo_dark_url" className="text-white">URL del Logo (Modo Oscuro)</Label>
                      <Input
                        id="logo_dark_url"
                        name="logo_dark_url"
                        type="url"
                        defaultValue={getSetting('logo_dark_url')}
                        placeholder="https://tu-dominio.com/logo-dark.png"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="site_title" className="text-white">Título del Sitio</Label>
                      <Input
                        id="site_title"
                        name="site_title"
                        defaultValue={getSetting('site_title') || 'SELAIAH RADIO'}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="site_tagline" className="text-white">Eslogan</Label>
                      <Input
                        id="site_tagline"
                        name="site_tagline"
                        defaultValue={getSetting('site_tagline') || 'Donde el cielo toca la tierra'}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="header_bg_color" className="text-white">Color de Fondo del Header</Label>
                    <div className="flex gap-3">
                      <Input
                        type="color"
                        defaultValue={getSetting('header_bg_color') || '#000000'}
                        className="w-20 h-10 p-1 bg-white/10 border-white/20"
                      />
                      <Input
                        id="header_bg_color"
                        name="header_bg_color"
                        defaultValue={getSetting('header_bg_color') || '#000000'}
                        className="flex-1 bg-white/10 border-white/20 text-white"
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveSettingMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Header
                  </Button>
                </form>
              </TabsContent>

              {/* Footer Configuration */}
              <TabsContent value="footer" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuración del Footer</h2>
                  <p className="text-gray-400 mb-6">Personaliza el footer, enlaces sociales e información de contacto</p>
                </div>

                <form onSubmit={handleFooterSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="footer_copyright" className="text-white">Texto de Copyright</Label>
                    <Input
                      id="footer_copyright"
                      name="footer_copyright"
                      defaultValue={getSetting('footer_copyright') || '© 2025 Selaiah Radio Inc. Todos los derechos reservados'}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Información de Contacto</h3>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="contact_email" className="text-white">Email</Label>
                        <Input
                          id="contact_email"
                          name="contact_email"
                          type="email"
                          defaultValue={getSetting('contact_email') || 'info@selaiahradio.com'}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="contact_phone" className="text-white">Teléfono</Label>
                        <Input
                          id="contact_phone"
                          name="contact_phone"
                          defaultValue={getSetting('contact_phone') || '+1 (555) 123-4567'}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label htmlFor="contact_address" className="text-white">Dirección</Label>
                      <Input
                        id="contact_address"
                        name="contact_address"
                        defaultValue={getSetting('contact_address') || '123 Main St, City, Country'}
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
                    Guardar Footer
                  </Button>
                </form>
              </TabsContent>

              {/* Social Media Links */}
              <TabsContent value="social" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Enlaces de Redes Sociales</h2>
                  <p className="text-gray-400 mb-6">Configura los enlaces a tus perfiles sociales</p>
                </div>

                <form onSubmit={handleSocialSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook_url" className="text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-[#1877f2] flex items-center justify-center text-white text-sm font-bold">f</span>
                        Facebook URL
                      </Label>
                      <Input
                        id="facebook_url"
                        name="facebook_url"
                        type="url"
                        defaultValue={getSetting('facebook_url')}
                        placeholder="https://facebook.com/selaiahradio"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instagram_url" className="text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">IG</span>
                        Instagram URL
                      </Label>
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        type="url"
                        defaultValue={getSetting('instagram_url')}
                        placeholder="https://instagram.com/selaiahradio"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter_url" className="text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-black flex items-center justify-center text-white text-sm font-bold">𝕏</span>
                        Twitter/X URL
                      </Label>
                      <Input
                        id="twitter_url"
                        name="twitter_url"
                        type="url"
                        defaultValue={getSetting('twitter_url')}
                        placeholder="https://twitter.com/selaiahradio"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="youtube_url" className="text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-[#ff0000] flex items-center justify-center text-white text-sm font-bold">▶</span>
                        YouTube URL
                      </Label>
                      <Input
                        id="youtube_url"
                        name="youtube_url"
                        type="url"
                        defaultValue={getSetting('youtube_url')}
                        placeholder="https://youtube.com/@selaiahradio"
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_number" className="text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded bg-[#25D366] flex items-center justify-center text-white text-sm font-bold">WA</span>
                        WhatsApp (Número con código de país)
                      </Label>
                      <Input
                        id="whatsapp_number"
                        name="whatsapp_number"
                        defaultValue={getSetting('whatsapp_number')}
                        placeholder="+1234567890"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">Formato: +1234567890 (sin espacios ni guiones)</p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveSettingMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Redes Sociales
                  </Button>
                </form>
              </TabsContent>

              {/* General Settings */}
              <TabsContent value="general" className="mt-0 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Configuración General</h2>
                  <p className="text-gray-400 mb-6">Favicon, meta tags y CSS personalizado</p>
                </div>

                <form onSubmit={handleGeneralSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="favicon_url" className="text-white">Favicon URL</Label>
                      <Input
                        id="favicon_url"
                        name="favicon_url"
                        type="url"
                        defaultValue={getSetting('favicon_url')}
                        placeholder="https://tu-dominio.com/favicon.ico"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">Recomendado: 32x32px o 64x64px</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="og_image" className="text-white">Open Graph Image</Label>
                      <Input
                        id="og_image"
                        name="og_image"
                        type="url"
                        defaultValue={getSetting('og_image')}
                        placeholder="https://tu-dominio.com/og-image.jpg"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <p className="text-xs text-gray-400">Para compartir en redes: 1200x630px</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description" className="text-white">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      name="meta_description"
                      defaultValue={getSetting('meta_description') || 'SELAIAH RADIO - Radio cristiana pentecostal 24/7 con alabanza, adoración y enseñanza bíblica'}
                      className="bg-white/10 border-white/20 text-white"
                      rows={3}
                    />
                    <p className="text-xs text-gray-400">Máximo 160 caracteres para SEO</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="custom_css" className="text-white">CSS Personalizado</Label>
                    <Textarea
                      id="custom_css"
                      name="custom_css"
                      defaultValue={getSetting('custom_css')}
                      placeholder="/* Tu CSS personalizado aquí */"
                      className="bg-white/10 border-white/20 text-white font-mono text-sm"
                      rows={10}
                    />
                    <p className="text-xs text-gray-400">Cuidado: CSS incorrecto puede romper el diseño</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={saveSettingMutation.isPending}
                    className="bg-gradient-to-r from-[#006cf0] to-[#00479e]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Configuración General
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}