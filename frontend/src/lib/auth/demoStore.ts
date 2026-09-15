// Persistent demo database for GitHub Pages / no-backend mode.
// Admin CRUD mutations (users, classes) are applied here and stored in
// localStorage, so changes survive page reloads — same UX as a real backend.
import { DEMO_DATA } from './demoData';

const STORAGE_KEY = 'demo_db_v1';

interface DemoDB {
  users: any[];
  classes: any[];
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

function seedDB(): DemoDB {
  return {
    users: JSON.parse(JSON.stringify(DEMO_DATA.users)),
    classes: JSON.parse(JSON.stringify(DEMO_DATA.classes)).map(normalizeClass),
  };
}

export function loadDB(): DemoDB {
  if (cache) return cache;
  if (typeof window === 'undefined') return seedDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const db = JSON.parse(raw) as DemoDB;
      if (Array.isArray(db?.users) && Array.isArray(db?.classes)) {
        cache = db;
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

  // GET /classes/:id (details view) — only for store-created classes;
  // seed classes fall through to the richer static classDetails
  const m = path.match(/\/classes\/([^/?]+)/);
  if (m) {
    const isSeed = DEMO_DATA.classes.some((c) => c.id === m[1]);
    const cls = db.classes.find((c) => c.id === m[1]);
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

  return null;
}
