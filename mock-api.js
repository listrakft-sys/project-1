// Minimal mock API server for demo/screenshot purposes
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ── Mock data ──────────────────────────────────────────
const today = new Date().toISOString();

const mockUser = {
  id: 'u1', username: 'admin', role: 'SCHOOL_ADMIN',
  profile: { firstName: 'Анна', lastName: 'Гарсиа' },
  school: { id: 's1', name: 'Colegio San Isidro' }
};

const mockToken = 'mock-jwt-token-12345';

// ── Auth ────────────────────────────────────────────────
app.post('/api/v1/auth/login', (req, res) => {
  res.json({
    success: true,
    data: {
      token: mockToken,
      refreshToken: 'mock-refresh',
      user: mockUser
    }
  });
});

app.get('/api/v1/auth/me', (req, res) => {
  res.json({ success: true, data: mockUser });
});

// ── Dashboard ───────────────────────────────────────────
app.get('/api/v1/lessons/today', (req, res) => {
  res.json({ success: true, data: [
    { id: 'l1', title: 'Математика — Алгебра', subject: { name: 'Математика', color: '#3b82f6' }, startTime: '09:00', endTime: '09:50', room: '201', className: '7-A' },
    { id: 'l2', title: 'Литература — Сервантес', subject: { name: 'Литература', color: '#ec4899' }, startTime: '10:00', endTime: '10:50', room: '105', className: '7-A' },
    { id: 'l3', title: 'Физика — Законы Ньютона', subject: { name: 'Физика', color: '#8b5cf6' }, startTime: '11:00', endTime: '11:50', room: '301', className: '8-B' },
    { id: 'l4', title: 'История — Реконкиста', subject: { name: 'История', color: '#f59e0b' }, startTime: '12:00', endTime: '12:50', room: '202', className: '7-A' },
  ]});
});

app.get('/api/v1/homework', (req, res) => {
  res.json({ success: true, data: [
    { id: 'h1', title: 'Уравнения 2-й степени', subject: { name: 'Математика', color: '#3b82f6' }, dueDate: '2026-09-03', status: 'assigned', description: 'Решить задачи 1-15 на стр. 84' },
    { id: 'h2', title: 'Эссе: Дон Кихот', subject: { name: 'Литература', color: '#ec4899' }, dueDate: '2026-09-05', status: 'in_progress', description: 'Написать эссе 500 слов' },
    { id: 'h3', title: 'Лабораторная: Маятник', subject: { name: 'Физика', color: '#8b5cf6' }, dueDate: '2026-09-02', status: 'submitted', description: 'Отчёт по лабораторной работе' },
    { id: 'h4', title: 'Тест: Реконкиста', subject: { name: 'История', color: '#f59e0b' }, dueDate: '2026-09-07', status: 'graded', description: 'Подготовка к тесту', grade: 'A', feedback: 'Отлично!' },
    { id: 'h5', title: 'Карта Европы', subject: { name: 'География', color: '#10b981' }, dueDate: '2026-09-04', status: 'assigned', description: 'Нарисовать карту с обозначениями' },
  ]});
});

app.get('/api/v1/announcements', (req, res) => {
  res.json({ success: true, data: [
    { id: 'a1', title: 'Добро пожаловать в новый учебный год!', content: 'Начинаем 2026-2027 учебный год. Первое собрание — 5 сентября.', author: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } }, createdAt: today, priority: 'high' },
    { id: 'a2', title: 'Родительское собрание', content: 'Родительское собрание для 7-х классов в эту пятницу в 18:00.', author: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } }, createdAt: today, priority: 'medium' },
    { id: 'a3', title: 'Спортивный день', content: '12 сентября — школьный спортивный день. Запись у физрука.', author: { profile: { firstName: 'Карлос', lastName: 'Руис' } }, createdAt: today, priority: 'low' },
  ]});
});

