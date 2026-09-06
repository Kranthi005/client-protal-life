# NEXUS — Intelligent Client Project Portal

> **NEXUS brings the entire client-project relationship into one intelligent workspace.**

NEXUS is a lightweight client project portal designed for freelancers, software companies, marketing agencies, consultants, design studios, and small businesses.

It centralizes project communication, tasks, milestones, files, deliverables, feedback, approvals, notifications, and activity history in one place. Its intelligence layer goes beyond a traditional project dashboard by analyzing project progress, identifying potential risks, calculating project health, summarizing project status, and recommending next actions.

## 🚀 Why NEXUS?

Client projects are often managed across email, messaging apps, spreadsheets, cloud storage, and disconnected tools. This creates fragmented communication, unclear project status, and unnecessary follow-up work.

NEXUS provides a single, simple workspace where:

- Teams can manage project execution.
- Clients can see progress without asking for updates.
- Deliverables can be shared and reviewed.
- Clients can provide feedback and approve work.
- Project activity is visible through a timeline.
- Notifications keep stakeholders informed.
- Project health and risks are surfaced automatically.

### The difference

**NEXUS doesn't just show clients what's happening. It understands what's happening.**

---

## ✨ Features

### 🔐 Authentication & Roles

- Secure user authentication
- Service provider and client roles
- Role-aware project access
- Protected project data

### 📊 Project Dashboard

- Portfolio-level project overview
- Project progress tracking
- Completion metrics
- Upcoming and overdue projects
- Task and approval statistics
- Project deadlines

### 📋 Tasks & Milestones

- Create and manage project tasks
- Track task status
- Organize project milestones
- Monitor execution progress

### 📁 Files & Deliverables

- Upload and share project files
- Secure project file storage
- Deliverable tracking
- Draft → In Review → Approved workflow

### 💬 Feedback & Approvals

- Client feedback and comments
- Deliverable approval requests
- Approval status tracking
- Change-request workflow

### 🕒 Activity Timeline

- Chronological project activity
- Project, task, milestone, file, deliverable, feedback, approval, and risk events

### 🔔 Notifications

- Project-related notifications
- Unread notification tracking
- Mark individual notifications as read
- Mark all notifications as read

### 👥 Client View

- Dedicated client-facing project preview
- Simplified read-only project experience
- Visibility into project progress, work items, files, and deliverables

### 🔎 Project Search & Filtering

- Search projects by name, client, or description
- Filter project lists
- Quickly find relevant projects

### ❤️ Project Health Indicators

Projects are automatically classified using project status, progress, and deadlines:

- **Healthy**
- **On Track**
- **At Risk**
- **Overdue**

### 🤖 NEXUS Intelligence

The built-in intelligence layer analyzes authorized project context and provides:

- Project summary
- Project health score
- Health label
- Risk detection
- Risk factors
- Recommended next action
- Confidence indicator
- Client-ready project update

The current intelligence implementation is local and deterministic, so the MVP does not require a paid external AI API.

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      NEXUS Web App  │
                    │   Next.js + React    │
                    └──────────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
          Authentication              Application Logic
                 │                           │
                 └─────────────┬─────────────┘
                               │
                    ┌──────────▼──────────┐
                    │      Supabase       │
                    │ PostgreSQL + Auth   │
                    │      + Storage      │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ NEXUS Intelligence  │
                    │ Project Context     │
                    │ → Analysis          │
                    │ → Structured Result │
                    └─────────────────────┘
```

---

## 🛠️ Tech Stack

| Technology           | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| **Next.js**          | Full-stack React framework                       |
| **React**            | User interface                                   |
| **TypeScript**       | Type-safe application development                |
| **Tailwind CSS**     | Styling                                          |
| **shadcn/ui**        | UI components                                    |
| **Supabase**         | Authentication, PostgreSQL database, and storage |
| **PostgreSQL**       | Relational data storage                          |
| **Supabase Storage** | Private project file storage                     |
| **Vercel**           | Deployment platform                              |

---

## 📂 Main Project Areas

```text
NEXUS/
├── app/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── approvals/
│   │   ├── notifications/
│   │   ├── tasks/
│   │   ├── files/
│   │   ├── activity/
│   │   └── settings/
│   └── api/
├── components/
│   ├── app/
│   └── projects/
├── lib/
│   ├── ai/
│   └── supabase/
├── supabase/
│   └── migrations/
└── README.md
```

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

- Node.js 18+
- npm
- A Supabase project
- Git

### 1. Clone the repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd NEXUS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> Never commit `.env.local` or expose private credentials.

### 4. Set up Supabase

Run the SQL migrations located in:

```text
supabase/migrations/
```

Configure Supabase Authentication and Storage according to the project's database policies.

### 5. Start the development server

```bash
npm run dev -- --webpack
```

Open:

```text
http://localhost:3000
```

### 6. Validate the project

```bash
npm run lint
npm run build
```

---

## 🔒 Security

NEXUS uses Supabase Row Level Security (RLS) to restrict access to project data.

The application is designed around authorized project membership, role-aware actions, and private file storage.

Important security principles include:

- Users can only access projects they are authorized to access.
- Project files are stored in a private storage bucket.
- Signed URLs are used for accessing private files.
- Database access is protected with RLS policies.
- Environment secrets are kept outside source control.

---

## 🎯 Target Users

NEXUS is designed for:

- Freelancers
- Software development companies
- Digital marketing agencies
- Design studios
- Consultants
- Small businesses

---

## 💡 Hackathon Problem

Traditional client communication often becomes fragmented across:

- Email
- Messaging applications
- Spreadsheets
- Cloud storage
- Separate project-management tools

This makes it difficult for clients to understand project status and forces teams to spend time preparing updates and answering repeated questions.

NEXUS addresses this by creating a centralized, lightweight client portal with project intelligence built into the experience.

---

## 🧠 What Makes NEXUS Different?

Most lightweight client portals primarily **display project information**.

NEXUS adds an intelligence layer that interprets the available project context.

Instead of only showing:

> Progress: 62%

NEXUS can provide:

> **Project Health: At Risk**
> Progress is below the expected level while the deadline is approaching. Recommended action: review outstanding tasks and resolve blockers before the next client update.

This turns project data into actionable project insight.

---

## 🏆 Hackathon MVP

The MVP focuses on the core client portal workflow:

- User authentication
- Project creation and management
- Project progress dashboard
- Tasks and milestones
- File and deliverable sharing
- Client feedback
- Approval workflow
- Activity timeline
- Notifications
- Client view
- Project health indicators
- NEXUS Intelligence

---

## 🔮 Future Improvements

Potential future iterations include:

- Natural-language **Ask Your Project** assistant
- Persistent project memory
- AI-generated client reports
- Email and messaging integrations
- Calendar integration
- Advanced analytics
- Real-time collaboration
- Automated reminders
- More granular permission controls
- External AI provider integration for richer project reasoning

---

## 📸 Demo Flow

A recommended demonstration flow:

```text
Dashboard
   ↓
Projects
   ↓
Project Health
   ↓
Project Details
   ↓
Tasks & Milestones
   ↓
Files & Deliverables
   ↓
Client Feedback
   ↓
Approval
   ↓
Activity Timeline
   ↓
Notifications
   ↓
NEXUS Intelligence
   ↓
Client View
```

---

## 👨‍💻 Project

**NEXUS — Intelligent Client Project Portal**

Built as a hackathon MVP with a focus on:

**Simplicity · Transparency · Collaboration · Project Intelligence**

---

## 📄 License

This project was created as a hackathon project. Add your preferred open-source or project-specific license before public production use.
