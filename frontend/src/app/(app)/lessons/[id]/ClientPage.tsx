'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api/client';
import { ArrowLeft, Clock, MapPin, User, FileText } from 'lucide-react';

export default function LessonDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) fetchLesson();
  }, [params.id]);

  const fetchLesson = async () => {
    try {
      const res = await api.get(`/lessons/${params.id}`);
      setLesson(res.data.data);
    } catch (err) {
      console.error('Failed to fetch lesson', err);
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

  if (!lesson) {
    return (
      <>
        <p className="text-center py-16 text-muted-foreground">{t('Lección no encontrada')}</p>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6 max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> {t('back')}
        </button>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{lesson.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {lesson.subject && (
              <span
                className="text-xs px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: `${lesson.subject.color}15`, color: lesson.subject.color }}
              >
                {lesson.subject.name}
              </span>
            )}
            {lesson.description && <p className="text-muted-foreground">{lesson.description}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">{t('Hora')}</p>
                  <p>{new Date(lesson.startDate).toLocaleString()}</p>
                </div>
              </div>
              {lesson.room && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">{t('Aula')}</p>
                    <p>{lesson.room}</p>
                  </div>
                </div>
              )}
              {lesson.teacher?.user?.profile && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground text-xs">{t('Profesor')}</p>
                    <p>{lesson.teacher.user.profile.firstName} {lesson.teacher.user.profile.lastName}</p>
                  </div>
                </div>
              )}
            </div>

            {lesson.materials && lesson.materials.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" /> {t('Materiales')}
                </p>
                {lesson.materials.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" className="block text-sm text-primary hover:underline">
                    📎 {url.split('/').pop()}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
