'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAdmin, AdminStats, emptyStats } from '@/lib/hooks/useAdmin';
import { useTranslation } from '@/lib/i18n';
import {
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  AlertCircle,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  Activity,
  School,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { fetchStats, fetchActivity } = useAdmin();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>(emptyStats);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchStats(), fetchActivity(8)])
      .then(([statsData, activityData]) => {
        if (!isMounted) return;
        if (statsData) setStats(statsData);
        if (activityData) setActivity(activityData);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const quickLinks = [
    {
      titleKey: 'admin.users',
      desc: 'Manage accounts, update roles, suspend or activate platform users.',
      href: '/admin/users',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      titleKey: 'admin.classes',
      desc: 'Configure grade sections, rooms, capacities, and homeroom tutors.',
      href: '/admin/classes',
      icon: GraduationCap,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      titleKey: 'admin.subjects',
      desc: 'Define subjects, language settings, colors, and assign teaching staff.',
      href: '/admin/subjects',
      icon: BookOpen,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      titleKey: 'admin.schedule',
      desc: 'Manage weekly timetables, classroom allocations, and time slots.',
      href: '/admin/schedule',
      icon: Calendar,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    },
    {
      titleKey: 'admin.complaints',
      desc: 'Review filed complaints, investigate reports, and set resolutions.',
      href: '/admin/complaints',
      icon: AlertCircle,
      color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
    {
      titleKey: 'admin.announcements',
      desc: 'Broadcast school-wide or class-specific news and pin announcements.',
      href: '/admin/announcements',
      icon: Megaphone,
      color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
  ];

  const activityLabels: Record<string, string> = {
    USER_REGISTERED: 'New user',
    COMPLAINT: 'Complaint',
    ANNOUNCEMENT: 'Announcement',
    GRADE: 'Grade added',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-primary" />
            {t('admin.title')}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            System overview, quick management shortcuts, and administrative metrics.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={loading ? '...' : stats.totals.users}
          trend={{ value: `+${stats.thisWeek.newUsers}`, isPositive: stats.thisWeek.newUsers > 0, label: 'this week' }}
        />
        <StatCard
          icon={GraduationCap}
          label="Students"
          value={loading ? '...' : stats.totals.students}
        />
        <StatCard
          icon={School}
          label="Teachers"
          value={loading ? '...' : stats.totals.teachers}
        />
        <StatCard
          icon={Activity}
          label="Classes"
          value={loading ? '...' : stats.totals.classes}
        />
        <StatCard
          icon={BookOpen}
          label="Subjects"
          value={loading ? '...' : stats.totals.subjects}
        />
        <StatCard
          icon={AlertCircle}
          label="Pending Complaints"
          value={loading ? '...' : stats.totals.pendingComplaints}
          trend={{ value: stats.totals.pendingComplaints > 0 ? 'Action needed' : 'All clear', isPositive: stats.totals.pendingComplaints === 0 }}
        />
        <StatCard
          icon={TrendingUp}
          label="Attendance Rate"
          value={loading ? '...' : `${stats.metrics.attendanceRate}%`}
        />
        <StatCard
          icon={ClipboardList}
          label="Grade Average"
          value={loading ? '...' : `${stats.metrics.gradeAverage}%`}
        />
      </div>

      {/* Quick Links + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Links — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Quick Links</h2>
            <p className="text-xs text-muted-foreground">Jump directly to administration modules.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="group">
                  <Card className="h-full p-5 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className={`p-2.5 rounded-xl ${link.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t(link.titleKey)}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{link.desc}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Activity Feed — 1 col */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
            <p className="text-xs text-muted-foreground">Latest events across the platform.</p>
          </div>
          <Card className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
            {activity.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
            ) : loading ? (
              <p className="text-sm text-muted-foreground text-center py-6">Loading…</p>
            ) : (
              activity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary mt-0.5">
                    <Activity className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {activityLabels[item.type] || item.type}: {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.detail} · {new Date(item.time).toLocaleDateString('en', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
