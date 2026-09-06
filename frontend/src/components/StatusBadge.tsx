'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n';

export type HomeworkStatus =
  | 'assigned'
  | 'in_progress'
  | 'submitted'
  | 'graded'
  | 'late'
  | 'overdue'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'GRADED'
  | 'LATE'
  | 'OVERDUE'
  | string;

interface StatusBadgeProps {
  status: HomeworkStatus;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = '',
  size = 'md',
}) => {
  const { t } = useTranslation();
  const normalizedStatus = (status || '').toLowerCase().replace('-', '_');

  const statusStyles: Record<string, string> = {
    assigned: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
    in_progress: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    submitted: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
    graded: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    late: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    overdue: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    completed: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800',
    scheduled: 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
  };

  const defaultStyle = 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  const badgeStyle = statusStyles[normalizedStatus] || defaultStyle;

  const sizeStyle = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const translationKey = `status.${normalizedStatus}`;
  const translatedText = t(translationKey);
  const displayText = translatedText !== translationKey ? translatedText : normalizedStatus.replace('_', ' ').toUpperCase();

  return (
    <span
      className={`inline-flex items-center justify-center font-semibold rounded-full border transition-colors ${badgeStyle} ${sizeStyle} ${className}`}
    >
      {displayText}
    </span>
  );
};

export default StatusBadge;
