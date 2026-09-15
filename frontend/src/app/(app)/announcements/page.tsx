'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation, localeFromLanguage } from '@/lib/i18n';
import { useAuthStore } from '@/lib/store/auth';
import api from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Megaphone, Pin, AlertCircle, Loader2, Calendar, Plus, Pencil, Trash2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  targetAudience: string;
  createdAt: string;
  author?: {
    profile?: { firstName?: string; lastName?: string };
    username?: string;
  };
}

interface AnnouncementForm {
  title: string;
  content: string;
  targetAudience: string;
  isPinned: boolean;
}

const emptyForm: AnnouncementForm = { title: '', content: '', targetAudience: 'ALL', isPinned: false };
const AUDIENCES = ['ALL', 'TEACHERS', 'PARENTS', 'STUDENTS', 'CLASS'];

export default function AnnouncementsPage() {
  const { t, language } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const canManage =
    !!user && ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].includes(user.role);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AnnouncementForm>(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setError(null);
    try {
      const response = await api.get('/announcements');
      const data = response.data.data || response.data;
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      setError(axiosErr.response?.data?.error?.message || axiosErr.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(localeFromLanguage(language), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sorted = [...announcements].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // ── CRUD handlers ──
  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (a: Announcement) => {
    setEditingId(a.id);
    setForm({
      title: a.title || '',
      content: a.content || '',
      targetAudience: a.targetAudience || 'ALL',
      isPinned: !!a.isPinned,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      setFormError(t('announcements.validationRequired'));
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        targetAudience: form.targetAudience,
        isPinned: form.isPinned,
      };
      if (editingId) {
        await api.put(`/announcements/${editingId}`, payload);
      } else {
        await api.post('/announcements', payload);
      }
      setModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to save announcement', err);
      setFormError(t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/announcements/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
    } finally {
      setDeleting(false);
    }
  };

  const fieldCls =
    'w-full py-2 px-3 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-foreground';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-2">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('nav.announcements')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('announcements.totalCount')}: {sorted.length}
            </p>
          </div>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="h-4 w-4" />}>
            {t('announcements.add')}
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <Card className="p-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">{t('announcements.empty')}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((announcement) => (
            <Card key={announcement.id} className={announcement.isPinned ? 'border-primary/50 shadow-md' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {announcement.isPinned && (
                      <Pin className="h-4 w-4 text-primary fill-primary" />
                    )}
                    {announcement.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEditModal(announcement)}
                          aria-label={t('common.edit')}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(announcement)}
                          aria-label={t('common.delete')}
                          className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(announcement.createdAt)}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{announcement.content}</p>
                <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {announcement.author?.profile?.firstName || announcement.author?.username || ''}
                  </span>
                  <span>·</span>
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {t(`announcements.audience.${announcement.targetAudience}`) || announcement.targetAudience}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? t('announcements.edit') : t('announcements.add')}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            {formError && <p className="text-xs text-destructive mr-auto">{formError}</p>}
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={saving}>
              {editingId ? t('common.save') : t('common.create')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('announcements.titleLabel')} *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t('announcements.titleLabel')}
              className={'mt-1 ' + fieldCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              {t('announcements.contentLabel')} *
            </label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder={t('announcements.contentLabel')}
              className={'mt-1 min-h-[110px] ' + fieldCls}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                {t('announcements.audienceLabel')}
              </label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className={'mt-1 ' + fieldCls}
              >
                {AUDIENCES.map((a) => (
                  <option key={a} value={a}>
                    {t(`announcements.audience.${a}`)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                type="checkbox"
                id="pinned-checkbox"
                checked={form.isPinned}
                onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
                className="h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
              />
              <label htmlFor="pinned-checkbox" className="text-sm text-foreground cursor-pointer select-none">
                {t('announcements.pinnedLabel')}
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={`${t('announcements.delete')}: ${deleteTarget?.title || ''}?`}
        description={t('announcements.deleteConfirm')}
        variant="danger"
        confirmText={t('common.delete')}
        isLoading={deleting}
      />
    </div>
  );
}
