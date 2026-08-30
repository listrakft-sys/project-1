'use client';

import React, { useEffect } from 'react';
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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
