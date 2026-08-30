import { create } from 'zustand';
import api from '../api/client';

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'INACTIVE';
  preferredLang?: 'en' | 'es' | 'de';
  schoolId?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    phone?: string;
    bio?: string;
  };
  teacher?: any;
  student?: any;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken?: string) => void;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  initAuth: () => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null,
  isAuthenticated: typeof window !== 'undefined' ? !!localStorage.getItem('token') : false,
  isLoading: false,

  login: (user, token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user, token, refreshToken: refreshToken ?? null, isAuthenticated: true });
  },

  setAuth: (user, token, refreshToken) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    }
    set({ user, token, refreshToken: refreshToken ?? null, isAuthenticated: true });
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    }
    set({ token, isAuthenticated: !!token });
  },

  initAuth: async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      set({ isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data || response.data, isAuthenticated: true, isLoading: false });
    } catch {
      // Token is invalid or expired
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
  },

  updateUser: (user) => set({ user }),
}));
