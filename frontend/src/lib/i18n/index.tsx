'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { es } from './dictionaries/es';
import { de } from './dictionaries/de';
import { en } from './dictionaries/en';

export type Language = 'es' | 'de' | 'en';

const dictionaries = {
  es,
  de,
  en,
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'school_platform_lang';

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (savedLang && ['es', 'de', 'en'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    const dict = dictionaries[language] || dictionaries.es;
    const keys = key.split('.');
    let current: any = dict;
    
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        return key;
      }
    }
    
    return typeof current === 'string' ? current : key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
