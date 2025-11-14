import React, { createContext, useContext, useState, useEffect } from 'react';
import { detectBrowserLanguage, translations } from '@/components/utils/translations';
import { base44 } from '@/api/base44Client';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('es'); // Español por defecto
  const [isRTL, setIsRTL] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Inicializar idioma
  useEffect(() => {
    initializeLanguage();
  }, []);

  const initializeLanguage = async () => {
    try {
      // 1. Intentar obtener usuario actual
      const user = await base44.auth.me();
      setCurrentUser(user);
      
      // 2. Prioridad: Idioma del usuario
      if (user?.preferences?.ui_language) {
        changeLanguage(user.preferences.ui_language);
        return;
      }
      
      // 3. Idioma detectado por IA
      if (user?.ai_detection?.detected_language) {
        changeLanguage(user.ai_detection.detected_language);
        return;
      }
    } catch (error) {
      console.log('Usuario no autenticado');
    }
    
    // 4. Idioma guardado en localStorage
    const savedLang = localStorage.getItem('app_language');
    if (savedLang && translations[savedLang]) {
      changeLanguage(savedLang);
      return;
    }
    
    // 5. Idioma del navegador
    const browserLang = detectBrowserLanguage();
    changeLanguage(browserLang);
  };

  const changeLanguage = (newLang) => {
    if (!translations[newLang]) {
      console.warn(`Idioma ${newLang} no soportado, usando español`);
      newLang = 'es';
    }
    
    setLanguage(newLang);
    setIsRTL(newLang === 'ar' || newLang === 'he'); // Árabe y Hebreo son RTL
    localStorage.setItem('app_language', newLang);
    
    // Actualizar dirección del documento
    document.documentElement.dir = (newLang === 'ar' || newLang === 'he') ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const t = translations[language] || translations.es;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      changeLanguage, 
      t,
      isRTL,
      currentUser
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
}