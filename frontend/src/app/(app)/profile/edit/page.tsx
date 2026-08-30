'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';
import { User, Camera, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfileEditPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    avatar: '',
    bio: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/users/${user.id}/profile`);
        const data = res.data?.data || res.data;
        if (data) {
          setFormData({
            firstName: data.firstName || user.profile?.firstName || '',
            lastName: data.lastName || user.profile?.lastName || '',
            avatar: data.avatar || user.profile?.avatar || '',
            bio: data.bio || '',
            phone: data.phone || user.profile?.phone || '',
          });
        }
      } catch {
        // Fallback to auth store user data
        setFormData({
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          avatar: user.profile?.avatar || '',
          bio: 'Passionate about learning and digital education.',
          phone: user.profile?.phone || '',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setSaving(true);
    setSuccessMsg(false);
    setErrorMsg(null);

    try {
      const res = await apiClient.put(`/users/${user.id}/profile`, formData);
      const updatedProfile = res.data?.data || res.data || formData;

      // Update local state and auth store
      if (user) {
        setUser({
          ...user,
          profile: {
            ...user.profile,
            firstName: formData.firstName,
            lastName: formData.lastName,
            avatar: formData.avatar,
            phone: formData.phone,
          },
        });
      }

      setSuccessMsg(true);
      setTimeout(() => {
        router.push(`/profile/${user.id}`);
      }, 1200);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
      setErrorMsg(axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || axiosErr.message || t("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const mockUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, avatar: mockUrl }));
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Top Back Navigation */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </button>

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <User className="h-7 w-7 text-primary" />
            {t('editProfile')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update your personal details, profile picture, and public bio.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold">{t('success')}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-semibold">{errorMsg}</span>
          </div>
        )}

        {loading ? (
          <Card className="p-6 animate-pulse space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </Card>
        ) : (
          <Card className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center justify-center space-y-3 pb-6 border-b border-border">
                <div className="relative group">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar"
                      className="w-24 h-24 rounded-full object-cover border-2 border-primary/20 shadow-md"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-primary/10 text-primary font-bold text-3xl flex items-center justify-center border-2 border-primary/20">
                      {formData.firstName?.[0] || user?.username?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <label className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarFileChange}
                    />
                  </label>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {t('avatarPlaceholder')}
                </span>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('firstName')}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
                <Input
                  label={t('lastName')}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>

              <Input
                label={t('phone')}
                placeholder="+1 555-0199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">{t('bio')}</label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell others a bit about yourself..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={saving}
                >
                  {t('cancel')}
                </Button>
                <Button
                  type="submit"
                  isLoading={saving}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {t('save')}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
