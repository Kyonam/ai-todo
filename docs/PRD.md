# PRD (Product Requirements Document) - AI-Powered To-Do Service

## 1. Project Overview
A smart task management system that uses AI to structure natural language inputs and provides analytical summaries of user productivity.

## 2. Technical Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Shadcn/ui
- **Backend/Database**: Supabase (Auth, PostgreSQL, RLS)
- **AI SDK**: Google Gemini API
- **State Management**: TanStack Query (React Query)

## 3. Core Features
### 3.1 Authentication
- Email/Password sign-up and login via Supabase Auth.
- Protected routes and Row Level Security (RLS) for data privacy.

### 3.2 Task Management (CRUD)
- Fields: `title`, `description`, `created_date`, `due_date`, `priority`, `category`, `completed`.
- Full support for creating, reading, updating, and deleting tasks.

### 3.3 Search, Filter, and Sort
- **Search**: Keyword search across titles and descriptions.
- **Filter**: By Priority (High/Mid/Low), Category, and Status (In-progress, Completed, Overdue).
- **Sort**: By Due Date, Priority, or Creation Date.

### 3.4 AI Integration
- **Natural Language Input**: Converts phrases like "Meeting tomorrow at 10 AM" into structured task objects.
- **Summary & Analytics**: 
    - Daily Briefing: Summary of today's achievements.
    - Weekly Report: Completion rate and category-wise analysis.

## 4. Data Structure (Supabase)
### `todos` table
| Column | Type | Description |
| :--- | :--- | :--- |
| id | uuid (PK) | Unique identifier |
| user_id | uuid (FK) | Reference to auth.users |
| title | text | Task title |
| description | text | Task details |
| priority | enum | high, medium, low |
| category | text[] | List of categories |
| due_date | timestamp | Deadline |
| completed | boolean | Status |
| created_at | timestamp | Auto-generated timestamp |

## 5. UI/UX Plan
- **Login/Signup Page**: Simple and secure access.
- **Main Dashboard**: 
    - AI prompt bar at the top.
    - Task list with filtering/sorting controls.
    - Sidebar for navigation and quick statistics.
- **Analytics View**: Visual charts showing productivity trends (Weekly/Monthly).
