'use client';

import React from 'react';

export interface BadgeProps {
  status: string;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral';
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, className = '', children }) => {
  const normStatus = status?.toLowerCase() || '';

  let calculatedVariant: 'success' | 'danger' | 'warning' | 'info' | 'neutral' = 'neutral';

  if (variant) {
    calculatedVariant = variant;
  } else if (
    normStatus === 'active' ||
    normStatus === 'resolved' ||
    normStatus === 'approved' ||
    normStatus === 'super_admin'
  ) {
    calculatedVariant = 'success';
  } else if (
    normStatus === 'suspended' ||
    normStatus === 'inactive' ||
    normStatus === 'bullying' ||
    normStatus === 'harassment' ||
    normStatus === 'spam'
  ) {
    calculatedVariant = 'danger';
  } else if (
    normStatus === 'pending' ||
    normStatus === 'in_progress' ||
    normStatus === 'warning'
  ) {
    calculatedVariant = 'warning';
  } else if (
    normStatus === 'reviewing' ||
    normStatus === 'school_admin' ||
    normStatus === 'teacher'
  ) {
    calculatedVariant = 'info';
  } else if (
    normStatus === 'dismissed' ||
    normStatus === 'other' ||
    normStatus === 'student' ||
    normStatus === 'parent'
  ) {
    calculatedVariant = 'neutral';
  }

  const styles = {
    success:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    danger:
      'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    warning:
      'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    info: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    neutral:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[calculatedVariant]} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          calculatedVariant === 'success'
            ? 'bg-emerald-500'
            : calculatedVariant === 'danger'
            ? 'bg-rose-500'
            : calculatedVariant === 'warning'
            ? 'bg-amber-500'
            : calculatedVariant === 'info'
            ? 'bg-sky-500'
            : 'bg-slate-400'
        }`}
      />
      {children || status}
    </span>
  );
};

export default Badge;
