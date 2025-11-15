import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

import { 
  Users, 
  Radio, 
  Mic, 
  Newspaper, 
  BarChart2, 
  Calendar, 
  MessageSquare, 
  Settings, 
  Palette, 
  Code, 
  Heart, 
  ShoppingBag, 
  Ticket, 
  MapPin, 
  Bell, 
  ShieldCheck, 
  FileText, 
  BookOpen, 
  LifeBuoy, 
  Server, 
  Users2,
  LogOut
} from 'lucide-react';

const LOGIN_URL = 'https://login.selaiah.com/';

// Mock API functions for stats
const fetchUsersCount = async () => 1250; // Mock data
const fetchPostsCount = async () => 340; // Mock data
const fetchDonationsTotal = async () => 5830.50; // Mock data

function Admin() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setAuthLoading(true);
      try {
        const user = await base44.auth.me();
        if (user && (user.role === 'admin' || user.role === 'superadmin')) {
          setCurrentUser(user);
          setDarkMode(user.preferences?.dark_mode || false);
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
          toast.error(user ? "Acceso denegado" : "Debes iniciar sesión como administrador");
          setTimeout(() => user ? navigate(getPagePath("Home")) : window.location.href = LOGIN_URL, 2000);
        }
      } catch (err) {
        setIsAuthorized(false);
        toast.error("Error de autenticación.");
        setTimeout(() => window.location.href = LOGIN_URL, 2000);
      } finally {
        setAuthLoading(false);
      }
    })()
  }, [navigate]);

  const { data: usersCount = 0 } = useQuery({ queryKey: ['usersCount'], queryFn: fetchUsersCount, enabled: isAuthorized });
  const { data: postsCount = 0 } = useQuery({ queryKey: ['postsCount'], queryFn: fetchPostsCount, enabled: isAuthorized });
  const { data: donationsTotal = 0 } = useQuery({ queryKey: ['donationsTotal'], queryFn: fetchDonationsTotal, enabled: isAuthorized });

  if (isAuthLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-slate-900'}`}>
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 h-16 bg-[#006cf0] z-50">
             <Button onClick={() => { base44.auth.logout(); navigate('/'); }} className="cursor-pointer text-red-400"><LogOut className="w-4 h-4 mr-2"/>Cerrar Sesión</Button>
        </header>

        {/* Main Content */}
        <main className={`pt-20 pb-8 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-0'}`}>
            <div className="container mx-auto px-4 max-w-7xl">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
                    <p className="text-2xl font-bold text-white">{usersCount}</p>
                    <p className="text-sm text-blue-300">Usuarios</p>
                </Card>
                <Card className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
                    <p className="text-2xl font-bold text-white">{postsCount}</p>
                    <p className="text-sm text-blue-300">Posts</p>
                </Card>
                <Card className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-[#006cf0]/20'} border-[#006cf0] p-6`}>
                    <p className="text-2xl font-bold text-white">${donationsTotal.toFixed(2)}</p>
                    <p className="text-sm text-blue-300">Donaciones</p>
                </Card>
            </div>
            </div>
        </main>
    </div>
  );
}

export default Admin;
