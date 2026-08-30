'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { useTranslation } from '@/lib/i18n';
import { BookOpen, Plus, Edit2, Trash2, UserPlus, Check, Globe } from 'lucide-react';

interface SubjectRecord {
  id: string;
  name: string;
  code: string;
  description?: string;
  color?: string;
  language?: string;
  teachers?: {
    id: string;
    userId?: string;
    profile?: { firstName?: string; lastName?: string };
  }[];
}

const colorPresets = [
  '#3b82f6', // blue
  '#10b981', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
];

export default function SubjectsAdminPage() {
  const { fetchSubjects, createSubject, updateSubject, deleteSubject, assignTeacherToSubject, removeTeacherFromSubject } = useAdmin();
  const { t } = useTranslation();

  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRecord | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3b82f6',
    language: 'en',
  });
  const [saving, setSaving] = useState(false);

  // Assign Teachers Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<SubjectRecord | null>(null);

  // Confirm Delete
  const [deleteTarget, setDeleteTarget] = useState<SubjectRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSubjects();
      if (Array.isArray(data)) {
        setSubjects(data);
      } else {
        setSubjects([
          { id: 's1', name: 'Mathematics', code: 'MATH101', description: 'Algebra, Geometry & Functions', color: '#3b82f6', language: 'en' },
          { id: 's2', name: 'Physics', code: 'PHYS101', description: 'Mechanics and Thermodynamics', color: '#8b5cf6', language: 'en' },
          { id: 's3', name: 'Spanish Literature', code: 'SPAN201', description: 'Spanish language and classics', color: '#ef4444', language: 'es' },
          { id: 's4', name: 'German Grammar', code: 'GERM101', description: 'Basic German communication', color: '#f59e0b', language: 'de' },
        ]);
      }
    } catch {
      setSubjects([
        { id: 's1', name: 'Mathematics', code: 'MATH101', description: 'Algebra & Geometry', color: '#3b82f6', language: 'en' },
        { id: 's2', name: 'Physics', code: 'PHYS101', description: 'Classical Mechanics', color: '#8b5cf6', language: 'en' },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const handleOpenCreate = () => {
    setEditingSubject(null);
    setFormData({ name: '', code: '', description: '', color: '#3b82f6', language: 'en' });
    setModalOpen(true);
  };

  const handleOpenEdit = (sub: SubjectRecord) => {
    setEditingSubject(sub);
    setFormData({
      name: sub.name,
      code: sub.code,
      description: sub.description || '',
      color: sub.color || '#3b82f6',
      language: sub.language || 'en',
    });
    setModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData);
      } else {
        await createSubject(formData);
      }
      setModalOpen(false);
      await loadSubjects();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSubject(deleteTarget.id);
      setDeleteTarget(null);
      await loadSubjects();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<SubjectRecord>[] = [
    {
      key: 'name',
      header: 'Subject Name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span
            className="h-4 w-4 rounded-full border border-black/10 shrink-0"
            style={{ backgroundColor: row.color || '#3b82f6' }}
          />
          <div>
            <p className="font-semibold text-foreground text-sm">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs px-2 py-1 bg-muted rounded font-bold text-foreground">
          {row.code}
        </span>
      ),
    },
    {
      key: 'language',
      header: 'Language',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground uppercase">
          <Globe className="h-3.5 w-3.5" />
          {row.language || 'en'}
        </span>
      ),
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <BookOpen className="h-7 w-7 text-primary" />
              {t('subjects.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('subjects.subtitle')}</p>
          </div>
          <Button onClick={handleOpenCreate} leftIcon={<Plus className="h-4 w-4" />}>
            {t('subjects.create')}
          </Button>
        </div>

        {/* Subjects Table */}
        <DataTable
          columns={columns}
          data={filteredSubjects}
          isLoading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search subjects by name or code..."
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                title="Edit Subject"
                onClick={() => handleOpenEdit(row)}
              >
                <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Delete Subject"
                onClick={() => setDeleteTarget(row)}
              >
                <Trash2 className="h-4 w-4 text-rose-500 hover:text-rose-600" />
              </Button>
            </div>
          )}
        />

        {/* Create / Edit Subject Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingSubject ? t('subjects.edit') : t('subjects.create')}
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveSubject} isLoading={saving}>
                {t('common.save')}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveSubject} className="space-y-4 py-2">
            <Input
              label="Subject Name"
              placeholder="e.g. Mathematics"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('subjects.code')}
                placeholder="e.g. MATH101"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">{t('subjects.language')}</label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="h-10 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="en">English (en)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="de">German (de)</option>
                </select>
              </div>
            </div>

            <Input
              label="Description"
              placeholder="Short summary of course curriculum"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {/* Color Swatch Picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{t('subjects.color')}</label>
              <div className="flex items-center gap-2 flex-wrap">
                {colorPresets.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setFormData({ ...formData, color: c })}
                    style={{ backgroundColor: c }}
                    className={`h-8 w-8 rounded-full border-2 transition-transform ${
                      formData.color === c ? 'scale-110 border-foreground shadow' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>
          </form>
        </Modal>

        {/* Delete Subject Confirm Dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteSubject}
          title={`Delete ${deleteTarget?.name}?`}
          description="Are you sure you want to delete this subject? Lessons and assignments linked to this subject will be affected."
          variant="danger"
          confirmText="Delete Subject"
          isLoading={deleting}
        />
      </div>
    </>
  );
}
