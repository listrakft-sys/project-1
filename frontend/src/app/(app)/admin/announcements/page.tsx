'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';
import { Megaphone, Pin, Plus, Trash2, Edit } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: string;
  isPinned: boolean;
  createdAt: string;
  author: { username: string; profile?: { firstName?: string; lastName?: string } };
}

export default function AdminAnnouncementsPage() {
  const { t } = useTranslation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ title: '', content: '', audience: 'school', classId: '' });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements');
      setAnnouncements(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch announcements', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/announcements', form);
      setShowForm(false);
      setForm({ title: '', content: '', audience: 'school', classId: '' });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to create announcement', err);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await api.put(`/announcements/${editing.id}`, { title: form.title, content: form.content });
      setEditing(null);
      setForm({ title: '', content: '', audience: 'school', classId: '' });
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to update announcement', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este anuncio?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement', err);
    }
  };

  const handlePin = async (id: string) => {
    try {
      await api.post(`/announcements/${id}/pin`);
      fetchAnnouncements();
    } catch (err) {
      console.error('Failed to pin announcement', err);
    }
  };

  const startEdit = (a: Announcement) => {
    setEditing(a);
    setForm({ title: a.title, content: a.content, audience: a.audience, classId: '' });
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            {t('Anuncios')}
          </h1>
          <Button onClick={() => { setShowForm(true); setEditing(null); setForm({ title: '', content: '', audience: 'school', classId: '' }); }}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </div>

        {/* Form */}
        {(showForm || editing) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{editing ? 'Editar anuncio' : 'Nuevo anuncio'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Título"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Contenido..."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <div>
                <label className="text-sm font-medium block mb-1">Audiencia</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                >
                  <option value="school">Toda la escuela</option>
                  <option value="class">Una clase</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button onClick={editing ? handleUpdate : handleCreate}>
                {editing ? t('save') : 'Publicar'}
              </Button>
              <Button variant="ghost" onClick={() => { setShowForm(false); setEditing(null); }}>
                {t('cancel')}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* List */}
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="text-center py-16">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No hay anuncios</p>
            </div>
          ) : (
            announcements.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {a.isPinned && <Pin className="h-4 w-4 text-primary" />}
                      <h3 className="font-semibold">{a.title}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handlePin(a.id)} className="p-1.5 rounded hover:bg-muted">
                        <Pin className={`h-4 w-4 ${a.isPinned ? 'text-primary' : 'text-muted-foreground'}`} />
                      </button>
                      <button onClick={() => startEdit(a)} className="p-1.5 rounded hover:bg-muted">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded hover:bg-muted">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3">{a.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-full bg-muted">{a.audience}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
