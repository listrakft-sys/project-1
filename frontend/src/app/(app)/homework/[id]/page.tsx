'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';
import { ArrowLeft, FileText, Clock, CheckCircle } from 'lucide-react';
import { FileUpload } from '@/components/ui/FileUpload';

export default function HomeworkDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [homework, setHomework] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) fetchHomework();
  }, [params.id]);

  const fetchHomework = async () => {
    try {
      const res = await api.get(`/homework/${params.id}`);
      setHomework(res.data.data);
    } catch (err) {
      console.error('Failed to fetch homework', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/homework/${params.id}/submit`, { content: submission });
      fetchHomework();
      setSubmission('');
    } catch (err) {
      console.error('Failed to submit', err);
    } finally {
      setSubmitting(false);
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

  if (!homework) {
    return (
      <>
        <p className="text-center py-16 text-muted-foreground">{t('Tarea no encontrada')}</p>
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
            <CardTitle className="text-xl">{homework.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {homework.subject && (
              <span
                className="text-xs px-2 py-1 rounded-full inline-block"
                style={{ backgroundColor: `${homework.subject.color}15`, color: homework.subject.color }}
              >
                {homework.subject.name}
              </span>
            )}
            <p className="text-muted-foreground">{homework.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(homework.dueDate).toLocaleDateString()}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-muted">
                {homework.status}
              </span>
            </div>
            {homework.attachments && homework.attachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('Archivos adjuntos')}</p>
                {homework.attachments.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" className="block text-sm text-primary hover:underline">
                    📎 {url.split('/').pop()}
                  </a>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission form for students */}
        {homework.status !== 'graded' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('Enviar tarea')}</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder={t('Escribe tu respuesta...')}
                value={submission}
                onChange={(e) => setSubmission(e.target.value)}
              />
              <div className="mt-3">
                <FileUpload entityType="HOMEWORK_SUBMISSION" entityId={homework.id} />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSubmit} disabled={submitting || !submission}>
                {submitting ? t('saving') : t('Enviar')}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Graded feedback */}
        {homework.status === 'graded' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                {t('Calificado')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold">{homework.grade}</p>
              {homework.feedback && <p className="text-muted-foreground">{homework.feedback}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
