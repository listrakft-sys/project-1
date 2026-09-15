'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { Calendar, Clock, MapPin, Plus, Pencil, Trash2, Users } from 'lucide-react';

interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  notes: string | null;
  classId?: string;
  subject: { id: string; name: string; code: string; color: string } | null;
  teacher: { user: { profile: { firstName: string; lastName: string } | null; username: string } } | null;
}

interface ClassOption {
  id: string;
  name: string;
}

interface SubjectOption {
  id: string;
  name: string;
}

interface SlotForm {
  dayOfWeek: string;
  subjectId: string;
  startTime: string;
  endTime: string;
  room: string;
}

const emptySlotForm: SlotForm = {
  dayOfWeek: '1',
  subjectId: '',
  startTime: '09:00',
  endTime: '09:50',
  room: '',
};

const LOCALES: Record<string, string> = { en: 'en-US', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' };
// day: 0 (Sun) … 6 (Sat) — 2024-01-07 is a Sunday
function dayName(day: number, locale: string): string {
  return new Date(2024, 0, 7 + day).toLocaleDateString(locale, { weekday: 'short' });
}
function dayNameLong(day: number, locale: string): string {
  return new Date(2024, 0, 7 + day).toLocaleDateString(locale, { weekday: 'long' });
}
const SCHOOL_DAYS = [1, 2, 3, 4, 5];

export default function SchedulePage() {
  const { t, language } = useTranslation();
  const locale = LOCALES[language] || 'en-US';
  const [schedule, setSchedule] = useState<Record<number, ScheduleEntry[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(1);

  // Class selector
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  // Slot management (admin/teacher)
  const user = useAuthStore((state) => state.user);
  const canManage =
    !!user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role);

  const [form, setForm] = useState<SlotForm>(emptySlotForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async (classId: string) => {
    setIsLoading(true);
    try {
      const url = classId ? `/schedules/class/${classId}` : '/schedules';
      const res = await api.get(url);
      const entries: ScheduleEntry[] = res.data.data || [];
      const grouped: Record<number, ScheduleEntry[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
      entries
        .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
        .forEach((e) => {
          if (grouped[e.dayOfWeek]) grouped[e.dayOfWeek].push(e);
          else grouped[e.dayOfWeek] = [e];
        });
      setSchedule(grouped);
    } catch (err) {
      console.error('Failed to fetch schedule', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [clsRes, subRes] = await Promise.allSettled([
          api.get('/classes'),
          api.get('/subjects'),
        ]);
        let firstClassId = '';
        if (clsRes.status === 'fulfilled') {
          const raw = clsRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.data || [];
          setClasses(list);
          firstClassId = list[0]?.id || '';
        }
        if (subRes.status === 'fulfilled') {
          const raw = subRes.value.data;
          const list = Array.isArray(raw) ? raw : raw?.data || [];
          setSubjects(list);
        }
        setSelectedClassId(firstClassId);
        await fetchSchedule(firstClassId);
      } catch (err) {
        console.error('Failed to init schedule page', err);
        setIsLoading(false);
      }
    })();
  }, [fetchSchedule]);

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    fetchSchedule(classId);
  };

  // ── Slot CRUD handlers ──
  const openCreateModal = () => {
    setEditingSlot(null);
    setForm(emptySlotForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (entry: ScheduleEntry) => {
    setEditingSlot(entry);
    setForm({
      dayOfWeek: String(entry.dayOfWeek ?? 1),
      subjectId: entry.subject?.id || '',
      startTime: entry.startTime || '09:00',
      endTime: entry.endTime || '09:50',
      room: entry.room || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveSlot = async () => {
    if (!form.subjectId) {
      setFormError(t('schedule.validationRequired'));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        classId: selectedClassId,
        dayOfWeek: Number(form.dayOfWeek),
        subjectId: form.subjectId,
        startTime: form.startTime,
        endTime: form.endTime,
        room: form.room.trim(),
      };
      if (editingSlot) {
        await api.put(`/schedules/${editingSlot.id}`, payload);
      } else {
        await api.post('/schedules', payload);
      }
      setModalOpen(false);
      fetchSchedule(selectedClassId);
    } catch (err) {
      console.error('Failed to save slot', err);
      setFormError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/schedules/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchSchedule(selectedClassId);
    } catch (err) {
      console.error('Failed to delete slot', err);
    } finally {
      setDeleting(false);
    }
  };

  const fieldCls =
    'w-full py-2 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground';

  const renderSlotActions = (entry: ScheduleEntry) =>
    canManage ? (
      <div className="flex items-center gap-1">
        <button
          onClick={() => openEditModal(entry)}
          aria-label={t('common.edit')}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => setDeleteTarget(entry)}
          aria-label={t('common.delete')}
          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : null;

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
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            {t('schedule.title')}
          </h1>
          <div className="flex items-center gap-2">
            {/* Class selector */}
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedClassId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="py-2 pl-3 pr-8 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                aria-label={t('schedule.classLabel')}
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            {canManage && (
              <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
                {t('schedule.addSlot')}
              </Button>
            )}
          </div>
        </div>

        {/* Desktop: 5-column grid */}
        <div className="hidden md:grid grid-cols-5 gap-3">
          {SCHOOL_DAYS.map((day) => (
            <div key={day} className="space-y-2">
              <h3 className="font-semibold text-center text-sm text-muted-foreground pb-2 border-b border-border">
                {dayName(day, locale)}
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
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-medium text-foreground">{entry.subject?.name || 'N/A'}</p>
                      {renderSlotActions(entry)}
                    </div>
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
                {dayName(day, locale)}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {(schedule[selectedDay] || []).map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium" style={{ color: entry.subject?.color || 'var(--primary)' }}>
                      {entry.subject?.name || 'N/A'}
                    </p>
                    {renderSlotActions(entry)}
                  </div>
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

      {/* Create / Edit Slot Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${editingSlot ? t('schedule.editSlot') : t('schedule.addSlot')}${
          selectedClassId ? ` — ${classes.find((c) => c.id === selectedClassId)?.name || ''}` : ''
        }`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            {formError && <p className="text-xs text-destructive mr-auto">{formError}</p>}
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleSaveSlot} isLoading={saving}>
              {editingSlot ? t('common.save') : t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('schedule.day')}</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                className={'mt-1 ' + fieldCls}
              >
                {SCHOOL_DAYS.map((day) => (
                  <option key={day} value={String(day)}>
                    {dayNameLong(day, locale)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('schedule.subjectLabel')} *
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={'mt-1 ' + fieldCls}
              >
                <option value="">{t('schedule.selectSubject')}</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('schedule.startTime')}
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className={'mt-1 ' + fieldCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('schedule.endTime')}</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className={'mt-1 ' + fieldCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">{t('schedule.room')}</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder={t('schedule.room')}
                className={'mt-1 ' + fieldCls}
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSlot}
        title={`${t('schedule.deleteSlot')}: ${deleteTarget?.subject?.name || ''}?`}
        description={t('schedule.deleteConfirm')}
        variant="danger"
        confirmText={t('common.delete')}
        isLoading={deleting}
      />
    </>
  );
}
