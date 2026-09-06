'use client';

import React, { useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/lib/store/theme';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="p-2 rounded-lg border border-input bg-background hover:bg-accent text-foreground transition-colors"
      title={`Tema actual: ${theme}`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={16} className="text-yellow-400" /> : <Moon size={16} className="text-slate-700 dark:text-slate-200" />}
    </button>
  );
};

export default ThemeToggle;
