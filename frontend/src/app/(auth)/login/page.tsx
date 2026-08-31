'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation, Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import { findDemoUser, isDemoMode, DEMO_USERS } from '@/lib/auth/demoUsers';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, Globe, AlertCircle, User, Eye, EyeOff, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demo = isDemoMode();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    if (demo) {
      await new Promise((r) => setTimeout(r, 600));
      const demoUser = findDemoUser(identifier, password);
      if (!demoUser) {
        setError('Invalid username or password');
        setIsLoading(false);
        return;
      }
      const { demoPassword, ...userData } = demoUser;
      login(userData as any, 'demo-token-' + Date.now(), 'demo-refresh');
      router.push('/');
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        emailOrUsername: identifier,
        password,
      });
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      router.push('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = axiosErr.response?.data?.error?.message || axiosErr.message || 'Login failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (username: string, pass: string) => {
    setIdentifier(username);
    setPassword(pass);
    setError(null);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'es', label: 'ES' },
    { code: 'de', label: 'DE' },
    { code: 'en', label: 'EN' },
  ];

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: 'from-purple-500 to-purple-600',
    SCHOOL_ADMIN: 'from-blue-500 to-blue-600',
    TEACHER: 'from-emerald-500 to-emerald-600',
    STUDENT: 'from-amber-500 to-amber-600',
    PARENT: 'from-orange-500 to-orange-600',
  };

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    SCHOOL_ADMIN: 'Admin',
    TEACHER: 'Учитель',
    STUDENT: 'Студент',
    PARENT: 'Родитель',
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        {/* Mobile logo */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <span className="font-bold text-lg text-foreground">EduPlatform</span>
        </div>

        {/* Language switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 ml-auto">
          <Globe className="h-3.5 w-3.5 ml-1.5 text-muted-foreground" />
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all ${
                language === lang.code
                  ? 'bg-background text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Title ── */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">С возвращением 👋</h1>
        <p className="text-muted-foreground text-sm">Войдите в свой аккаунт, чтобы продолжить</p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Identifier */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">
            Email или имя пользователя
          </label>
          <div className="relative group">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="username или email@example.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-input bg-muted/30 px-3 pl-11 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Пароль</label>
            <button type="button" className="text-xs text-primary hover:underline font-medium">
              Забыли пароль?
            </button>
          </div>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex h-12 w-full rounded-xl border border-input bg-muted/30 px-3 pl-11 pr-11 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold rounded-xl group"
          size="lg"
          isLoading={isLoading}
          rightIcon={!isLoading ? <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" /> : undefined}
        >
          Войти
        </Button>
      </form>

      {/* ── Divider ── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground font-medium">или</span>
        </div>
      </div>

      {/* ── Demo accounts ── */}
      {demo && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Demo-аккаунты — нажмите для входа</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {Object.entries(DEMO_USERS).map(([key, user]) => (
              <button
                key={key}
                onClick={() => fillDemo(user.username, user.demoPassword)}
                className="text-left p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/30 hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleColors[user.role] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {user.profile?.firstName?.[0] || user.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-foreground">
                      {roleLabels[user.role] || user.role}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {user.username}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Register link ── */}
      <div className="text-center pt-2">
        <p className="text-sm text-muted-foreground">
          Нет аккаунта?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline inline-flex items-center gap-1">
            Регистрация
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
}
