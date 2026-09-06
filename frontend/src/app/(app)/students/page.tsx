'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';
import { Users, Search } from 'lucide-react';

interface Student {
  id: string;
  username: string;
  profile?: { firstName?: string; lastName?: string; avatar?: string };
  student?: { class?: { name: string; grade: number; section: string } } | null;
}

export default function StudentsPage() {
  const { t } = useTranslation();
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch students', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!search) return true;
    const name = `${s.profile?.firstName || ''} ${s.profile?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || s.username.toLowerCase().includes(search.toLowerCase());
  });

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
          <Users className="h-6 w-6 text-primary" />
          {t('students')}
        </h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchStudents')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{t('noStudentsFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((student) => (
              <Link href={`/profile/${student.id}`} key={student.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {(student.profile?.firstName?.[0] || student.username[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {student.profile?.firstName} {student.profile?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">@{student.username}</p>
                      {student.student?.class && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted mt-1 inline-block">
                          {student.student.class.name}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