app.get('/api/v1/conversations', (req, res) => {
  res.json({ success: true, data: [
    { id: 'c1', title: '7-A Родители', lastMessage: 'Спасибо за информацию!', lastMessageAt: today, unreadCount: 2, participants: 12 },
    { id: 'c2', title: 'Карлос Руис (родитель Марии)', lastMessage: 'Когда родительское собрание?', lastMessageAt: today, unreadCount: 0, participants: 2 },
    { id: 'c3', title: 'Учителя 7-х классов', lastMessage: 'Нам нужно обсудить расписание', lastMessageAt: today, unreadCount: 1, participants: 5 },
  ]});
});

app.get('/api/v1/notifications', (req, res) => {
  res.json({ success: true, data: [
    { id: 'n1', title: 'Новая оценка', message: 'Мария получила A по математике', type: 'grade', read: false, createdAt: today },
    { id: 'n2', title: 'Новая домашняя работа', message: 'Задано: Уравнения 2-й степени', type: 'homework', read: false, createdAt: today },
    { id: 'n3', title: 'Сообщение', message: 'Новое сообщение в чате 7-A', type: 'message', read: true, createdAt: today },
    { id: 'n4', title: 'Объявление', message: 'Добро пожаловать в новый учебный год!', type: 'announcement', read: true, createdAt: today },
  ]});
});

// ── Calendar ────────────────────────────────────────────
app.get('/api/v1/calendar', (req, res) => {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  res.json({ success: true, data: [
    { id: 'e1', title: 'Родительское собрание', description: 'Для всех 7-х классов', type: 'MEETING', startDate: new Date(y, m, 5, 18, 0).toISOString(), endDate: new Date(y, m, 5, 19, 30).toISOString(), location: 'Актовый зал', createdBy: 'u1' },
    { id: 'e2', title: 'Контрольная по математике', description: 'Тест по алгебре', type: 'EXAM', startDate: new Date(y, m, 10, 9, 0).toISOString(), endDate: new Date(y, m, 10, 9, 50).toISOString(), location: '201', createdBy: 'u1' },
    { id: 'e3', title: 'Срок сдачи эссе', description: 'Эссе по Дон Кихоту', type: 'HOMEWORK_DUE', startDate: new Date(y, m, 5, 23, 59).toISOString(), endDate: null, location: null, createdBy: 'u1' },
    { id: 'e4', title: 'Спортивный день', description: 'Школьный спортивный день', type: 'HOLIDAY', startDate: new Date(y, m, 12, 9, 0).toISOString(), endDate: new Date(y, m, 12, 15, 0).toISOString(), location: 'Спортплощадка', createdBy: 'u1' },
    { id: 'e5', title: 'Урок математики', description: '', type: 'LESSON', startDate: new Date(y, m, new Date().getDate(), 9, 0).toISOString(), endDate: new Date(y, m, new Date().getDate(), 9, 50).toISOString(), location: '201', createdBy: 'u1' },
    { id: 'e6', title: 'Урок литературы', description: '', type: 'LESSON', startDate: new Date(y, m, new Date().getDate(), 10, 0).toISOString(), endDate: new Date(y, m, new Date().getDate(), 10, 50).toISOString(), location: '105', createdBy: 'u1' },
    { id: 'e7', title: 'Экзамен по физике', description: 'Итоговый тест', type: 'EXAM', startDate: new Date(y, m, 15, 11, 0).toISOString(), endDate: new Date(y, m, 15, 12, 0).toISOString(), location: '301', createdBy: 'u1' },
    { id: 'e8', title: 'Школьная ярмарка', description: 'Книжная ярмарка', type: 'EVENT', startDate: new Date(y, m, 8, 10, 0).toISOString(), endDate: new Date(y, m, 8, 16, 0).toISOString(), location: 'Холл', createdBy: 'u1' },
  ]});
});

app.post('/api/v1/calendar', (req, res) => {
  res.json({ success: true, data: { id: 'new-' + Date.now(), ...req.body } });
});

app.delete('/api/v1/calendar/:id', (req, res) => {
  res.json({ success: true });
});

// ── Gradebook ───────────────────────────────────────────
app.get('/api/v1/classes', (req, res) => {
  res.json({ success: true, data: [
    { id: 'c1', name: '7-A', grade: 7, section: 'A', studentsCount: 28 },
    { id: 'c2', name: '7-B', grade: 7, section: 'B', studentsCount: 26 },
    { id: 'c3', name: '8-A', grade: 8, section: 'A', studentsCount: 30 },
    { id: 'c4', name: '8-B', grade: 8, section: 'B', studentsCount: 25 },
  ]});
});

