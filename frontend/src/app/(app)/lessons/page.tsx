'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { useTranslation } from '@/lib/i18n';
import LessonCard, { FullLessonProps } from '@/components/LessonCard';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuthStore } from '@/lib/store/auth';
import {
  BookOpen,
  Search,
  Filter,
  Users,
  Loader2,
  RefreshCw,
  FolderOpen,
  Plus,
} from 'lucide-react';

interface FilterOption {
  id: string;
  name: string;
}

interface LessonForm {
  title: string;
  subjectId: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  description: string;
}

const emptyForm: LessonForm = {
  title: '',
  subjectId: '',
  classId: '',
  date: new Date().toISOString().slice(0, 10),
  startTime: '09:00',
  endTime: '09:50',
  room: '',
  description: '',
};

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

  // Lesson management (admin/teacher)
  const user = useAuthStore((state) => state.user);
  const canManage =
    !!user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role);

  const [form, setForm] = useState<LessonForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<FullLessonProps | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FullLessonProps | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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
        console.error('Failed to fetch filter options:', err);
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
    } catch (err: unknown) {
      console.error('Error fetching lessons:', err);
      const axiosErr = err as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message || axiosErr.message || t("error"));
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

  // ── Lesson management handlers ──
  const openCreateModal = () => {
    setEditingLesson(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (lesson: FullLessonProps) => {
    setEditingLesson(lesson);
    setForm({
      title: lesson.title || '',
      subjectId: lesson.subject?.id || '',
      classId: lesson.class?.id || '',
      date: lesson.startDate ? new Date(lesson.startDate).toISOString().slice(0, 10) : emptyForm.date,
      startTime: (lesson as any).startTime || emptyForm.startTime,
      endTime: (lesson as any).endTime || emptyForm.endTime,
      room: lesson.room || '',
      description: lesson.description || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!form.title.trim() || !form.subjectId || !form.classId) {
      setFormError(t('lessons.validationRequired'));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: form.title.trim(),
        subjectId: form.subjectId,
        classId: form.classId,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room.trim(),
        description: form.description.trim(),
      };
      if (editingLesson) {
        await api.put(`/lessons/${editingLesson.id}`, payload);
      } else {
        await api.post('/lessons', payload);
      }
      setModalOpen(false);
      fetchLessons();
    } catch (err) {
      console.error('Failed to save lesson:', err);
      setFormError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/lessons/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchLessons();
    } catch (err) {
      console.error('Failed to delete lesson:', err);
    } finally {
      setDeleting(false);
    }
  };

  const fieldCls =
    'w-full py-2 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground';

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-primary" />
            <span>{t('lessons.title')}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('lessons.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLessons}
            disabled={loading}
            leftIcon={<RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            {t('refresh')}
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
              {t('lessons.createLesson')}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-4 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t('search')}
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
            <option value="all">{t('lessons.allSubjects')}</option>
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
            <option value="all">{t('lessons.allClasses')}</option>
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
          <p className="text-sm text-muted-foreground mt-3">{t('loading')}</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-card rounded-xl border border-destructive/30 text-destructive">
          <p className="font-semibold text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchLessons} className="mt-4">
            {t('common.tryAgain')}
          </Button>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border border-border space-y-3">
          <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">
            {t('noResults')}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t('lessons.adjustFilters')}
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
              {t('lessons.resetFilters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              manage={canManage ? { onEdit: openEditModal, onDelete: setDeleteTarget } : undefined}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Lesson Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingLesson ? t('lessons.editLesson') : t('lessons.createLesson')}
        size="xl"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            {formError && (
              <p className="text-xs text-destructive mr-auto">{formError}</p>
            )}
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleSaveLesson} isLoading={saving}>
              {editingLesson ? t('common.save') : t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('lessons.lessonTitle')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t('lessons.lessonTitle')}
              className="mt-1 w-full py-2 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('lessons.subject')} *
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={"mt-1 " + fieldCls}
              >
                <option value="">{t('lessons.selectSubject')}</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('lessons.classLabel')} *
              </label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value })}
                className={'mt-1 ' + fieldCls}
              >
                <option value="">{t('lessons.selectClass')}</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('lessons.date')}
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={'mt-1 ' + fieldCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('lessons.startTime')}
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className={'mt-1 ' + fieldCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('lessons.endTime')}
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={'mt-1 ' + fieldCls}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('lessons.room')}
            </label>
            <input
              type="text"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder={t('lessons.room')}
              className={'mt-1 ' + fieldCls}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('lessons.description')}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('lessons.description')}
              rows={3}
              className={'mt-1 ' + fieldCls + ' resize-none'}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteLesson}
        title={`${t('lessons.deleteLesson')}: ${deleteTarget?.title || ''}?`}
        description={t('lessons.deleteConfirm')}
        variant="danger"
        confirmText={t('common.delete')}
        isLoading={deleting}
      />
    </div>
  );
}
