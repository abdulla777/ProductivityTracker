import { useTranslation } from "react-i18next";

// Custom hook to provide fallback text when translation keys are missing
export function useTranslationWithFallback() {
  const { t, i18n } = useTranslation();

  const tWithFallback = (key: string, fallback?: string, options?: any): string => {
    const translation = t(key, options);
    
    // If translation returns the key itself, it means the key is missing
    if (translation === key && fallback) {
      return fallback;
    }
    
    return typeof translation === 'string' ? translation : key;
  };

  return { t: tWithFallback, i18n };
}