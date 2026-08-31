'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation, Language } from '@/lib/i18n';
import { useAuthStore, UserRole } from '@/lib/store/auth';
import api from '@/lib/api/client';
import { isDemoMode } from '@/lib/auth/demoUsers';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, Globe, AlertCircle, User, UserCheck, Eye, EyeOff, Info, ArrowRight, GraduationCap, Users, Heart } from 'lucide-react';

export default function RegisterPage() {
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STUDENT' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const demo = isDemoMode();

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.username || !formData.password || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    if (demo) {
      await new Promise((r) => setTimeout(r, 600));
      const newUser = {
        id: 'local-' + Date.now(),
        email: formData.email,
        username: formData.username,
        role: formData.role,
        status: 'ACTIVE' as const,
        preferredLang: language as 'es' | 'de' | 'en',
        profile: { firstName: formData.firstName, lastName: formData.lastName },
      };
      login(newUser as any, 'demo-token-' + Date.now(), 'demo-refresh');
      router.push('/');
      return;
    }

    try {
      const response = await api.post('/auth/register', {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
        preferredLang: language,
      });
      const { user, accessToken, refreshToken } = response.data.data;
      login(user, accessToken, refreshToken);
      router.push('/');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const msg = axiosErr.response?.data?.error?.message || axiosErr.message || 'Registration failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'es', label: 'ES' },
    { code: 'de', label: 'DE' },
    { code: 'en', label: 'EN' },
  ];

  const roles = [
    { value: 'STUDENT' as UserRole, label: 'Студент', icon: GraduationCap, color: 'from-amber-500 to-amber-600' },
    { value: 'TEACHER' as UserRole, label: 'Учитель', icon: Users, color: 'from-emerald-500 to-emerald-600' },
    { value: 'PARENT' as UserRole, label: 'Родитель', icon: Heart, color: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <Link href="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="h-4 w-4 rotate-180" />
          <span>Назад</span>
        </Link>

        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Создать аккаунт</h1>
        <p className="text-muted-foreground text-sm">Зарегистрируйтесь, чтобы присоединиться к платформе</p>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role selector */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Я хочу зарегистрироваться как:</label>
          <div className="grid grid-cols-3 gap-2.5">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = formData.role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleChange('role', r.value)}
                  className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    isActive
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-accent/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white ${isActive ? 'scale-110' : 'scale-100'} transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {r.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Имя</label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Иван"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-muted/30 px-3 pl-11 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Фамилия</label>
            <input
              type="text"
              placeholder="Иванов"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className="flex h-12 w-full rounded-xl border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Email</label>
          <div className="relative group">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="email"
              placeholder="ivanov@ejemplo.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="flex h-12 w-full rounded-xl border border-input bg-muted/30 px-3 pl-11 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Имя пользователя</label>
          <div className="relative group">
            <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder="ivanov"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              className="flex h-12 w-full rounded-xl border border-input bg-muted/30 px-3 pl-11 py-2 text-sm ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Пароль</label>
          <div className="relative group">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
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
          Зарегистрироваться
        </Button>
      </form>

      {/* Demo notice */}
      {demo && (
        <div className="p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <span>Demo mode: аккаунт сохраняется только в этом браузере.</span>
        </div>
      )}

      {/* Login link */}
      <div className="text-center pt-1">
        <p className="text-sm text-muted-foreground">
          Уже есть аккаунт?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline inline-flex items-center gap-1">
            Войти
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </div>
  );
}
