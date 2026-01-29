'use client';

import { Globe } from 'lucide-react';
import { useLocale } from '../contexts/LocaleContext';

interface LocaleSwitcherProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export default function LocaleSwitcher({ variant = 'compact', className = '' }: LocaleSwitcherProps) {
  const { locale, setLocale, t } = useLocale();

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Globe className="w-4 h-4 text-slate-400" />
        <span className="text-xs text-slate-500">{t.common.language}:</span>
        <div className="flex gap-1">
          <button
            onClick={() => setLocale('vi')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              locale === 'vi' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🇻🇳 VI
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
              locale === 'en' 
                ? 'bg-teal-500 text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🇬🇧 EN
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setLocale(locale === 'vi' ? 'en' : 'vi')}
      className={`px-2 py-1 text-xs font-medium bg-white/10 hover:bg-white/20 rounded transition-colors ${className}`}
      title={locale === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      {locale === 'vi' ? '🇻🇳 VI' : '🇬🇧 EN'}
    </button>
  );
}
