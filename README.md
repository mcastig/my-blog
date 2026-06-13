# My Blog

A full-stack personal blog built with Next.js 16 App Router, featuring a markdown editor, category management, image uploads, threaded comments, dark/light mode, and a protected admin panel.

## Features

- **Public blog** — homepage, per-post pages, category filtering, full-text search
- **Threaded comments** — readers can comment on posts and reply to top-level comments; replies are nested under their parent with a left-border thread indicator
- **Category dropdown** — navbar dropdown lists all categories for quick navigation; replaces flat links on desktop
- **Admin panel** — create, edit, and delete posts with a live markdown preview editor
- **Categories** — create and manage categories with inline editing
- **Comment moderation** — view and delete all comments from the admin panel
- **Image uploads** — upload images directly from the post editor (stored in `public/uploads/`)
- **Dark/light/system mode** — persists to localStorage, no flash on load
- **Auth** — JWT stored in an `httpOnly` cookie; all `/admin` routes are proxy-guarded
- **Profile management** — update display name and change password from the admin nav

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** (CSS-first config in `globals.css`)
- **Drizzle ORM** + **Neon PostgreSQL**
- **Vitest** + **React Testing Library** (100% coverage)
- **Biome** for linting and formatting

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create `.env.local` in the project root:

```env
DATABASE_URL=your_neon_connection_string
JWT_SECRET=a_long_random_secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Set up the database

Push the schema to your Neon project:

```bash
npx drizzle-kit push
```

Then seed an admin user (replace the hash with one you generate):

```bash
node -e "const b = require('bcryptjs'); b.hash('your-password', 10).then(console.log)"
```

```sql
INSERT INTO admin_users (username, password_hash) VALUES ('admin', '<hash>');
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the blog and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at http://localhost:3000 |
| `npm run build` | Production build |
| `npm run lint` | Lint with Biome |
| `npm run format` | Auto-format with Biome |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

## Project Structure

```
src/
  app/
    (blog)/      public routes — homepage, post, category, search
    admin/       protected admin panel (posts, categories, comments, login)
    api/         REST endpoints — auth, posts, categories, comments, upload, search
  components/
    blog/        Header, Footer, PostCard, PostContent, SearchBar, MobileMenu,
                 ThemeToggle, CategoryDropdown, CommentSection
    admin/       AdminNav, PostForm, CategoryManager, DeletePostButton, ProfileMenu
    providers/   ThemeProvider
    ui/          ConfirmModal
  lib/
    auth.ts      JWT helpers and session reading
    db/          Drizzle instance and schema (posts, categories, admin_users, comments)
  proxy.ts       Route guard for /admin/*
```

## Deployment

The app is designed to deploy on [Vercel](https://vercel.com). Set the three environment variables in the Vercel project settings and connect to your Neon database.
