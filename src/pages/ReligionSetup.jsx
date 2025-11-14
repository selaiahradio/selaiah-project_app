import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Globe, 
  Check,
  Sparkles,
  ChevronRight,
  Cross,
  Moon as Crescent,
  Star as StarOfDavid,
  Wind,
  Flame
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/LanguageContext";
import { availableLanguages } from "@/components/utils/translations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ReligionSetupPage() {
  const navigate = useNavigate();
  const { t, language, changeLanguage } = useLanguage();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1); // 1 = idioma, 2 = religión
  
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [selectedReligion, setSelectedReligion] = useState('christianity');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const user = await base44.auth.me();
      setCurrentUser(user);
      if (user.religion) {
        setSelectedReligion(user.religion);
      }
      if (user.preferences?.ui_language) {
        setSelectedLanguage(user.preferences.ui_language);
      }
    } catch (error) {
      console.log('Usuario no autenticado');
    }
  };

  const religions = [
    {
      id: 'christianity',
      name: t.religion.christianity,
      icon: Cross,
      color: 'from-blue-500 to-cyan-500',
      description: 'Biblia • Jesús • Iglesia',
      books: ['Biblia (66 libros)']
    },
    {
      id: 'islam',
      name: t.religion.islam,
      icon: Crescent,
      color: 'from-green-500 to-emerald-500',
      description: 'Corán • Muhammad • Mezquita',
      books: ['Corán (114 suras)', 'Hadices']
    },
    {
      id: 'judaism',
      name: t.religion.judaism,
      icon: StarOfDavid,
      color: 'from-indigo-500 to-blue-500',
      description: 'Torá • Moisés • Sinagoga',
      books: ['Torá', 'Talmud', 'Tanaj']
    },
    {
      id: 'buddhism',
      name: t.religion.buddhism,
      icon: Wind,
      color: 'from-orange-500 to-amber-500',
      description: 'Sutras • Buda • Templo',
      books: ['Tripitaka', 'Sutras Mahayana']
    },
    {
      id: 'hinduism',
      name: t.religion.hinduism,
      icon: Flame,
      color: 'from-red-500 to-pink-500',
      description: 'Vedas • Krishna • Mandir',
      books: ['Vedas', 'Upanishads', 'Bhagavad Gita']
    },
    {
      id: 'other',
      name: t.religion.other,
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      description: 'Otras tradiciones espirituales',
      books: []
    }
  ];

  const savePreferencesMutation = useMutation({
    mutationFn: async (data) => {
      if (!currentUser) {
        throw new Error('Debes iniciar sesión para guardar preferencias');
      }
      return await base44.entities.User.update(currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      changeLanguage(selectedLanguage);
      toast.success(t.common.success);
      setTimeout(() => {
        navigate(createPageUrl("Home"));
      }, 1000);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleSaveAndContinue = () => {
    if (step === 1) {
      changeLanguage(selectedLanguage);
      setStep(2);
    } else {
      // Guardar en el servidor
      savePreferencesMutation.mutate({
        religion: selectedReligion,
        preferences: {
          ...currentUser?.preferences,
          ui_language: selectedLanguage,
          show_religious_content: true
        }
      });
    }
  };

  const handleSkip = () => {
    if (step === 1) {
      setStep(2);
    } else {
      navigate(createPageUrl("Home"));
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-700'} text-white font-bold`}>
              {step > 1 ? <Check className="w-5 h-5" /> : '1'}
            </div>
            <div className={`h-1 w-24 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-700'}`} />
            <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-700'} text-white font-bold`}>
              2
            </div>
          </div>
          <div className="flex items-center justify-center gap-32 mt-2">
            <p className="text-sm text-gray-400">{t.religion.selectLanguage}</p>
            <p className="text-sm text-gray-400">{t.religion.selectReligion}</p>
          </div>
        </div>

        {/* Step 1: Idioma */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 border-white/10 p-8">
              <div className="text-center mb-8">
                <Globe className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <h1 className="text-3xl font-bold text-white mb-2">
                  {t.religion.selectLanguage}
                </h1>
                <p className="text-gray-400">
                  Selecciona tu idioma preferido para la interfaz
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedLanguage === lang.code
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-4xl mb-2">{lang.flag}</div>
                    <p className="text-white text-sm font-semibold">{lang.name}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white"
                >
                  Omitir
                </Button>
                <Button
                  onClick={handleSaveAndContinue}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Step 2: Religión */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-white/5 border-white/10 p-8">
              <div className="text-center mb-8">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-purple-400" />
                <h1 className="text-3xl font-bold text-white mb-2">
                  {t.religion.selectReligion}
                </h1>
                <p className="text-gray-400">
                  Personalizaremos tu experiencia según tu tradición espiritual
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {religions.map((religion) => {
                  const Icon = religion.icon;
                  return (
                    <button
                      key={religion.id}
                      onClick={() => setSelectedReligion(religion.id)}
                      className={`p-6 rounded-xl border-2 transition-all text-left ${
                        selectedReligion === religion.id
                          ? 'border-blue-500 bg-blue-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${religion.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {religion.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-3">
                        {religion.description}
                      </p>
                      {religion.books.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {religion.books.map((book, idx) => (
                            <span key={idx} className="text-xs px-2 py-1 rounded bg-white/10 text-gray-300">
                              {book}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-200">
                    <p className="font-semibold mb-1">🤖 Detección Automática con IA</p>
                    <p className="text-blue-300">
                      Nuestra IA puede detectar automáticamente tu religión e idioma según tus conversaciones. 
                      Puedes cambiar estas preferencias en cualquier momento desde tu perfil.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-gray-400 hover:text-white"
                >
                  {currentUser ? 'Omitir' : 'Continuar sin cuenta'}
                </Button>
                <Button
                  onClick={handleSaveAndContinue}
                  disabled={savePreferencesMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  {savePreferencesMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      {t.religion.save}
                      <Check className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}