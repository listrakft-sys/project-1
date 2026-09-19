// Persistent demo database for GitHub Pages / no-backend mode.
// Admin CRUD mutations (users, classes, schedules) and messaging are applied
// here and stored in localStorage, so changes survive page reloads — same UX
// as a real backend.
import { DEMO_DATA } from './demoData';

const STORAGE_KEY = 'demo_db_v1';

interface DemoDB {
  users: any[];
  classes: any[];
  schedules: any[];
  lessons: any[];
  conversations: any[];
  messages: Record<string, any[]>;
  homework: any[];
  announcements: any[];
}

let cache: DemoDB | null = null;

// Classes seed data lacks admin-page fields (capacity/room/_count) — normalize
function normalizeClass(c: any): any {
  return {
    capacity: 30,
    room: '',
    homeroomTeacherId: null,
    homeroomTeacher: null,
    ...c,
    _count: { students: c._count?.students ?? c.studentsCount ?? 0 },
  };
}

// Currently logged-in demo user (auth store persists it in localStorage)
function getCurrentUser(): { id: string; username: string; profile: any } {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u?.id) {
          return { id: u.id, username: u.username || 'me', profile: u.profile || { firstName: 'Me', lastName: '' } };
        }
      }
    } catch {
      // fall through
    }
  }
  return { id: 'me', username: 'me', profile: { firstName: 'Me', lastName: '' } };
}

// The "other party" in demo chats — Carlos Ruiz (parent)
const OTHER_PARTY = { userId: 'u4', user: { id: 'u4', username: 'carlos_r', profile: { firstName: 'Carlos', lastName: 'Ruiz' } } };

// Seed conversations (static demo data is flat) → full ConversationItem shape
function seedConversations(): any[] {
  return JSON.parse(JSON.stringify(DEMO_DATA.conversations)).map((c: any, i: number) => ({
    id: c.id,
    type: i === 1 ? 'DIRECT' : 'GROUP',
    name: c.title,
    lastMessage: { content: c.lastMessage, createdAt: c.lastMessageAt },
    unreadCount: c.unreadCount || 0,
    updatedAt: c.lastMessageAt,
    participants: [{ ...OTHER_PARTY }],
  }));
}

// Per-conversation message threads, seeded from the static demo messages
function seedMessages(): Record<string, any[]> {
  const out: Record<string, any[]> = {};
  for (const c of DEMO_DATA.conversations as any[]) {
    out[c.id] = JSON.parse(JSON.stringify(DEMO_DATA.conversationMessages));
  }
  return out;
}

// Attach proper sender objects at read time; remap legacy 'me' senderId to the
// actual logged-in user so isOwn detection works.
function remapMessage(m: any, me: { id: string; username: string; profile: any }): any {
  if (m.senderId === 'me') {
    return { ...m, senderId: me.id, sender: { username: me.username, profile: me.profile } };
  }
  if (!m.sender) {
    return { ...m, sender: { username: 'carlos_r', profile: { firstName: 'Carlos', lastName: 'Ruiz' } } };
  }
  return m;
}

// Resolve a subject (and its homeroom teacher) into the shape schedule pages render
function resolveSubject(subjectId?: string): { subject: any; teacher: any } {
  const s: any = subjectId ? (DEMO_DATA.subjects as any[]).find((x) => x.id === subjectId) : null;
  if (!s) return { subject: null, teacher: null };
  const t: any = s.teachers?.[0];
  const teacherUser = t
    ? {
        id: t.id,
        userId: t.userId,
        profile: t.profile,
        user: { username: (DEMO_DATA.users as any[]).find((u) => u.id === t.userId)?.username || '', profile: t.profile },
      }
    : null;
  return { subject: { id: s.id, name: s.name, code: s.code, color: s.color }, teacher: teacherUser };
}

// Seed lessons → full card shape (class object, teacher, classId for filters)
function seedLessons(): any[] {
  return JSON.parse(JSON.stringify(DEMO_DATA.lessons)).map((l: any) => {
    const cls = (DEMO_DATA.classes as any[]).find((c) => c.name === l.className);
    const { teacher } = resolveSubject(l.subject?.id);
    return {
      ...l,
      classId: cls?.id || null,
      class: cls ? { id: cls.id, name: cls.name } : undefined,
      teacher,
      description: l.description || '',
    };
  });
}

