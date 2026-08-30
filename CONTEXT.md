# School Platform — Shared Context for Development

## Project Structure
```
school-platform/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/schema.prisma      # Full Prisma schema (all models)
│   └── src/
│       ├── config/               # index.ts, prisma.ts
│       ├── middleware/           # auth.ts, validate.ts, errorHandler.ts, rateLimiter.ts, localize.ts, permission.ts
│       ├── utils/                # logger.ts, jwt.ts, password.ts, apiResponse.ts, pagination.ts
│       ├── routes/index.ts       # Route aggregator
│       ├── modules/
│       │   ├── auth/             # DONE: auth.routes.ts, auth.controller.ts, auth.service.ts, auth.schema.ts
│       │   ├── users/            # TODO
│       │   ├── schools/          # TODO
│       │   ├── classes/          # TODO
│       │   ├── subjects/         # TODO
│       │   ├── teachers/        # TODO
│       │   ├── students/        # TODO
│       │   ├── lessons/         # TODO
│       │   ├── schedules/       # TODO
│       │   ├── homework/        # TODO
│       │   ├── announcements/    # TODO
│       │   ├── messages/        # TODO
│       │   ├── conversations/   # TODO
│       │   ├── notifications/   # TODO
│       │   ├── reports/         # TODO
│       │   ├── complaints/      # TODO
│       │   └── permissions/     # TODO
│       ├── app.ts               # DONE: Express app setup
│       └── server.ts            # DONE: Server entry point
└── frontend/                    # TODO: Next.js app
```

## Backend Conventions

Each module follows this pattern (4 files):
```typescript
// {module}.schema.ts — Zod validation schemas
import { z } from 'zod';
export const createXSchema = { body: z.object({ ... }) };

// {module}.service.ts — Business logic
import prisma from '../../config/prisma';
export class XService {
  static async create(data) { ... }
  static async findAll(query) { ... }
  // etc.
}

// {module}.controller.ts — Request handlers
import { success, paginated } from '../../utils/apiResponse';
export class XController {
  static async create(req, res, next) {
    try { const result = await XService.create(req.body); res.status(201).json(success(result)); }
    catch (e) { next(e); }
  }
}

// {module}.routes.ts — Express router
import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { requirePermission } from '../../middleware/permission';
const router = Router();
router.use(authenticate); // All routes authenticated
router.post('/', requirePermission('resource','create'), validate(schema), XController.create);
export default router;
```

## Key Utils Available
- `prisma` from `../../config/prisma` — PrismaClient instance
- `ApiError` from `../../utils/apiResponse` — throw new ApiError(status, code, message, details?)
- `success(data, meta?)` from `../../utils/apiResponse` — success response
- `paginated(data, total, page, limit)` from `../../utils/apiResponse`
- `getPagination(req)` from `../../utils/pagination` — returns {page, limit, skip}
- `getSort(req, allowedFields, defaultField, defaultDir)` from `../../utils/pagination`
- `getSearchFilter(req, fields)` from `../../utils/pagination`
- `authenticate` from `../../middleware/auth` — JWT auth middleware
- `requireRole(...roles)` from `../../middleware/auth` — role guard
- `requirePermission(resource, action)` from `../../middleware/permission`
- `validate(schemas)` from `../../middleware/validate` — Zod validation
- `messageRateLimiter` from `../../middleware/rateLimiter`

