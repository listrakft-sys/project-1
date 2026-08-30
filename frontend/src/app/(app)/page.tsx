'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { useTranslation } from '@/lib/i18n';
import { LessonCard, DashboardLessonProps } from '@/components/dashboard/LessonCard';
import { HomeworkCard, DashboardHomeworkProps } from '@/components/dashboard/HomeworkCard';
import { AnnouncementCard, DashboardAnnouncementProps } from '@/components/dashboard/AnnouncementCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  BookOpen,
  FileText,
  MessageSquare,
  Bell,
  Calendar,
  Sparkles,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Megaphone,
} from 'lucide-react';

interface StatsState {
  unreadMessages: number;
  unreadNotifications: number;
  todayLessonsCount: number;
  pendingHomeworkCount: number;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [lessons, setLessons] = useState<DashboardLessonProps[]>([]);
  const [homework, setHomework] = useState<DashboardHomeworkProps[]>([]);
  const [announcements, setAnnouncements] = useState<DashboardAnnouncementProps[]>([]);
  const [stats, setStats] = useState<StatsState>({
    unreadMessages: 0,
    unreadNotifications: 0,
    todayLessonsCount: 0,
    pendingHomeworkCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      setLoading(true);
      try {
        const [lessonsRes, homeworkRes, announcementsRes, conversationsRes, notificationsRes] =
          await Promise.allSettled([
            api.get('/lessons/today'),
            api.get('/homework'),
            api.get('/announcements'),
            api.get('/conversations'),
            api.get('/notifications'),
          ]);

        if (!isMounted) return;

        // Process lessons
        let fetchedLessons: DashboardLessonProps[] = [];
        if (lessonsRes.status === 'fulfilled') {
          const raw = lessonsRes.value.data;
          fetchedLessons = Array.isArray(raw) ? raw : raw?.data || [];
        }
        setLessons(fetchedLessons);

        // Process homework
        let fetchedHomework: DashboardHomeworkProps[] = [];
        if (homeworkRes.status === 'fulfilled') {
          const raw = homeworkRes.value.data;
          fetchedHomework = Array.isArray(raw) ? raw : raw?.data || [];
        }
        setHomework(fetchedHomework);

        // Process announcements
        let fetchedAnnouncements: DashboardAnnouncementProps[] = [];
        if (announcementsRes.status === 'fulfilled') {
          const raw = announcementsRes.value.data;
          fetchedAnnouncements = Array.isArray(raw) ? raw : raw?.data || [];
        }
        setAnnouncements(fetchedAnnouncements);

        // Calculate Stats
        let unreadMsgs = 0;
        if (conversationsRes.status === 'fulfilled') {
          const convs = Array.isArray(conversationsRes.value.data)
            ? conversationsRes.value.data
            : conversationsRes.value.data?.data || [];
          unreadMsgs = convs.reduce((acc: number, c: any) => acc + (c.unreadCount || c._count?.unread || 0), 0);
        }

        let unreadNotifs = 0;
        if (notificationsRes.status === 'fulfilled') {
          const notifs = Array.isArray(notificationsRes.value.data)
            ? notificationsRes.value.data
            : notificationsRes.value.data?.data || [];
          unreadNotifs = notifs.filter((n: any) => !n.isRead).length;
        }

        const pendingHw = fetchedHomework.filter(
          (h) => (h.status || '').toLowerCase() !== 'submitted' && (h.status || '').toLowerCase() !== 'graded'
        ).length;

        setStats({
          unreadMessages: unreadMsgs,
          unreadNotifications: unreadNotifs,
          todayLessonsCount: fetchedLessons.length,
          pendingHomeworkCount: pendingHw,
        });
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const userName = user?.profile?.firstName
    ? `${user.profile.firstName} ${user.profile.lastName || ''}`.trim()
    : user?.username || 'User';

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/90 via-primary to-primary/80 p-6 sm:p-8 text-primary-foreground shadow-lg">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Welcome back</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Hello, {userName}!
          </h1>
          <p className="text-xs sm:text-sm text-primary-foreground/80 leading-relaxed">
            Here is your daily school activity overview. You have{' '}
            <span className="font-bold underline">{stats.todayLessonsCount}</span> lesson
            {stats.todayLessonsCount === 1 ? '' : 's'} scheduled today and{' '}
            <span className="font-bold underline">{stats.pendingHomeworkCount}</span> pending homework assignment
            {stats.pendingHomeworkCount === 1 ? '' : 's'}.
          </p>
        </div>
        <div className="absolute right-4 bottom-0 opacity-10 pointer-events-none hidden sm:block">
          <BookOpen className="h-48 w-48 text-white" />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/messages" className="group">
          <Card className="hover:border-primary/50 transition-all duration-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {t('messages', 'Messages')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? '...' : stats.unreadMessages}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">unread</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                <MessageSquare className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/notifications" className="group">
          <Card className="hover:border-primary/50 transition-all duration-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">
                  {t('notifications', 'Notifications')}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? '...' : stats.unreadNotifications}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">unread</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
                <Bell className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/lessons" className="group">
          <Card className="hover:border-primary/50 transition-all duration-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Today's Classes</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? '...' : stats.todayLessonsCount}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">lessons</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/homework" className="group">
          <Card className="hover:border-primary/50 transition-all duration-200">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">Pending Tasks</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-foreground">
                    {loading ? '...' : stats.pendingHomeworkCount}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">homework</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Main Dashboard Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Lessons & Homework */}
        <div className="lg:col-span-2 space-y-8">
          {/* Today's Lessons Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Today's Schedule</h2>
              </div>
              <Link href="/schedule">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Full Timetable
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-card rounded-xl border border-border">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">{t('loading')}</p>
              </div>
            ) : lessons.length === 0 ? (
              <Card className="border border-border p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-semibold text-foreground text-sm">No lessons scheduled today</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Enjoy your free time or review upcoming homework tasks.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {lessons.map((lesson) => (
                  <LessonCard key={lesson.id} lesson={lesson} />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Homework Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Upcoming Homework</h2>
              </div>
              <Link href="/homework">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  View All Homework
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-card rounded-xl border border-border">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">{t('loading')}</p>
              </div>
            ) : homework.length === 0 ? (
              <Card className="border border-border p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-semibold text-foreground text-sm">No homework assignments due</h4>
                <p className="text-xs text-muted-foreground mt-1">You are all caught up!</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {homework.slice(0, 4).map((hw) => (
                  <HomeworkCard key={hw.id} homework={hw} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Announcements & Shortcuts */}
        <div className="space-y-8">
          {/* Announcements Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Announcements</h2>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center bg-card rounded-xl border border-border">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">{t('loading')}</p>
              </div>
            ) : announcements.length === 0 ? (
              <Card className="border border-border p-6 text-center">
                <p className="text-xs text-muted-foreground">No recent announcements</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {announcements.slice(0, 4).map((announcement) => (
                  <AnnouncementCard key={announcement.id} announcement={announcement} />
                ))}
              </div>
            )}
          </div>

          {/* Quick Access Card */}
          <Card className="border border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Quick Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/schedule" className="block">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>View Weekly Timetable</span>
                </Button>
              </Link>
              <Link href="/lessons" className="block">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <span>Browse All Lessons</span>
                </Button>
              </Link>
              <Link href="/homework" className="block">
                <Button variant="outline" className="w-full justify-start gap-2" size="sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>Homework Tracker</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
