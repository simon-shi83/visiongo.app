import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportedLocale, LanguageInfo, SUPPORTED_LANGUAGES, TranslationDictionary } from '../types/i18n';
import { en } from './locales/en';
import { zh } from './locales/zh';

const LOCALES_MAP: Record<SupportedLocale, TranslationDictionary> = {
  en,
  zh,
};

interface LanguageContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: TranslationDictionary;
  languages: LanguageInfo[];
  isZh: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    // 1. Check URL parameters (?lang=zh or ?lang=en)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const langParam = params.get('lang')?.toLowerCase();
      if (langParam === 'zh' || langParam === 'en') {
        return langParam as SupportedLocale;
      }

      // 2. Check localStorage
      const saved = localStorage.getItem('visiongo_locale');
      if (saved === 'zh' || saved === 'en') {
        return saved as SupportedLocale;
      }

      // 3. Fallback to browser language
      const browserLang = navigator.language?.toLowerCase() || '';
      if (browserLang.startsWith('zh')) {
        return 'zh';
      }
    }
    return 'en';
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('visiongo_locale', newLocale);

      // Keep URL clean or update query param if user specifically wants shareable link
      const url = new URL(window.location.href);
      if (newLocale === 'en') {
        url.searchParams.delete('lang');
      } else {
        url.searchParams.set('lang', newLocale);
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    }
  }, [locale]);

  const value: LanguageContextType = {
    locale,
    setLocale,
    t: LOCALES_MAP[locale] || en,
    languages: SUPPORTED_LANGUAGES,
    isZh: locale === 'zh',
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
