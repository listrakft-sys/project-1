'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';
import { FileText, Clock, Search } from 'lucide-react';

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  subject: { id: string; name: string; color: string } | null;
}

const statusColors: Record<string, string> = {
  assigned: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-yellow-500/10 text-yellow-600',
  submitted: 'bg-purple-500/10 text-purple-600',
  graded: 'bg-green-500/10 text-green-600',
  late: 'bg-orange-500/10 text-orange-600',
  overdue: 'bg-red-500/10 text-red-600',
};

export default function HomeworkPage() {
  const { t } = useTranslation();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    try {
      const res = await api.get('/homework');
      setHomework(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch homework', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = homework.filter((hw) => {
    const matchesSearch = !search || hw.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || hw.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isOverdue = (date: string, status: string) => {
    return new Date(date) < new Date() && status !== 'graded' && status !== 'submitted';
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
          <FileText className="h-6 w-6 text-primary" />
          {t('Tareas')}
        </h1>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('Buscar tareas...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t('Todos')}</option>
            <option value="assigned">{t('Asignadas')}</option>
            <option value="in_progress">{t('En progreso')}</option>
            <option value="submitted">{t('Enviadas')}</option>
            <option value="graded">{t('Calificadas')}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{t('No hay tareas')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((hw) => (
              <Link href={`/homework/${hw.id}`} key={hw.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold">{hw.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[hw.status] || statusColors.assigned}`}>
                        {hw.status}
                      </span>
                    </div>
                    {hw.subject && (
                      <span
                        className="text-xs px-2 py-1 rounded-full inline-block"
                        style={{ backgroundColor: `${hw.subject.color}15`, color: hw.subject.color }}
                      >
                        {hw.subject.name}
                      </span>
                    )}
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {isOverdue(hw.dueDate, hw.status) ? (
                        <span className="text-red-600">{new Date(hw.dueDate).toLocaleDateString()}</span>
                      ) : (
                        new Date(hw.dueDate).toLocaleDateString()
                      )}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
