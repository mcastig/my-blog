# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev             # start dev server at http://localhost:3000
npm run build           # production build
npm run lint            # check with Biome
npm run format          # auto-format with Biome
npm test                # run tests once
npm run test:watch      # run tests in watch mode
npm run test:coverage   # run tests with v8 coverage report
```

Test stack: **Vitest** + **React Testing Library** + **jsdom**. Coverage target is 100% (statements, branches, functions, lines). Test files live alongside their components as `ComponentName.test.tsx`.

## Stack

- **Next.js 16** App Router — proxy (middleware) file is `src/proxy.ts` with `export async function proxy(...)`, **not** `middleware.ts`/`middleware`
- **React 19**
- **Tailwind CSS v4** — config is CSS-first in `globals.css` via `@theme {}` and `@variant dark`; no `tailwind.config.js`
- **Drizzle ORM** + **Neon PostgreSQL** (`@neondatabase/serverless`)
- **`jose`** for JWT · **`bcryptjs`** for password hashing
- **Custom `ThemeProvider`** (`src/components/providers/ThemeProvider/ThemeProvider.tsx`) for dark/light/system mode — wraps the root layout, HTML element needs `suppressHydrationWarning`
- **`react-markdown`** + `remark-gfm` + `rehype-highlight` for rendering post content
- **`date-fns`** for formatting · **`slugify`** for slug generation

## Architecture

```
src/
  app/
    (blog)/          ← public routes (homepage, post, category, search)
    admin/           ← protected by src/proxy.ts; login at /admin/login
    api/             ← REST handlers (auth, posts CRUD, upload, categories, search, comments)
  components/
    blog/            ← Header (async Server Component), Footer, PostCard, PostContent,
    |                   SearchBar, MobileMenu, ThemeToggle, CategoryDropdown, CommentSection
    admin/           ← AdminNav, PostForm (markdown editor + preview), CategoryManager,
    |                   DeletePostButton, ProfileMenu
    providers/       ← ThemeProvider (custom dark/light/system implementation)
    ui/              ← ConfirmModal (shared confirmation dialog)
  lib/
    auth.ts          ← signToken / verifyToken / getSession (cookie: blog_token)
    db/
      index.ts       ← drizzle(neon(...)) instance
      schema.ts      ← posts, categories, admin_users, comments tables + Drizzle relations
  proxy.ts           ← route guard — redirects unauthenticated /admin/* to /admin/login
```

### Key patterns

- **Auth**: JWT stored in `httpOnly` cookie (`blog_token`). `getSession()` reads it server-side. The proxy checks it before any `/admin` route.
- **Post editor** (`PostForm.tsx`): client component with a markdown textarea + live preview toggle. Calls `/api/posts` (POST) or `/api/posts/[id]` (PUT). Images uploaded via `/api/upload` → saved in `public/uploads/`.
- **Dark mode**: `globals.css` defines CSS custom properties under `:root` and `.dark {}`. Tailwind `@variant dark` maps to `.dark *` so all `dark:` utilities work. Do **not** use `@media (prefers-color-scheme)` — the custom `ThemeProvider` manages this by toggling the `.dark` class on `<html>`.
- **Revalidation**: public blog pages use `export const revalidate = 60`.
- **Comments & replies**: `CommentSection` is a client component rendered at the bottom of each post. Comments are stored flat with a nullable `parentCommentId` self-reference (cascade delete). `GET /api/comments?postId=X` returns all approved comments in ASC order; the client groups them into top-level + threaded replies. `POST /api/comments` accepts an optional `parentCommentId`; the API validates the parent belongs to the same post.
- **Category dropdown**: `CategoryDropdown` is a client component in the desktop navbar (left of search). It receives categories from the `Header` server component. Closes on outside click, Escape, and route change.

## Database

Neon project: `bold-meadow-25623294` (aws-us-west-2).  
Tables: `categories`, `posts`, `admin_users`, `comments`.  
Connection string is in `.env.local` (`DATABASE_URL`).

### Change the admin password

```bash
node -e "const b = require('bcryptjs'); b.hash('your-new-password', 10).then(console.log)"
# then run in Neon console:
# UPDATE admin_users SET password_hash = '<hash>' WHERE username = 'admin';
```

Default credentials: `admin` / `admin123` — **change before deploying**.

## Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `NEXT_PUBLIC_BASE_URL` | Public URL of the site |
