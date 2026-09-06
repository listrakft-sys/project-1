'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import StatusBadge, { HomeworkStatus } from '@/components/StatusBadge';

export interface DashboardHomeworkProps {
  id: string;
  title: string;
  dueDate: string;
  status: HomeworkStatus;
  subject?: {
    name: string;
    color?: string;
  };
}

export const HomeworkCard: React.FC<{ homework: DashboardHomeworkProps }> = ({ homework }) => {
  const isOverdue = React.useMemo(() => {
    if (homework.status === 'submitted' || homework.status === 'graded') return false;
    const due = new Date(homework.dueDate);
    return due < new Date();
  }, [homework.dueDate, homework.status]);

  const formattedDueDate = React.useMemo(() => {
    try {
      const due = new Date(homework.dueDate);
      return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return homework.dueDate;
    }
  }, [homework.dueDate]);

  const subjectColor = homework.subject?.color || '#3b82f6';

  return (
    <Card className="hover:border-primary/50 transition-all cursor-pointer group border border-border">
      <CardContent className="p-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold text-white truncate max-w-[100px]"
              style={{ backgroundColor: subjectColor }}
            >
              {homework.subject?.name || 'Subject'}
            </span>
            <StatusBadge status={isOverdue ? 'overdue' : homework.status} size="sm" />
          </div>

          <Link href={`/homework/${homework.id}`}>
            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
              {homework.title}
            </h4>
          </Link>

          <div className={`flex items-center gap-1.5 text-xs font-medium ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
            {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
            <span>Due {formattedDueDate}</span>
          </div>
        </div>

        <Link
          href={`/homework/${homework.id}`}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
        >
          View
        </Link>
      </CardContent>
    </Card>
  );
};

export default HomeworkCard;