app.get('/api/v1/classes/:id/subjects', (req, res) => {
  res.json({ success: true, data: [
    { id: 's1', name: 'Математика', code: 'MATH', color: '#3b82f6' },
    { id: 's2', name: 'Литература', code: 'LIT', color: '#ec4899' },
    { id: 's3', name: 'Физика', code: 'PHY', color: '#8b5cf6' },
    { id: 's4', name: 'История', code: 'HIS', color: '#f59e0b' },
  ]});
});

app.get('/api/v1/gradebook/classes/:classId/subjects/:subjectId/overview', (req, res) => {
  res.json({ success: true, data: [
    { student: { id: 'st1', user: { username: 'maria_g', profile: { firstName: 'Мария', lastName: 'Гарсиа' } } }, grades: [
      { id: 'g1', score: 9, maxScore: 10, type: 'тест', comment: 'Хорошо', date: today },
      { id: 'g2', score: 8, maxScore: 10, type: 'дз', comment: '', date: today },
      { id: 'g3', score: 10, maxScore: 10, type: 'контрольная', comment: 'Отлично!', date: today },
    ], average: 90, attendance: { present: 15, absent: 1, late: 0, total: 16 } },
    { student: { id: 'st2', user: { username: 'carlos_r', profile: { firstName: 'Карлос', lastName: 'Руис' } } }, grades: [
      { id: 'g4', score: 7, maxScore: 10, type: 'тест', comment: '', date: today },
      { id: 'g5', score: 6, maxScore: 10, type: 'дз', comment: 'Нужно повторить', date: today },
    ], average: 65, attendance: { present: 12, absent: 3, late: 1, total: 16 } },
    { student: { id: 'st3', user: { username: 'elena_p', profile: { firstName: 'Елена', lastName: 'Перес' } } }, grades: [
      { id: 'g6', score: 10, maxScore: 10, type: 'тест', comment: 'Превосходно!', date: today },
      { id: 'g7', score: 9, maxScore: 10, type: 'дз', comment: '', date: today },
      { id: 'g8', score: 10, maxScore: 10, type: 'контрольная', comment: 'Безупречно', date: today },
    ], average: 96.7, attendance: { present: 16, absent: 0, late: 0, total: 16 } },
    { student: { id: 'st4', user: { username: 'diego_m', profile: { firstName: 'Диего', lastName: 'Морено' } } }, grades: [
      { id: 'g9', score: 5, maxScore: 10, type: 'тест', comment: 'Нужна помощь', date: today },
    ], average: 50, attendance: { present: 10, absent: 5, late: 1, total: 16 } },
  ]});
});

app.get('/api/v1/gradebook/classes/:classId/attendance', (req, res) => {
  res.json({ success: true, data: [
    { id: 'st1', studentId: 'st1', status: 'PRESENT', date: today },
    { id: 'st2', studentId: 'st2', status: 'ABSENT', date: today },
    { id: 'st3', studentId: 'st3', status: 'PRESENT', date: today },
    { id: 'st4', studentId: 'st4', status: 'LATE', date: today },
  ]});
});

