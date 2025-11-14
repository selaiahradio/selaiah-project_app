import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Shield,
  CheckCircle,
  Award,
  BookOpen,
  Heart,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      toast.success("Perfil actualizado exitosamente");
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: () => toast.error("Error al actualizar perfil"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const spiritualGiftsString = formData.get('spiritual_gifts');
    const spiritual_gifts = spiritualGiftsString ? spiritualGiftsString.split(',').map(g => g.trim()) : [];

    const ministryAreasString = formData.get('ministry_areas');
    const ministry_areas = ministryAreasString ? ministryAreasString.split(',').map(a => a.trim()) : [];

    const data = {
      bio: formData.get('bio'),
      phone: formData.get('phone'),
      denomination: formData.get('denomination'),
      church_name: formData.get('church_name'),
      pastor_name: formData.get('pastor_name'),
      avatar_url: formData.get('avatar_url'),
      cover_photo_url: formData.get('cover_photo_url'),
      location: {
        city: formData.get('city'),
        state: formData.get('state'),
        country: formData.get('country')
      },
      spiritual_gifts,
      ministry_areas,
      preferences: {
        ...currentUser?.preferences,
        dark_mode: formData.get('dark_mode') === 'on',
        notifications_enabled: formData.get('notifications_enabled') === 'on',
        email_notifications: formData.get('email_notifications') === 'on'
      }
    };

    updateProfileMutation.mutate(data);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-white/5 border-white/10 p-8 text-center">
          <p className="text-white mb-4">Debes iniciar sesión para ver tu perfil</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Iniciar Sesión
          </Button>
        </Card>
      </div>
    );
  }

  const verificationLevel = currentUser?.verification_level || 0;
  const isVerified = currentUser?.is_verified || false;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header con Cover Photo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="relative h-64 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 mb-[-80px]">
            {currentUser?.cover_photo_url && (
              <img src={currentUser.cover_photo_url} alt="Cover" className="w-full h-full object-cover" />
            )}
          </div>
          
          <div className="relative z-10 px-8">
            <div className="flex flex-col md:flex-row md:items-end gap-6">
              <div className="relative">
                <div className="w-40 h-40 rounded-full border-4 border-slate-900 overflow-hidden bg-gradient-to-r from-blue-500 to-purple-500">
                  {currentUser?.avatar_url ? (
                    <img src={currentUser.avatar_url} alt={currentUser.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-white">
                      {currentUser.full_name?.[0]}
                    </div>
                  )}
                </div>
                <button className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="flex-1 mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{currentUser.full_name}</h1>
                  {isVerified && (
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Verificado
                    </Badge>
                  )}
                  <Badge className={`
                    ${currentUser.role === 'superadmin' ? 'bg-red-500/20 text-red-300 border-red-500/30' :
                      currentUser.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' :
                      currentUser.role === 'verified_user' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      'bg-gray-500/20 text-gray-300 border-gray-500/30'}
                  `}>
                    <Shield className="w-4 h-4 mr-1" />
                    {currentUser.role === 'superadmin' ? 'Super Admin' :
                     currentUser.role === 'admin' ? 'Administrador' :
                     currentUser.role === 'verified_user' ? 'Usuario Verificado' :
                     'Usuario'}
                  </Badge>
                </div>
                <p className="text-gray-400">{currentUser.email}</p>
                {currentUser?.bio && (
                  <p className="text-gray-300 mt-2">{currentUser.bio}</p>
                )}
              </div>

              {!isVerified && currentUser.role === 'user' && (
                <Link to={createPageUrl("Verification")}>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                    <Award className="w-4 h-4 mr-2" />
                    Verificar Identidad Religiosa
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card className="bg-white/5 border-white/10 p-6">
              <h3 className="text-lg font-bold text-white mb-4">Estadísticas</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Posts</span>
                  <span className="text-white font-bold">{currentUser?.stats?.posts_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Versículos</span>
                  <span className="text-white font-bold">{currentUser?.stats?.verses_created || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Eventos</span>
                  <span className="text-white font-bold">{currentUser?.stats?.events_created || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Seguidores</span>
                  <span className="text-white font-bold">{currentUser?.stats?.followers_count || 0}</span>
                </div>
              </div>
            </Card>

            {/* Verification Progress */}
            {!isVerified && currentUser.role === 'user' && (
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-400" />
                  Progreso de Verificación
                </h3>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Nivel {verificationLevel}%</span>
                    <span className="text-blue-400">Meta: 100%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all"
                      style={{ width: `${verificationLevel}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">
                  Completa ejercicios de verificación para obtener permisos completos
                </p>
                <Link to={createPageUrl("Verification")}>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600">
                    Continuar Verificación
                  </Button>
                </Link>
              </Card>
            )}

            {/* Permisos */}
            {(isVerified || currentUser.role !== 'user') && (
              <Card className="bg-white/5 border-white/10 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Permisos</h3>
                <div className="space-y-2 text-sm">
                  {currentUser?.permissions?.can_create_verses && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Crear Versículos
                    </div>
                  )}
                  {currentUser?.permissions?.can_create_events && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Crear Eventos
                    </div>
                  )}
                  {currentUser?.permissions?.can_create_blog_posts && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      Crear Artículos
                    </div>
                  )}
                  {currentUser?.permissions?.can_moderate_posts && (
                    <div className="flex items-center gap-2 text-purple-400">
                      <Shield className="w-4 h-4" />
                      Moderar Contenido
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="bg-white/5 border-white/10 p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Editar Perfil</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Biografía</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={currentUser?.bio}
                    className="bg-white/10 border-white/20 text-white"
                    rows={3}
                    placeholder="Cuéntanos sobre ti..."
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-white">Teléfono</Label>
                    <Input
                      id="phone"
                      name="phone"
                      defaultValue={currentUser?.phone}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="denomination" className="text-white">Denominación</Label>
                    <Select name="denomination" defaultValue={currentUser?.denomination}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pentecostal">Pentecostal</SelectItem>
                        <SelectItem value="evangelical">Evangélico</SelectItem>
                        <SelectItem value="baptist">Bautista</SelectItem>
                        <SelectItem value="methodist">Metodista</SelectItem>
                        <SelectItem value="presbyterian">Presbiteriano</SelectItem>
                        <SelectItem value="catholic">Católico</SelectItem>
                        <SelectItem value="other">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="church_name" className="text-white">Iglesia</Label>
                    <Input
                      id="church_name"
                      name="church_name"
                      defaultValue={currentUser?.church_name}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pastor_name" className="text-white">Pastor</Label>
                    <Input
                      id="pastor_name"
                      name="pastor_name"
                      defaultValue={currentUser?.pastor_name}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">Ciudad</Label>
                    <Input
                      id="city"
                      name="city"
                      defaultValue={currentUser?.location?.city}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">Estado</Label>
                    <Input
                      id="state"
                      name="state"
                      defaultValue={currentUser?.location?.state}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-white">País</Label>
                    <Input
                      id="country"
                      name="country"
                      defaultValue={currentUser?.location?.country}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spiritual_gifts" className="text-white">Dones Espirituales</Label>
                  <Input
                    id="spiritual_gifts"
                    name="spiritual_gifts"
                    defaultValue={currentUser?.spiritual_gifts?.join(', ')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Profecía, Sanidad, Enseñanza (separados por comas)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ministry_areas" className="text-white">Áreas de Ministerio</Label>
                  <Input
                    id="ministry_areas"
                    name="ministry_areas"
                    defaultValue={currentUser?.ministry_areas?.join(', ')}
                    className="bg-white/10 border-white/20 text-white"
                    placeholder="Adoración, Jóvenes, Evangelismo (separados por comas)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar_url" className="text-white">URL de Avatar</Label>
                  <Input
                    id="avatar_url"
                    name="avatar_url"
                    type="url"
                    defaultValue={currentUser?.avatar_url}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cover_photo_url" className="text-white">URL de Foto de Portada</Label>
                  <Input
                    id="cover_photo_url"
                    name="cover_photo_url"
                    type="url"
                    defaultValue={currentUser?.cover_photo_url}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h3 className="text-lg font-bold text-white">Preferencias</h3>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dark_mode" className="text-white cursor-pointer">Modo Oscuro</Label>
                    <Switch
                      id="dark_mode"
                      name="dark_mode"
                      defaultChecked={currentUser?.preferences?.dark_mode}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications_enabled" className="text-white cursor-pointer">
                      Notificaciones Push
                    </Label>
                    <Switch
                      id="notifications_enabled"
                      name="notifications_enabled"
                      defaultChecked={currentUser?.preferences?.notifications_enabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="email_notifications" className="text-white cursor-pointer">
                      Notificaciones por Email
                    </Label>
                    <Switch
                      id="email_notifications"
                      name="email_notifications"
                      defaultChecked={currentUser?.preferences?.email_notifications}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}