'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import apiClient from '@/lib/api/client';
import {
  User as UserIcon,
  MessageCircle,
  GraduationCap,
  BookOpen,
  Mail,
  Phone,
  Edit,
  Lock,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';

interface UserProfileData {
  id: string;
  username: string;
  email?: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
    phone?: string;
  };
  student?: {
    class?: {
      name: string;
    };
  };
  teacher?: {
    subjects?: { name: string }[];
  };
  className?: string;
  subjects?: string[];
  isPrivate?: boolean;
  isBlocked?: boolean;
}

export default function ProfileViewPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user: currentUser } = useAuthStore();

  const userId = params?.id as string;
  const isOwnProfile = currentUser?.id === userId;

  const [userData, setUserData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/users/${userId}`);
      const data = res.data?.data || res.data;
      if (data) {
        setUserData(data);
      } else {
        setUserData(getMockProfile(userId));
      }
    } catch {
      // Fallback mock profile for development
      setUserData(getMockProfile(userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getMockProfile = (id: string): UserProfileData => {
    if (id === currentUser?.id) {
      return {
        id: currentUser.id,
        username: currentUser.username,
        email: currentUser.email,
        role: currentUser.role,
        profile: {
          firstName: currentUser.profile?.firstName || 'Current',
          lastName: currentUser.profile?.lastName || 'User',
          bio: 'Passionate about learning and digital education.',
          phone: currentUser.profile?.phone || '+1 555-0199',
        },
        student: currentUser.role === 'STUDENT' ? { class: { name: 'Grade 10-A' } } : undefined,
        teacher: currentUser.role === 'TEACHER' ? { subjects: [{ name: 'Mathematics' }, { name: 'Physics' }] } : undefined,
      };
    }

    return {
      id,
      username: 'johndoe',
      role: 'TEACHER',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Senior Science Teacher with 10 years of experience in STEM education.',
        phone: '+1 555-0142',
      },
      teacher: {
        subjects: [{ name: 'Physics' }, { name: 'Chemistry' }],
      },
    };
  };

  const handleSendMessage = () => {
    router.push(`/messages?user=${userId}`);
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'STUDENT':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'TEACHER':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'SCHOOL_ADMIN':
      case 'SUPER_ADMIN':
        return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'STUDENT':
        return t('roleStudent');
      case 'TEACHER':
        return t('roleTeacher');
      case 'SCHOOL_ADMIN':
        return t('roleSchoolAdmin');
      case 'SUPER_ADMIN':
        return t('roleSuperAdmin');
      case 'PARENT':
        return t('roleParent');
      default:
        return role || '';
    }
  };

  const fullName = userData?.profile?.firstName
    ? `${userData.profile.firstName} ${userData.profile.lastName || ''}`.trim()
    : userData?.username || '';

  const studentClassName = userData?.student?.class?.name || userData?.className;
  const teacherSubjects =
    userData?.teacher?.subjects?.map((s) => s.name) || userData?.subjects || [];

  return (
    <>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Navigation Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </button>

        {loading ? (
          <Card className="p-8 animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-muted" />
              <div className="space-y-2 flex-1">
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            </div>
            <div className="h-16 bg-muted rounded" />
          </Card>
        ) : userData?.isBlocked ? (
          <Card className="p-8 text-center space-y-3 border-destructive/30 bg-destructive/5">
            <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="text-lg font-bold text-foreground">{t('blockedTitle')}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('blockedMessage')}
            </p>
          </Card>
        ) : userData?.isPrivate ? (
          <Card className="p-8 text-center space-y-3 border-border">
            <Lock className="h-10 w-10 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-bold text-foreground">{fullName}</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('privateProfile')}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <Card className="p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  {userData?.profile?.avatar ? (
                    <img
                      src={userData.profile.avatar}
                      alt={fullName}
                      className="w-20 h-20 rounded-full object-cover border-2 border-border shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center border-2 border-primary/20 shadow-inner">
                      {userData?.profile?.firstName?.[0] || userData?.username?.[0]?.toUpperCase()}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-2xl font-bold text-foreground">{fullName}</h1>
                      <span
                        className={`text-xs font-semibold px-3 py-1 rounded-full border ${getRoleBadgeStyle(
                          userData?.role
                        )}`}
                      >
                        {getRoleLabel(userData?.role)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">@{userData?.username}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {isOwnProfile ? (
                    <Button
                      onClick={() => router.push('/profile/edit')}
                      leftIcon={<Edit className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                    >
                      {t('editProfile')}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSendMessage}
                      leftIcon={<MessageCircle className="h-4 w-4" />}
                      className="w-full sm:w-auto"
                    >
                      {t('sendMessage')}
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2 pt-4 border-t border-border">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t('bio')}
                </h3>
                <p className="text-sm text-foreground leading-relaxed italic">
                  {userData?.profile?.bio ? `"${userData.profile.bio}"` : t('noBio')}
                </p>
              </div>
            </Card>

            {/* Role Specific Details Card */}
            <Card className="p-6 space-y-4">
              <h3 className="text-base font-semibold text-foreground border-b border-border pb-3">
                Details & Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {studentClassName && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/40 border border-border">
                    <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t('class')}</p>
                      <p className="font-semibold text-foreground">{studentClassName}</p>
                    </div>
                  </div>
                )}

                {teacherSubjects.length > 0 && (
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/40 border border-border col-span-1 sm:col-span-2">
                    <BookOpen className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground font-medium">{t('subjects')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {teacherSubjects.map((sub, i) => (
                          <span
                            key={i}
                            className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-md font-semibold"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {userData?.email && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/40 border border-border">
                    <Mail className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">Email</p>
                      <p className="font-semibold text-foreground truncate">{userData.email}</p>
                    </div>
                  </div>
                )}

                {userData?.profile?.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/40 border border-border">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground font-medium">{t('phone')}</p>
                      <p className="font-semibold text-foreground">{userData.profile.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