## Prisma Models (Key fields — see prisma/schema.prisma for full schema)
- User: id, email, username, password, role (SUPER_ADMIN/SCHOOL_ADMIN/TEACHER/STUDENT/PARENT), status, preferredLang
- Profile: userId, firstName, lastName, avatar, phone, gender, dateOfBirth, bio, etc.
- PrivacySettings: userId, profileVisibility (PUBLIC/STUDENTS_ONLY/TEACHERS_ONLY/SCHOOL_ONLY/PRIVATE), whoCanMessage (EVERYONE/SCHOOL_ONLY/CLASS_ONLY/NO_ONE), showEmail, showPhone, searchableByName, searchableByUsername
- School: name, description, address, phone, email, logo, adminId
- Class: schoolId, name, grade, section, capacity, room, homeroomTeacherId
- Subject: schoolId, name, code, description, color, language
- Teacher: userId, schoolId, employeeId, qualification, specialization, subjects[]
- Student: userId, schoolId, classId, studentCardId, guardianName, guardianPhone
- Lesson: classId, subjectId, teacherId, title, description, materials[], room, status, startDate, endDate
- Schedule: schoolId, classId, subjectId?, teacherId?, dayOfWeek (0-6), startTime, endTime, room
- Homework: classId, subjectId, teacherId, title, description, dueDate, attachments[], maxScore
- HomeworkSubmission: homeworkId, studentId, content, attachments[], status (ASSIGNED/IN_PROGRESS/SUBMITTED/GRADED/LATE/OVERDUE), grade, feedback
- Announcement: schoolId?, classId?, authorId, title, content, audience, isPinned, attachments[]
- Conversation: type (DIRECT/GROUP/CLASS/PARENT_TEACHER), name?, createdBy
- ConversationParticipant: conversationId, userId, role (ADMIN/MEMBER), lastReadAt
- Message: conversationId, senderId, content, attachments[], readBy[], editedAt, deletedAt
- Notification: userId, type, title, content, data?, link?, isRead
- Report: type (ACADEMIC/ATTENDANCE/BEHAVIOR/PROGRESS/CUSTOM), studentId?, classId?, createdById, title, content, data?, period, status
- Complaint: filedById, againstUserId, type (HARASSMENT/SPAM/INAPPROPRIATE_CONTENT/BULLYING/OTHER), description, evidence[], status (PENDING/REVIEWING/RESOLVED/DISMISSED), handledById, resolution
- BlockedUser: userId, blockedById, reason
- Permission: name, resource, action
- UserPermission: userId, permissionId, granted
- RefreshToken: token, userId, expiresAt, revokedAt

## API Endpoints (all under /api/v1)

### Auth (DONE)
POST   /auth/register
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
PUT    /auth/password
POST   /auth/forgot-password
POST   /auth/reset-password

### Users
GET    /users                  — list/search users (with pagination, privacy-respecting)
GET    /users/:id              — get user by id (respects privacy settings)
GET    /users/username/:username — get user by @username
PUT    /users/:id              — update user (self or admin)
DELETE /users/:id              — delete/deactivate user (admin only)
PUT    /users/:id/role         — change user role (admin only)
PUT    /users/:id/status       — change user status (admin only)

### Profiles
GET    /users/:id/profile       — get profile (privacy-respecting)
PUT    /users/:id/profile       — update own profile
PUT    /users/:id/privacy       — update privacy settings

### Blocked Users
POST   /users/:id/block         — block a user
DELETE /users/:id/block          — unblock
GET    /users/blocked            — list blocked users

### Schools
GET    /schools                 — list schools
POST   /schools                 — create school (admin)
GET    /schools/:id             — get school
PUT    /schools/:id             — update school (admin)
DELETE /schools/:id             — delete school (admin)

### Classes
GET    /schools/:schoolId/classes — list classes in school
POST   /classes                 — create class (admin)
GET    /classes/:id              — get class with students, subjects, teachers
PUT    /classes/:id              — update class (admin)
DELETE /classes/:id              — delete class (admin)
POST   /classes/:id/students/:studentId — assign student to class
DELETE /classes/:id/students/:studentId — remove student from class

### Subjects
GET    /schools/:schoolId/subjects — list subjects
POST   /subjects                 — create subject (admin)
GET    /subjects/:id              — get subject
PUT    /subjects/:id              — update subject (admin)
DELETE /subjects/:id              — delete subject (admin)
POST   /subjects/:id/teachers/:teacherId — assign teacher to subject
DELETE /subjects/:id/teachers/:teacherId — remove teacher from subject

### Teachers
GET    /teachers                 — list teachers
POST   /teachers                 — create teacher record (admin)
GET    /teachers/:id              — get teacher with subjects, classes
PUT    /teachers/:id              — update teacher (admin/self)
GET    /teachers/:id/classes      — get classes assigned to teacher
GET    /teachers/:id/lessons      — get lessons by teacher

