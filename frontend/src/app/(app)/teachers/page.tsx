'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api/client';
import { GraduationCap, Search } from 'lucide-react';

interface Teacher {
  id: string;
  username: string;
  profile?: { firstName?: string; lastName?: string; avatar?: string };
  teacher?: { subjects?: { name: string; color: string }[] } | null;
}

export default function TeachersPage() {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/teachers');
      setTeachers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch teachers', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = teachers.filter((tc) => {
    if (!search) return true;
    const name = `${tc.profile?.firstName || ''} ${tc.profile?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || tc.username.toLowerCase().includes(search.toLowerCase());
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
          <GraduationCap className="h-6 w-6 text-primary" />
          {t('teachers')}
        </h1>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchTeachers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">{t('noTeachersFound')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((teacher) => (
              <Link href={`/profile/${teacher.id}`} key={teacher.id}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-semibold">
                      {(teacher.profile?.firstName?.[0] || teacher.username[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {teacher.profile?.firstName} {teacher.profile?.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">@{teacher.username}</p>
                      {teacher.teacher?.subjects && teacher.teacher.subjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {teacher.teacher.subjects.slice(0, 3).map((subj, i) => (
                            <span
                              key={i}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: `${subj.color}15`, color: subj.color }}
                            >
                              {subj.name}
                            </span>
                          ))}
                        </div>
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
