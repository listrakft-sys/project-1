// Demo users for GitHub Pages / no-backend mode
import { User, UserRole } from '@/lib/store/auth';

export interface DemoUser extends User {
  demoPassword: string;
}

export const DEMO_USERS: Record<string, DemoUser> = {
  admin: {
    id: 'demo-admin',
    email: 'admin@school.edu',
    username: 'admin',
    role: 'SCHOOL_ADMIN' as UserRole,
    status: 'ACTIVE',
    preferredLang: 'es',
    schoolId: 'demo-school',
    demoPassword: 'admin123',
    profile: { firstName: 'Анна', lastName: 'Гарсиа' },
  },
  teacher: {
    id: 'demo-teacher',
    email: 'teacher@school.edu',
    username: 'teacher',
    role: 'TEACHER' as UserRole,
    status: 'ACTIVE',
    preferredLang: 'es',
    schoolId: 'demo-school',
    demoPassword: 'teacher123',
    profile: { firstName: 'Лаура', lastName: 'Фернандес' },
  },
  student: {
    id: 'demo-student',
    email: 'student@school.edu',
    username: 'student',
    role: 'STUDENT' as UserRole,
    status: 'ACTIVE',
    preferredLang: 'es',
    schoolId: 'demo-school',
    student: { id: 'demo-student-record', schoolId: 'demo-school', classId: 'demo-class-7a' },
    demoPassword: 'student123',
    profile: { firstName: 'Мария', lastName: 'Гарсиа' },
  },
  parent: {
    id: 'demo-parent',
    email: 'parent@school.edu',
    username: 'parent',
    role: 'PARENT' as UserRole,
    status: 'ACTIVE',
    preferredLang: 'es',
    schoolId: 'demo-school',
    demoPassword: 'parent123',
    profile: { firstName: 'Карлос', lastName: 'Руис' },
  },
};

// Try to find a demo user by username or email
export function findDemoUser(identifier: string, password: string): DemoUser | null {
  const key = identifier.toLowerCase().trim();
  for (const user of Object.values(DEMO_USERS)) {
    if (
      (user.username.toLowerCase() === key || user.email.toLowerCase() === key) &&
      user.demoPassword === password
    ) {
      return user;
    }
  }
  return null;
}

// Check if we're in demo mode (no backend available)
export function isDemoMode(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  // GitHub Pages = demo mode
  if (host.includes('github.io')) return true;
  // No API URL configured and running on default = demo mode
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return true;
  // If API URL points to localhost but we're not on localhost = demo
  if (apiUrl.includes('localhost') && host !== 'localhost' && host !== '127.0.0.1') return true;
  return false;
}
