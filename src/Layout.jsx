import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth, Me } from "@/lib/AuthContext";
import { QueryClientProvider, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClientInstance as queryClient } from "@/lib/query-client.js";
import { AudioProvider, useAudio } from "@/components/player/AudioContext";
import { Toaster, toast } from "sonner";
import { LanguageProvider, useLanguage } from "@/components/LanguageContext";
import { appParams } from "@/lib/app-params";
import { AnimatePresence, motion } from "framer-motion";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getPagePath } from "@/pages.config.js";

import { Home, ListMusic, Mic, Star, Radio, MessageSquare, ShoppingCart, CircleUserRound, LogIn, LogOut, Ticket, Settings, Shield, BookOpen, Newspaper, Users, Landmark, Contact, Info, HandHelping, Tv, Menu, X, Sun, Moon, Bell, Search, LayoutDashboard } from "lucide-react";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from "@/components/ui/dropdown-menu";
import { Button } from "./components/ui/button";

// Player
import { Link } from "react-router-dom";

import NotificationPrompt from "./components/notifications/NotificationPrompt";
import LocationPrompt from "./components/location/LocationPrompt";

// Chat
import AIChat from "@/components/chat/AIChat";
import UserChat from "@/components/chat/UserChat";
import { SocketProvider } from "./lib/SocketContext";

// Translations




function NavigationLogger() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // This tells the parent window that the URL has changed
    window.parent?.postMessage({ type: "app_changed_url", url: window.location.href }, "*");
  }, [location]);

  useEffect(() => {
    const path = location.pathname;
    let pageName;

    if (path === "/" || path === "") {
      pageName = mainPage;
    } else {
      const page = path.replace(/^\//, "").split("/")[0];
      pageName = Object.keys(pagePaths).find((p) => p.toLowerCase() === page.toLowerCase()) || null;
    }
    
    if(isAuthenticated && pageName) {
      window.base44.appLogs.logUserInApp(pageName).catch(() => {});
    }

  }, [location, isAuthenticated]);

  return null;
}


const mainPage = "Home"




// App-wide error handling


const sendErrorToParent = (error) => {
  const { title, details, componentName, originalError } = error;
  // Don't report 402 errors, which are expected when the user is not a subscriber
  if (originalError?.response?.status !== 402) {
    window.parent?.postMessage({ type: "app_error", error: { title: title.toString(), details: details?.toString(), componentName: componentName?.toString() } }, "*");
  }
};

const rejectionHandler = (event) => {
  const componentName = event.reason.stack.match(/at\s+(\w+)\s+\(eval\)/)?.[1];
  const title = componentName ? `Error in ${componentName}: ${event.reason.toString()}`: event.reason.toString();
  sendErrorToParent({ title, details: event.reason.toString(), componentName, originalError: event.reason });
};

const errorHandler = (event) => {
  let componentName = event.error?.stack.match(/at\s+(\w+)\s+\(eval\)/)?.[1];
  if (componentName === 'eval') {
    componentName = null;
  }
  const title = componentName ? `in ${componentName}: ${event.error.toString()}`: event.error.toString();
  sendErrorToParent({ title, details: event.error.toString(), componentName, originalError: event.error });
};


