# 🎓 School Platform

A modern, secure, multilingual school management platform — social network + education in one place.

Built as a full-stack MVP: **Frontend** (Next.js) + **Backend** (Express API) + **Database** (PostgreSQL) + **Auth** (JWT) + **Roles** + **Localization** + **Admin Panel**.

---

## 📋 Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Roles & Permissions](#roles--permissions)
7. [Localization](#localization)
8. [Getting Started](#getting-started)
9. [Environment Variables](#environment-variables)
10. [Implemented Features](#implemented-features)
11. [Known Limitations](#known-limitations)
12. [Ideas for Next Version](#ideas-for-next-version)

---

## Features

- **Authentication**: JWT-based with access + refresh tokens, password hashing (bcrypt)
- **Roles**: Super Admin, School Admin, Teacher, Student, Parent — each with specific permissions
- **User Profiles**: With @username, privacy settings (who can see what, who can message)
- **Schools & Classes**: Full school hierarchy (school → class → students + subjects + teachers)
- **Lessons**: Teachers create lessons with materials, students view their class lessons
- **Schedule**: Weekly schedule grid, day-based, per class
- **Homework**: Assign, submit, grade — with status tracking (assigned → submitted → graded)
- **Messages**: Real-time direct messaging with privacy controls, block system, anti-spam
- **Announcements**: School-wide or class-specific, pinned announcements
- **Notifications**: New messages, lessons, homework, announcements, schedule changes
- **Admin Panel**: User management, class/subject/schedule management, complaints/moderation
- **Localization**: Español (default), Deutsch, English — UI language independent of subject language
- **Responsive**: Works on desktop, laptop, tablet, and phone
- **Dark/Light Theme**: Toggle in settings
- **Security**: Backend-enforced permissions, privacy settings, rate limiting, helmet, CORS

---

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit
- **Real-time**: Socket.io (for messaging)
- **Logging**: Morgan

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **HTTP**: Axios
- **Icons**: lucide-react
- **Theme**: next-themes
- **i18n**: Custom context-based (es/de/en)

---

## Project Structure

```
school-platform/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma          # Full database schema (18+ entities)
│   │   └── seed.ts                # Seed data (admin, teacher, student, subjects, etc.)
│   └── src/
│       ├── config/                # App config, Prisma client
│       ├── middleware/            # auth, validation, errors, rate-limit, localization, permissions
│       ├── utils/                 # logger, JWT, password, API response, pagination
│       ├── routes/index.ts        # Route aggregator
│       ├── modules/
│       │   ├── auth/               # Register, login, refresh, logout, password
│       │   ├── users/              # User CRUD, profiles, privacy, block
│       │   ├── schools/             # School CRUD
│       │   ├── classes/             # Class CRUD, student assignment
│       │   ├── subjects/            # Subject CRUD, teacher assignment
│       │   ├── teachers/            # Teacher CRUD, classes, lessons
│       │   ├── students/            # Student CRUD, homework, reports
│       │   ├── lessons/             # Lesson CRUD, today/upcoming
│       │   ├── schedules/           # Weekly schedule CRUD
│       │   ├── homework/            # Homework CRUD + submissions + grading
│       │   ├── announcements/       # Announcements CRUD + feed + pin
│       │   ├── conversations/       # Conversation CRUD + participants
│       │   ├── messages/            # Messages send/edit/delete + read status
│       │   ├── notifications/       # Notifications CRUD + read-all + unread count
│       │   ├── reports/             # Academic/behavior reports
│       │   ├── complaints/           # Moderation complaints
│       │   └── permissions/          # Permission management
│       ├── app.ts                   # Express app setup (helmet, cors, routes, errors)
│       └── server.ts               # HTTP server entry point
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    ├── tailwind.config.ts
    └── src/
        ├── app/                     # Next.js App Router pages
        │   ├── (auth)/              # Login, Register
        │   ├── (app)/               # Dashboard, Lessons, Schedule, etc.
        │   │   └── admin/           # Admin panel pages
        │   └── globals.css          # Tailwind + theme variables
        ├── components/              # UI components, layout, dashboard, admin
        ├── lib/
        │   ├── api/client.ts        # Axios instance with auth interceptor
        │   ├── store/auth.ts        # Zustand auth store
        │   └── i18n/                # Localization (es/de/en dictionaries)
        └── middleware.ts            # Route protection
```

---

## Database Schema

### Entities (18+)

| Entity | Description |
|--------|-------------|
| **User** | Base auth entity: email, username (@handle), password, role, status, preferredLang |
| **Profile** | Personal info: firstName, lastName, avatar, phone, gender, DOB, bio |
| **PrivacySettings** | Visibility controls: profileVisibility, whoCanMessage, showEmail/Phone/Address |
| **School** | School info: name, address, phone, email, logo, adminId |
| **Class** | School class: name (e.g. "8B"), grade, section, capacity, room, homeroomTeacher |
| **Subject** | School subject: name, code, color, language (independent of UI language) |
| **Teacher** | Links User to School: employeeId, qualification, specialization, subjects[] |
| **Student** | Links User to School + Class: studentCardId, guardian info |
| **Lesson** | Class lesson: title, description, materials[], room, startDate, endDate, status |
| **Schedule** | Weekly time slot: classId, dayOfWeek, startTime, endTime, room |
| **Homework** | Assignment: title, description, dueDate, attachments[], maxScore |
| **HomeworkSubmission** | Student submission: content, attachments, status, grade, feedback |
| **Announcement** | School/class announcement: title, content, audience, isPinned, attachments[] |
| **Conversation** | Chat: type (direct/group/class), name, participants[] |
| **ConversationParticipant** | User in conversation: role (admin/member), lastReadAt |
| **Message** | Chat message: content, attachments[], readBy[], editedAt, deletedAt |
| **Notification** | User notification: type, title, content, link, isRead |
| **Report** | Academic/behavior report: type, student, period, status (draft/published) |
| **Complaint** | Moderation complaint: filedBy, against, type, status, resolution |
| **BlockedUser** | Block relationship: userId, blockedById, reason |
| **Permission** | Permission definition: name (e.g. "users.create"), resource, action |
| **UserPermission** | User-specific permission grant/deny override |
| **RefreshToken** | JWT refresh token with rotation support |

### Key Relationships
- User 1:1 Profile, 1:1 PrivacySettings
- User 1:1 Teacher OR 1:1 Student (based on role)
- School 1:N Classes, 1:N Subjects, 1:N Teachers, 1:N Students
- Class N:N Subjects (via Teacher), Class 1:N Lessons, 1:N Homework
- Teacher N:N Subjects (many-to-many)
- Conversation N:N Users (via ConversationParticipant)
- Conversation 1:N Messages

---

## API Reference

Base URL: `/api/v1`

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login (email or username) |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (revoke refresh token) |
| GET | `/auth/me` | Get current user |
| PUT | `/auth/password` | Change password |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |

### Users & Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List/search users (privacy-respecting) |
| GET | `/users/:id` | Get user (privacy-respecting) |
| GET | `/users/username/:username` | Get user by @username |
| PUT | `/users/:id` | Update user (self or admin) |
| DELETE | `/users/:id` | Delete user (admin) |
| GET | `/users/:id/profile` | Get profile (privacy-respecting) |
| PUT | `/users/:id/profile` | Update profile (self) |
| PUT | `/users/:id/privacy` | Update privacy settings (self) |
| POST | `/users/:id/block` | Block user |
| DELETE | `/users/:id/block` | Unblock user |
| GET | `/users/blocked` | List blocked users |

### Schools, Classes, Subjects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/schools` | List/create schools |
| GET/PUT/DELETE | `/schools/:id` | School CRUD |
| GET/POST | `/classes` | List/create classes |
| GET/PUT/DELETE | `/classes/:id` | Class CRUD |
| POST/DELETE | `/classes/:id/students/:studentId` | Assign/remove student |
| GET/POST | `/subjects` | List/create subjects |
| GET/PUT/DELETE | `/subjects/:id` | Subject CRUD |
| POST/DELETE | `/subjects/:id/teachers/:teacherId` | Assign/remove teacher |

### Teachers & Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/teachers` | List/create teachers |
| GET/PUT | `/teachers/:id` | Get/update teacher |
| GET | `/teachers/:id/classes` | Teacher's classes |
| GET | `/teachers/:id/lessons` | Teacher's lessons |
| GET/POST | `/students` | List/create students |
| GET/PUT | `/students/:id` | Get/update student |
| GET | `/students/:id/homework` | Student's homework |
| GET | `/students/:id/reports` | Student's reports |

### Lessons & Schedule
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/lessons` | List/create lessons |
| GET/PUT/DELETE | `/lessons/:id` | Lesson CRUD |
| GET | `/lessons/today` | Today's lessons |
| GET | `/lessons/upcoming` | Upcoming lessons |
| GET/POST | `/schedules` | List/create schedule entries |
| GET | `/schedules/class/:classId` | Full week schedule for class |
| PUT/DELETE | `/schedules/:id` | Update/delete schedule entry |

### Homework
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/homework` | List/create homework |
| GET/PUT/DELETE | `/homework/:id` | Homework CRUD |
| GET | `/homework/:id/submissions` | Get submissions (teacher) |
| POST | `/homework/:id/submit` | Submit homework (student) |
| PUT | `/homework/:id/submissions/:submissionId` | Grade submission (teacher) |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/conversations` | List/create conversations |
| GET/PUT/DELETE | `/conversations/:id` | Conversation CRUD |
| POST/DELETE | `/conversations/:id/participants` | Add/remove participant |
| POST | `/conversations/:id/read` | Mark as read |
| GET | `/conversations/unread` | Unread counts |
| GET/POST | `/conversations/:id/messages` | List/send messages |
| PUT/DELETE | `/messages/:id` | Edit/delete message |

### Announcements & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/announcements` | List/create announcements |
| GET/PUT/DELETE | `/announcements/:id` | Announcement CRUD |
| GET | `/announcements/feed` | Personalized feed |
| POST | `/announcements/:id/pin` | Pin (admin) |
| GET | `/notifications` | List notifications |
| PUT | `/notifications/:id/read` | Mark as read |
| PUT | `/notifications/read-all` | Mark all as read |
| DELETE | `/notifications/:id` | Delete notification |
| GET | `/notifications/unread-count` | Unread count |

### Reports, Complaints, Permissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/reports` | List/create reports |
| GET/PUT/DELETE | `/reports/:id` | Report CRUD |
| GET/POST | `/complaints` | List/file complaints |
| GET/PUT | `/complaints/:id` | View/handle complaint |
| GET/POST | `/permissions` | List/create permissions |
| GET/PUT | `/users/:id/permissions` | Get/set user permissions |

---

## Roles & Permissions

| Role | Permissions |
|------|------------|
| **SUPER_ADMIN** | Full access to everything |
| **SCHOOL_ADMIN** | Manage users, schools, classes, subjects, teachers, students, schedules, announcements, complaints, permissions |
| **TEACHER** | Create lessons, homework, announcements; view students in their classes; send messages |
| **STUDENT** | View their class lessons, schedule, homework; submit homework; send messages (within privacy rules) |
| **PARENT** | View child's lessons, schedule, homework, reports; send messages |

All permissions are enforced on the backend. The frontend hides unauthorized UI, but the API rejects unauthorized requests regardless.

---

## Localization

Supported languages:
- 🇪🇸 **Español** (default)
- 🇩🇪 **Deutsch**
- 🇬🇧 **English**

The UI language is selected at first login and changeable in settings. Subject material language is independent — e.g., the UI can be in Spanish while a lesson is in German.

All UI text uses a translation system (`t('key')`) — no hardcoded strings in components.

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Edit .env with your database URL and JWT secrets

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# Start development server
npm run dev
```

The API runs on `http://localhost:3000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# Set NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Start development server
npm run dev
```

The frontend runs on `http://localhost:3001`.

### Demo Accounts (from seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@school.edu | Admin123! |
| Teacher | teacher@school.edu | Teacher123! |
| Student | student@school.edu | Student123! |

---

## Environment Variables

### Backend (`.env`)
```
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_platform
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret_change_me
JWT_REFRESH_SECRET=your_refresh_secret_change_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
DEFAULT_LANGUAGE=es
SUPPORTED_LANGUAGES=es,de,en
PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100
```

### Frontend (`.env`)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

---

## Implemented Features

✅ JWT authentication (register, login, refresh, logout, change password)
✅ Role-based access control (5 roles with backend-enforced permissions)
✅ User profiles with @username and privacy settings
✅ User search (respecting privacy)
✅ Block/unblock users
✅ Schools, classes, and subjects management
✅ Teacher and student management
✅ Lessons with materials
✅ Weekly schedule (per class)
✅ Homework with submission and grading
✅ Direct messaging with privacy controls
✅ Announcements (school-wide and class-specific)
✅ Notifications (messages, lessons, homework, announcements)
✅ Complaints/moderation system
✅ Permission management
✅ Admin panel (users, classes, subjects, schedule, complaints, announcements)
✅ Localization (Español, Deutsch, English)
✅ Dark/light theme
✅ Responsive design (desktop, tablet, phone)

---

## Known Limitations

- Email verification not fully implemented (users are set to ACTIVE on registration)
- Password reset via email token is stubbed (requires email service integration)
- File uploads are represented as URL strings (no actual file storage integration)
- Real-time messaging uses polling or Socket.io (needs active WebSocket connection)
- No group chat creation UI (API supports it, frontend TBD)
- Video calls and online lessons not implemented (planned for v2)
- Grade calculation and report generation are manual
- No calendar view (planned for v2)

---

## Ideas for Next Version

- 📱 Mobile app (React Native)
- 💬 Group chats
- 📹 Video calls and online lessons
- 📎 File upload with actual storage (S3/Cloudinary)
- 📊 Grade calculation and automatic report generation
- 📅 Calendar view with events
- 🎓 School events and activities
- 📚 Material library with search
- 🤖 AI study assistant
- ⏰ Automatic reminders (push notifications)
- 🌍 Additional languages
- 📊 Analytics dashboard for admins
- 👨‍👩‍👧 Parent portal with child progress tracking
- 🔐 Two-factor authentication
- 📧 Email service integration (for verification and notifications)
