// Demo data for GitHub Pages / no-backend mode
// All mock data returned in the same format as the real API

// Helper: today's ISO date at a given hour/minute
function todayAt(hour: number, minute: number = 0): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute).toISOString();
}

export const DEMO_DATA = {
  // ── Dashboard ──
  lessonsToday: [
    { id: 'l1', title: 'Алгебра', subject: { name: 'Математика', color: '#3b82f6' }, startDate: todayAt(9, 0), endDate: todayAt(9, 50), startTime: '09:00', endTime: '09:50', room: '201', className: '7-A' },
    { id: 'l2', title: 'Сервантес', subject: { name: 'Литература', color: '#ec4899' }, startDate: todayAt(10, 0), endDate: todayAt(10, 50), startTime: '10:00', endTime: '10:50', room: '105', className: '7-A' },
    { id: 'l3', title: 'Законы Ньютона', subject: { name: 'Физика', color: '#8b5cf6' }, startDate: todayAt(11, 0), endDate: todayAt(11, 50), startTime: '11:00', endTime: '11:50', room: '301', className: '8-B' },
    { id: 'l4', title: 'Реконкиста', subject: { name: 'История', color: '#f59e0b' }, startDate: todayAt(12, 0), endDate: todayAt(12, 50), startTime: '12:00', endTime: '12:50', room: '202', className: '7-A' },
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

  // ── Admin ──
  adminStats: {
    totals: { users: 86, students: 62, teachers: 14, classes: 8, subjects: 11, lessons: 124, announcements: 9, schedules: 40, pendingComplaints: 2 },
    thisWeek: { newUsers: 5, newComplaints: 2, newAnnouncements: 3 },
    metrics: { attendanceRate: 94.2, gradeAverage: 82.5 },
  },

  adminActivity: [
    { id: 'act1', type: 'user_created', description: 'Зарегистрирован новый ученик: Диего Морено', createdAt: new Date().toISOString() },
    { id: 'act2', type: 'complaint', description: 'Новая жалоба: ожидает рассмотрения', createdAt: new Date().toISOString() },
    { id: 'act3', type: 'announcement', description: 'Опубликовано объявление: Спортивный день', createdAt: new Date().toISOString() },
    { id: 'act4', type: 'grade', description: 'Выставлены оценки по математике (7-A)', createdAt: new Date().toISOString() },
    { id: 'act5', type: 'homework', description: 'Задана домашняя работа: Уравнения 2-й степени', createdAt: new Date().toISOString() },
    { id: 'act6', type: 'user_created', description: 'Зарегистрирован новый учитель: Педро Санчес', createdAt: new Date().toISOString() },
    { id: 'act7', type: 'schedule', description: 'Обновлено расписание 8-B', createdAt: new Date().toISOString() },
    { id: 'act8', type: 'attendance', description: 'Отмечена посещаемость 7-A', createdAt: new Date().toISOString() },
  ],

  users: [
    { id: 'u1', email: 'admin@school.edu', username: 'admin', role: 'SCHOOL_ADMIN', status: 'ACTIVE', profile: { firstName: 'Анна', lastName: 'Гарсиа' }, createdAt: new Date().toISOString() },
    { id: 'u2', email: 'teacher@school.edu', username: 'teacher', role: 'TEACHER', status: 'ACTIVE', profile: { firstName: 'Лаура', lastName: 'Фернандес' }, createdAt: new Date().toISOString() },
    { id: 'u3', email: 'student@school.edu', username: 'student', role: 'STUDENT', status: 'ACTIVE', profile: { firstName: 'Мария', lastName: 'Гарсиа' }, createdAt: new Date().toISOString() },
    { id: 'u4', email: 'parent@school.edu', username: 'parent', role: 'PARENT', status: 'ACTIVE', profile: { firstName: 'Карлос', lastName: 'Руис' }, createdAt: new Date().toISOString() },
    { id: 'u5', email: 'elena@school.edu', username: 'elena_p', role: 'STUDENT', status: 'ACTIVE', profile: { firstName: 'Елена', lastName: 'Перес' }, createdAt: new Date().toISOString() },
    { id: 'u6', email: 'diego@school.edu', username: 'diego_m', role: 'STUDENT', status: 'PENDING', profile: { firstName: 'Диего', lastName: 'Морено' }, createdAt: new Date().toISOString() },
    { id: 'u7', email: 'lucia@school.edu', username: 'lucia_v', role: 'STUDENT', status: 'SUSPENDED', profile: { firstName: 'Люсия', lastName: 'Варгас' }, createdAt: new Date().toISOString() },
    { id: 'u8', email: 'pedro@school.edu', username: 'pedro_s', role: 'TEACHER', status: 'ACTIVE', profile: { firstName: 'Педро', lastName: 'Санчес' }, createdAt: new Date().toISOString() },
  ],

  complaints: [
    { id: 'cmp1', type: 'GRADE_DISPUTE', status: 'PENDING', description: 'Оценка за контрольную кажется несправедливой', createdAt: new Date().toISOString(), filedBy: { username: 'parent', profile: { firstName: 'Карлос', lastName: 'Руис' } }, againstUser: { username: 'teacher', profile: { firstName: 'Лаура', lastName: 'Фернандес' } } },
    { id: 'cmp2', type: 'BULLYING', status: 'REVIEWING', description: 'Конфликт между учениками на перемене', createdAt: new Date().toISOString(), filedBy: { username: 'parent', profile: { firstName: 'Елена', lastName: 'Перес' } }, againstUser: { username: 'student', profile: { firstName: 'Диего', lastName: 'Морено' } } },
    { id: 'cmp3', type: 'TEACHER_CONDUCT', status: 'RESOLVED', resolution: 'Проведена беседа с учителем', description: 'Опоздания на уроки', createdAt: new Date().toISOString(), filedBy: { username: 'student', profile: { firstName: 'Мария', lastName: 'Гарсиа' } }, againstUser: { username: 'pedro_s', profile: { firstName: 'Педро', lastName: 'Санчес' } } },
  ],

  subjects: [
    { id: 's1', name: 'Математика', code: 'MATH', description: 'Алгебра и геометрия', color: '#3b82f6', teachers: [{ id: 't1', userId: 'u1', profile: { firstName: 'Анна', lastName: 'Гарсиа' } }] },
    { id: 's2', name: 'Литература', code: 'LIT', description: 'Испанская и мировая литература', color: '#ec4899', teachers: [{ id: 't2', userId: 'u2', profile: { firstName: 'Лаура', lastName: 'Фернандес' } }] },
    { id: 's3', name: 'Физика', code: 'PHY', description: 'Механика, оптика, электричество', color: '#8b5cf6', teachers: [{ id: 't3', userId: 'u8', profile: { firstName: 'Педро', lastName: 'Санчес' } }] },
    { id: 's4', name: 'История', code: 'HIST', description: 'История Испании и мира', color: '#f59e0b', teachers: [{ id: 't1', userId: 'u1', profile: { firstName: 'Анна', lastName: 'Гарсиа' } }] },
  ],

  // ── Student "me" record (student attendance view) ──
  studentMe: { id: 'st1', schoolId: 'demo-school', classId: 'c1', user: { username: 'student', profile: { firstName: 'Мария', lastName: 'Гарсиа' } } },

  studentAttendance: [
    { id: 'att1', studentId: 'st1', status: 'PRESENT', date: new Date().toISOString() },
    { id: 'att2', studentId: 'st1', status: 'PRESENT', date: new Date(Date.now() - 86400000).toISOString() },
    { id: 'att3', studentId: 'st1', status: 'LATE', date: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: 'att4', studentId: 'st1', status: 'ABSENT', date: new Date(Date.now() - 3 * 86400000).toISOString() },
    { id: 'att5', studentId: 'st1', status: 'PRESENT', date: new Date(Date.now() - 4 * 86400000).toISOString() },
    { id: 'att6', studentId: 'st1', status: 'EXCUSED', date: new Date(Date.now() - 5 * 86400000).toISOString() },
  ],

  attendanceSummary: { total: 16, present: 13, absent: 1, late: 1, excused: 1, earlyLeave: 0, rate: 87.5 },

  // Class attendance for today (teacher marking view)
  classAttendance: [
    { id: 'ca1', studentId: 'st1', status: 'PRESENT', date: new Date().toISOString() },
    { id: 'ca2', studentId: 'st2', status: 'PRESENT', date: new Date().toISOString() },
    { id: 'ca3', studentId: 'st3', status: 'ABSENT', date: new Date().toISOString() },
  ],

  // ── Lessons (full list) ──
  lessons: [
    { id: 'l1', title: 'Алгебра', subject: { id: 's1', name: 'Математика', color: '#3b82f6' }, startDate: todayAt(9, 0), endDate: todayAt(9, 50), startTime: '09:00', endTime: '09:50', room: '201', className: '7-A' },
    { id: 'l2', title: 'Сервантес', subject: { id: 's2', name: 'Литература', color: '#ec4899' }, startDate: todayAt(10, 0), endDate: todayAt(10, 50), startTime: '10:00', endTime: '10:50', room: '105', className: '7-A' },
    { id: 'l3', title: 'Законы Ньютона', subject: { id: 's3', name: 'Физика', color: '#8b5cf6' }, startDate: todayAt(11, 0), endDate: todayAt(11, 50), startTime: '11:00', endTime: '11:50', room: '301', className: '8-B' },
    { id: 'l4', title: 'Реконкиста', subject: { id: 's4', name: 'История', color: '#f59e0b' }, startDate: todayAt(12, 0), endDate: todayAt(12, 50), startTime: '12:00', endTime: '12:50', room: '202', className: '7-A' },
    { id: 'l5', title: 'Квадратные уравнения', subject: { id: 's1', name: 'Математика', color: '#3b82f6' }, startDate: todayAt(9, 0), endDate: todayAt(9, 50), startTime: '09:00', endTime: '09:50', room: '203', className: '8-A' },
  ],

  lessonDetail: {
    id: 'l1', title: 'Алгебра',
    subject: { id: 's1', name: 'Математика', color: '#3b82f6' },
    teacher: { user: { username: 'anna_g', profile: { firstName: 'Анна', lastName: 'Гарсиа' } } },
    className: '7-A', room: '201',
    startDate: todayAt(9, 0), endDate: todayAt(9, 50), startTime: '09:00', endTime: '09:50',
    description: 'Решение квадратных уравнений. Теорема Виета. Разбор задач из домашней работы.',
    materials: [
      { id: 'm1', name: 'Презентация: Квадратные уравнения.pdf', type: 'pdf', url: '#' },
      { id: 'm2', name: 'Рабочая тетрадь, стр. 84', type: 'doc', url: '#' },
    ],
  },

  homeworkDetail: {
    id: 'h1', title: 'Уравнения 2-й степени',
    subject: { id: 's1', name: 'Математика', color: '#3b82f6' },
    teacher: { user: { username: 'anna_g', profile: { firstName: 'Анна', lastName: 'Гарсиа' } } },
    className: '7-A', dueDate: '2026-09-12', status: 'assigned',
    description: 'Решить задачи 1-15 на стр. 84. Особое внимание — задачам со звёздочкой.',
    attachments: [{ id: 'hw-a1', name: 'Задачи.pdf', type: 'pdf', url: '#' }],
    submissions: [],
  },

  // ── Conversations detail (thread view) ──
  conversationMessages: [
    { id: 'msg1', senderId: 'u4', senderName: 'Карлос Руис', content: 'Добрый день! Когда будет родительское собрание?', createdAt: new Date(Date.now() - 3600000).toISOString(), isOwn: false },
    { id: 'msg2', senderId: 'me', senderName: 'Вы', content: 'Добрый день! В эту пятницу в 18:00.', createdAt: new Date(Date.now() - 3400000).toISOString(), isOwn: true },
    { id: 'msg3', senderId: 'u4', senderName: 'Карлос Руис', content: 'Спасибо за информацию!', createdAt: new Date(Date.now() - 3000000).toISOString(), isOwn: false },
    { id: 'msg4', senderId: 'me', senderName: 'Вы', content: 'Если будут вопросы — пишите.', createdAt: new Date(Date.now() - 1200000).toISOString(), isOwn: true },
  ],

  conversationDetail: {
    id: 'c2', name: 'Карлос Руис', type: 'DIRECT',
    otherParticipant: { id: 'u4', name: 'Карлос Руис', role: 'PARENT', avatar: null },
    participantCount: 2,
  },

  // ── Parent chat ──
  parentChatChildren: [
    { linkId: 'pl1', studentId: 'st1', studentName: 'Мария Гарсиа', relationship: 'MOTHER', isPrimary: true, classId: 'c1', className: '7-A', homeroomTeacherId: 't1' },
  ],

  parentChatTeachers: [
    { teacherId: 't1', userId: 'u1', name: 'Анна Гарсиа', subjects: ['Математика'], isHomeroom: true },
    { teacherId: 't2', userId: 'u2', name: 'Лаура Фернандес', subjects: ['Литература'], isHomeroom: false },
    { teacherId: 't3', userId: 'u8', name: 'Педро Санчес', subjects: ['Физика'], isHomeroom: false },
  ],

  parentChatConversations: [
    { id: 'c2', name: 'Анна Гарсиа', type: 'DIRECT', lastMessage: { content: 'Спасибо за информацию!', createdAt: new Date().toISOString() }, unreadCount: 0, updatedAt: new Date().toISOString(), participantCount: 2, otherParticipant: { id: 'u1', name: 'Анна Гарсиа', role: 'TEACHER', avatar: null } },
    { id: 'c1', name: '7-A Родительский чат', type: 'GROUP', lastMessage: { content: 'Когда родительское собрание?', createdAt: new Date(Date.now() - 7200000).toISOString() }, unreadCount: 2, updatedAt: new Date(Date.now() - 7200000).toISOString(), participantCount: 12 },
  ],

  parentChatGroups: [
    { classId: 'c1', className: '7-A', schoolName: 'Школа №1', childName: 'Мария Гарсиа', groupExists: true, isMember: true, conversationId: 'c1' },
  ],

  parentChatAvailableGroups: [
    { classId: 'c1', className: '7-A', schoolName: 'Школа №1', childName: 'Мария Гарсиа', groupExists: true, isMember: false, conversationId: null },
  ],

  // ── User profile ──
  userProfile: {
    id: 'u3', email: 'student@school.edu', username: 'student', role: 'STUDENT', status: 'ACTIVE',
    profile: { firstName: 'Мария', lastName: 'Гарсиа', avatar: null, phone: '+34 600 000 000', bio: 'Ученица 7-А класса. Люблю математику и литературу.' },
    student: { id: 'st1', schoolId: 'demo-school', classId: 'c1' },
  },

  // ── Class details ──
  classDetails: {
    id: 'c1', name: '7-A', grade: 7, section: 'A',
    homeroomTeacher: { id: 't1', user: { username: 'anna_g', profile: { firstName: 'Анна', lastName: 'Гарсиа' } } },
    students: [
      { id: 'st1', user: { username: 'maria_g', profile: { firstName: 'Мария', lastName: 'Гарсиа' } } },
      { id: 'st2', user: { username: 'carlos_r', profile: { firstName: 'Карлос', lastName: 'Руис' } } },
      { id: 'st3', user: { username: 'elena_p', profile: { firstName: 'Елена', lastName: 'Перес' } } },
    ],
    studentsCount: 28,
  },

  // ── My Grades (student view) ──
  myGrades: [
    { id: 'g1', subject: { name: 'Математика', color: '#3b82f6' }, score: 9, maxScore: 10, type: 'тест', comment: 'Хорошо', date: new Date().toISOString() },
    { id: 'g2', subject: { name: 'Литература', color: '#ec4899' }, score: 8, maxScore: 10, type: 'дз', comment: '', date: new Date().toISOString() },
    { id: 'g3', subject: { name: 'Физика', color: '#8b5cf6' }, score: 10, maxScore: 10, type: 'контрольная', comment: 'Отлично!', date: new Date().toISOString() },
    { id: 'g4', subject: { name: 'История', color: '#f59e0b' }, score: 7, maxScore: 10, type: 'тест', comment: '', date: new Date().toISOString() },
  ],
};

// Helper: get demo data by API path.
// NOTE: order matters — more specific paths must be checked first.
export function getDemoData(path: string): any {
  // ── Admin ──
  if (path.includes('/admin/stats')) return DEMO_DATA.adminStats;
  if (path.includes('/admin/activity')) return DEMO_DATA.adminActivity;

  // ── Users (admin list vs. public profile) ──
  if (/\/users\/[^/]+$/.test(path)) return DEMO_DATA.userProfile;
  if (path === '/users') return DEMO_DATA.users;

  // ── Complaints / subjects ──
  if (path.includes('/complaints')) return DEMO_DATA.complaints;
  if (path.includes('/subjects')) return DEMO_DATA.subjects;

  // ── Students: /students/me before generic /students ──
  if (path.includes('/students/me')) return DEMO_DATA.studentMe;
  if (path.includes('/students')) return DEMO_DATA.students;
  if (path.includes('/teachers')) return DEMO_DATA.teachers;

  // ── Attendance (gradebook) ──
  if (/\/gradebook\/students\/[^/]+\/attendance\/summary/.test(path)) return DEMO_DATA.attendanceSummary;
  if (/\/gradebook\/students\/[^/]+\/attendance/.test(path)) return DEMO_DATA.studentAttendance;
  if (/\/gradebook\/classes\/[^/]+\/attendance/.test(path)) return DEMO_DATA.classAttendance;
  if (path.includes('/gradebook')) return DEMO_DATA.gradebook;

  // ── Lessons: today → detail → list ──
  if (path.includes('/lessons/today')) return DEMO_DATA.lessonsToday;
  if (/\/lessons\/[^/]+$/.test(path)) return DEMO_DATA.lessonDetail;
  if (path.includes('/lessons')) return DEMO_DATA.lessons;

  // ── Homework: detail → list ──
  if (/\/homework\/[^/]+$/.test(path)) return DEMO_DATA.homeworkDetail;
  if (path.includes('/homework')) return DEMO_DATA.homework;

  // ── Conversations: thread → detail → list ──
  if (/\/conversations\/[^/]+\/messages/.test(path)) return DEMO_DATA.conversationMessages;
  if (/\/conversations\/[^/]+$/.test(path)) return DEMO_DATA.conversationDetail;
  if (path.includes('/conversations')) return DEMO_DATA.conversations;

  // ── Parent chat ──
  if (path.includes('/parent-chat/teachers')) return DEMO_DATA.parentChatTeachers;
  if (path.includes('/parent-chat/children')) return DEMO_DATA.parentChatChildren;
  if (path.includes('/parent-chat/groups')) return DEMO_DATA.parentChatGroups;
  if (path.includes('/parent-chat/available-groups')) return DEMO_DATA.parentChatAvailableGroups;
  if (path.includes('/parent-chat/conversations')) return DEMO_DATA.parentChatConversations;

  // ── Schedule / classes ──
  if (path.includes('/schedules')) return DEMO_DATA.schedule;
  if (/\/classes\/[^/]+$/.test(path)) return DEMO_DATA.classDetails;
  if (path.includes('/classes')) return DEMO_DATA.classes;

  // ── Misc ──
  if (path.includes('/announcements')) return DEMO_DATA.announcements;
  if (path.includes('/notifications') && !path.includes('/settings')) return DEMO_DATA.notifications;
  if (path.includes('/calendar')) return DEMO_DATA.calendarEvents;
  if (path.includes('/my-grades')) return DEMO_DATA.myGrades;

  return null;
}