### Students
GET    /students                 — list students
POST   /students                 — create student record (admin)
GET    /students/:id              — get student with class, school info
PUT    /students/:id              — update student (admin/self/guardian)
GET    /students/:id/homework     — get student's homework
GET    /students/:id/reports      — get student's reports

### Lessons
GET    /lessons                  — list lessons (filtered by class/teacher/subject)
POST   /lessons                  — create lesson (teacher)
GET    /lessons/:id               — get lesson with materials
PUT    /lessons/:id               — update lesson (teacher/owner)
DELETE /lessons/:id               — delete lesson (teacher/owner)
GET    /lessons/today              — get today's lessons for current user
GET    /lessons/upcoming           — get upcoming lessons

### Schedules
GET    /schedules                — list schedules (filtered by class/day)
POST   /schedules                — create schedule entry (admin)
PUT    /schedules/:id             — update schedule (admin)
DELETE /schedules/:id             — delete schedule (admin)
GET    /schedules/class/:classId   — get full week schedule for a class

### Homework
GET    /homework                 — list homework (filtered by class/subject/student)
POST   /homework                 — create homework (teacher)
GET    /homework/:id              — get homework details
PUT    /homework/:id              — update homework (teacher)
DELETE /homework/:id              — delete homework (teacher)
GET    /homework/:id/submissions  — get submissions for homework (teacher)
POST   /homework/:id/submit      — submit homework (student)
PUT    /homework/:id/submissions/:submissionId — grade submission (teacher)

### Announcements
GET    /announcements            — list announcements (school/class)
POST   /announcements            — create announcement (teacher/admin)
GET    /announcements/:id         — get announcement
PUT    /announcements/:id         — update (author/admin)
DELETE /announcements/:id         — delete (author/admin)
GET    /announcements/feed        — get announcement feed for current user
POST   /announcements/:id/pin     — pin announcement (admin)

### Conversations
GET    /conversations            — list user's conversations
POST   /conversations            — create conversation (direct or group)
GET    /conversations/:id         — get conversation with participants
PUT    /conversations/:id         — update conversation (name, etc.)
DELETE /conversations/:id         — leave/delete conversation
POST   /conversations/:id/participants — add participant
DELETE /conversations/:id/participants/:userId — remove participant

### Messages
GET    /conversations/:id/messages — get messages in conversation (paginated)
POST   /conversations/:id/messages — send message
PUT    /messages/:id               — edit message (sender only)
DELETE /messages/:id               — delete message (sender only)
POST   /conversations/:id/read     — mark conversation as read
GET    /conversations/unread       — get unread count

### Notifications
GET    /notifications             — list notifications (paginated)
PUT    /notifications/:id/read     — mark single as read
PUT    /notifications/read-all     — mark all as read
DELETE /notifications/:id          — delete notification
GET    /notifications/unread-count  — get unread count

### Reports
GET    /reports                  — list reports (filtered by type/student/class)
POST   /reports                  — create report (teacher/admin)
GET    /reports/:id               — get report
PUT    /reports/:id               — update report
DELETE /reports/:id               — delete report (admin)

### Complaints
GET    /complaints               — list complaints (admin only)
POST   /complaints               — file a complaint (any authenticated user)
GET    /complaints/:id            — get complaint (filer or admin)
PUT    /complaints/:id            — handle/resolve complaint (admin only)

### Permissions
GET    /permissions               — list all permissions (admin)
POST   /permissions               — create permission (super admin)
PUT    /users/:id/permissions     — grant/revoke permission for user (admin)
GET    /users/:id/permissions     — get user's permissions

## Frontend Tech Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + dark/light theme
- next-i18next or custom i18n for es/de/en
- Zustand for state management
- Socket.io-client for real-time messaging
- Responsive: desktop, tablet, phone

## Frontend Pages Required
- Auth: login, register (with language selector)
- Dashboard (today's lessons, homework, announcements, messages, notifications)
- Lessons: list, detail
- Schedule: weekly view
- Homework: list, detail, submit
- Messages: conversation list, chat view
- Notifications: list
- Profile: view (with privacy), edit, privacy settings
- Settings: language, theme, privacy
- Users: search, directory
- Admin panel: users, classes, subjects, schedule, complaints, announcements
