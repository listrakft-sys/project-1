'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTranslation } from '@/lib/i18n';
import apiClient from '@/lib/api/client';
import {
  Bell,
  MessageCircle,
  FileText,
  Megaphone,
  CheckCheck,
  CheckCircle2,
  Calendar,
  GraduationCap,
  ShieldAlert,
  AlertTriangle,
  Filter,
} from 'lucide-react';

interface NotificationItemData {
  id: string;
  type: 'MESSAGE' | 'SYSTEM' | 'HOMEWORK' | 'ANNOUNCEMENT' | 'LESSON' | 'SCHEDULE' | 'REPORT' | 'COMPLAINT' | 'GENERAL';
  title: string;
  content: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<NotificationItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/notifications');
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setNotifications(data);
      } else {
        // Mock notifications fallback
        setNotifications(getMockNotifications());
      }
    } catch {
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put('/notifications/read-all');
    } catch {
      // optimistic update
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
    } catch {
      // optimistic update
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const getMockNotifications = (): NotificationItemData[] => [
    {
      id: 'notif-1',
      type: 'ANNOUNCEMENT',
      title: 'School Closed on Friday',
      content: 'Please note that the school will be closed this Friday for staff development day.',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'notif-2',
      type: 'HOMEWORK',
      title: 'Mathematics Homework Assigned',
      content: 'Chapter 5 Algebra exercises 1-15 are due on Monday at 09:00 AM.',
      isRead: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'notif-3',
      type: 'MESSAGE',
      title: 'New Message from Prof. Garcia',
      content: 'Hello, please review the study guide before tomorrow\'s quiz.',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      id: 'notif-4',
      type: 'SYSTEM',
      title: 'Password Security Reminder',
      content: 'Your password was changed 90 days ago. Consider updating it in settings.',
      isRead: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
  ];

  const getTypeIcon = (type: NotificationItemData['type']) => {
    switch (type) {
      case 'MESSAGE':
        return <MessageCircle className="h-5 w-5 text-emerald-500" />;
      case 'SYSTEM':
        return <Bell className="h-5 w-5 text-amber-500" />;
      case 'HOMEWORK':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="h-5 w-5 text-purple-500" />;
      case 'LESSON':
        return <GraduationCap className="h-5 w-5 text-indigo-500" />;
      case 'SCHEDULE':
        return <Calendar className="h-5 w-5 text-teal-500" />;
      case 'REPORT':
        return <ShieldAlert className="h-5 w-5 text-rose-500" />;
      case 'COMPLAINT':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'UNREAD') return !n.isRead;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" />
              {t('notifications')}
              {unreadCount > 0 && (
                <span className="text-xs bg-primary text-primary-foreground font-semibold px-2 py-0.5 rounded-full">
                  {unreadCount} {t('unread')}
                </span>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Stay updated with system messages, class announcements, and homework assignments.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck className="h-4 w-4" />}
          >
            {t('markAllAsRead')}
          </Button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0 ml-1" />
          {[
            { id: 'ALL', label: t('all') },
            { id: 'UNREAD', label: t('unread') },
            { id: 'ANNOUNCEMENT', label: t('ANNOUNCEMENT') },
            { id: 'HOMEWORK', label: t('HOMEWORK') },
            { id: 'MESSAGE', label: t('MESSAGE') },
            { id: 'SYSTEM', label: t('SYSTEM') },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="p-12 text-center space-y-3 border-dashed">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <Bell className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">{t('noNotifications')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You are all caught up! No notifications matching your filter.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const formattedDate = new Date(notif.createdAt).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <Card
                  key={notif.id}
                  className={`p-4 transition-all border ${
                    notif.isRead
                      ? 'bg-card border-border opacity-90'
                      : 'bg-primary/5 border-primary/30 shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-background border border-border shrink-0">
                      {getTypeIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {notif.title}
                        </h4>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                          {formattedDate}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {notif.content}
                      </p>
                      {notif.link && (
                        <a
                          href={notif.link}
                          className="inline-block text-xs font-semibold text-primary hover:underline mt-1"
                        >
                          {t('linkedResource')} &rarr;
                        </a>
                      )}
                    </div>

                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notif.id)}
                        className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                        title={t('markAllAsRead')}
                      >
                        <CheckCircle2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
