# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at localhost:8080
npm run build      # Production build to /dist
npm run build:dev  # Dev-mode build
npm run lint       # ESLint
npm run preview    # Preview production build
```

**Testing**: Vitest is installed and `vitest.config.ts` exists, but there is no `test` script in `package.json`. Test files: `src/pages/AdminLogin.test.tsx`, `src/pages/AdminDashboard.test.tsx`.

## Architecture

**Stack**: React 18 + TypeScript + Vite + Supabase (PostgreSQL BaaS) + Tailwind CSS + shadcn/ui + React Query + React Router v6.

This is a therapy practice site ("Human Heart Beat" / Gestalt therapy) with a public marketing site, bilingual (EN/RU) support, a client booking system, and an admin dashboard.

### Routing (`src/App.tsx`)
- `/` → English homepage
- `/:lang` → Language-prefixed routes (`/ru`, `/en`)
- `/admin/login` → Admin auth
- `/admin` → Protected admin dashboard
- `/:lang/offer-agreement` → Legal page

### Internationalization
All UI text lives in `src/content/*.ts` as paired export objects (`*EN` / `*RU`). Usage pattern throughout components:
```ts
const t = language === "ru" ? contentRU : contentEN;
```
Language context is provided via `src/contexts/LanguageContext.tsx` (`useLanguage()` hook), persisted in localStorage and driven by route param.

### Supabase Integration
- Client initialized in `src/integrations/supabase/client.ts`
- Auto-generated TypeScript types in `src/integrations/supabase/types.ts` — regenerate with `supabase gen types` after schema changes
- All data fetching via custom hooks in `src/hooks/` (React Query)
- Edge function at `supabase/functions/process-booking/` handles booking creation/cancellation, Jitsi JaaS video link generation, and email notifications
- DB migrations in `supabase/migrations/` (incremental SQL files)

### Database Tables
- `session_types` — Configurable therapy offerings (bilingual name/description, pricing, notification emails)
- `availability_rules` — Weekly recurring availability (day_of_week, time range, buffer_minutes)
- `availability_overrides` — Date-specific exceptions
- `bookings` — Client bookings (linked to session_type, status: confirmed/cancelled/completed)
- `profiles` / `user_roles` — Admin auth; roles checked via `has_role()` RPC function

### Key Architectural Patterns
- **RLS**: All tables have Row Level Security. Only admins can write availability/session types; bookings are publicly creatable.
- **Booking flow**: Multi-step widget (`src/components/booking/BookingWidget.tsx`) — session type → date/time → client details — calls `process-booking` Edge Function.
- **Admin dashboard** (`src/pages/AdminDashboard.tsx`): Tabbed UI using components in `src/components/admin/`.

### Styling
- Custom design tokens in `src/index.css` (HSL CSS variables: sage, cream, terracotta, warm-gray)
- Custom fonts: Cormorant Garamond (display), Lora (body)
- Custom utility classes: `card-organic`, `btn-primary`, `container-narrow`
- Path alias: `@/*` → `src/*`
