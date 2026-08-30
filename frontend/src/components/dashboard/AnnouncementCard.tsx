'use client';

import React from 'react';
import { Pin, Calendar, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export interface DashboardAnnouncementProps {
  id: string;
  title: string;
  content: string;
  isPinned?: boolean;
  createdAt: string;
  author?: {
    user?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

export const AnnouncementCard: React.FC<{ announcement: DashboardAnnouncementProps }> = ({
  announcement,
}) => {
  const formattedDate = React.useMemo(() => {
    try {
      const d = new Date(announcement.createdAt);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return announcement.createdAt;
    }
  }, [announcement.createdAt]);

  const authorName = announcement.author?.user
    ? `${announcement.author.user.firstName || ''} ${announcement.author.user.lastName || ''}`.trim()
    : 'School Admin';

  return (
    <Card className={`transition-all border ${announcement.isPinned ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm text-foreground flex-1 line-clamp-1">
            {announcement.title}
          </h4>
          {announcement.isPinned && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
              <Pin className="h-3 w-3 fill-primary" />
              Pinned
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {announcement.content}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-primary" />
            <span>{authorName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementCard;
