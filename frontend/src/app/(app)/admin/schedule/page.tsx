'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { useTranslation } from '@/lib/i18n';
import { Calendar, Plus, Clock, MapPin, User, BookOpen, Trash2, Edit2 } from 'lucide-react';

interface ScheduleSlot {
  id: string;
  classId: string;
  subjectId?: string;
  subject?: { id: string; name: string; code: string; color?: string };
  teacherId?: string;
  teacher?: { id: string; profile?: { firstName?: string; lastName?: string } };
  dayOfWeek: number; // 1 = Mon, 2 = Tue, ..., 5 = Fri
  startTime: string; // "08:00"
  endTime: string;   // "08:50"
  room?: string;
}

interface ClassOption {
  id: string;
  name: string;
  grade: number;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  color?: string;
}

const daysOfWeek = [
  { day: 1, key: 'schedule.monday', label: 'Monday' },
  { day: 2, key: 'schedule.tuesday', label: 'Tuesday' },
  { day: 3, key: 'schedule.wednesday', label: 'Wednesday' },
  { day: 4, key: 'schedule.thursday', label: 'Thursday' },
  { day: 5, key: 'schedule.friday', label: 'Friday' },
];

const timeSlotsList = [
  { start: '08:00', end: '08:50' },
  { start: '09:00', end: '09:50' },
  { start: '10:00', end: '10:50' },
  { start: '11:00', end: '11:50' },
  { start: '12:00', end: '12:50' },
  { start: '13:00', end: '13:50' },
  { start: '14:00', end: '14:50' },
];

