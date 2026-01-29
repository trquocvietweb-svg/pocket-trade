'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Locale } from '../lib/i18n/translations';

type Translations = typeof translations;

interface LocaleContextType {
  locale: Locale;
  t: Translations[Locale];
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ 
  children,
  initialLocale = 'vi'
}: { 
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    // Đọc locale từ cookie nếu có
    const savedLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] as Locale | undefined;
    
    if (savedLocale && (savedLocale === 'vi' || savedLocale === 'en')) {
      setLocaleState(savedLocale);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`;
  };

  return (
    <LocaleContext.Provider value={{ 
      locale, 
      t: translations[locale],
      setLocale 
    }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
