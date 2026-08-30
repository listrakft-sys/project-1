'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api/client';
import { Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface Complaint {
  id: string;
  type: string;
  status: string;
  description: string;
  resolution?: string;
  createdAt: string;
  filedBy: { username: string; profile?: { firstName?: string; lastName?: string } };
  againstUser: { username: string; profile?: { firstName?: string; lastName?: string } };
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-500/10 text-yellow-600',
  REVIEWING: 'bg-blue-500/10 text-blue-600',
  RESOLVED: 'bg-green-500/10 text-green-600',
  DISMISSED: 'bg-red-500/10 text-red-600',
};

export default function AdminComplaintsPage() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [resolution, setResolution] = useState('');
  const [status, setStatus] = useState('REVIEWING');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints');
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.put(`/complaints/${selected.id}`, { status, resolution });
      fetchComplaints();
      setSelected(null);
      setResolution('');
    } catch (err) {
      console.error('Failed to resolve complaint', err);
    } finally {
      setSaving(false);
    }
  };

  const getName = (user: any) => {
    if (user?.profile?.firstName) return `${user.profile.firstName} ${user.profile.lastName || ''}`;
    return user?.username || 'N/A';
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
          <Shield className="h-6 w-6 text-primary" />
          {t('Quejas y reportes')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Complaints list */}
          <div className="lg:col-span-2 space-y-3">
            {complaints.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay quejas pendientes</p>
              </div>
            ) : (
              complaints.map((c) => (
                <Card
                  key={c.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${selected?.id === c.id ? 'border-primary' : ''}`}
                >
                  <CardContent className="p-4" onClick={() => setSelected(c)}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{c.type}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[c.status] || statusColors.PENDING}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>De: {getName(c.filedBy)}</span>
                      <span>Contra: {getName(c.againstUser)}</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Handle panel */}
          {selected && (
            <Card className="lg:sticky lg:top-6 h-fit">
              <CardHeader>
                <CardTitle className="text-lg">Resolver queja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t('description')}:</p>
                  <p className="text-sm">{selected.description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Estado</label>
                  <select
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="REVIEWING">En revisión</option>
                    <option value="RESOLVED">Resuelto</option>
                    <option value="DISMISSED">Desestimado</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Resolución</label>
                  <textarea
                    className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Describe la resolución..."
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                  />
                </div>
                <Button onClick={handleResolve} disabled={saving} className="w-full">
                  {saving ? t('saving') : 'Resolver'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
