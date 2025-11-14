
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Calendar,
  Mic2,
  BookOpen,
  TrendingUp,
  Calendar as CalendarIcon,
  Radio,
  Bell,
  MapPin,
  Settings,
  Users,
  BarChart3,
  Menu,
  X,
  Moon,
  Sun,
  User,
  LogOut,
  ChevronRight,
  Home,
  Folder,
  FileText,
  Mail,
  ShoppingBag,
  Heart,
  MessageSquare,
  UserCheck,
  Shield, // Added Shield icon
  Palette, // Added Palette icon
  Headphones as HeadphonesIcon // Added Headphones icon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner"; // FIXED: Changed from react-hot-toast to sonner
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge"; // Added Badge import

export default function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false); // New state for authorization
  const location = useLocation();

  // Obtener estadísticas
  const { data: users = [] } = useQuery({
    queryKey: ['usersCount'],
    queryFn: () => base44.entities.User.list(),
    initialData: [],
    enabled: isAuthorized,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ['postsCount'],
    queryFn: () => base44.entities.SocialPost.list(),
    initialData: [],
    enabled: isAuthorized,
  });

  const { data: donations = [] } = useQuery({
    queryKey: ['donationsTotal'],
    queryFn: () => base44.entities.Donation.filter({ payment_status: 'completed' }),
    initialData: [],
    enabled: isAuthorized,
  });

  const totalDonations = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

  React.useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setDarkMode(user?.preferences?.dark_mode || false);
        
        // PROTECCIÓN: Solo admin y superadmin pueden acceder
        if (user.role === 'admin' || user.role === 'superadmin') {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          toast.error("Acceso denegado. Solo administradores pueden acceder a esta página.");
          // Redirigir al home después de 2 segundos
          setTimeout(() => {
            window.location.href = createPageUrl("Home");
          }, 2000);
        }
      } catch (error) {
        setCurrentUser(null);
        setIsAuthorized(false);
        toast.error("Debes iniciar sesión como administrador");
        setTimeout(() => {
          base44.auth.redirectToLogin(window.location.pathname);
        }, 2000);
      }
    };
    fetchUser();
  }, []);

  const toggleDarkMode = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (currentUser) {
      await base44.auth.updateMe({
        preferences: {
          ...currentUser.preferences,
          dark_mode: newMode
        }
      });
    }
  };

  const menuSections = [
    {
      title: "Configuración",
      items: [
        {
          name: "Streams",
          description: "URLs de streaming",
          icon: Radio,
          path: createPageUrl("StreamSettings"),
          color: "text-blue-400"
        },
        {
          name: "Integraciones",
          description: "Alexa, Siri, APIs",
          icon: Settings,
          path: createPageUrl("AdminIntegrations"),
          color: "text-cyan-400"
        },
        {
          name: "DJ Virtual IA",
          description: "Robot locutor automático",
          icon: Mic2,
          path: createPageUrl("AdminDJVirtual"),
          color: "text-purple-400"
        },
        {
          name: "Diagnóstico",
          description: "Health checks del sistema",
          icon: BarChart3,
          path: createPageUrl("AdminDiagnostics"),
          color: "text-green-400"
        },
        {
          name: "Setup Wizard",
          description: "Configuración inicial",
          icon: Settings,
          path: createPageUrl("AdminSetup"),
          color: "text-orange-400"
        }
      ]
    },
    {
      title: "Sistema",
      items: [
        {
          name: "Roles & Permisos",
          description: "RBAC del sistema",
          icon: Shield,
          path: createPageUrl("AdminRoles"),
          color: "text-red-400"
        },
        {
          name: "Settings",
          description: "Configuración general",
          icon: Settings,
          path: createPageUrl("AdminSettings"),
          color: "text-blue-400"
        },
        {
          name: "Apariencia",
          description: "Header, Footer, Colores",
          icon: Palette,
          path: createPageUrl("AdminAppearance"),
          color: "text-pink-400"
        },
        {
          name: "Documentación",
          description: "Docs del sistema",
          icon: BookOpen,
          path: createPageUrl("Documentation"),
          color: "text-indigo-400"
        },
        {
          name: "Soporte",
          description: "Tickets y departamentos",
          icon: HeadphonesIcon,
          path: createPageUrl("AdminSupport"),
          color: "text-purple-400"
        }
      ]
    },
    {
      title: "Contenido",
      items: [
        {
          name: "Shows",
          description: "Programas cristianos",
          icon: Calendar,
          path: createPageUrl("AdminShows"),
          color: "text-purple-400"
        },
        {
          name: "Radio Jockeys",
          description: "DJs y locutores",
          icon: Mic2,
          path: createPageUrl("AdminDJs"),
          color: "text-pink-400"
        },
        {
          name: "Biblia",
          description: "Versículos y enseñanzas",
          icon: BookOpen,
          path: createPageUrl("AdminBible"),
          color: "text-yellow-400"
        },
        {
          name: "Blog",
          description: "Artículos y testimonios",
          icon: BookOpen,
          path: createPageUrl("AdminBlog"),
          color: "text-indigo-400"
        },
        {
          name: "Categorías",
          description: "Organizar contenido",
          icon: Folder,
          path: createPageUrl("AdminCategories"),
          color: "text-cyan-400"
        },
        {
          name: "Páginas",
          description: "Páginas personalizadas",
          icon: FileText,
          path: createPageUrl("AdminPages"),
          color: "text-teal-400"
        },
        {
          name: "Charts",
          description: "Rankings musicales",
          icon: TrendingUp,
          path: createPageUrl("AdminCharts"),
          color: "text-green-400"
        },
        {
          name: "Eventos",
          description: "Conciertos y conferencias",
          icon: CalendarIcon,
          path: createPageUrl("AdminEvents"),
          color: "text-orange-400"
        }
      ]
    },
    {
      title: "Comunicación",
      items: [
        {
          name: "Notificaciones Push",
          description: "Enviar notificaciones",
          icon: Bell,
          path: createPageUrl("AdminNotifications"),
          color: "text-red-400"
        },
        {
          name: "Suscripciones",
          description: "Usuarios suscritos",
          icon: Users,
          path: createPageUrl("AdminSubscriptions"),
          color: "text-cyan-400"
        },
        {
          name: "Mensajes",
          description: "Contacto de usuarios",
          icon: Mail,
          path: createPageUrl("AdminMessages"),
          color: "text-amber-400"
        }
      ]
    },
    {
      title: "Localización",
      items: [
        {
          name: "Noticias Locales",
          description: "Gestionar noticias",
          icon: MapPin,
          path: createPageUrl("AdminLocalNews"),
          color: "text-teal-400"
        },
        {
          name: "Ubicaciones",
          description: "Usuarios por zona",
          icon: MapPin,
          path: createPageUrl("AdminLocations"),
          color: "text-lime-400"
        }
      ]
    },
    {
      title: "Comercio",
      items: [
        {
          name: "Métricas",
          description: "Analytics y reportes",
          icon: BarChart3,
          path: createPageUrl("ShopAnalytics"),
          color: "text-green-400"
        },
        {
          name: "Tienda",
          description: "Productos y merchandise",
          icon: ShoppingBag,
          path: createPageUrl("AdminShop"),
          color: "text-blue-400"
        },
        {
          name: "Órdenes",
          description: "Pedidos de clientes",
          icon: ShoppingBag,
          path: createPageUrl("AdminOrders"),
          color: "text-purple-400"
        },
        {
          name: "Donaciones",
          description: "Gestionar donaciones",
          icon: Heart,
          path: createPageUrl("AdminDonations"),
          color: "text-red-400"
        }
      ]
    },
    {
      title: "Comunidad",
      items: [
        {
          name: "Red Social",
          description: "Posts de la comunidad",
          icon: MessageSquare,
          path: createPageUrl("AdminSocial"),
          color: "text-purple-400"
        },
        {
          name: "Usuarios",
          description: "Gestionar usuarios y roles", // Modified description
          icon: Users,
          path: createPageUrl("AdminUsers"),
          color: "text-blue-400"
          // Removed requiredRole, making it accessible to all admin roles
        },
        {
          name: "Verificaciones",
          description: "Ejercicios religiosos",
          icon: UserCheck,
          path: createPageUrl("AdminVerifications"),
          color: "text-green-400"
        }
      ]
    }
  ];

  // Filtrar items según rol del usuario
  const getFilteredMenuSections = () => {
    // Si no hay usuario cargado aún, mostrar todo (se ocultará después si no tiene permisos)
    if (!currentUser) return menuSections;

    return menuSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Si no requiere rol especial, mostrar
        if (!item.requiredRole) return true;
        
        // Si requiere superadmin, solo mostrar a superadmins
        if (item.requiredRole === 'superadmin') {
          return currentUser.role === 'superadmin';
        }
        
        // Si requiere admin, mostrar a admin y superadmin
        if (item.requiredRole === 'admin') {
          return currentUser.role === 'admin' || currentUser.role === 'superadmin';
        }
        
        return true;
      })
    })).filter(section => section.items.length > 0); // Remover secciones vacías
  };

  const filteredMenuSections = getFilteredMenuSections();

  const isActive = (path) => location.pathname === path;

  // Si no está autorizado, mostrar mensaje de acceso denegado
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="bg-white/5 border-red-500/30 p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-4">
            Esta área está restringida solo para administradores del sistema.
          </p>
          <div className="flex flex-col gap-2">
            <Badge className="bg-red-500/20 text-red-300 mx-auto">
              {currentUser?.role ? `Tu rol: ${currentUser.role}` : 'No autenticado'}
            </Badge>
            <p className="text-xs text-gray-500">
              Serás redirigido en unos segundos...
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-900'}`}>
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#006cf0] backdrop-blur-xl border-b border-[#00479e] z-50">
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left side - Menu Toggle */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-[#00479e]"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <div>
              <h1 className="text-lg font-bold text-white">Panel de Administración</h1>
              <p className="text-xs text-blue-100">SELAIAH RADIO</p>
            </div>
          </div>

          {/* Right side - User, Notifications, Theme */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#00479e] relative"
              asChild
            >
              <Link to={createPageUrl("AdminNotifications")}>
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Link>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="text-white hover:bg-[#00479e]"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-[#00479e] pl-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {currentUser?.full_name?.[0] || 'A'}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-white leading-none">{currentUser?.full_name || 'Admin'}</p>
                    <p className="text-xs text-blue-100 leading-none mt-1">{currentUser?.role || 'admin'}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
                <DropdownMenuLabel className="text-white">
                  <div className="flex flex-col">
                    <span>{currentUser?.full_name || 'Admin'}</span>
                    <span className="text-xs text-gray-400 font-normal">{currentUser?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Profile")} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                    <User className="w-4 h-4" />
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={createPageUrl("Home")} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                    <Home className="w-4 h-4" />
                    Volver a la Radio
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem 
                  onClick={() => base44.auth.logout()}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25 }}
            className={`fixed left-0 top-16 bottom-0 w-72 ${darkMode ? 'bg-slate-950' : 'bg-[#006cf0]'} backdrop-blur-xl border-r border-[#00479e] overflow-y-auto z-40`}
          >
            <div className="p-4">
              {/* Menu Sections */}
              {filteredMenuSections.map((section, index) => (
                <div key={section.title} className="mb-6">
                  <h3 className="text-xs font-semibold text-blue-200 uppercase mb-3 px-3">
                    {section.title}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);

                      const linkContent = (
                        <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                          active
                            ? "bg-[#00479e] border border-[#003875]"
                            : "hover:bg-[#00479e]"
                        }`}>
                          <Icon className={`w-5 h-5 ${item.color}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${active ? "text-white" : "text-blue-50"}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-blue-200 truncate">
                              {item.description}
                            </p>
                          </div>
                          {item.requiredRole === 'superadmin' && (
                            <Shield className="w-3 h-3 text-red-400" title="Requiere rol de Superadmin" />
                          )}
                          {item.external && (
                            <ChevronRight className="w-4 h-4 text-blue-300 opacity-0 group-hover:opacity-100 transition" />
                          )}
                        </div>
                      );

                      return item.external ? (
                        <a key={item.name} href={item.path} target="_blank" rel="noopener noreferrer">
                          {linkContent}
                        </a>
                      ) : (
                        <Link key={item.name} to={item.path}>
                          {linkContent}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`pt-20 pb-8 transition-all duration-300 ${sidebarOpen ? "ml-72" : "ml-0"}`}>
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className={`${darkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#006cf0] to-[#00479e] flex items-center justify-center">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">1</p>
                  <p className="text-sm text-blue-300">Stream Activo</p>
                </div>
              </div>
            </Card>

            <Card className={`${darkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                  <p className="text-sm text-blue-300">Usuarios</p>
                </div>
              </div>
            </Card>

            <Card className={`${darkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{posts.length}</p>
                  <p className="text-sm text-blue-300">Posts</p>
                </div>
              </div>
            </Card>

            <Card className={`${darkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">${totalDonations.toFixed(2)}</p>
                  <p className="text-sm text-blue-300">Donaciones</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className={`${darkMode ? 'bg-gradient-to-r from-slate-800/80 to-slate-700/60' : 'bg-gradient-to-r from-[#006cf0]/30 to-purple-600/20'} border-[#006cf0] p-8 mb-8`}>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Bienvenido {currentUser?.full_name ? `, ${currentUser.full_name}` : ""}! 👋
                  </h2>
                  <p className="text-blue-200 mb-6">
                    Administra el contenido de SELAIAH RADIO desde este panel
                  </p>
                  <div className="flex gap-3">
                    <Link to={createPageUrl("StreamSettings")}>
                      <Button className="bg-gradient-to-r from-[#006cf0] to-[#00479e] hover:from-[#00479e] hover:to-[#003875] text-white">
                        <Radio className="w-4 h-4 mr-2" />
                        Configurar Stream
                      </Button>
                    </Link>
                    <Link to={createPageUrl("AdminShows")}>
                      <Button variant="outline" className="border-[#006cf0] text-blue-100 hover:bg-[#006cf0]/20">
                        <Calendar className="w-4 h-4 mr-2" />
                        Crear Show
                      </Button>
                    </Link>
                  </div>
                </div>
                <Settings className="w-20 h-20 text-[#006cf0]/40" />
              </div>
            </Card>
          </motion.div>

          {/* Tips Card */}
          <Card className={`${darkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              💡 Consejos Rápidos
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-100">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#006cf0] mt-2"></div>
                <div>
                  <strong>Streams:</strong> Configura tu URL de streaming desde el menú lateral
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2"></div>
                <div>
                  <strong>Shows & DJs:</strong> Gestiona todo desde dentro de la aplicación
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-2"></div>
                <div>
                  <strong>Comunidad:</strong> Modera posts, gestiona usuarios y verificaciones
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2"></div>
                <div>
                  <strong>Notificaciones:</strong> Envía notificaciones push a la comunidad
                </div>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
