'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/auth';
import { FileText, Clock, Search, Plus, Pencil, Trash2 } from 'lucide-react';

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: string;
  subject: { id: string; name: string; color: string } | null;
}

interface SubjectOption {
  id: string;
  name: string;
}

interface HomeworkForm {
  title: string;
  subjectId: string;
  dueDate: string;
  status: string;
  description: string;
}

const emptyForm: HomeworkForm = {
  title: '',
  subjectId: '',
  dueDate: new Date().toISOString().slice(0, 10),
  status: 'assigned',
  description: '',
};

const STATUS_KEYS = ['assigned', 'in_progress', 'submitted', 'graded', 'late', 'overdue'];

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
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);

  // Management (admin/teacher)
  const user = useAuthStore((state) => state.user);
  const canManage =
    !!user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role);

  const [form, setForm] = useState<HomeworkForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Homework | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchHomework();
    api
      .get('/subjects')
      .then((res) => {
        const raw = res.data;
        setSubjects(Array.isArray(raw) ? raw : raw?.data || []);
      })
      .catch(() => {});
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

  // ── CRUD handlers ──
  const openCreateModal = () => {
    setEditingHw(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (hw: Homework) => {
    setEditingHw(hw);
    setForm({
      title: hw.title || '',
      subjectId: hw.subject?.id || '',
      dueDate: hw.dueDate || new Date().toISOString().slice(0, 10),
      status: hw.status || 'assigned',
      description: hw.description || '',
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.subjectId) {
      setFormError(t('homework.validationRequired'));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: form.title.trim(),
        subjectId: form.subjectId,
        dueDate: form.dueDate,
        status: form.status,
        description: form.description.trim(),
      };
      if (editingHw) {
        await api.put(`/homework/${editingHw.id}`, payload);
      } else {
        await api.post('/homework', payload);
      }
      setModalOpen(false);
      fetchHomework();
    } catch (err) {
      console.error('Failed to save homework', err);
      setFormError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/homework/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchHomework();
    } catch (err) {
      console.error('Failed to delete homework', err);
    } finally {
      setDeleting(false);
    }
  };

  const stopNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const fieldCls =
    'w-full py-2 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground';

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            {t('homework.title')}
          </h1>
          {canManage && (
            <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
              {t('homework.addTask')}
            </Button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('homework.searchPlaceholder')}
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
            <option value="all">{t('homework.all')}</option>
            <option value="assigned">{t('homework.status.assigned')}</option>
            <option value="in_progress">{t('homework.status.inProgress')}</option>
            <option value="submitted">{t('homework.status.submitted')}</option>
            <option value="graded">{t('homework.status.graded')}</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{t('homework.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((hw) => (
              <Link href={`/homework/${hw.id}`} key={hw.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-semibold">{hw.title}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            statusColors[hw.status] || statusColors.assigned
                          }`}
                        >
                          {t(`status.${hw.status}`)}
                        </span>
                        {canManage && (
                          <div className="flex items-center" onClick={stopNavigation}>
                            <button
                              onClick={() => openEditModal(hw)}
                              aria-label={t('common.edit')}
                              className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(hw)}
                              aria-label={t('common.delete')}
                              className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
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
                        <span className="text-red-600">
                          {new Date(hw.dueDate).toLocaleDateString()}
                        </span>
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingHw ? t('homework.editTask') : t('homework.addTask')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            {formError && <p className="text-xs text-destructive mr-auto">{formError}</p>}
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving}>
              {editingHw ? t('common.save') : t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('homework.title')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t('homework.title')}
              className={'mt-1 ' + fieldCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('homework.subject')} *
              </label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className={'mt-1 ' + fieldCls}
              >
                <option value="">{t('schedule.selectSubject')}</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('homework.dueDate')}
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={'mt-1 ' + fieldCls}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('homework.statusLabel')}
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className={'mt-1 ' + fieldCls}
              >
                {STATUS_KEYS.map((st) => (
                  <option key={st} value={st}>
                    {t(`status.${st}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('homework.description')}
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={t('homework.description')}
              className={'mt-1 min-h-[90px] ' + fieldCls}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`${t('homework.deleteTask')}: ${deleteTarget?.title || ''}?`}
        description={t('homework.deleteConfirm')}
        variant="danger"
        confirmText={t('common.delete')}
        isLoading={deleting}
      />
    </>
  );
}
