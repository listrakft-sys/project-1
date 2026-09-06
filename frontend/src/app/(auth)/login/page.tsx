'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation, Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import { findDemoUser, isDemoMode, DEMO_USERS } from '@/lib/auth/demoUsers';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { School, Lock, Mail, Globe, AlertCircle, User, Info } from 'lucide-react';

export default function LoginPage() {
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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

    // ── Demo mode: no backend, authenticate locally ──
    if (demo) {
      await new Promise((r) => setTimeout(r, 600)); // simulate delay
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

    // ── Normal mode: real backend ──
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

  // Quick fill demo account
  const fillDemo = (username: string, pass: string) => {
    setIdentifier(username);
    setPassword(pass);
    setError(null);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'es', label: 'ES' },
    { code: 'de', label: 'DE' },
    { code: 'en', label: 'EN' },
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

          {/* Language Selector */}
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
          <CardTitle className="text-2xl font-bold tracking-tight text-center">{t('auth.login')}</CardTitle>
          <CardDescription className="text-center text-sm mt-1">{t('auth.welcome')}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label={`${t('auth.email')} / ${t('auth.username')}`}
            placeholder="username or email"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<User className="h-4 w-4" />}
            required
          />

          <Input
            label={t('auth.password')}
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="h-4 w-4" />}
            required
          />

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={isLoading}>
            {t('auth.loginButton')}
          </Button>
        </form>

        {/* Demo accounts quick-fill */}
        {demo && (
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/15 space-y-3">
            <div className="flex items-center gap-2 text-primary font-medium text-sm">
              <Info className="h-4 w-4" />
              <span>Demo accounts — click to fill</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(DEMO_USERS).map(([key, user]) => (
                <button
                  key={key}
                  onClick={() => fillDemo(user.username, user.demoPassword)}
                  className="text-left p-2.5 rounded-lg bg-card hover:bg-accent border border-border/50 transition-colors group"
                >
                  <div className="font-semibold text-sm text-foreground capitalize">
                    {user.role.toLowerCase().replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {user.username} / {user.demoPassword}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {user.profile?.firstName} {user.profile?.lastName}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center pt-2 pb-6 border-t border-border/50">
        <p className="text-sm text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline ml-1">
            {t('auth.register')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