app.get('/api/v1/schedule', (req, res) => {
  res.json({ success: true, data: [
    { id: 'sch1', dayOfWeek: 1, startTime: '09:00', endTime: '09:50', room: '201', subject: { id: 's1', name: 'Математика', code: 'MATH', color: '#3b82f6' }, teacher: { user: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } } } },
    { id: 'sch2', dayOfWeek: 1, startTime: '10:00', endTime: '10:50', room: '105', subject: { id: 's2', name: 'Литература', code: 'LIT', color: '#ec4899' }, teacher: { user: { profile: { firstName: 'Лаура', lastName: 'Фернандес' } } } },
    { id: 'sch3', dayOfWeek: 2, startTime: '09:00', endTime: '09:50', room: '301', subject: { id: 's3', name: 'Физика', code: 'PHY', color: '#8b5cf6' }, teacher: { user: { profile: { firstName: 'Педро', lastName: 'Санчес' } } } },
    { id: 'sch4', dayOfWeek: 2, startTime: '11:00', endTime: '11:50', room: '202', subject: { id: 's4', name: 'История', code: 'HIS', color: '#f59e0b' }, teacher: { user: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } } } },
    { id: 'sch5', dayOfWeek: 3, startTime: '09:00', endTime: '09:50', room: '201', subject: { id: 's1', name: 'Математика', code: 'MATH', color: '#3b82f6' }, teacher: { user: { profile: { firstName: 'Анна', lastName: 'Гарсиа' } } } },
    { id: 'sch6', dayOfWeek: 4, startTime: '10:00', endTime: '10:50', room: '105', subject: { id: 's2', name: 'Литература', code: 'LIT', color: '#ec4899' }, teacher: { user: { profile: { firstName: 'Лаура', lastName: 'Фернандес' } } } },
    { id: 'sch7', dayOfWeek: 5, startTime: '09:00', endTime: '09:50', room: '301', subject: { id: 's3', name: 'Физика', code: 'PHY', color: '#8b5cf6' }, teacher: { user: { profile: { firstName: 'Педро', lastName: 'Санчес' } } } },
  ]});
});

// ── Students ─────────────────────────────────────────────
app.get('/api/v1/students', (req, res) => {
  res.json({ success: true, data: [
    { id: 'st1', user: { username: 'maria_g', profile: { firstName: 'Мария', lastName: 'Гарсиа' } }, class: { name: '7-A' }, average: 90 },
    { id: 'st2', user: { username: 'carlos_r', profile: { firstName: 'Карлос', lastName: 'Руис' } }, class: { name: '7-A' }, average: 65 },
    { id: 'st3', user: { username: 'elena_p', profile: { firstName: 'Елена', lastName: 'Перес' } }, class: { name: '7-A' }, average: 96.7 },
    { id: 'st4', user: { username: 'diego_m', profile: { firstName: 'Диего', lastName: 'Морено' } }, class: { name: '7-A' }, average: 50 },
    { id: 'st5', user: { username: 'lucia_v', profile: { firstName: 'Люсия', lastName: 'Варгас' } }, class: { name: '7-B' }, average: 85 },
  ]});
});

// ── Teachers ────────────────────────────────────────────
app.get('/api/v1/teachers', (req, res) => {
  res.json({ success: true, data: [
    { id: 't1', user: { username: 'anna_g', profile: { firstName: 'Анна', lastName: 'Гарсиа' } }, subjects: [{ name: 'Математика' }] },
    { id: 't2', user: { username: 'laura_f', profile: { firstName: 'Лаура', lastName: 'Фернандес' } }, subjects: [{ name: 'Литература' }] },
    { id: 't3', user: { username: 'pedro_s', profile: { firstName: 'Педро', lastName: 'Санчес' } }, subjects: [{ name: 'Физика' }] },
  ]});
});

// ── Files ───────────────────────────────────────────────
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

app.post('/api/v1/files/upload', upload.single('file'), (req, res) => {
  res.json({ success: true, data: {
    id: 'f-' + Date.now(),
    filename: req.file?.originalname || 'file.txt',
    originalName: req.file?.originalname || 'file.txt',
    mimeType: req.file?.mimetype || 'text/plain',
    size: req.file?.size || 1024,
    url: '#'
  }});
});

app.delete('/api/v1/files/:id', (req, res) => {
  res.json({ success: true });
});

// ── Export (mock PDF) ───────────────────────────────────
app.get('/api/v1/export/grades/:id', (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="grade_report.pdf"');
  res.send(Buffer.from('Mock PDF'));
});

app.get('/api/v1/export/attendance/:id', (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from('Mock PDF'));
});

app.get('/api/v1/export/class/:id', (req, res) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.send(Buffer.from('Mock PDF'));
});

// ── Generic catch-all ──────────────────────────────────
app.use('/api/v1', (req, res) => {
  res.json({ success: true, data: [] });
});

app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});
