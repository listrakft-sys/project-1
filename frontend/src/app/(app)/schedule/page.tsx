'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import api from '@/lib/api/client';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  notes: string | null;
  subject: { id: string; name: string; code: string; color: string } | null;
  teacher: { user: { profile: { firstName: string; lastName: string } | null; username: string } } | null;
}

const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const SCHOOL_DAYS = [1, 2, 3, 4, 5];

export default function SchedulePage() {
  const { t } = useTranslation();
  const [schedule, setSchedule] = useState<Record<number, ScheduleEntry[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await api.get('/schedules');
      const entries = res.data.data || [];
      const grouped: Record<number, ScheduleEntry[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      entries.forEach((e: ScheduleEntry) => {
        if (grouped[e.dayOfWeek]) grouped[e.dayOfWeek].push(e);
        else grouped[e.dayOfWeek] = [e];
      });
      setSchedule(grouped);
    } catch (err) {
      console.error('Failed to fetch schedule', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          {t('schedule.title')}
        </h1>

        {/* Desktop: 5-column grid */}
        <div className="hidden md:grid grid-cols-5 gap-3">
          {SCHOOL_DAYS.map((day) => (
            <div key={day} className="space-y-2">
              <h3 className="font-semibold text-center text-sm text-muted-foreground pb-2 border-b border-border">
                {DAYS_RU[day]}
              </h3>
              {(schedule[day] || []).length === 0 ? (
                <p className="text-xs text-muted-foreground/50 text-center py-4">—</p>
              ) : (
                (schedule[day] || []).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-border bg-card p-3 text-xs space-y-1"
                    style={{ borderLeft: `3px solid ${entry.subject?.color || 'var(--primary)'}` }}
                  >
                    <p className="font-medium text-foreground">{entry.subject?.name || 'Н/Д'}</p>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {entry.startTime} - {entry.endTime}
                    </p>
                    {entry.room && (
                      <p className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {entry.room}
                      </p>
                    )}
                    {entry.teacher?.user?.profile && (
                      <p className="text-muted-foreground">
                        {entry.teacher.user.profile.firstName} {entry.teacher.user.profile.lastName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* Mobile: day selector + list */}
        <div className="md:hidden space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SCHOOL_DAYS.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedDay === day
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {DAYS_RU[day]}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {(schedule[selectedDay] || []).map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4 space-y-1">
                  <p className="font-medium" style={{ color: entry.subject?.color || 'var(--primary)' }}>
                    {entry.subject?.name || 'Н/Д'}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {entry.startTime} - {entry.endTime}
                  </p>
                  {entry.room && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> {entry.room}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            {(schedule[selectedDay] || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">{t('schedule.noSchedule')}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
