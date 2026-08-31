'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <div className="min-h-screen w-full flex bg-background overflow-hidden">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700">
        {/* Animated decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-purple-400/20 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
          <div className="absolute -bottom-32 left-1/4 w-72 h-72 rounded-full bg-blue-300/15 blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
        </div>

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">EduPlatform</span>
          </div>

          {/* Main copy */}
          <div className="space-y-6 max-w-md">
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Учись, учи и общайся — всё в одном месте.
            </h1>
            <p className="text-lg text-blue-100/80 leading-relaxed">
              Платформа для школ: расписание, задания, оценки, сообщения и многое другое. Безопасно и удобно.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {[
                { icon: '📚', label: 'Уроки' },
                { icon: '📝', label: 'Задания' },
                { icon: '📅', label: 'Расписание' },
                { icon: '💬', label: 'Сообщения' },
                { icon: '📊', label: 'Оценки' },
                { icon: '🔔', label: 'Уведомления' },
              ].map((f) => (
                <span
                  key={f.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-white/10 backdrop-blur-sm border border-white/15"
                >
                  <span className="text-xs">{f.icon}</span>
                  {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom stats */}
          <div className="flex gap-8 pt-6">
            {[
              { value: '5', label: 'ролей' },
              { value: '25', label: 'страниц' },
              { value: '3', label: 'языка' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-sm text-blue-200/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
