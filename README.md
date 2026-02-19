# 🔖 Smart Bookmark

A full-stack bookmark manager built with **Next.js 16**, **Supabase**, and **Tailwind CSS**. Features Google OAuth authentication, real-time sync across devices, and collection-based organization.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ECF8E?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss)

---

## ✨ Features

- **Google OAuth** — One-click sign in via Supabase Auth
- **Real-time Sync** — Bookmark and collection changes sync instantly via Supabase Realtime (Postgres Changes)
- **Collections** — Organize bookmarks into color-coded collections
- **Favorites** — Star bookmarks for quick access
- **Smart Metadata** — Auto-fetches title, description, and OG image when adding a URL
- **Search** — Filter bookmarks by title, URL, description, or tags
- **Tags** — Comma-separated tags per bookmark with validation
- **Optimistic UI** — Delete and favorite actions update instantly, with rollback on failure
- **Dark Theme** — Fully dark-themed UI with DM Sans typography
- **Loading States** — Skeleton-based loading for the dashboard and spinners on actions

---

## 🏗️ Architecture

```
smart-bookmark-app/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (font, Toaster, env validation)
│   ├── page.tsx                # Root redirect → /dashboard or /login
│   ├── login/page.tsx          # Login page (server-side auth check)
│   ├── dashboard/
│   │   ├── page.tsx            # Dashboard (SSR: fetch bookmarks + collections)
│   │   └── loading.tsx         # Skeleton loading UI (Suspense boundary)
│   ├── auth/callback/route.ts  # OAuth callback → exchange code for session
│   └── api/metadata/route.ts   # GET endpoint: scrape URL (currently manual entry only)
│
├── components/
│   ├── dashboard-shell.tsx     # Main client component (state, realtime)
│   ├── app-sidebar.tsx         # Sidebar: collections, favorites, user profile
│   ├── bookmark-card.tsx       # Individual bookmark card
│   ├── bookmark-grid.tsx       # Responsive grid of bookmark cards
│   ├── bookmark-header.tsx     # Search bar + "New" button
│   ├── bookmark-skeleton.tsx   # Skeleton placeholder card for loading
│   ├── add-bookmark-dialog.tsx # Dialog: add bookmark via service
│   ├── add-collection-dialog.tsx # Dialog: create collection via service
│   ├── edit-bookmark-dialog.tsx  # Dialog: edit existing bookmark via service
│   ├── login-form.tsx          # Google OAuth login button
│   └── ui/                     # shadcn/ui primitives (40+ components)
│
├── services/                   # Business Logic & Supabase Operations
│   ├── bookmark-service.ts     # CRUD for bookmarks (with favicon auto-discovery)
│   └── collection-service.ts   # CRUD for collections
│
├── hooks/
│   ├── use-bookmark-subscription.ts  # Realtime subscription for bookmarks
│   ├── use-collection-subscription.ts # Realtime subscription for collections
│   ├── use-mobile.tsx          # Mobile breakpoint detection
│   └── use-toast.ts            # Toast notifications hook
│
├── lib/
│   ├── env.ts                  # Zod-based env var validation
│   ├── types.ts                # TypeScript interfaces: Bookmark, Collection
│   ├── utils.ts                # cn() utility
│   ├── validation.ts           # Zod schemas for bookmark/collection forms
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       ├── server.ts           # Server Supabase client (cookie-based)
│       └── middleware.ts       # Session refresh + route protection
│
├── middleware.ts               # Next.js middleware (auth redirect logic)
└── scripts/
    └── 001_create_bookmarks.sql # Database migration: tables, RLS, realtime
```

---

## 🗄️ Database Schema

Two tables with Row-Level Security (RLS) — users can only access their own data.

| Table           | Key Columns                                                                                                                                | Notes                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------- |
| **collections** | `id`, `user_id`, `name`, `color`, `icon`                                                                                                   | Color-coded groups                 |
| **bookmarks**   | `id`, `user_id`, `collection_id` (FK → collections), `title`, `url`, `description`, `favicon_url`, `og_image_url`, `tags[]`, `is_favorite` | Tags stored as Postgres text array |

Both tables have RLS policies for `SELECT`, `INSERT`, `UPDATE`, `DELETE` scoped to `auth.uid() = user_id`. Realtime is enabled via `supabase_realtime` publication.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm
- A **Supabase** project ([create one free](https://supabase.com))

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd smart-bookmark-app
pnpm install
```

### 2. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Set Up Supabase

1. Go to your project's **SQL Editor** in the Supabase Dashboard.
2. Run the migration in `scripts/001_create_bookmarks.sql`.
3. Enable **Google OAuth** under **Authentication → Providers → Google**.
4. Set the redirect URL to `http://localhost:3000/auth/callback` (and your production URL later).

### 4. Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the login page.

---

## 🔐 Authentication Flow

```
User clicks "Continue with Google"
  → Supabase OAuth redirect to Google
  → Google grants consent
  → Redirect to /auth/callback
  → Exchange code for session (server-side)
  → Redirect to /dashboard
```

The **middleware** (`middleware.ts`) runs on every request to:

- Redirect unauthenticated users from `/dashboard` → `/login`
- Redirect authenticated users from `/login` → `/dashboard`
- Refresh the Supabase session cookie

---

## 🔄 Real-time Sync

The `useBookmarkSubscription` and `useCollectionSubscription` hooks subscribe to Postgres changes via Supabase Realtime channels, filtered by `user_id`. Changes from other tabs or devices appear instantly. Includes:

- Exponential backoff reconnection (up to 5 attempts)
- Error handling with user-visible toast notifications

---

## 📦 Deployment

### Vercel (Recommended)

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Update the Supabase redirect URL to include your production domain.
5. Deploy.

---

## 🛠️ Tech Stack

| Category        | Technology                        |
| --------------- | --------------------------------- |
| Framework       | Next.js 16 (App Router, React 19) |
| Database        | Supabase (Postgres + Realtime)    |
| Auth            | Supabase Auth (Google OAuth)      |
| Styling         | Tailwind CSS 4                    |
| UI Components   | shadcn/ui (Radix primitives)      |
| Forms           | React Hook Form + Zod             |
| Notifications   | Sonner                            |
| Language        | TypeScript 5.7                    |
| Package Manager | pnpm                              |

---

## 📝 License

MIT
