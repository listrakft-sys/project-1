'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  BookOpen,
  MessageCircle,
  GraduationCap,
  Calendar,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Megaphone,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export interface Notification {
  id: string;
  type:
    | 'ANNOUNCEMENT'
    | 'HOMEWORK'
    | 'MESSAGE'
    | 'LESSON'
    | 'SCHEDULE'
    | 'SYSTEM'
    | 'REPORT'
    | 'COMPLAINT'
    | 'GENERAL';
  title: string;
  content: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string | Date;
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead?: (id: string) => void;
}

const typeIconMap = {
  ANNOUNCEMENT: { icon: Megaphone, color: 'text-amber-500 bg-amber-500/10' },
  HOMEWORK: { icon: BookOpen, color: 'text-blue-500 bg-blue-500/10' },
  MESSAGE: { icon: MessageCircle, color: 'text-green-500 bg-green-500/10' },
  LESSON: { icon: GraduationCap, color: 'text-purple-500 bg-purple-500/10' },
  SCHEDULE: { icon: Calendar, color: 'text-indigo-500 bg-indigo-500/10' },
  SYSTEM: { icon: ShieldAlert, color: 'text-red-500 bg-red-500/10' },
  REPORT: { icon: FileText, color: 'text-teal-500 bg-teal-500/10' },
  COMPLAINT: { icon: AlertTriangle, color: 'text-rose-500 bg-rose-500/10' },
  GENERAL: { icon: Bell, color: 'text-slate-500 bg-slate-500/10' },
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkRead,
}) => {
  const { t } = useTranslation();
  const typeConfig = typeIconMap[notification.type] || typeIconMap.GENERAL;
  const Icon = typeConfig.icon;

  const formattedDate = new Date(notification.createdAt).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const contentElement = (
    <div
      className={`p-4 rounded-xl border transition-all flex items-start gap-3 ${
        notification.isRead
          ? 'bg-card border-border text-foreground opacity-80'
          : 'bg-primary/5 border-primary/20 text-foreground font-medium shadow-sm'
      }`}
    >
      <div className={`p-2.5 rounded-lg shrink-0 ${typeConfig.color}`}>
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold truncate">{notification.title}</h4>
          <span className="text-[11px] text-muted-foreground shrink-0">{formattedDate}</span>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.content}</p>

        {notification.link && (
          <span className="inline-block text-xs font-semibold text-primary hover:underline mt-1">
            {t('linkedResource')} &rarr;
          </span>
        )}
      </div>

      {!notification.isRead && onMarkRead && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
          className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
          title={t('markAllAsRead')}
        >
          <CheckCircle2 size={18} />
        </button>
      )}
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block group">
        {contentElement}
      </Link>
    );
  }

  return contentElement;
};

export default NotificationItem;
