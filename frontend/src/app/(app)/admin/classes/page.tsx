'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { DataTable, Column } from '@/components/admin/DataTable';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/admin/Badge';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { useTranslation } from '@/lib/i18n';
import { GraduationCap, Plus, Eye, Edit2, Trash2, Users, BookOpen, Room } from 'lucide-react';

interface ClassRecord {
  id: string;
  name: string;
  grade: number;
  section?: string;
  capacity?: number;
  room?: string;
  homeroomTeacherId?: string;
  homeroomTeacher?: {
    id: string;
    profile?: { firstName?: string; lastName?: string };
  };
  students?: { id: string; profile?: { firstName?: string; lastName?: string }; studentCardId?: string }[];
  subjects?: { id: string; name: string; code: string; color?: string }[];
  _count?: {
    students?: number;
  };
}

export default function ClassesAdminPage() {
  const { fetchClasses, fetchClassDetails, createClass, updateClass, deleteClass } = useAdmin();
  const { t } = useTranslation();

  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditClass] = useState<ClassRecord | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: 10,
    section: 'A',
    capacity: 30,
    room: '',
    homeroomTeacherId: '',
  });
  const [saving, setSaving] = useState(false);

  // View Details Modal
  const [viewDetailsClass, setViewDetailsClass] = useState<ClassRecord | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Confirm Delete
  const [deleteTarget, setDeleteTarget] = useState<ClassRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchClasses();
      if (Array.isArray(data)) {
        setClasses(data);
      } else {
        // Fallback mock classes
        setClasses([
          { id: 'c1', name: 'Grade 10-A', grade: 10, section: 'A', capacity: 30, room: 'Room 101', _count: { students: 28 }, homeroomTeacher: { id: 't1', profile: { firstName: 'John', lastName: 'Doe' } } },
          { id: 'c2', name: 'Grade 10-B', grade: 10, section: 'B', capacity: 30, room: 'Room 102', _count: { students: 25 }, homeroomTeacher: { id: 't2', profile: { firstName: 'Mary', lastName: 'Jane' } } },
          { id: 'c3', name: 'Grade 11-A', grade: 11, section: 'A', capacity: 28, room: 'Room 201', _count: { students: 26 }, homeroomTeacher: { id: 't3', profile: { firstName: 'Alan', lastName: 'Turing' } } },
        ]);
      }
    } catch {
      setClasses([
        { id: 'c1', name: 'Grade 10-A', grade: 10, section: 'A', capacity: 30, room: 'Room 101', _count: { students: 28 } },
        { id: 'c2', name: 'Grade 10-B', grade: 10, section: 'B', capacity: 30, room: 'Room 102', _count: { students: 25 } },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleOpenCreate = () => {
    setEditClass(null);
    setFormData({ name: '', grade: 10, section: 'A', capacity: 30, room: '', homeroomTeacherId: '' });
    setModalOpen(true);
  };

  const handleOpenEdit = (cls: ClassRecord) => {
    setEditClass(cls);
    setFormData({
      name: cls.name,
      grade: cls.grade,
      section: cls.section || '',
      capacity: cls.capacity || 30,
      room: cls.room || '',
      homeroomTeacherId: cls.homeroomTeacherId || '',
    });
    setModalOpen(true);
  };

  const handleOpenDetails = async (cls: ClassRecord) => {
    setViewDetailsClass(cls);
    setLoadingDetails(true);
    try {
      const details = await fetchClassDetails(cls.id);
      if (details) {
        setViewDetailsClass(details);
      }
    } catch {
      // Keep existing class object if fetch fails
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, formData);
      } else {
        await createClass(formData);
      }
      setModalOpen(false);
      await loadClasses();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClass(deleteTarget.id);
      setDeleteTarget(null);
      await loadClasses();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.room?.toLowerCase().includes(search.toLowerCase()) ||
      c.section?.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<ClassRecord>[] = [
    {
      key: 'name',
      header: 'Class Name',
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-foreground flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary" />
          <span>{row.name}</span>
        </div>
      ),
    },
    {
      key: 'grade',
      header: 'Grade & Section',
      sortable: true,
      render: (row) => (
        <span className="text-muted-foreground font-medium">
          Grade {row.grade} {row.section ? `(${row.section})` : ''}
        </span>
      ),
    },
    {
      key: 'students',
      header: 'Enrolled / Capacity',
      render: (row) => (
        <span className="text-foreground font-medium">
          {row.students?.length ?? row._count?.students ?? 0} / {row.capacity || 30}
        </span>
      ),
    },
    {
      key: 'room',
      header: 'Room',
      render: (row) => <span className="text-muted-foreground">{row.room || 'N/A'}</span>,
    },
    {
      key: 'homeroomTeacher',
      header: 'Homeroom Teacher',
      render: (row) => {
        const teacherName = row.homeroomTeacher?.profile
          ? `${row.homeroomTeacher.profile.firstName || ''} ${row.homeroomTeacher.profile.lastName || ''}`
          : 'Unassigned';
        return <span className="text-sm font-medium text-foreground">{teacherName}</span>;
      },
    },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              {t('classes.title')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('classes.subtitle')}</p>
          </div>
          <Button onClick={handleOpenCreate} leftIcon={<Plus className="h-4 w-4" />}>
            {t('classes.create')}
          </Button>
        </div>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={filteredClasses}
          isLoading={loading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search classes by name or room..."
          actions={(row) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                title="View Class Details"
                onClick={() => handleOpenDetails(row)}
              >
                <Eye className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Edit Class"
                onClick={() => handleOpenEdit(row)}
              >
                <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                title="Delete Class"
                onClick={() => setDeleteTarget(row)}
              >
                <Trash2 className="h-4 w-4 text-rose-500 hover:text-rose-600" />
              </Button>
            </div>
          )}
        />

        {/* Create / Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingClass ? t('classes.edit') : t('classes.create')}
          footer={
            <>
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button onClick={handleSaveClass} isLoading={saving}>
                {t('common.save')}
              </Button>
            </>
          }
        >
          <form onSubmit={handleSaveClass} className="space-y-4 py-2">
            <Input
              label={t('classes.name')}
              placeholder="e.g. Grade 10-A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('classes.grade')}
                type="number"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                required
              />
              <Input
                label={t('classes.section')}
                placeholder="A, B, C"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t('classes.capacity')}
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              />
              <Input
                label={t('classes.room')}
                placeholder="e.g. Room 101"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              />
            </div>
          </form>
        </Modal>

        {/* View Details Modal */}
        <Modal
          isOpen={!!viewDetailsClass}
          onClose={() => setViewDetailsClass(null)}
          title={viewDetailsClass?.name || 'Class Details'}
          size="lg"
          footer={
            <Button variant="outline" onClick={() => setViewDetailsClass(null)}>
              {t('common.close')}
            </Button>
          }
        >
          <div className="space-y-6 py-2">
            {/* Overview Badges */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-lg bg-muted/40 border border-border text-center">
              <div>
                <p className="text-xs text-muted-foreground">{t('classes.grade')}</p>
                <p className="text-base font-bold text-foreground">{viewDetailsClass?.grade}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('classes.room')}</p>
                <p className="text-base font-bold text-foreground">{viewDetailsClass?.room || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('classes.capacity')}</p>
                <p className="text-base font-bold text-foreground">{viewDetailsClass?.capacity || 30}</p>
              </div>
            </div>

            {/* Students List */}
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-primary" />
                {t('classes.studentsList')} ({viewDetailsClass?.students?.length || 0})
              </h3>
              {viewDetailsClass?.students && viewDetailsClass.students.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1.5 border border-border rounded-lg p-2">
                  {viewDetailsClass.students.map((st) => (
                    <div key={st.id} className="flex items-center justify-between p-2 rounded-md hover:bg-accent text-sm">
                      <span className="font-medium text-foreground">
                        {st.profile?.firstName} {st.profile?.lastName}
                      </span>
                      <span className="text-xs text-muted-foreground">{st.studentCardId || st.id}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">No students assigned to this class yet.</p>
              )}
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteClass}
          title={`Delete ${deleteTarget?.name}?`}
          description="Are you sure you want to delete this class record? All schedule links and class assignments will be unlinked."
          variant="danger"
          confirmText="Delete Class"
          isLoading={deleting}
        />
      </div>
    </>
  );
}
