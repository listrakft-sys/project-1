import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Super Admin ──────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@school.edu' },
    update: {},
    create: {
      email: 'admin@school.edu',
      username: 'admin',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      preferredLang: 'es',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'School',
        },
      },
      privacySettings: {
        create: {
          profileVisibility: 'PUBLIC',
          whoCanMessage: 'EVERYONE',
        },
      },
    },
  });

  // ── School ────────────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { email: 'info@escuela.edu' },
    update: {},
    create: {
      name: 'Escuela Internacional',
      description: 'International school with multilingual education',
      address: 'Calle Principal 123',
      city: 'Madrid',
      country: 'España',
      phone: '+34 600 000 000',
      email: 'info@escuela.edu',
      adminId: admin.id,
    },
  });

  // ── Subjects ──────────────────────────────────────────────────
  const subjects = await Promise.all([
    prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: 'MATH' } },
      update: {},
      create: { schoolId: school.id, name: 'Mathematik', code: 'MATH', color: '#3B82F6', language: 'de' },
    }),
    prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: 'ENG' } },
      update: {},
      create: { schoolId: school.id, name: 'English', code: 'ENG', color: '#10B981', language: 'en' },
    }),
    prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: 'PHYS' } },
      update: {},
      create: { schoolId: school.id, name: 'Physik', code: 'PHYS', color: '#F59E0B', language: 'de' },
    }),
    prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: 'HIST' } },
      update: {},
      create: { schoolId: school.id, name: 'Geschichte', code: 'HIST', color: '#EF4444', language: 'de' },
    }),
    prisma.subject.upsert({
      where: { schoolId_code: { schoolId: school.id, code: 'ESP' } },
      update: {},
      create: { schoolId: school.id, name: 'Español', code: 'ESP', color: '#8B5CF6', language: 'es' },
    }),
  ]);

  // ── Class ────────────────────────────────────────────────────
  const class8B = await prisma.class.upsert({
    where: { schoolId_name: { schoolId: school.id, name: '8B' } },
    update: {},
    create: {
      schoolId: school.id,
      name: '8B',
      grade: 8,
      section: 'B',
      capacity: 30,
      room: 'Room 101',
    },
  });

  // ── Teacher ───────────────────────────────────────────────────
  const teacherPassword = await bcrypt.hash('Teacher123!', 12);
  const teacherUser = await prisma.user.upsert({
    where: { email: 'teacher@school.edu' },
    update: {},
    create: {
      email: 'teacher@school.edu',
      username: 'profesor',
      password: teacherPassword,
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      preferredLang: 'es',
      profile: {
        create: {
          firstName: 'Maria',
          lastName: 'García',
        },
      },
      privacySettings: {
        create: {
          profileVisibility: 'SCHOOL_ONLY',
          whoCanMessage: 'SCHOOL_ONLY',
        },
      },
      teacher: {
        create: {
          schoolId: school.id,
          employeeId: 'EMP-001',
          qualification: 'PhD Mathematics',
          specialization: 'Algebra & Geometry',
          subjects: {
            connect: [subjects[0].id, subjects[2].id].map(id => ({ id })),
          },
        },
      },
    },
    include: { teacher: true },
  });

  // ── Student ───────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student123!', 12);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@school.edu' },
    update: {},
    create: {
      email: 'student@school.edu',
      username: 'alumno',
      password: studentPassword,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      preferredLang: 'es',
      profile: {
        create: {
          firstName: 'Carlos',
          lastName: 'Rodríguez',
        },
      },
      privacySettings: {
        create: {
          profileVisibility: 'SCHOOL_ONLY',
          whoCanMessage: 'CLASS_ONLY',
        },
      },
      student: {
        create: {
          schoolId: school.id,
          classId: class8B.id,
          studentCardId: 'STU-001',
          guardianName: 'Parent Rodríguez',
          guardianPhone: '+34 600 111 222',
          guardianEmail: 'parent@school.edu',
        },
      },
    },
    include: { student: true },
  });

  // ── Lesson ────────────────────────────────────────────────────
  if (teacherUser.teacher) {
    await prisma.lesson.create({
      data: {
        classId: class8B.id,
        subjectId: subjects[0].id,
        teacherId: teacherUser.teacher.id,
        title: 'Quadratische Gleichungen',
        description: 'Einführung in quadratische Gleichungen und ihre Lösungen.',
        room: 'Room 101',
        startDate: new Date(Date.now() + 86400000), // tomorrow
        endDate: new Date(Date.now() + 86400000 + 5400000), // +90 min
        materials: ['textbook-ch5.pdf', 'worksheet-3.pdf'],
      },
    });
  }

  // ── Schedule (Mon-Fri for class 8B) ────────────────────────────
  const scheduleData = [
    { dayOfWeek: 1, startTime: '08:00', endTime: '08:45', subjectId: subjects[0].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 1, startTime: '09:00', endTime: '09:45', subjectId: subjects[1].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 1, startTime: '10:00', endTime: '10:45', subjectId: subjects[2].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 1, startTime: '11:00', endTime: '11:45', subjectId: subjects[3].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 2, startTime: '08:00', endTime: '08:45', subjectId: subjects[4].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 2, startTime: '09:00', endTime: '09:45', subjectId: subjects[0].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 3, startTime: '08:00', endTime: '08:45', subjectId: subjects[2].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 3, startTime: '09:00', endTime: '09:45', subjectId: subjects[1].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 4, startTime: '08:00', endTime: '08:45', subjectId: subjects[3].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 4, startTime: '09:00', endTime: '09:45', subjectId: subjects[0].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 5, startTime: '08:00', endTime: '08:45', subjectId: subjects[4].id, teacherId: teacherUser.teacher?.id },
    { dayOfWeek: 5, startTime: '09:00', endTime: '09:45', subjectId: subjects[2].id, teacherId: teacherUser.teacher?.id },
  ];

  if (teacherUser.teacher) {
    for (const entry of scheduleData) {
      await prisma.schedule.create({
        data: {
          schoolId: school.id,
          classId: class8B.id,
          ...entry,
        },
      });
    }
  }

  // ── Homework ──────────────────────────────────────────────────
  if (teacherUser.teacher) {
    await prisma.homework.create({
      data: {
        classId: class8B.id,
        subjectId: subjects[0].id,
        teacherId: teacherUser.teacher.id,
        title: 'Aufgaben zu quadratischen Gleichungen',
        description: 'Lösen Sie die Aufgaben 1-10 auf Seite 45.',
        dueDate: new Date(Date.now() + 7 * 86400000), // 1 week from now
        attachments: ['worksheet-3.pdf'],
        maxScore: 100,
      },
    });
  }

  // ── Announcement ──────────────────────────────────────────────
  await prisma.announcement.create({
    data: {
      schoolId: school.id,
      authorId: admin.id,
      title: 'Willkommen zum neuen Schuljahr!',
      content: 'Wir begrüßen alle Schüler und Lehrer zum neuen Schuljahr 2026/2027.',
      audience: 'school',
      isPinned: true,
    },
  });

  // ── Permissions ───────────────────────────────────────────────
  const permissionData = [
    { name: 'users.create', resource: 'users', action: 'create', description: 'Create users' },
    { name: 'users.read', resource: 'users', action: 'read', description: 'View users' },
    { name: 'users.update', resource: 'users', action: 'update', description: 'Update users' },
    { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
    { name: 'classes.create', resource: 'classes', action: 'create', description: 'Create classes' },
    { name: 'classes.read', resource: 'classes', action: 'read', description: 'View classes' },
    { name: 'classes.update', resource: 'classes', action: 'update', description: 'Update classes' },
    { name: 'classes.delete', resource: 'classes', action: 'delete', description: 'Delete classes' },
    { name: 'subjects.create', resource: 'subjects', action: 'create', description: 'Create subjects' },
    { name: 'subjects.read', resource: 'subjects', action: 'read', description: 'View subjects' },
    { name: 'subjects.update', resource: 'subjects', action: 'update', description: 'Update subjects' },
    { name: 'subjects.delete', resource: 'subjects', action: 'delete', description: 'Delete subjects' },
    { name: 'lessons.create', resource: 'lessons', action: 'create', description: 'Create lessons' },
    { name: 'lessons.read', resource: 'lessons', action: 'read', description: 'View lessons' },
    { name: 'lessons.update', resource: 'lessons', action: 'update', description: 'Update lessons' },
    { name: 'lessons.delete', resource: 'lessons', action: 'delete', description: 'Delete lessons' },
    { name: 'schedules.create', resource: 'schedules', action: 'create', description: 'Create schedules' },
    { name: 'schedules.read', resource: 'schedules', action: 'read', description: 'View schedules' },
    { name: 'schedules.update', resource: 'schedules', action: 'update', description: 'Update schedules' },
    { name: 'schedules.delete', resource: 'schedules', action: 'delete', description: 'Delete schedules' },
    { name: 'homework.create', resource: 'homework', action: 'create', description: 'Create homework' },
    { name: 'homework.read', resource: 'homework', action: 'read', description: 'View homework' },
    { name: 'homework.update', resource: 'homework', action: 'update', description: 'Update homework' },
    { name: 'homework.delete', resource: 'homework', action: 'delete', description: 'Delete homework' },
    { name: 'announcements.create', resource: 'announcements', action: 'create', description: 'Create announcements' },
    { name: 'announcements.read', resource: 'announcements', action: 'read', description: 'View announcements' },
    { name: 'announcements.update', resource: 'announcements', action: 'update', description: 'Update announcements' },
    { name: 'announcements.delete', resource: 'announcements', action: 'delete', description: 'Delete announcements' },
    { name: 'complaints.read', resource: 'complaints', action: 'read', description: 'View complaints' },
    { name: 'complaints.update', resource: 'complaints', action: 'update', description: 'Handle complaints' },
    { name: 'permissions.read', resource: 'permissions', action: 'read', description: 'View permissions' },
    { name: 'permissions.update', resource: 'permissions', action: 'update', description: 'Update permissions' },
  ];

  for (const perm of permissionData) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }

  console.log('✅ Seed completed successfully!');
  console.log('   Admin:    admin@school.edu / Admin123!');
  console.log('   Teacher:  teacher@school.edu / Teacher123!');
  console.log('   Student:  student@school.edu / Student123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
