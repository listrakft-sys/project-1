'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, MapPin, User, FileText, ArrowRight, Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface FullLessonProps {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  room?: string;
  subject?: {
    id?: string;
    name: string;
    color?: string;
  };
  class?: {
    id?: string;
    name: string;
  };
  teacher?: {
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
  materials?: Array<unknown>;
}

export const LessonCard: React.FC<{ lesson: FullLessonProps }> = ({ lesson }) => {
  const formatDateTime = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const dateFormatted = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      const startTime = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const endTime = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      return { dateFormatted, timeRange: `${startTime} - ${endTime}` };
    } catch {
      return { dateFormatted: startStr, timeRange: '' };
    }
  };

  const { dateFormatted, timeRange } = formatDateTime(lesson.startDate, lesson.endDate);
  const teacherName = lesson.teacher?.user
    ? `${lesson.teacher.user.firstName || ''} ${lesson.teacher.user.lastName || ''}`.trim()
    : 'Teacher';
  const materialsCount = lesson.materials?.length || 0;
  const subjectColor = lesson.subject?.color || '#3b82f6';

  return (
    <Card className="hover:border-primary/60 transition-all hover:shadow-md flex flex-col justify-between overflow-hidden border border-border group">
      <CardContent className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Header Tags */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: subjectColor }}
              >
                {lesson.subject?.name || 'Subject'}
              </span>
              {lesson.class && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {lesson.class.name}
                </span>
              )}
            </div>

            {materialsCount > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded font-medium">
                <FileText className="h-3.5 w-3.5 text-primary" />
                {materialsCount} materials
              </span>
            )}
          </div>

          {/* Lesson Title & Description */}
          <div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {lesson.title}
            </h3>
            {lesson.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {lesson.description}
              </p>
            )}
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="pt-3 border-t border-border space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="h-4 w-4 text-primary" />
              <span>{teacherName}</span>
            </div>
            {lesson.room && (
              <div className="flex items-center gap-1 bg-accent/60 px-2 py-0.5 rounded text-foreground font-semibold">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Room {lesson.room}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{dateFormatted}</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{timeRange}</span>
            </div>
          </div>
        </div>

        {/* View Button */}
        <div className="pt-2">
          <Link href={`/lessons/${lesson.id}`} className="w-full block">
            <Button variant="outline" className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
              <span>View Details</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonCard;
