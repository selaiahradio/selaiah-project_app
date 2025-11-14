import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Radio, Calendar, Mic2, BookOpen, TrendingUp, Calendar as CalendarIcon, Mail, Menu, X, MapPin, Settings, ShoppingBag, Heart, Users, Bell, User, LogOut, Moon, Sun, Globe } from "lucide-react";
import { LanguageProvider, useLanguage } from "./components/LanguageContext";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AudioPlayer from "./components/player/AudioPlayer";
import NotificationPrompt from "./components/notifications/NotificationPrompt";
import LocationPrompt from "./components/location/LocationPrompt";
import { AudioProvider } from "./components/player/AudioContext";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import AIChat from "./components/chat/AIChat";
import UserChat from "./components/chat/UserChat";

function LayoutContent({ children, currentPageName }) {
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
        setDarkMode(user?.preferences?.dark_mode || false);
      } catch (error) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ['userNotifications'],
    queryFn: async () => {
      if (!currentUser) return [];
      const allNotifs = await base44.entities.PushNotification.filter({ status: 'sent' }, '-sent_at', 10);
      return allNotifs;
    },
    enabled: !!currentUser,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

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

  const unreadCount = notifications.length;

  // Filtrar items del menú según autenticación (TRADUCIDOS)
  const allNavItems = [
    { name: t.nav.home, path: createPageUrl("Home"), icon: Radio },
    { name: t.nav.shows, path: createPageUrl("Shows"), icon: Calendar },
    { name: t.nav.djs, path: createPageUrl("RadioJockeys"), icon: Mic2 },
    { name: t.nav.bible, path: createPageUrl("Bible"), icon: BookOpen },
    { name: t.nav.blog, path: createPageUrl("Blog"), icon: BookOpen },
    { name: t.nav.charts, path: createPageUrl("Charts"), icon: TrendingUp },
    { name: t.nav.events, path: createPageUrl("Events"), icon: CalendarIcon },
    { name: t.nav.local, path: createPageUrl("LocalNews"), icon: MapPin },
    { name: t.nav.community, path: createPageUrl("Feed"), icon: Users, requireAuth: true },
    { name: t.nav.shop, path: createPageUrl("Shop"), icon: ShoppingBag },
    { name: t.nav.donate, path: createPageUrl("Donations"), icon: Heart },
    { name: t.nav.contact, path: createPageUrl("Contact"), icon: Mail },
  ];

  // Mostrar solo items permitidos según autenticación
  const navItems = allNavItems.filter(item => {
    // Si el item requiere autenticación, solo mostrarlo si hay usuario
    if (item.requireAuth) {
      return currentUser !== null;
    }
    return true;
  });

  return (
    <AudioProvider>
      <div className={`min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <Link to={createPageUrl("Home")} className="flex items-center gap-3 group">
                <div className="relative">
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e8/8116342ff_IMG-20251102-WA0000.jpg" 
                    alt="SELAIAH RADIO" 
                    className="h-14 w-auto transform group-hover:scale-105 transition-transform drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{
                      filter: 'brightness(1.1) contrast(1.1)',
                      mixBlendMode: 'screen'
                    }}
                  />
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-white">SELAIAH RADIO</h1>
                  <p className="text-xs text-blue-300">Donde el cielo toca la tierra</p>
                </div>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden lg:flex items-center gap-1">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                          : "text-gray-300 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* Right Side Actions */}
              <div className="flex items-center gap-2">
                {/* Language Switcher */}
                <LanguageSwitcher />
                
                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDarkMode}
                  className="text-gray-300 hover:text-white"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </Button>

                {/* Notifications */}
                {currentUser && (
                  <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white">
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </Badge>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-white/10">
                      <DropdownMenuLabel className="text-white">{t.nav.notifications || 'Notificaciones'}</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      {notifications.length > 0 ? (
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.map((notif) => (
                            <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-4 cursor-pointer hover:bg-white/5">
                              <div className="flex items-start gap-3 w-full">
                                {notif.image_url && (
                                  <img src={notif.image_url} alt="" className="w-10 h-10 rounded" />
                                )}
                                <div className="flex-1">
                                  <p className="font-semibold text-white text-sm">{notif.title}</p>
                                  <p className="text-gray-400 text-xs mt-1">{notif.body}</p>
                                  <p className="text-gray-500 text-xs mt-1">
                                    {new Date(notif.sent_at || notif.created_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          No hay notificaciones
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* User Menu */}
                {currentUser ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 text-gray-300 hover:text-white">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {currentUser.full_name?.[0] || 'U'}
                        </div>
                        <span className="hidden md:inline text-sm">{currentUser.full_name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
                      <DropdownMenuLabel className="text-white">
                        <div className="flex flex-col">
                          <span>{currentUser.full_name}</span>
                          <span className="text-xs text-gray-400 font-normal">{currentUser.email}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("Profile")} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                          <User className="w-4 h-4" />
                          Mi Perfil
                        </Link>
                      </DropdownMenuItem>
                      {(currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Admin")} className="flex items-center gap-2 text-gray-300 hover:text-white cursor-pointer">
                            <Settings className="w-4 h-4" />
                            Panel Admin
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {!currentUser.is_verified && currentUser.role === 'user' && (
                        <DropdownMenuItem asChild>
                          <Link to={createPageUrl("Verification")} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 cursor-pointer">
                            <Badge className="bg-yellow-500/20">Verificar Cuenta</Badge>
                          </Link>
                        </DropdownMenuItem>
                      )}
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
                ) : (
                  <Button
                    onClick={() => base44.auth.redirectToLogin()}
                    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                  >
                    {t.nav.login}
                  </Button>
                )}

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-white"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-black/95 border-t border-white/10">
              <nav className="container mx-auto px-4 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white"
                          : "text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </Link>
                  );
                })}
                {currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin') && (
                  <Link
                    to={createPageUrl("Admin")}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5 transition-all"
                  >
                    <Settings className="w-5 h-5" />
                    Panel Admin
                  </Link>
                )}
              </nav>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="pt-20 pb-36 lg:pb-28">
          {children}
        </main>

        {/* Audio Player Component */}
        <AudioPlayer />

        {/* Notification Prompt */}
        <NotificationPrompt />

        {/* Location Prompt */}
        <LocationPrompt />

        {/* AI Chat Component - Disponible para todos */}
        <AIChat position="left" />

        {/* User Chat Component - Solo para usuarios autenticados */}
        {currentUser && <UserChat />}

        {/* Footer */}
        <footer className="bg-black/50 border-t border-white/10 py-8 text-center text-gray-400 text-sm mb-32 lg:mb-20">
          <div className="container mx-auto px-4">
            <p className="text-blue-300 mb-2 italic">"Alabad a Jehová con arpa; cantadle con salterio y decacordio" - Salmos 33:2</p>
            <p>&copy; 2025 Selaiah Radio Inc. {t.common?.rights || 'Todos los derechos reservados'}</p>
            <div className="flex justify-center gap-6 mt-4">
              <Link to={createPageUrl("Terms")} className="hover:text-white transition">
                {t.nav?.terms || 'Términos y Condiciones'}
              </Link>
              <Link to={createPageUrl("Privacy")} className="hover:text-white transition">
                {t.nav?.privacy || 'Política de Privacidad'}
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </AudioProvider>
  );
}

export default function Layout(props) {
  return (
    <LanguageProvider>
      <LayoutContent {...props} />
    </LanguageProvider>
  );
}