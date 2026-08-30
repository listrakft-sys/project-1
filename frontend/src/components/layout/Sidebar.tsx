'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  Calendar,
  FileText,
  MessageSquare,
  Users,
  GraduationCap,
  Megaphone,
  Bell,
  User,
  Settings,
  Shield,
  X,
  School,
  Sparkles,
  ClipboardList,
  BarChart3,
  CalendarCheck
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

  const navItems = [
    { name: t('nav.home'), href: '/', icon: Home },
    { name: t('nav.lessons'), href: '/lessons', icon: BookOpen },
    { name: t('nav.schedule'), href: '/schedule', icon: Calendar },
    { name: t('nav.homework'), href: '/homework', icon: FileText },
    { name: t('nav.messages'), href: '/messages', icon: MessageSquare },
    { name: t('nav.students'), href: '/students', icon: Users },
    { name: t('nav.teachers'), href: '/teachers', icon: GraduationCap },
    { name: t('nav.announcements'), href: '/announcements', icon: Megaphone },
    { name: t('nav.notifications'), href: '/notifications', icon: Bell },
    { name: t('nav.profile'), href: '/profile', icon: User },
    { name: t('nav.settings'), href: '/settings', icon: Settings },
  ];

  navItems.push({ name: t('nav.gradebook'), href: '/gradebook', icon: ClipboardList });
  navItems.push({ name: t('nav.myGrades'), href: '/my-grades', icon: BarChart3 });
  navItems.push({ name: t('nav.attendance'), href: '/attendance', icon: CalendarCheck });
  navItems.push({ name: t('nav.aiAssistant'), href: '/ai-assistant', icon: Sparkles });

  if (isAdmin) {
    navItems.push({ name: t('nav.admin'), href: '/admin', icon: Shield });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <Link href="/" className="flex items-center gap-3 font-semibold text-lg text-primary">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <School className="h-6 w-6" />
            </div>
            <span className="font-bold tracking-tight text-foreground">EduPlatform</span>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-primary-foreground' : 'text-muted-foreground')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Info Footer (Mobile/Desktop) */}
        {user && (
          <div className="p-4 border-t border-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              {user.profile?.firstName?.[0] || user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.profile?.firstName ? `${user.profile.firstName} ${user.profile.lastName || ''}` : user.username}
              </p>
              <p className="text-xs text-muted-foreground capitalize truncate">
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