function seedDB(): DemoDB {
  return {
    users: JSON.parse(JSON.stringify(DEMO_DATA.users)),
    classes: JSON.parse(JSON.stringify(DEMO_DATA.classes)).map(normalizeClass),
    // Seed timetable belongs to class 7-A; other classes start empty until
    // an admin adds lessons — that exercises the schedule CRUD.
    schedules: JSON.parse(JSON.stringify(DEMO_DATA.schedule)).map((s: any) => ({ ...s, classId: 'c1' })),
    lessons: seedLessons(),
    conversations: seedConversations(),
    messages: seedMessages(),
    homework: JSON.parse(JSON.stringify(DEMO_DATA.homework)),
    // Seed uses `priority` (high = pinned); normalize to the page shape
    announcements: JSON.parse(JSON.stringify(DEMO_DATA.announcements)).map((a: any) => ({
      ...a,
      isPinned: a.isPinned ?? a.priority === 'high',
      targetAudience: a.targetAudience || 'ALL',
    })),
  };
}

export function loadDB(): DemoDB {
  if (cache) return cache;
  if (typeof window === 'undefined') return seedDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw);
      if (Array.isArray(db?.users) && Array.isArray(db?.classes)) {
        // Merge older stored DBs that predate schedules/conversations
        const seed = seedDB();
        cache = {
          users: db.users,
          classes: (db.classes || []).map(normalizeClass),
          schedules: Array.isArray(db.schedules) ? db.schedules : seed.schedules,
          lessons: Array.isArray(db.lessons) ? db.lessons : seed.lessons,
          conversations: Array.isArray(db.conversations) ? db.conversations : seed.conversations,
          messages: { ...seed.messages, ...(db.messages || {}) },
          homework: Array.isArray(db.homework) ? db.homework : seed.homework,
          announcements: Array.isArray(db.announcements) ? db.announcements : seed.announcements,
        };
        return cache;
      }
    }
  } catch {
    // corrupted storage → reseed
  }
  cache = seedDB();
  persistDB();
  return cache;
}

function persistDB(): void {
  if (typeof window === 'undefined' || !cache) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // storage full / private mode — keep working in-memory
  }
}

// Reset to original demo data (useful while demoing)
export function resetDemoDB(): void {
  cache = seedDB();
  persistDB();
}

function matchUser(u: any, search: string): boolean {
  if (!search) return true;
  const s = search.toLowerCase();
  const name = `${u.profile?.firstName || ''} ${u.profile?.lastName || ''}`.trim().toLowerCase();
  return (
    name.includes(s) ||
    (u.email || '').toLowerCase().includes(s) ||
    (u.username || '').toLowerCase().includes(s)
  );
}

