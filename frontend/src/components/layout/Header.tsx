'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation, Language } from '@/lib/i18n';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/lib/store/auth';
import { useRouter } from 'next/navigation';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Globe,
  User,
  LogOut,
  Settings,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuToggle }) => {
  const { language, setLanguage, t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const router = Router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setIsUserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur border-b border-border px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu Trigger + Search Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('common.search')}
            className="w-full h-9 pl-9 pr-4 rounded-md bg-muted/50 border border-input text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-all"
          />
        </div>
      </div>

      {/* Right Actions: Notifications, Language, Theme, User Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={t('nav.notifications')}
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary animate-pulse" />
        </button>

        {/* Language Switcher */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Language selector"
          >
            <Globe className="h-4 w-4" />
            <span className="uppercase text-xs font-semibold">{language}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 mt-2 w-36 rounded-lg bg-card border border-border shadow-lg py-1 z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsLangOpen(false);
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-left hover:bg-muted transition-colors ${
                    language === lang.code ? 'text-primary font-bold bg-primary/10' : 'text-foreground'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5" />}
          </button>
        )}

        {/* User Menu */}
        <div className="relative ml-1" ref={userRef}>
          <button
            onClick={() => setIsUserOpen(!isUserOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
              {user?.profile?.firstName?.[0] || user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </button>

          {isUserOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-card border border-border shadow-xl py-2 z-50">
              <div className="px-4 py-2.5 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : user?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setIsUserOpen(false);
                    router.push('/profile');
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{t('nav.profile')}</span>
                </button>

                <button
                  onClick={() => {
                    setIsUserOpen(false);
                    router.push('/settings');
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>{t('nav.settings')}</span>
                </button>
              </div>

              <div className="pt-1 border-t border-border">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
