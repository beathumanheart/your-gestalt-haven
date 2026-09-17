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

**Testing**:
```bash
npm run test          # vitest unit tests (run once)
npm run test:watch    # vitest in watch mode
npm run test:e2e      # Playwright E2E (requires built app at :4173)
npm run test:all      # unit + E2E
```

## Architecture

**Stack**: React 18 + TypeScript + Vite + Supabase (PostgreSQL BaaS) + Tailwind CSS + shadcn/ui + React Query + React Router v6.

This is a therapy practice site ("Human Heart" / Gestalt therapy) with a public marketing site, bilingual (EN/RU) support, a client booking system, and an admin dashboard.

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

### Static page generation (SEO)
The app is client-rendered and deployed to GitHub Pages, which has no rewrite
rules. The deploy copies `index.html` to `404.html` so the SPA fallback renders
the right page — but the response status is still 404, and crawlers believe the
status, not the rendered pixels. For a long time every URL in the sitemap was
served as a 404, so only `/` was ever indexed.

`scripts/static-site/plugin.ts` (a Vite plugin, run on `vite build`) therefore
writes a real HTML file for every indexable route, in both languages, plus
`sitemap.xml`. Each file carries that route's own title, description, OG tags,
canonical and hreflang set. It is **not** prerendering — the body is still an
empty `#root` that boots the SPA — it is a fetchable document with an honest
head, which is the part that was missing.

- Route titles/descriptions live in `src/config/pageMetadata.ts` and nowhere
  else. `<PageMeta>` renders them at runtime and the build writes them into the
  files; if the two ever disagree, the indexed head stops matching the page.
  Add a route by adding it there.
- `scripts/static-site/render.ts` is pure (string in, string out) and throws if
  a tag it must replace is missing from `index.html`, so renaming a meta tag
  fails the build instead of silently shipping the homepage's head everywhere.
- Every path is checked against `FORBIDDEN_PATH_SEGMENTS` before anything is
  written: `/s/` and `/c/` slugs are capability tokens for video rooms, so
  writing a file at one would publish the room. See
  `src/__tests__/shortLinkIndexing.test.ts`.
- Routes with no generated file (`/admin`, `/s/`, `/c/`, hidden offers,
  `/booking-cancelled`) still fall through to the SPA via `404.html`, which is
  intended — they are all noindex or private.
- One file per route, written as `en/take.html`. GitHub Pages resolves the
  extensionless `/en/take` to it and serves it directly, so the sitemap URL is
  never a redirect. The directory form (`en/take/index.html`) was dropped
  because it is only reachable via a 301 from the canonical URL — measured on
  the #49 deploy, see issue #48. Consequence: there is no `/en/take/`, so
  `langPath()` must never emit a trailing slash.
- The site-wide JSON-LD is emitted per language: `scripts/static-site/jsonLd.ts`
  injects the English nodes into `index.html`, and `setJsonLd` in `render.ts`
  rewrites them in Russian for the `/ru` files. The EN output stays
  byte-identical to `index.html`. `jobTitle` differs between languages **by
  intent, not translation** — see the comment on `JOB_TITLE` in
  `src/config/identity.ts` before touching it.

### Guards and tests
Several tests exist to stop a specific mistake recurring rather than to check
a feature — sitemap tokens, draft copy, image weight, terminology, bundle
splitting. Four of them were once wrong in the same way: they asserted on an
artifact's presence rather than on behaviour, so they passed when the guarded
thing stopped existing. **Read `docs/writing-guards.md` before adding or
editing one.** The short version: make a guard fail before trusting it, and
"not found" is not a pass.

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

### PostHog Analytics
- Initialized in `src/main.tsx` with EU host (`eu.i.posthog.com`), `maskAllInputs: true`, `respect_dnt: true`
- All tracking functions exported from `src/hooks/useBookingAnalytics.ts` — use these, don't call `posthog.capture` directly
- 8 funnel events defined in `FUNNEL_STEPS` constant; booking form inputs carry `data-ph-no-capture`
- PostHog key set via `VITE_PUBLIC_POSTHOG_KEY` / `VITE_PUBLIC_POSTHOG_HOST` env vars

### Styling
- Custom design tokens in `src/index.css` (HSL CSS variables: sage, cream, terracotta, warm-gray)
- Custom fonts: Cormorant Garamond (display), Lora (body)
- Custom utility classes: `card-organic`, `btn-primary`, `container-narrow`
- Path alias: `@/*` → `src/*`
