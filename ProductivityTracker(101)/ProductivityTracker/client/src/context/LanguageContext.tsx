import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

// Type for the language context
interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  dir: 'rtl' | 'ltr';
}

// Create the context
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<string>(localStorage.getItem('language') || 'ar');
  const [dir, setDir] = useState<'rtl' | 'ltr'>(language === 'ar' ? 'rtl' : 'ltr');

  // Set the language
  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setDir(lang === 'ar' ? 'rtl' : 'ltr');
    
    // Update document direction
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    // Force reload to apply language changes
    setTimeout(() => {
      const event = new Event('languageChange');
      window.dispatchEvent(event);
      console.log('Language changed to:', lang);
    }, 0);
  };

  // Initialize language on component mount
  useEffect(() => {
    if (language) {
      i18n.changeLanguage(language);
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [i18n, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};