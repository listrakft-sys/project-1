import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (typeof window !== 'undefined'
    ? (localStorage.getItem('theme') as Theme) || 'system'
    : 'system'),
  setTheme: (theme: Theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  },
}));