// ── Reads that must reflect mutations (overrides static getDemoData) ──
// Returns data or null (null → fall through to static demo data).
export function getDemoDataOverride(path: string, params?: any): any {
  const db = loadDB();

  // GET /users (admin list, with search/role/status/page/limit)
  if (/^\/?users$/.test(path.split('?')[0])) {
    let list = db.users.filter((u) => matchUser(u, params?.search));
    if (params?.role) list = list.filter((u) => u.role === params.role);
    if (params?.status) list = list.filter((u) => u.status === params.status);

    const total = list.length;
    const page = Math.max(1, parseInt(params?.page, 10) || 1);
    const limit = parseInt(params?.limit, 10) || 10;
    list = list.slice((page - 1) * limit, page * limit);
    return { data: list, total, page, limit };
  }

  // GET /conversations/:id/messages
  let m = path.match(/\/conversations\/([^/]+)\/messages/);
  if (m) {
    const me = getCurrentUser();
    return {
      data: (db.messages[m[1]] || []).map((msg) => {
        const out = remapMessage(msg, me);
        // Simulate the other party reading own messages after ~4s →
        // the double-tick "read" indicator flips on the next poll.
        if (
          out.senderId === me.id &&
          (!out.readBy || out.readBy.length === 0) &&
          Date.now() - new Date(out.createdAt).getTime() > 4000
        ) {
          out.readBy = [OTHER_PARTY.userId];
        }
        return out;
      }),
    };
  }

  // GET /conversations/:id (detail)
  m = path.match(/\/conversations\/([^/]+)$/);
  if (m) {
    const conv = db.conversations.find((c) => c.id === m![1]);
    if (conv) return { data: conv };
    return null;
  }

  // GET /conversations (list)
  if (/\/conversations/.test(path)) return { data: db.conversations };

  // GET /announcements (list)
  if (/^\/?announcements/.test(path)) return { data: db.announcements };

  // GET /homework/:id (detail) — store-backed; static homeworkDetail is the
  // fallback for unknown ids. Seed h1 keeps its rich detail (attachments…).
  m = path.match(/^\/?homework\/([^/]+)$/);
  if (m) {
    const item = db.homework.find((h) => h.id === m![1]);
    if (item) {
      const base: any = (DEMO_DATA.homeworkDetail as any).id === item.id ? DEMO_DATA.homeworkDetail : {};
      return { data: { attachments: [], ...base, ...item } };
    }
    return null;
  }

  // GET /homework (list)
  if (/^\/?homework/.test(path)) return { data: db.homework };

  // GET /schedules/class/:id (admin per-class timetable)
  m = path.match(/\/schedules\/class\/([^/?]+)/);
  if (m) return { data: db.schedules.filter((s) => s.classId === m![1]) };

  // GET /schedules (student/teacher weekly timetable)
  if (/\/schedules/.test(path)) return { data: db.schedules };

  // GET /lessons/today (dashboard) — keep the static demo data
  if (/^\/?lessons\/today/.test(path)) return null;

  // GET /lessons/:id (detail) — store-created lessons; seed lessons fall
  // through to the richer static lessonDetail (materials, description…)
  m = path.match(/^\/?lessons\/([^/]+)$/);
  if (m) {
    const isSeed = (DEMO_DATA.lessons as any[]).some((x) => x.id === m![1]);
    const found = db.lessons.find((l) => l.id === m![1]);
    return !isSeed && found ? { data: found } : null;
  }

  // GET /lessons (list, subject/class filters, chronological order)
  if (/^\/?lessons/.test(path)) {
    let list = db.lessons;
    if (params?.subjectId) list = list.filter((l) => l.subject?.id === params.subjectId);
    if (params?.classId) list = list.filter((l) => l.classId === params.classId);
    return {
      data: [...list].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    };
  }

  // GET /classes/:id (details view) — only for store-created classes;
  // seed classes fall through to the richer static classDetails
  m = path.match(/\/classes\/([^/?]+)/);
  if (m) {
    const isSeed = (DEMO_DATA.classes as any[]).some((c) => c.id === m![1]);
    const cls = db.classes.find((c) => c.id === m![1]);
    if (!isSeed && cls) return { data: cls };
    return null;
  }

  // GET /classes (list)
  if (/\/classes/.test(path)) return { data: db.classes };

  return null;
}

