import { useTranslation } from "react-i18next";
import { useLanguage } from "@/context/LanguageContext";

// Utility function to provide fallback text when translation keys are missing
export function getTranslationWithFallback(translationFunction: (key: string) => string, key: string, fallback: string): string {
  const translation = translationFunction(key);
  
  // If translation returns the key itself, it means the key is missing
  if (translation === key) {
    return fallback;
  }
  
  return translation;
}

// Hook for getting translations with fallback support that responds to language changes
export function useTranslationWithFallback() {
  const { t, i18n } = useTranslation();
  const { language } = useLanguage();
  
  return (key: string, fallback: string): string => {
    const translation = t(key);
    
    // If translation returns the key itself, it means the key is missing
    if (translation === key) {
      return fallback;
    }
    
    return translation;
  };
}

// Enhanced translation hook that ensures component re-renders on language change
export function useResponsiveTranslation() {
  const { t, i18n } = useTranslation();
  const { language } = useLanguage();
  
  // This function will automatically re-evaluate when language changes
  const getTranslation = (key: string, fallback: string): string => {
    const translation = t(key);
    
    // If translation returns the key itself, it means the key is missing
    if (translation === key || !translation) {
      return fallback;
    }
    
    return translation;
  };
  
  return { getTranslation, t, language, i18n };
}