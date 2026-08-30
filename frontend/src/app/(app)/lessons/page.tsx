'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n';
import LessonCard, { FullLessonProps } from '@/components/LessonCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  BookOpen,
  Search,
  Filter,
  Users,
  Loader2,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
}

export default function LessonsPage() {
  const { t } = useTranslation();

  const [lessons, setLessons] = useState<FullLessonProps[]>([]);
  const [subjects, setSubjects] = useState<FilterOption[]>([]);
  const [classes, setClasses] = useState<FilterOption[]>([]);

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch filter options (Subjects & Classes)
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [subRes, clsRes] = await Promise.allSettled([
          api.get('/subjects'),
          api.get('/classes'),
        ]);

        if (subRes.status === 'fulfilled') {
          const raw = subRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.data || [];
          setSubjects(list);
        }

        if (clsRes.status === 'fulfilled') {
          const raw = clsRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.data || [];
          setClasses(list);
        }
      } catch (err) {
        console.error('Failed to fetch subjects/classes filter options:', err);
      }
    }

    loadFilterOptions();
  }, []);

  // Fetch lessons with optional params
  const fetchLessons = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (selectedSubject !== 'all') params.subjectId = selectedSubject;
      if (selectedClass !== 'all') params.classId = selectedClass;

      const res = await api.get('/lessons', { params });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw : raw?.data || [];
      setLessons(list);
    } catch (err: any) {
      console.error('Error fetching lessons:', err);
      setError(err.response?.data?.message || t('error', 'An error occurred while loading lessons.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLessons();
  }, [selectedSubject, selectedClass]);

  // Client-side search filtering
  const filteredLessons = lessons.filter((lesson) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = lesson.title?.toLowerCase().includes(q);
    const descMatch = lesson.description?.toLowerCase().includes(q);
    const subjectMatch = lesson.subject?.name?.toLowerCase().includes(q);
    const teacherName = lesson.teacher?.user
      ? `${lesson.teacher.user.firstName || ''} ${lesson.teacher.user.lastName || ''}`.toLowerCase()
      : '';
    const teacherMatch = teacherName.includes(q);

    return titleMatch || descMatch || subjectMatch || teacherMatch;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span>Lessons</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore and review course lessons, teaching materials, and class schedules.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchLessons}
          disabled={loading}
          leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
        >
          {t('refresh', 'Refresh')}
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('search', 'Search lessons, teachers, subjects...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          />
        </div>

        {/* Subject Filter Dropdown */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        {/* Class Filter Dropdown */}
        <div className="flex items-center gap-2 min-w-[180px]">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full py-2 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground mt-3">{t('loading', 'Loading lessons...')}</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-card rounded-xl border border-destructive/30 text-destructive">
          <p className="font-semibold text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchLessons} className="mt-4">
            Try Again
          </Button>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border space-y-3">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">
            {t('noResults', 'No lessons found')}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search criteria or selecting a different subject or class filter.
          </p>
          {(selectedSubject !== 'all' || selectedClass !== 'all' || searchQuery) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSubject('all');
                setSelectedClass('all');
                setSearchQuery('');
              }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <LessonCard key={lesson.id} lesson={lesson} />
          ))}
        </div>
      )}
    </div>
  );
}
