'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation, Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';

const languages: { code: Language; label: string; flag: string }[] = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (code: Language) => {
    setLanguage(code);
    setIsOpen(false);
    if (user) {
      try {
        await api.put(`/users/${user.id}`, { preferredLang: code });
      } catch {
        // Silently catch error if backend update fails
      }
    }
  };

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
      >
        <Globe size={14} className="text-muted-foreground" />
        <span>{currentLang.flag} {currentLang.label}</span>
        <ChevronDown size={12} className="text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-md border border-border bg-card shadow-lg ring-1 ring-black ring-opacity-5 z-50 py-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-accent ${
                language === lang.code ? 'bg-accent/60 font-semibold text-primary' : 'text-foreground'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
