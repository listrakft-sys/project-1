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
    preferredLang: 'ru',
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
    preferredLang: 'ru',
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
    preferredLang: 'ru',
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
    preferredLang: 'ru',
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

// Re-exported for backwards compatibility
export { isDemoMode } from './demoMode';
