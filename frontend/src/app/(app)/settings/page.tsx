'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Toggle } from '@/components/Toggle';
import api from '@/lib/api/client';
import { Globe, Moon, Lock, UserCog, Check } from 'lucide-react';

type Tab = 'language' | 'theme' | 'privacy' | 'account';

export default function SettingsPage() {
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('language');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'school',
    whoCanMessage: 'everyone',
    showEmail: false,
    showPhone: false,
    showAddress: false,
    searchableByName: true,
    searchableByUsername: true,
  });

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'language', label: t('tabLanguage'), icon: <Globe className="h-4 w-4" /> },
    { id: 'theme', label: t('tabTheme'), icon: <Moon className="h-4 w-4" /> },
    { id: 'privacy', label: t('tabPrivacy'), icon: <Lock className="h-4 w-4" /> },
    { id: 'account', label: t('tabAccount'), icon: <UserCog className="h-4 w-4" /> },
  ];

  const handleSavePrivacy = async () => {
    setSaving(true);
    try {
      await api.put('/users/me/privacy', privacy);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save privacy settings', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold">{t('settings')}</h1>

        <div className="flex gap-2 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Language */}
        {activeTab === 'language' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('selectLanguage')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {([
                { code: 'es', label: 'Español', flag: '🇪🇸' },
                { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                { code: 'en', label: 'English', flag: '🇬🇧' },
              ] as const).map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    language === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium">{lang.label}</span>
                  {language === lang.code && <Check className="h-4 w-4 text-primary ml-auto" />}
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Theme */}
        {activeTab === 'theme' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('selectTheme')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    className="p-4 rounded-lg border border-border hover:border-primary/50 text-center transition-colors"
                  >
                    <p className="font-medium capitalize">{t(`theme${theme.charAt(0).toUpperCase() + theme.slice(1)}`)}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy */}
        {activeTab === 'privacy' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('tabPrivacy')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">{t('profileVisibility')}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={privacy.profileVisibility}
                  onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value })}
                >
                  <option value="public">Público</option>
                  <option value="school">Solo mi escuela</option>
                  <option value="private">Privado</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">{t('whoCanMessage')}</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={privacy.whoCanMessage}
                  onChange={(e) => setPrivacy({ ...privacy, whoCanMessage: e.target.value })}
                >
                  <option value="everyone">Todos</option>
                  <option value="school">Solo mi escuela</option>
                  <option value="nobody">Nadie</option>
                </select>
              </div>
              {[
                { key: 'showEmail', label: t('showEmail') },
                { key: 'showPhone', label: t('showPhone') },
                { key: 'showAddress', label: t('showAddress') },
                { key: 'searchableByName', label: t('searchableByName') },
                { key: 'searchableByUsername', label: t('searchableByUsername') },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <Toggle
                    checked={privacy[item.key as keyof typeof privacy] as boolean}
                    onChange={(val) => setPrivacy({ ...privacy, [item.key]: val })}
                  />
                </div>
              ))}
              <Button onClick={handleSavePrivacy} disabled={saving} className="mt-4">
                {saved ? `✓ ${t('success')}` : saving ? t('saving') : t('save')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account */}
        {activeTab === 'account' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('changePassword')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input type="password" placeholder={t('currentPassword')} />
              <Input type="password" placeholder={t('newPassword')} />
              <Input type="password" placeholder={t('confirmPassword')} />
              <Button>{t('save')}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