export default function ScheduleAdminPage() {
  const { fetchClasses, fetchSubjects, fetchSchedulesForClass, createSchedule, updateSchedule, deleteSchedule } = useAdmin();
  const { t } = useTranslation();

  const [classList, setClassList] = useState<ClassOption[]>([]);
  const [subjectList, setSubjectList] = useState<SubjectOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');

  const [schedules, setSchedules] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal Slot State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [slotForm, setSlotForm] = useState({
    subjectId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '08:50',
    room: '',
    teacherName: '',
  });
  const [saving, setSaving] = useState(false);

  // Confirm Delete
  const [deleteTarget, setDeleteTarget] = useState<ScheduleSlot | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load Classes & Subjects
  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchClasses(), fetchSubjects()]).then(([clsData, subData]) => {
      if (!isMounted) return;

      const classesArr = Array.isArray(clsData)
        ? clsData
        : [{ id: 'c1', name: 'Grade 10-A', grade: 10 }, { id: 'c2', name: 'Grade 10-B', grade: 10 }];

      const subsArr = Array.isArray(subData)
        ? subData
        : [
            { id: 's1', name: 'Mathematics', code: 'MATH101', color: '#3b82f6' },
            { id: 's2', name: 'Physics', code: 'PHYS101', color: '#8b5cf6' },
            { id: 's3', name: 'Spanish', code: 'SPAN201', color: '#ef4444' },
          ];

      setClassList(classesArr);
      setSubjectList(subsArr);

      if (classesArr.length > 0 && !selectedClassId) {
        setSelectedClassId(classesArr[0].id);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Schedules when Selected Class changes
  const loadClassSchedule = useCallback(async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const data = await fetchSchedulesForClass(selectedClassId);
      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        // Fallback mock schedule slots
        setSchedules([
          { id: 'sch1', classId: selectedClassId, dayOfWeek: 1, startTime: '08:00', endTime: '08:50', room: 'Room 101', subject: { id: 's1', name: 'Mathematics', code: 'MATH101', color: '#3b82f6' } },
          { id: 'sch2', classId: selectedClassId, dayOfWeek: 1, startTime: '09:00', endTime: '09:50', room: 'Room 101', subject: { id: 's2', name: 'Physics', code: 'PHYS101', color: '#8b5cf6' } },
          { id: 'sch3', classId: selectedClassId, dayOfWeek: 2, startTime: '10:00', endTime: '10:50', room: 'Lab 2', subject: { id: 's3', name: 'Spanish', code: 'SPAN201', color: '#ef4444' } },
        ]);
      }
    } catch {
      setSchedules([
        { id: 'sch1', classId: selectedClassId, dayOfWeek: 1, startTime: '08:00', endTime: '08:50', room: 'Room 101', subject: { id: 's1', name: 'Mathematics', code: 'MATH101', color: '#3b82f6' } },
      ]);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    loadClassSchedule();
  }, [loadClassSchedule]);

  const handleOpenAddSlot = (dayOfWeek = 1, startTime = '08:00', endTime = '08:50') => {
    setEditingSlot(null);
    setSlotForm({
      subjectId: subjectList[0]?.id || '',
      dayOfWeek,
      startTime,
      endTime,
      room: 'Room 101',
      teacherName: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditSlot = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setSlotForm({
      subjectId: slot.subjectId || slot.subject?.id || subjectList[0]?.id || '',
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      room: slot.room || '',
      teacherName: slot.teacher?.profile?.firstName || '',
    });
    setModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId) return;
    setSaving(true);
    try {
      const payload = {
        classId: selectedClassId,
        subjectId: slotForm.subjectId,
        dayOfWeek: Number(slotForm.dayOfWeek),
        startTime: slotForm.startTime,
        endTime: slotForm.endTime,
        room: slotForm.room,
      };

      if (editingSlot) {
        await updateSchedule(editingSlot.id, payload);
      } else {
        await createSchedule(payload);
      }
      setModalOpen(false);
      await loadClassSchedule();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSchedule(deleteTarget.id);
      setDeleteTarget(null);
      await loadClassSchedule();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary" />
              {t('schedule.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('schedule.subtitle')}</p>
          </div>

          {/* Class Selector Dropdown & Add Button */}
          <div className="flex items-center gap-3">
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {classList.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>

            <Button onClick={() => handleOpenAddSlot()} leftIcon={<Plus className="h-4 w-4" />}>
              {t('schedule.addSlot')}
            </Button>
          </div>
        </div>

        {/* Timetable Grid View */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-3 text-center text-xs font-semibold text-muted-foreground w-28 uppercase border-r border-border">
                    Time
                  </th>
                  {daysOfWeek.map((day) => (
                    <th key={day.day} className="p-3 text-center text-xs font-semibold text-foreground uppercase border-r border-border last:border-r-0">
                      {t(day.key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {timeSlotsList.map((time) => (
                  <tr key={time.start} className="hover:bg-muted/20 transition-colors">
                    {/* Time Column */}
                    <td className="p-3 text-center font-mono text-xs font-medium text-muted-foreground bg-muted/20 border-r border-border">
                      {time.start} - {time.end}
                    </td>

                    {/* Day Columns */}
                    {daysOfWeek.map((day) => {
                      const slot = schedules.find(
                        (s) => s.dayOfWeek === day.day && s.startTime === time.start
                      );

                      return (
                        <td
                          key={day.day}
                          className="p-2 border-r border-border last:border-r-0 align-top h-24 relative group"
                        >
                          {slot ? (
                            <div
                              className="h-full p-2.5 rounded-lg border flex flex-col justify-between shadow-xs transition-shadow hover:shadow-md cursor-pointer"
                              style={{
                                borderLeftWidth: '4px',
                                borderLeftColor: slot.subject?.color || '#3b82f6',
                                backgroundColor: `${slot.subject?.color || '#3b82f6'}10`,
                              }}
                              onClick={() => handleOpenEditSlot(slot)}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-bold text-xs text-foreground truncate">
                                    {slot.subject?.name || 'Subject'}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDeleteTarget(slot);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded transition-opacity"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                  {slot.subject?.code}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {slot.room || 'Room'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAddSlot(day.day, time.start, time.end)}
                              className="w-full h-full rounded-lg border border-dashed border-border opacity-0 group-hover:opacity-100 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Slot Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingSlot ? t('schedule.editSlot') : t('schedule.addSlot')}
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveSlot} isLoading={saving}>
                {t('common.save')}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveSlot} className="space-y-4 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Subject</label>
              <select
                value={slotForm.subjectId}
                onChange={(e) => setSlotForm({ ...slotForm, subjectId: e.target.value })}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {subjectList.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">{t('schedule.day')}</label>
                <select
                  value={slotForm.dayOfWeek}
                  onChange={(e) => setSlotForm({ ...slotForm, dayOfWeek: Number(e.target.value) })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {daysOfWeek.map((d) => (
                    <option key={d.day} value={d.day}>
                      {t(d.key)}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Room"
                placeholder="Room 101"
                value={slotForm.room}
                onChange={(e) => setSlotForm({ ...slotForm, room: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('schedule.startTime')}
                type="time"
                value={slotForm.startTime}
                onChange={(e) => setSlotForm({ ...slotForm, startTime: e.target.value })}
              />
              <Input
                label={t('schedule.endTime')}
                type="time"
                value={slotForm.endTime}
                onChange={(e) => setSlotForm({ ...slotForm, endTime: e.target.value })}
              />
            </div>
          </form>
        </Modal>

        {/* Delete Slot Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteSlot}
          title="Remove Time Slot?"
          description="Are you sure you want to remove this schedule slot from the timetable?"
          variant="danger"
          confirmText="Remove Slot"
          isLoading={deleting}
        />
      </div>
    </>
  );
}
