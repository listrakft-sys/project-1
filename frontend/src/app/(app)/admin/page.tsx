'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '@/components/admin/StatCard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { useAdmin, AdminStats } from '@/lib/hooks/useAdmin';
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
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { fetchStats } = useAdmin();
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingComplaints: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetchStats()
      .then((data) => {
        if (isMounted && data) {
          setStats(data);
        }
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

  return (
    <>
      <div className="space-y-8">
        {/* Header Section */}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            icon={Users}
            label={t('stats.totalUsers')}
            value={loading ? '...' : stats.totalUsers}
            trend={{ value: '+12%', isPositive: true, label: 'this month' }}
          />
          <StatCard
            icon={GraduationCap}
            label={t('stats.totalStudents')}
            value={loading ? '...' : stats.totalStudents}
          />
          <StatCard
            icon={School}
            label={t('stats.totalTeachers')}
            value={loading ? '...' : stats.totalTeachers}
          />
          <StatCard
            icon={Activity}
            label={t('stats.totalClasses')}
            value={loading ? '...' : stats.totalClasses}
          />
          <StatCard
            icon={BookOpen}
            label={t('stats.totalSubjects')}
            value={loading ? '...' : stats.totalSubjects}
          />
          <StatCard
            icon={AlertCircle}
            label={t('stats.pendingComplaints')}
            value={loading ? '...' : stats.pendingComplaints}
            trend={{ value: stats.pendingComplaints > 0 ? 'Requires action' : 'All clear', isPositive: stats.pendingComplaints === 0 }}
          />
        </div>

        {/* Quick Links Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{t('dashboard.quickLinks')}</h2>
            <p className="text-xs text-muted-foreground">Jump directly to administration management modules.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.href} href={link.href} className="group">
                  <Card className="h-full p-6 transition-all duration-200 group-hover:border-primary/50 group-hover:shadow-md flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl ${link.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {t(link.titleKey)}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{link.desc}</p>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
