'use client';

import React from 'react';
import Link from 'next/link';
import { User, MessageCircle, BookOpen, GraduationCap } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useTranslation } from '@/lib/i18n';

export interface UserCardData {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
  profile?: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
  };
  student?: {
    class?: {
      name: string;
    };
  };
  teacher?: {
    subjects?: { name: string }[];
  };
  className?: string; // Alternative class string
  subjects?: string[]; // Alternative subjects array
}

interface ProfileCardProps {
  user: UserCardData;
  onMessage?: (userId: string) => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user, onMessage }) => {
  const { t } = useTranslation();

  const name = user.profile
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : user.username;

  const roleBadges = {
    STUDENT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    TEACHER: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    SCHOOL_ADMIN: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    SUPER_ADMIN: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    PARENT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  };

  const roleLabels = {
    STUDENT: t('roleStudent'),
    TEACHER: t('roleTeacher'),
    SCHOOL_ADMIN: t('roleSchoolAdmin'),
    SUPER_ADMIN: t('roleSuperAdmin'),
    PARENT: t('roleParent'),
  };

  const studentClassName = user.student?.class?.name || user.className;
  const teacherSubjects =
    user.teacher?.subjects?.map((s) => s.name) || user.subjects || [];

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col justify-between h-full space-y-4">
      <div className="space-y-3">
        {/* Header with Avatar and Role */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {user.profile?.avatar ? (
              <img
                src={user.profile.avatar}
                alt={name}
                className="w-12 h-12 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-lg">
                {user.profile?.firstName?.[0] || user.username[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-base text-foreground truncate">{name}</h3>
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
            </div>
          </div>

          <span
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
              roleBadges[user.role] || roleBadges.STUDENT
            }`}
          >
            {roleLabels[user.role] || user.role}
          </span>
        </div>

        {/* Extra info for Student / Teacher */}
        {studentClassName && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-accent/40 p-2 rounded-lg">
            <GraduationCap size={14} className="text-primary" />
            <span className="font-medium text-foreground">{t('class')}:</span>
            <span>{studentClassName}</span>
          </div>
        )}

        {teacherSubjects.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
              <BookOpen size={12} /> {t('subjects')}:
            </span>
            <div className="flex flex-wrap gap-1">
              {teacherSubjects.map((sub, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded font-medium"
                >
                  {sub}
                </span>
              ))}
            </div>
          </div>
        )}

        {user.profile?.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 italic">
            "{user.profile.bio}"
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <Link href={`/profile/${user.id}`} className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            {t('viewProfile')}
          </Button>
        </Link>
        {onMessage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMessage(user.id)}
            title={t('sendMessage')}
          >
            <MessageCircle size={14} />
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ProfileCard;