// ── Mutations ──
// Returns response data, or null when the path is not handled.
export function applyDemoMutation(method: string, path: string, body?: any): any {
  const db = loadDB();
  let m: RegExpMatchArray | null;

  // PUT /admin/users/:id/role
  m = path.match(/\/admin\/users\/([^/]+)\/role/);
  if (m && method === 'put') {
    const user = db.users.find((u) => u.id === m![1]);
    if (!user) return { error: 'User not found' };
    user.role = body?.role || user.role;
    persistDB();
    return user;
  }

  // PUT /admin/users/:id/status
  m = path.match(/\/admin\/users\/([^/]+)\/status/);
  if (m && method === 'put') {
    const user = db.users.find((u) => u.id === m![1]);
    if (!user) return { error: 'User not found' };
    user.status = body?.status || user.status;
    persistDB();
    return user;
  }

  // DELETE /users/:id
  m = path.match(/\/users\/([^/]+)$/);
  if (m && method === 'delete') {
    const idx = db.users.findIndex((u) => u.id === m![1]);
    if (idx === -1) return { error: 'User not found' };
    db.users.splice(idx, 1);
    persistDB();
    return { success: true };
  }

  // POST /conversations (create a new direct or group chat)
  if (/^\/?conversations$/.test(path.split('?')[0]) && method === 'post') {
    const me = getCurrentUser();
    const ids = Array.isArray(body?.participantIds) ? body.participantIds : [];
    const others = ids.filter((id: string) => id !== me.id);
    if (others.length === 0) return { error: 'At least one participant required' };
    const isGroup = others.length > 1 || !!body?.name;
    if (isGroup) {
      const conv = {
        id: `conv${Date.now()}`,
        type: 'GROUP',
        name: body?.name || 'Group',
        participants: [
          { userId: me.id, user: { id: me.id, username: me.username, profile: me.profile } },
          ...others.map((id: string) => {
            const u = db.users.find((x) => x.id === id);
            return { userId: id, user: { id, username: u?.username || id, profile: u?.profile } };
          }),
        ],
        lastMessage: undefined,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };
      db.conversations.unshift(conv);
      persistDB();
      return conv;
    }
    // Direct chat: reuse an existing one with the same pair
    const existing = db.conversations.find(
      (c) =>
        c.type === 'DIRECT' &&
        c.participants.length === 2 &&
        c.participants.some((p: any) => p.userId === me.id) &&
        c.participants.some((p: any) => p.userId === others[0])
    );
    if (existing) return existing;
    const u = db.users.find((x) => x.id === others[0]);
    const conv = {
      id: `conv${Date.now()}`,
      type: 'DIRECT',
      participants: [
        { userId: me.id, user: { id: me.id, username: me.username, profile: me.profile } },
        { userId: others[0], user: { id: others[0], username: u?.username || others[0], profile: u?.profile } },
      ],
      lastMessage: undefined,
      unreadCount: 0,
      updatedAt: new Date().toISOString(),
    };
    db.conversations.unshift(conv);
    persistDB();
    return conv;
  }

  // POST /conversations/:id/messages (send chat message)
  m = path.match(/\/conversations\/([^/]+)\/messages/);
  if (m && method === 'post') {
    const conv = db.conversations.find((c) => c.id === m![1]);
    if (!conv) return { error: 'Conversation not found' };
    const me = getCurrentUser();
    const msg = {
      id: `m${Date.now()}`,
      senderId: me.id,
      sender: { username: me.username, profile: me.profile },
      content: body?.content || '',
      attachments: [],
      createdAt: new Date().toISOString(),
      readBy: [],
    };
    if (!db.messages[m[1]]) db.messages[m[1]] = [];
    db.messages[m[1]].push(msg);
    conv.lastMessage = { content: msg.content, createdAt: msg.createdAt };
    conv.updatedAt = msg.createdAt;
    persistDB();
    return msg;
  }

  // POST /conversations/:id/read (mark conversation as read)
  m = path.match(/\/conversations\/([^/]+)\/read/);
  if (m && method === 'post') {
    const conv = db.conversations.find((c) => c.id === m![1]);
    if (conv) {
      conv.unreadCount = 0;
      persistDB();
    }
    return { success: true };
  }

  // POST /lessons (create a lesson)
  if (/^\/?lessons/.test(path) && method === 'post') {
    const { subject, teacher } = resolveSubject(body?.subjectId);
    const cls = db.classes.find((c) => c.id === body?.classId);
    const date = body?.date || new Date().toISOString().slice(0, 10);
    const startTime = body?.startTime || '09:00';
    const endTime = body?.endTime || '09:50';
    const lesson = {
      id: `l${Date.now()}`,
      title: body?.title || 'Lesson',
      description: body?.description || '',
      subject,
      teacher,
      classId: cls?.id || null,
      className: cls?.name || '',
      class: cls ? { id: cls.id, name: cls.name } : undefined,
      startDate: new Date(`${date}T${startTime}`).toISOString(),
      endDate: new Date(`${date}T${endTime}`).toISOString(),
      startTime,
      endTime,
      room: body?.room || '',
      materials: [],
    };
    db.lessons.push(lesson);
    persistDB();
    return lesson;
  }

  // PUT /lessons/:id
  m = path.match(/^\/?lessons\/([^/]+)$/);
  if (m && method === 'put') {
    const lesson = db.lessons.find((l) => l.id === m![1]);
    if (!lesson) return { error: 'Lesson not found' };
    Object.assign(lesson, {
      title: body?.title ?? lesson.title,
      description: body?.description ?? lesson.description,
      room: body?.room ?? lesson.room,
      startTime: body?.startTime ?? lesson.startTime,
      endTime: body?.endTime ?? lesson.endTime,
    });
    if (body?.classId) {
      const cls = db.classes.find((c) => c.id === body.classId);
      if (cls) {
        lesson.classId = cls.id;
        lesson.className = cls.name;
        lesson.class = { id: cls.id, name: cls.name };
      }
    }
    if (body?.date || body?.startTime || body?.endTime) {
      const date = body?.date || lesson.startDate.slice(0, 10);
      const startTime = body?.startTime || lesson.startTime;
      const endTime = body?.endTime || lesson.endTime;
      lesson.startDate = new Date(`${date}T${startTime}`).toISOString();
      lesson.endDate = new Date(`${date}T${endTime}`).toISOString();
    }
    if (body?.subjectId) {
      const { subject, teacher } = resolveSubject(body.subjectId);
      if (subject) lesson.subject = subject;
      lesson.teacher = teacher;
    }
    persistDB();
    return lesson;
  }

  // DELETE /lessons/:id
  m = path.match(/^\/?lessons\/([^/]+)$/);
  if (m && method === 'delete') {
    const idx = db.lessons.findIndex((l) => l.id === m![1]);
    if (idx === -1) return { error: 'Lesson not found' };
    db.lessons.splice(idx, 1);
    persistDB();
    return { success: true };
  }

  // POST /classes
  if (/\/classes/.test(path) && method === 'post') {
    const cls = {
      id: `c${Date.now()}`,
      name: body?.name || 'New Class',
      grade: body?.grade || 1,
      section: body?.section || '',
      capacity: body?.capacity || 30,
      room: body?.room || '',
      homeroomTeacherId: body?.homeroomTeacherId || null,
      studentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    const created = normalizeClass(cls);
    db.classes.push(created);
    persistDB();
    return created;
  }

  // PUT /classes/:id
  m = path.match(/\/classes\/([^/]+)$/);
  if (m && method === 'put') {
    const cls = db.classes.find((c) => c.id === m![1]);
    if (!cls) return { error: 'Class not found' };
    Object.assign(cls, {
      name: body?.name ?? cls.name,
      grade: body?.grade ?? cls.grade,
      section: body?.section ?? cls.section,
      capacity: body?.capacity ?? cls.capacity,
      room: body?.room ?? cls.room,
      homeroomTeacherId: body?.homeroomTeacherId ?? cls.homeroomTeacherId,
    });
    persistDB();
    return cls;
  }

  // DELETE /classes/:id
  m = path.match(/\/classes\/([^/]+)$/);
  if (m && method === 'delete') {
    const idx = db.classes.findIndex((c) => c.id === m![1]);
    if (idx === -1) return { error: 'Class not found' };
    db.classes.splice(idx, 1);
    persistDB();
    return { success: true };
  }

  // POST /schedules (add lesson slot to a class timetable)
  if (/\/schedules/.test(path) && method === 'post') {
    const { subject, teacher } = resolveSubject(body?.subjectId);
    const entry = {
      id: `sch${Date.now()}`,
      classId: body?.classId || 'c1',
      dayOfWeek: Number(body?.dayOfWeek) || 1,
      startTime: body?.startTime || '08:00',
      endTime: body?.endTime || '08:50',
      room: body?.room || '',
      notes: null,
      subject,
      teacher,
    };
    db.schedules.push(entry);
    persistDB();
    return entry;
  }

  // PUT /schedules/:id
  m = path.match(/\/schedules\/([^/]+)$/);
  if (m && method === 'put') {
    const entry = db.schedules.find((s) => s.id === m![1]);
    if (!entry) return { error: 'Schedule not found' };
    Object.assign(entry, {
      dayOfWeek: body?.dayOfWeek != null ? Number(body.dayOfWeek) : entry.dayOfWeek,
      startTime: body?.startTime ?? entry.startTime,
      endTime: body?.endTime ?? entry.endTime,
      room: body?.room ?? entry.room,
      classId: body?.classId ?? entry.classId,
    });
    if (body?.subjectId) {
      const { subject, teacher } = resolveSubject(body.subjectId);
      entry.subject = subject;
      entry.teacher = teacher;
    }
    persistDB();
    return entry;
  }

  // DELETE /schedules/:id
  m = path.match(/\/schedules\/([^/]+)$/);
  if (m && method === 'delete') {
    const idx = db.schedules.findIndex((s) => s.id === m![1]);
    if (idx === -1) return { error: 'Schedule not found' };
    db.schedules.splice(idx, 1);
    persistDB();
    return { success: true };
  }

  // ── Announcements CRUD ──
  // POST /announcements
  if (/^\/?announcements$/.test(path) && method === 'post') {
    const cu = getCurrentUser();
    const item = {
      id: `a${Date.now()}`,
      title: body?.title || 'Untitled',
      content: body?.content || '',
      targetAudience: body?.targetAudience || 'ALL',
      isPinned: !!body?.isPinned,
      priority: body?.isPinned ? 'high' : 'medium',
      author: { id: cu.id, username: cu.username, profile: cu.profile },
      createdAt: new Date().toISOString(),
    };
    db.announcements.push(item);
    persistDB();
    return item;
  }

  // PUT /announcements/:id
  m = path.match(/^\/?announcements\/([^/]+)$/);
  if (m && method === 'put') {
    const item = db.announcements.find((a) => a.id === m![1]);
    if (!item) return { error: 'Announcement not found' };
    Object.assign(item, {
      title: body?.title ?? item.title,
      content: body?.content ?? item.content,
      targetAudience: body?.targetAudience ?? item.targetAudience,
      isPinned: body?.isPinned !== undefined ? !!body.isPinned : item.isPinned,
      priority: body?.isPinned !== undefined ? (body.isPinned ? 'high' : 'medium') : item.priority,
    });
    persistDB();
    return item;
  }

  // DELETE /announcements/:id
  m = path.match(/^\/?announcements\/([^/]+)$/);
  if (m && method === 'delete') {
    const idx = db.announcements.findIndex((a) => a.id === m![1]);
    if (idx === -1) return { error: 'Announcement not found' };
    db.announcements.splice(idx, 1);
    persistDB();
    return { success: true };
  }

  // ── Homework CRUD ──
  // POST /homework
  if (/^\/?homework$/.test(path) && method === 'post') {
    const { subject } = resolveSubject(body?.subjectId);
    const item = {
      id: `h${Date.now()}`,
      title: body?.title || 'Untitled',
      description: body?.description || '',
      dueDate: body?.dueDate || new Date().toISOString().slice(0, 10),
      status: body?.status || 'assigned',
      subject,
    };
    db.homework.push(item);
    persistDB();
    return item;
  }

  // POST /homework/:id/submit (student submission)
  m = path.match(/^\/?homework\/([^/]+)\/submit$/);
  if (m && method === 'post') {
    const item = db.homework.find((h) => h.id === m![1]);
    if (!item) return { error: 'Homework not found' };
    item.status = 'submitted';
    item.submissions = [
      ...(item.submissions || []),
      { content: body?.content || '', submittedAt: new Date().toISOString() },
    ];
    persistDB();
    return item;
  }

  // PUT /homework/:id
  m = path.match(/^\/?homework\/([^/]+)$/);
  if (m && method === 'put') {
    const item = db.homework.find((h) => h.id === m![1]);
    if (!item) return { error: 'Homework not found' };
    Object.assign(item, {
      title: body?.title ?? item.title,
      description: body?.description ?? item.description,
      dueDate: body?.dueDate ?? item.dueDate,
      status: body?.status ?? item.status,
    });
    if (body?.subjectId) {
      const { subject } = resolveSubject(body.subjectId);
      item.subject = subject;
    }
    persistDB();
    return item;
  }

  // DELETE /homework/:id
  m = path.match(/^\/?homework\/([^/]+)$/);
  if (m && method === 'delete') {
    const idx = db.homework.findIndex((h) => h.id === m![1]);
    if (idx === -1) return { error: 'Homework not found' };
    db.homework.splice(idx, 1);
    persistDB();
    return { success: true };
  }

  return null;
}
