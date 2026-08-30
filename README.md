<div align="center">

# 🎓 School Platform

### A modern, secure, multilingual school management platform — social network + education in one place.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)

[![Lines of Code](https://img.shields.io/badge/Lines_of_Code-28K+-blueviolet?style=flat-square)]()
[![Backend Modules](https://img.shields.io/badge/Backend_Modules-17-orange?style=flat-square)]()
[![Frontend Pages](https://img.shields.io/badge/Frontend_Pages-25-green?style=flat-square)]()
[![DB Entities](https://img.shields.io/badge/DB_Entities-23-red?style=flat-square)]()
[![Languages](https://img.shields.io/badge/Languages-3_(ES/DE/EN)-blue?style=flat-square)]()
[![Roles](https://img.shields.io/badge/User_Roles-5-purple?style=flat-square)]()

**[🌐 Live Demo](#)** · **[📖 Documentation](#documentation)** · **[🚀 Getting Started](#getting-started)** · **[🎨 GitHub Pages](#github-pages)**

</div>

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based auth with **access + refresh tokens** and token rotation
- Password hashing with **bcrypt** (12 rounds)
- 5 user roles: **Super Admin · School Admin · Teacher · Student · Parent** — each with specific permissions
- Backend-enforced permission middleware — no client-trust

### 👥 Social & Communication
- **User profiles** with @username, avatar, bio, privacy settings
- **Direct & group messaging** with read receipts, edit/delete, attachments, anti-spam
- **Privacy controls**: who can see your profile, who can message you, block system
- **Announcements**: school-wide or class-specific, with pinned posts
- **Notifications**: new messages, lessons, homework, announcements, schedule changes

### 📚 Education
- **Schools & Classes**: full hierarchy (school → class → students + subjects + teachers)
- **Lessons**: teachers create lessons with materials, students view their class lessons
- **Schedule**: weekly schedule grid, day-based, per class
- **Homework**: assign → submit → grade, with status tracking and feedback
- **Reports**: academic & behavior reports per student/period

### 🎨 UI & UX
- **Responsive**: desktop, laptop, tablet, phone
- **Dark / Light theme** toggle
- **Multilingual**: Español (default) · Deutsch · English — UI language independent of subject language
- **Admin panel**: user management, class/subject/schedule management, complaints/moderation

---

## 🛠️ Tech Stack

<details open>
<summary><b>Click to expand/collapse</b></summary>

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| Express.js | HTTP framework |
| TypeScript | Type safety |
| PostgreSQL | Database |
| Prisma | ORM & migrations |
| JWT + bcryptjs | Authentication & password hashing |
| Zod | Request validation |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |
| Socket.io | Real-time messaging |
| Morgan | HTTP logging |

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 14 (App Router) | React framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| Zustand | State management |
| Axios | HTTP client |
| lucide-react | Icons |
| next-themes | Dark/light mode |
| Custom i18n context | Localization (es/de/en) |

</details>

---

## 📂 Project Structure

```
school-platform/
├── backend/                      # Express API server
│   ├── prisma/
│   │   ├── schema.prisma         # 23 database entities
│   │   └── seed.ts               # Seed data
│   └── src/
│       ├── config/               # App config, Prisma client
│       ├── middleware/           # auth, validation, errors, rate-limit, i18n, permissions
│       ├── utils/                # logger, JWT, password, API response, pagination
│       ├── routes/index.ts       # Route aggregator
│       └── modules/              # 17 feature modules
│           ├── auth/             # Register, login, refresh, logout
│           ├── users/            # User CRUD, profiles, privacy, block
│           ├── schools/          # School CRUD
│           ├── classes/          # Class CRUD, student assignment
│           ├── subjects/         # Subject CRUD, teacher assignment
│           ├── teachers/         # Teacher CRUD, classes, lessons
│           ├── students/        # Student CRUD, homework, reports
│           ├── lessons/         # Lesson CRUD, today/upcoming
│           ├── schedules/       # Weekly schedule CRUD
│           ├── homework/        # Homework + submissions + grading
│           ├── announcements/   # Announcements + feed + pin
│           ├── conversations/   # Conversation CRUD + participants
│           ├── messages/        # Messages send/edit/delete + read status
│           ├── notifications/   # Notifications + read-all + unread count
│           ├── reports/         # Academic/behavior reports
│           ├── complaints/     # Moderation complaints
│           └── permissions/    # Permission management
│
├── frontend/                     # Next.js 14 App Router
│   └── src/
│       ├── app/
│       │   ├── (auth)/          # Login, Register pages
│       │   ├── (app)/           # 25 app pages
│       │   │   └── admin/      # Admin panel (7 pages)
│       │   └── globals.css     # Tailwind + theme variables
│       ├── components/          # UI components, layout, dashboard
│       ├── lib/
│       │   ├── api/             # Axios instance with auth interceptor
│       │   ├── store/           # Zustand auth store
│       │   └── i18n/           # Localization dictionaries (es/de/en)
│       └── middleware.ts       # Route protection
│
├── docs/                         # GitHub Pages site
│   └── index.html               # Landing page
│
├── .github/
│   └── workflows/                # CI/CD pipeline
│
└── README.md                     # You are here ✨
```

---

## 🗄️ Database Schema

<details>
<summary><b>23 Entities — click to see full schema</b></summary>

| Entity | Description |
|--------|-------------|
| **User** | Base auth: email, username, password, role, status, preferredLang |
| **Profile** | Personal info: firstName, lastName, avatar, phone, gender, DOB, bio |
| **PrivacySettings** | Visibility: profileVisibility, whoCanMessage, showEmail/Phone |
| **School** | Name, address, phone, email, logo, adminId |
| **Class** | Name (e.g. "8B"), grade, section, capacity, room, homeroomTeacher |
| **Subject** | Name, code, color, language (independent of UI language) |
| **Teacher** | Links User → School: employeeId, qualification, subjects[] |
| **Student** | Links User → School + Class: studentCardId, guardian info |
| **Lesson** | Title, description, materials[], room, startDate, endDate, status |
| **Schedule** | Weekly slot: classId, dayOfWeek, startTime, endTime, room |
| **Homework** | Title, description, dueDate, attachments[], maxScore |
| **HomeworkSubmission** | Student: content, attachments, status, grade, feedback |
| **Announcement** | title, content, audience, isPinned, attachments[] |
| **Conversation** | type (direct/group/class), name, participants[] |
| **ConversationParticipant** | User in conversation: role, lastReadAt |
| **Message** | content, attachments[], readBy[], editedAt, deletedAt |
| **Notification** | type, title, content, link, isRead |
| **Report** | type, student, period, status (draft/published) |
| **Complaint** | filedBy, against, type, status, resolution |
| **BlockedUser** | userId, blockedById, reason |
| **Permission** | name (e.g. "users.create"), resource, action |
| **UserPermission** | User-specific permission grant/deny override |
| **RefreshToken** | JWT refresh token with rotation support |

**Key Relationships:**
- User 1:1 Profile, 1:1 PrivacySettings
- User 1:1 Teacher OR 1:1 Student (based on role)
- School 1:N Classes, 1:N Subjects, 1:N Teachers, 1:N Students
- Class N:N Subjects (via Teacher), 1:N Lessons, 1:N Homework
- Conversation N:N Users (via ConversationParticipant)
- Conversation 1:N Messages

</details>

---

## 🔑 Roles & Permissions

| Role | Key Permissions |
|------|---------------|
| 🟣 **Super Admin** | Full system access — all schools, users, global settings |
| 🔵 **School Admin** | Own school management — users, classes, subjects, schedule, announcements |
| 🟢 **Teacher** | Own lessons, homework, grades, class announcements, student reports |
| 🟡 **Student** | View lessons, submit homework, view schedule, receive announcements |
| 🟠 **Parent** | View child's progress, grades, schedule, messages with teachers |

---

## 🌍 Localization

The platform supports **3 languages** for the UI, independent of the content language:

| Language | Code | Flag |
|----------|------|------|
| Español | `es` | 🇪🇸 |
| Deutsch | `de` | 🇩🇪 |
| English | `en` | 🇬🇧 |

User preference is stored per-user (`preferredLang` field) and persisted in `localStorage`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/listrakft-sys/project-1.git
cd school-platform

# Install backend
cd backend && npm install

# Install frontend
cd ../frontend && npm install
```

### 2. Environment Setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit .env with your DATABASE_URL, JWT secrets, etc.

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit with your API URL
```

### 3. Database

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed with sample data
npx prisma db seed
```

### 4. Run

```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3001)
cd frontend && npm run dev
```

Visit **http://localhost:3001** 🎉

---

## ⚙️ Environment Variables

<details>
<summary><b>Backend (.env)</b></summary>

```env
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:3001

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_platform

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12

DEFAULT_LANGUAGE=es
SUPPORTED_LANGUAGES=es,de,en

PAGINATION_DEFAULT_LIMIT=20
PAGINATION_MAX_LIMIT=100
```

</details>

<details>
<summary><b>Frontend (.env.local)</b></summary>

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

</details>

---

## 📊 Project Stats

<div align="center">

| Metric | Value |
|--------|-------|
| Total Files | 162 |
| Total Lines of Code | 28,248 |
| Backend Modules | 17 |
| Frontend Pages | 25 |
| Database Entities | 23 |
| API Endpoints | 70+ |
| Supported Languages | 3 (ES/DE/EN) |
| User Roles | 5 |

</div>

---

## 📝 License

This project is proprietary. All rights reserved.

---

<div align="center">

**Built with ❤️ as a full-stack MVP**

[Report Bug](../../issues) · [Request Feature](../../issues) · [Documentation](#)

</div>