function LivePlayer() {
  const location = useLocation();
  const isHomePage = location.pathname === "/Home" || location.pathname === "/";
  const { isPlaying, volume, isMuted, isLoading, error, streamConfig, nowPlaying, togglePlay, toggleMute, handleVolumeChange } = useAudio();
  const coverArt = nowPlaying?.cover_art_url || nowPlaying?.artist_image_url || 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e2/8116342ff_IMG-20251102-WA0000.jpg';

  if (!streamConfig || (typeof window !== 'undefined' && window.innerWidth < 1024 && isHomePage)) {
    return null;
  }

  return (
    <div className="hidden lg:block fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 shadow-2xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left side: Controls and Info */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 shrink-0 shadow-lg">
                <img src={coverArt} alt={nowPlaying?.artist || 'SELAIAH RADIO'} className="w-full h-full object-cover" onError={(e) => { e.target.src = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e2/8116342ff_IMG-20251102-WA0000.jpg'; }} />
            </div>
            <Button size="icon" onClick={togglePlay} disabled={isLoading} className="bg-white/20 hover:bg-white/30 backdrop-blur-sm shrink-0 w-12 h-12 rounded-full transition-all hover:scale-105 active:scale-95">
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <ListMusic className="w-6 h-6 text-white fill-white" />
              ) : (
                <Radio className="w-6 h-6 text-white fill-white ml-1" />
              )}
            </Button>
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                {error ? (
                    <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-white/80 text-sm truncate">⚠️ {error}</motion.p>
                ) : nowPlaying ? (
                  <motion.div key="nowplaying" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <p className="text-white font-semibold truncate flex items-center gap-2">
                        {isPlaying && <span className="flex gap-1"><span className='w-1 h-3 bg-white rounded-full animate-pulse' style={{animationDelay: '0ms'}} /><span className='w-1 h-3 bg-white rounded-full animate-pulse' style={{animationDelay: '150ms'}} /><span className='w-1 h-3 bg-white rounded-full animate-pulse' style={{animationDelay: '300ms'}} /></span>}
                        {nowPlaying.song_title}
                    </p>
                    <p className="text-white/80 text-sm truncate">{nowPlaying.artist || 'SELAIAH RADIO'}{nowPlaying.listeners ? ` • ${nowPlaying.listeners} oyentes` : ''}</p>
                  </motion.div>
                ) : (
                  <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                     <p className="text-white font-semibold truncate flex items-center gap-2">
                        {isPlaying && <Mic className="w-4 h-4 animate-pulse" />}
                        {isPlaying ? '🔴 EN VIVO' : 'SELAIAH RADIO'}
                    </p>
                    <p className="text-white/80 text-sm truncate">Radio Cristiana • Alabanza y Adoración 24/7</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right side: Volume control */}
          <div className="hidden md:flex items-center gap-3 w-40">
            <Button size="icon" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white/10 shrink-0">
              {isMuted || volume === 0 ? <Star className="w-5 h-5" /> : <CircleUserRound className="w-5 h-5" />}
            </Button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-full h-2 accent-white cursor-pointer"
              style={{ background: `linear-gradient(to right, white ${isMuted ? 0 : volume}%, rgba(255,255,255,0.3) ${isMuted ? 0 : volume}%)` }}
            />
            <span className="text-white text-xs font-medium w-8 text-right">{Math.round(isMuted ? 0 : volume)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const LOGIN_URL = 'https://login.selaiah.com/'

function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { t, isRTL } = useLanguage();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [isNotificationsMenuOpen, setNotificationsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!appParams.token) {
        // No token, do nothing
      } else {
        try {
          const me = await Me();
          setUser(me);
          setDarkMode(me?.preferences?.dark_mode || false);
        } catch (e) {
          console.error("Failed to fetch user, token might be invalid.", e);
          // remove token and reload
          localStorage.removeItem('base44_access_token');
          window.location.reload();
        }
      }
      setIsLoading(false);
    })();
  }, []);

  const { data: notifications = [] } = useQuery({ 
    queryKey: ['userNotifications'], 
    queryFn: () => window.base44.entities.PushNotification.filter({status: 'sent'}, '-sent_at', 10), 
    enabled: !!user,
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const updateUserPreferences = useMutation({ 
    mutationFn: (prefs) => Me.update(prefs), 
    onError: (e) => console.error("Failed to update user preferences", e) 
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setDarkMode(newMode);
    if (user) {
      updateUserPreferences.mutate({ preferences: { ...user.preferences, dark_mode: newMode }});
    }
  }

  const unreadNotificationsCount = notifications.length; // This can be improved with a proper count

  // Navigation items
  const navItems = [
    { name: t.nav.home, path: getPagePath("Home"), icon: Home },
    { name: t.nav.shows, path: getPagePath("Shows"), icon: Tv },
    { name: t.nav.djs, path: getPagePath("RadioJockeys"), icon: Mic },
    { name: t.nav.bible, path: getPagePath("Bible"), icon: BookOpen },
    { name: t.nav.blog, path: getPagePath("Blog"), icon: Newspaper },
    { name: t.nav.charts, path: getPagePath("Charts"), icon: ListMusic },
    { name: t.nav.events, path: getPagePath("Events"), icon: Ticket },
    { name: t.nav.local, path: getPagePath("LocalNews"), icon: Landmark },
    { name: t.nav.community, path: getPagePath("Feed"), icon: Users, requireAuth: true },
    { name: t.nav.shop, path: getPagePath("Shop"), icon: ShoppingCart },
    { name: t.nav.donate, path: getPagePath("Donations"), icon: HandHelping },
    { name: t.nav.contact, path: getPagePath("Contact"), icon: Contact },
  ].filter(item => !item.requireAuth || !!user);

  function login() {
    window.location.href = LOGIN_URL;
  }

  function logout() {
    localStorage.removeItem("base44_access_token");
    window.location.reload();
  }
  
  return (
    <AudioProvider>
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'}`} dir={isRTL ? "rtl" : "ltr"}>
          <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-20">
                {/* Logo */}
                <Link to={getPagePath("Home")} className="flex items-center gap-3 group">
                  <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6907896c4b6e76c26b9db5e2/8116342ff_IMG-20251102-WA0000.jpg" alt="SELAIAH RADIO" className="h-14 w-auto" />
                  <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-white">SELAIAH RADIO</h1>
                    <p className="text-xs text-blue-300">Donde el cielo toca la tierra</p>
                  </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-gradient-to-r from-blue-500 to-blue-700 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}>
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>

                {/* Right side controls */}
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />

                  <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-gray-300 hover:text-white">
                    {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </Button>

                  {user && (
                    <DropdownMenu open={isNotificationsMenuOpen} onOpenChange={setNotificationsMenuOpen}>
                       <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="relative text-gray-300 hover:text-white">
                            <Bell className="w-5 h-5" />
                            {unreadNotificationsCount > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs rounded-full">{unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}</span>}
                          </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-white/10">
                          <DropdownMenuLabel className="text-white">{t.nav.notifications || 'Notificaciones'}</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-white/10" />
                          {notifications.length > 0 ? (
                            <div className="max-h-96 overflow-y-auto">
                              {notifications.map(n => (
                                <DropdownMenuItem key={n.id} className="flex flex-col items-start p-4 cursor-pointer hover:bg-white/5">
                                  <p className="font-semibold text-white text-sm">{n.title}</p>
                                  <p className="text-gray-400 text-xs mt-1">{n.body}</p>
                                </DropdownMenuItem>
                              ))}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-400 text-sm">No hay notificaciones</div>
                          )}
                       </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  {isLoading ? (
                     <div className="w-24 h-8 bg-white/10 rounded-lg animate-pulse" />
                  ) : user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 text-gray-300 hover:text-white">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">{user.full_name?.[0] || 'U'}</div>
                          <span className="hidden md:inline text-sm">{user.full_name}</span>
                        </Button>                      
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-white/10">
                        <DropdownMenuLabel className="text-white">{user.full_name}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        {(user.role === 'admin' || user.role === 'superadmin') && <DropdownMenuItem asChild><Link to={getPagePath("Admin")} className="cursor-pointer"><LayoutDashboard className="w-4 h-4 mr-2" /> Panel Admin</Link></DropdownMenuItem>}
                        <DropdownMenuItem onClick={logout} className="text-red-400 cursor-pointer"><LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <Button onClick={login} className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white">
                      {t.nav.login}
                    </Button>
                  )}

                  {/* Mobile Menu Button */}
                  <Button variant="ghost" size="icon" className="lg:hidden text-white" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
              <div className="lg:hidden bg-black/95 border-t border-white/10">
                <nav className="container mx-auto px-4 py-4 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/5">
                      <item.icon className="w-5 h-5" /> {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            )}
          </header>

          <main className="pt-20 pb-36 lg:pb-28">{children}</main>
          
          <LivePlayer />

          {/* Global Components */}
          <NotificationPrompt />
          <LocationPrompt />
          <AIChat position="left" />
          {user && <UserChat />}

          <footer className="bg-black/50 border-t border-white/10 py-8 text-center text-gray-400 text-sm mb-32 lg:mb-20">
            <p>© 2025 Selaiah Radio Inc. {t.common.rights || 'Todos los derechos reservados'}</p>
          </footer>
        </div>
    </AudioProvider>
  );
}

export default function AppLayout({ children, currentPageName }) {
    return (
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
         <Layout currentPageName={currentPageName}>{children}</Layout>
        </QueryClientProvider>
      </LanguageProvider>
    );
  }