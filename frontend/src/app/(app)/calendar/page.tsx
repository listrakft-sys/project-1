'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import api from '@/lib/api/client';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Clock,
  MapPin,
  X,
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string | null;
  location: string | null;
  createdBy: string;
  creator?: {
    profile: { firstName: string; lastName: string } | null;
  } | null;
}

const EVENT_TYPES = ['event', 'lesson', 'homeworkDue', 'exam', 'holiday', 'meeting'];

const TYPE_COLORS: Record<string, string> = {
  EVENT: 'bg-blue-100 text-blue-700 border-blue-200',
  LESSON: 'bg-purple-100 text-purple-700 border-purple-200',
  HOMEWORK_DUE: 'bg-amber-100 text-amber-700 border-amber-200',
  EXAM: 'bg-red-100 text-red-700 border-red-200',
  HOLIDAY: 'bg-green-100 text-green-700 border-green-200',
  MEETING: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const MONTHS_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function CalendarPage() {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Create form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'EVENT',
    startDate: '',
    endDate: '',
    location: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.role || '');
      } catch { /* ignore */ }
    }
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const now = new Date();
      const from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString();
      const to = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString();
      const res = await api.get(`/calendar?from=${from}&to=${to}`);
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/calendar', {
        title: formData.title,
        description: formData.description || undefined,
        type: formData.type,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        location: formData.location || undefined,
      });
      setShowCreateModal(false);
      setFormData({ title: '', description: '', type: 'EVENT', startDate: '', endDate: '', location: '' });
      fetchEvents();
    } catch (err) {
      console.error('Failed to create event', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('calendario.confirmDelete'))) return;
    try {
      await api.delete(`/calendar/${id}`);
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);

    return days;
  }, [currentMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach(ev => {
      const dateKey = new Date(ev.startDate).toDateString();
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(ev);
    });
    return map;
  }, [events]);

  const selectedDateEvents = selectedDate ? eventsByDate[selectedDate.toDateString()] || [] : [];
  const canCreate = ['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN'].includes(userRole);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const goToToday = () => { setCurrentMonth(new Date()); setSelectedDate(new Date()); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarIcon className="h-7 w-7 text-blue-500" />
          <h1 className="text-2xl font-bold">{t('calendario.title')}</h1>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            {t('calendario.createEvent')}
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Календарь */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {MONTHS_ES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <button
                    onClick={prevMonth}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                    title={t('calendario.prevMonth')}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="rounded-lg px-3 py-1 text-sm font-medium border hover:bg-slate-50 transition-colors"
                  >
                    {t('calendario.today')}
                  </button>
                  <button
                    onClick={nextMonth}
                    className="rounded-lg p-2 hover:bg-slate-100 transition-colors"
                    title={t('calendario.nextMonth')}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS_ES.map(day => (
                  <div key={day} className="text-center text-xs font-semibold text-slate-500 py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const dateKey = date.toDateString();
                  const dayEvents = eventsByDate[dateKey] || [];
                  const isToday = date.toDateString() === new Date().toDateString();
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`relative min-h-[70px] rounded-lg border p-1.5 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : isToday
                          ? 'border-blue-300 bg-blue-50/50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-slate-700'}`}>
                        {date.getDate()}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayEvents.slice(0, 3).map(ev => (
                          <div
                            key={ev.id}
                            className={`truncate rounded px-1.5 py-0.5 text-xs font-medium border ${TYPE_COLORS[ev.type] || TYPE_COLORS.EVENT}`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-slate-400 pl-1">+{dayEvents.length - 3}</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Боковая панель — события выбранного дня */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate
                  ? `${t('calendario.eventsOn')} ${selectedDate.toLocaleDateString()}`
                  : t('calendario.noEvents')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateEvents.length === 0 ? (
                <p className="text-slate-400 text-sm">{t('calendario.noEvents')}</p>
              ) : (
                <div className="space-y-3">
                  {selectedDateEvents.map(ev => (
                    <div
                      key={ev.id}
                      className={`rounded-lg border p-3 ${TYPE_COLORS[ev.type] || TYPE_COLORS.EVENT}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm">{ev.title}</h4>
                          {ev.description && (
                            <p className="text-xs mt-1 text-slate-600">{ev.description}</p>
                          )}
                          <div className="mt-2 flex flex-col gap-1 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {ev.endDate && ` - ${new Date(ev.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </div>
                            {ev.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {ev.location}
                              </div>
                            )}
                          </div>
                        </div>
                        {canCreate && (
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Модалка создания события */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreateModal(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">{t('calendario.createEvent')}</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('calendario.eventTitle')}</label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('calendario.description')}</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('calendario.eventType')}</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {EVENT_TYPES.map(tp => (
                      <option key={tp} value={tp.toUpperCase()}>{t(`calendario.${tp}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('calendario.location')}</label>
                  <input
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('calendario.startDate')}</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t('calendario.endDate')}</label>
                  <input
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  {t('calendario.deleteEvent') === 'Eliminar evento' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {t('calendario.createEvent')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
