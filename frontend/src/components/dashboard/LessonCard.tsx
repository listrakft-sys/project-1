'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, User, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export interface DashboardLessonProps {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  room?: string;
  subject?: {
    name: string;
    color?: string;
  };
  teacher?: {
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export const LessonCard: React.FC<{ lesson: DashboardLessonProps }> = ({ lesson }) => {
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch {
      return dateStr;
    }
  };

  const startTime = formatTime(lesson.startDate);
  const endTime = formatTime(lesson.endDate);
  const teacherName = lesson.teacher?.user
    ? `${lesson.teacher.user.firstName || ''} ${lesson.teacher.user.lastName || ''}`.trim()
    : 'Teacher';

  const subjectColor = lesson.subject?.color || '#3b82f6';

  return (
    <Card className="hover:border-primary/50 transition-all cursor-pointer group overflow-hidden border border-border">
      <CardContent className="p-4 flex flex-col justify-between h-full space-y-3">
        {/* Subject Header */}
        <div className="flex items-center justify-between">
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white shadow-sm"
            style={{ backgroundColor: subjectColor }}
          >
            {lesson.subject?.name || 'Subject'}
          </span>
          <div className="flex items-center text-xs font-medium text-muted-foreground gap-1 bg-muted px-2 py-1 rounded-md">
            <Clock className="h-3.5 w-3.5" />
            <span>{startTime} - {endTime}</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h4 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {lesson.title}
          </h4>
        </div>

        {/* Footer info: Teacher & Room */}
        <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-primary" />
            <span className="truncate max-w-[120px] font-medium">{teacherName}</span>
          </div>

          {lesson.room && (
            <div className="flex items-center gap-1 bg-accent/60 px-2 py-0.5 rounded text-foreground font-medium">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>{lesson.room}</span>
            </div>
          )}

          <Link
            href={`/lessons/${lesson.id}`}
            className="p-1 rounded hover:bg-primary hover:text-primary-foreground transition-colors ml-1"
            title="View Details"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonCard;
