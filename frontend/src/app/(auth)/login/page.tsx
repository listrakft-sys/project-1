'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation, Language } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { School, Lock, Mail, Globe, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { t, language, setLanguage } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [identifier, setIdentifier] = useState(''); // email or username
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isEmail = identifier.includes('@');
      const payload = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      const response = await api.post('/auth/login', payload);
      const { user, token } = response.data.data;

      login(user, token);
      router.push('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Error al iniciar sesión';
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
            placeholder="email@ejemplo.com o usuario"
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            leftIcon={<Mail className="h-4 w-4" />}
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
