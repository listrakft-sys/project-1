// Demo data for GitHub Pages / no-backend mode
// All mock data returned in the same format as the real API

export const DEMO_DATA = {
  // ── Dashboard ──
  lessonsToday: [
    { id: 'l1', title: 'Алгебра', subject: { name: 'Математика', color: '#3b82f6' }, startTime: '09:00', endTime: '09:50', room: '201', className: '7-A' },
    { id: 'l2', title: 'Сервантес', subject: { name: 'Литература', color: '#ec4899' }, startTime: '10:00', endTime: '10:50', room: '105', className: '7-A' },
    { id: 'l3', title: 'Законы Ньютона', subject: { name: 'Физика', color: '#8b5cf6' }, startTime: '11:00', endTime: '11:50', room: '301', className: '8-B' },
    { id: 'l4', title: 'Реконкиста', subject: { name: 'История', color: '#f59e0b' }, startTime: '12:00', endTime: '12:50', room: '202', className: '7-A' },
  ],

  homework: [
    { id: 'h1', title: 'Уравнения 2-й степени', subject: { name: 'Математика', color: '#3b82f6' }, dueDate: '2026-09-03', status: 'assigned', description: 'Решить задачи 1-15 на стр. 84' },
    { id: 'h2', title: 'Эссе: Дон Кихот', subject: { name: 'Литература', color: '#ec4899' }, dueDate: '2026-09-05', status: 'in_progress', description: 'Написать эссе 500 слов' },
    { id: 'h3', title: 'Лабораторная: Маятник', subject: { name: 'Физика', color: '#8b5cf6' }, dueDate: '2026-09-02', status: 'submitted', description: 'Отчёт по лабораторной работе' },
    { id: 'h4', title: 'Тест: Реконкиста', subject: { name: 'История', color: '#f59e0b' }, dueDate: '2026-09-07', status: 'graded', description: 'Подготовка к тесту', grade: 'A', feedback: 'Отлично!' },
  ],

  announcements: [
    { id: 'a1', title: 'Добро пожаловать в новый учебный год!', content: 'Начинаем 2026-2027 учебный год. Первое собрание — 5 сентября.', author: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } }, createdAt: new Date().toISOString(), priority: 'high' },
    { id: 'a2', title: 'Родительское собрание', content: 'Родительское собрание для 7-х классов в эту пятницу в 18:00.', author: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } }, createdAt: new Date().toISOString(), priority: 'medium' },
    { id: 'a3', title: 'Спортивный день', content: '12 сентября — школьный спортивный день.', author: { profile: { firstName: 'Карлос', lastName: 'Руис' } }, createdAt: new Date().toISOString(), priority: 'low' },
  ],

  conversations: [
    { id: 'c1', title: '7-A Родительский чат', lastMessage: 'Спасибо за информацию!', lastMessageAt: new Date().toISOString(), unreadCount: 2, participants: 12 },
    { id: 'c2', title: 'Карлос Руис', lastMessage: 'Когда родительское собрание?', lastMessageAt: new Date().toISOString(), unreadCount: 0, participants: 2 },
    { id: 'c3', title: 'Учителя 7-х классов', lastMessage: 'Нам нужно обсудить расписание', lastMessageAt: new Date().toISOString(), unreadCount: 1, participants: 5 },
  ],

  notifications: [
    { id: 'n1', title: 'Новая оценка', message: 'Мария получила A по математике', type: 'grade', read: false, createdAt: new Date().toISOString() },
    { id: 'n2', title: 'Новая домашняя работа', message: 'Задано: Уравнения 2-й степени', type: 'homework', read: false, createdAt: new Date().toISOString() },
    { id: 'n3', title: 'Сообщение', message: 'Новое сообщение в чате 7-A', type: 'message', read: true, createdAt: new Date().toISOString() },
    { id: 'n4', title: 'Объявление', message: 'Добро пожаловать в новый учебный год!', type: 'announcement', read: true, createdAt: new Date().toISOString() },
  ],

  // ── Calendar ──
  calendarEvents: (() => {
    const now = new Date();
    const y = now.getFullYear(), m = now.getMonth();
    return [
      { id: 'e1', title: 'Родительское собрание', description: 'Для всех 7-х классов', type: 'MEETING', startDate: new Date(y, m, 5, 18, 0).toISOString(), endDate: new Date(y, m, 5, 19, 30).toISOString(), location: 'Актовый зал' },
      { id: 'e2', title: 'Контрольная по математике', description: 'Тест по алгебре', type: 'EXAM', startDate: new Date(y, m, 10, 9, 0).toISOString(), endDate: new Date(y, m, 10, 9, 50).toISOString(), location: '201' },
      { id: 'e3', title: 'Срок сдачи эссе', description: 'Эссе по Дон Кихоту', type: 'HOMEWORK_DUE', startDate: new Date(y, m, 5, 23, 59).toISOString(), endDate: null, location: null },
      { id: 'e4', title: 'Спортивный день', description: 'Школьный спортивный день', type: 'HOLIDAY', startDate: new Date(y, m, 12, 9, 0).toISOString(), endDate: new Date(y, m, 12, 15, 0).toISOString(), location: 'Спортплощадка' },
      { id: 'e5', title: 'Урок математики', type: 'LESSON', startDate: new Date(y, m, now.getDate(), 9, 0).toISOString(), endDate: new Date(y, m, now.getDate(), 9, 50).toISOString(), location: '201' },
      { id: 'e6', title: 'Урок литературы', type: 'LESSON', startDate: new Date(y, m, now.getDate(), 10, 0).toISOString(), endDate: new Date(y, m, now.getDate(), 10, 50).toISOString(), location: '105' },
      { id: 'e7', title: 'Экзамен по физике', type: 'EXAM', startDate: new Date(y, m, 15, 11, 0).toISOString(), endDate: new Date(y, m, 15, 12, 0).toISOString(), location: '301' },
    ];
  })(),

  // ── Classes ──
  classes: [
    { id: 'c1', name: '7-A', grade: 7, section: 'A', studentsCount: 28 },
    { id: 'c2', name: '7-B', grade: 7, section: 'B', studentsCount: 26 },
    { id: 'c3', name: '8-A', grade: 8, section: 'A', studentsCount: 30 },
    { id: 'c4', name: '8-B', grade: 8, section: 'B', studentsCount: 25 },
  ],

  // ── Students ──
  students: [
    { id: 'st1', user: { username: 'maria_g', profile: { firstName: 'Мария', lastName: 'Гарсиа' } }, class: { name: '7-A' }, average: 90 },
    { id: 'st2', user: { username: 'carlos_r', profile: { firstName: 'Карлос', lastName: 'Руис' } }, class: { name: '7-A' }, average: 65 },
    { id: 'st3', user: { username: 'elena_p', profile: { firstName: 'Елена', lastName: 'Перес' } }, class: { name: '7-A' }, average: 96.7 },
    { id: 'st4', user: { username: 'diego_m', profile: { firstName: 'Диего', lastName: 'Морено' } }, class: { name: '7-A' }, average: 50 },
    { id: 'st5', user: { username: 'lucia_v', profile: { firstName: 'Люсия', lastName: 'Варгас' } }, class: { name: '7-B' }, average: 85 },
  ],

  // ── Teachers ──
  teachers: [
    { id: 't1', user: { username: 'anna_g', profile: { firstName: 'Анна', lastName: 'Гарсиа' } }, subjects: [{ name: 'Математика' }] },
    { id: 't2', user: { username: 'laura_f', profile: { firstName: 'Лаура', lastName: 'Фернандес' } }, subjects: [{ name: 'Литература' }] },
    { id: 't3', user: { username: 'pedro_s', profile: { firstName: 'Педро', lastName: 'Санчес' } }, subjects: [{ name: 'Физика' }] },
  ],

  // ── Schedule ──
  schedule: [
    { id: 'sch1', dayOfWeek: 1, startTime: '09:00', endTime: '09:50', room: '201', subject: { id: 's1', name: 'Математика', color: '#3b82f6' }, teacher: { user: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } } } },
    { id: 'sch2', dayOfWeek: 1, startTime: '10:00', endTime: '10:50', room: '105', subject: { id: 's2', name: 'Литература', color: '#ec4899' }, teacher: { user: { profile: { firstName: 'Лаура', lastName: 'Фернандес' } } } },
    { id: 'sch3', dayOfWeek: 2, startTime: '09:00', endTime: '09:50', room: '301', subject: { id: 's3', name: 'Физика', color: '#8b5cf6' }, teacher: { user: { profile: { firstName: 'Педро', lastName: 'Санчес' } } } },
    { id: 'sch4', dayOfWeek: 2, startTime: '11:00', endTime: '11:50', room: '202', subject: { id: 's4', name: 'История', color: '#f59e0b' }, teacher: { user: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } } } },
    { id: 'sch5', dayOfWeek: 3, startTime: '09:00', endTime: '09:50', room: '201', subject: { id: 's1', name: 'Математика', color: '#3b82f6' }, teacher: { user: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } } } },
    { id: 'sch6', dayOfWeek: 4, startTime: '10:00', endTime: '10:50', room: '105', subject: { id: 's2', name: 'Литература', color: '#ec4899' }, teacher: { user: { profile: { firstName: 'Лаура', lastName: 'Фернандес' } } } },
    { id: 'sch7', dayOfWeek: 5, startTime: '09:00', endTime: '09:50', room: '301', subject: { id: 's3', name: 'Физика', color: '#8b5cf6' }, teacher: { user: { profile: { firstName: 'Педро', lastName: 'Санчес' } } } },
  ],

  // ── Gradebook ──
  gradebook: [
    { student: { id: 'st1', user: { username: 'maria_g', profile: { firstName: 'Мария', lastName: 'Гарсиа' } } }, grades: [
      { id: 'g1', score: 9, maxScore: 10, type: 'тест', comment: 'Хорошо', date: new Date().toISOString() },
      { id: 'g2', score: 8, maxScore: 10, type: 'дз', comment: '', date: new Date().toISOString() },
      { id: 'g3', score: 10, maxScore: 10, type: 'контрольная', comment: 'Отлично!', date: new Date().toISOString() },
    ], average: 90, attendance: { present: 15, absent: 1, late: 0, total: 16 } },
    { student: { id: 'st2', user: { username: 'carlos_r', profile: { firstName: 'Карлос', lastName: 'Руис' } } }, grades: [
      { id: 'g4', score: 7, maxScore: 10, type: 'тест', comment: '', date: new Date().toISOString() },
      { id: 'g5', score: 6, maxScore: 10, type: 'дз', comment: 'Нужно повторить', date: new Date().toISOString() },
    ], average: 65, attendance: { present: 12, absent: 3, late: 1, total: 16 } },
    { student: { id: 'st3', user: { username: 'elena_p', profile: { firstName: 'Елена', lastName: 'Перес' } } }, grades: [
      { id: 'g6', score: 10, maxScore: 10, type: 'тест', comment: 'Превосходно!', date: new Date().toISOString() },
      { id: 'g7', score: 9, maxScore: 10, type: 'дз', comment: '', date: new Date().toISOString() },
    ], average: 96.7, attendance: { present: 16, absent: 0, late: 0, total: 16 } },
    { student: { id: 'st4', user: { username: 'diego_m', profile: { firstName: 'Диего', lastName: 'Морено' } } }, grades: [
      { id: 'g9', score: 5, maxScore: 10, type: 'тест', comment: 'Нужна помощь', date: new Date().toISOString() },
    ], average: 50, attendance: { present: 10, absent: 5, late: 1, total: 16 } },
  ],

  // ── My Grades (student view) ──
  myGrades: [
    { id: 'g1', subject: { name: 'Математика', color: '#3b82f6' }, score: 9, maxScore: 10, type: 'тест', comment: 'Хорошо', date: new Date().toISOString() },
    { id: 'g2', subject: { name: 'Литература', color: '#ec4899' }, score: 8, maxScore: 10, type: 'дз', comment: '', date: new Date().toISOString() },
    { id: 'g3', subject: { name: 'Физика', color: '#8b5cf6' }, score: 10, maxScore: 10, type: 'контрольная', comment: 'Отлично!', date: new Date().toISOString() },
    { id: 'g4', subject: { name: 'История', color: '#f59e0b' }, score: 7, maxScore: 10, type: 'тест', comment: '', date: new Date().toISOString() },
  ],
};

// Helper: get demo data by API path
export function getDemoData(path: string): any[] | null {
  if (path.includes('/lessons/today')) return DEMO_DATA.lessonsToday;
  if (path.includes('/homework')) return DEMO_DATA.homework;
  if (path.includes('/announcements')) return DEMO_DATA.announcements;
  if (path.includes('/conversations')) return DEMO_DATA.conversations;
  if (path.includes('/notifications') && !path.includes('/settings')) return DEMO_DATA.notifications;
  if (path.includes('/calendar')) return DEMO_DATA.calendarEvents;
  if (path.includes('/classes') && !path.includes('gradebook')) return DEMO_DATA.classes;
  if (path.includes('/students')) return DEMO_DATA.students;
  if (path.includes('/teachers')) return DEMO_DATA.teachers;
  if (path.includes('/schedule')) return DEMO_DATA.schedule;
  if (path.includes('/gradebook')) return DEMO_DATA.gradebook;
  if (path.includes('/my-grades')) return DEMO_DATA.myGrades;
  return null;
}
