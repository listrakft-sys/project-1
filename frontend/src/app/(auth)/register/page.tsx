'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation, Language } from '@/lib/i18n';
import { useAuthStore, UserRole } from '@/lib/store/auth';
import api from '@/lib/api/client';
import { isDemoMode } from '@/lib/auth/demoUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { School, Lock, Mail, User, Globe, AlertCircle, UserCheck, Info } from 'lucide-react';

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

    // ── Demo mode: create local user ──
    if (demo) {
      await new Promise((r) => setTimeout(r, 600));
      const newUser = {
        id: 'local-' + Date.now(),
        email: formData.email,
        username: formData.username,
        role: formData.role,
        status: 'ACTIVE' as const,
        preferredLang: language as 'es' | 'de' | 'en' | 'ru',
        profile: { firstName: formData.firstName, lastName: formData.lastName },
      };
      login(newUser as any, 'demo-token-' + Date.now(), 'demo-refresh');
      router.push('/');
      return;
    }

    // ── Normal mode: real backend ──
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
    { code: 'ru', label: 'RU' },
    { code: 'es', label: 'ES' },
    { code: 'de', label: 'DE' },
    { code: 'en', label: 'EN' },
  ];

  const roles: { value: UserRole; labelKey: string }[] = [
    { value: 'STUDENT', labelKey: 'auth.studentRole' },
    { value: 'TEACHER', labelKey: 'auth.teacherRole' },
    { value: 'PARENT', labelKey: 'auth.parentRole' },
  ];

  return (
    <Card className="shadow-2xl border-border/50 backdrop-blur">
      <CardHeader className="space-y-3 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
              <School className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg text-foreground">EduPlatform</span>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50">
            <Globe className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all ${
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

        <div className="pt-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-center">{t('auth.register')}</CardTitle>
          <CardDescription className="text-center text-sm mt-1">{t('auth.welcome')}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('auth.firstName')}
              placeholder="Juan"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              leftIcon={<User className="h-4 w-4" />}
              required
            />
            <Input
              label={t('auth.lastName')}
              placeholder="Pérez"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
          </div>

          <Input
            label={t('auth.email')}
            placeholder="juan.perez@ejemplo.com"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
            required
          />

          <Input
            label={t('auth.username')}
            placeholder="juanperez"
            type="text"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            leftIcon={<UserCheck className="h-4 w-4" />}
            required
          />

          <Input
            label={t('auth.password')}
            placeholder="••••••••"
            type="password"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">{t('auth.role')}</label>
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleChange('role', r.value)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all ${
                    formData.role === r.value
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-input bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t(r.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full mt-4" size="lg" isLoading={isLoading}>
            {t('auth.registerButton')}
          </Button>
        </form>

        {demo && (
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/15 text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <span>Demo mode: your account will be saved locally in this browser only.</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center pt-2 pb-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          {t('auth.hasAccount')}{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline ml-1">
            {t('auth.login')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
