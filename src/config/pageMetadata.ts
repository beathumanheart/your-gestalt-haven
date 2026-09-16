/**
 * ============================================================
 * PAGE METADATA — ONE SOURCE FOR RUNTIME AND BUILD
 * ============================================================
 * Title and description for every indexable route live here, because
 * two different things need them and they must never disagree:
 *
 *   - <PageMeta> writes them into the DOM after the app hydrates.
 *     That is what a reader sees, and what a crawler sees if it gets
 *     as far as running the JavaScript.
 *   - The static-page build step writes them into the HTML file the
 *     host serves. That is what a crawler reads *before* it decides
 *     whether to render anything at all.
 *
 * If those two drift, the head that gets indexed stops matching the
 * page that gets read, and nothing in the build would notice.
 *
 * Relative imports only: vite.config.ts pulls this module into the
 * build to generate those files, and esbuild resolves it without
 * Vite's "@/" alias — the same constraint ./identity carries.
 * ============================================================
 */

import { SITE_URL } from "./identity";

export { SITE_URL };

export type MetaLang = "en" | "ru";

/** English first: it is the default language and the x-default target. */
export const LANGS: readonly MetaLang[] = ["en", "ru"] as const;

/** Title and description for one route, in both languages. */
export interface RouteText {
  titleEn: string;
  titleRu: string;
  descriptionEn: string;
  descriptionRu: string;
}

/** A route that gets its own file on disk and its own sitemap entry. */
export interface StaticRoute extends RouteText {
  /** Path *after* the language prefix. "" is the homepage. */
  path: string;
  priority: string;
  changefreq: string;
}

export const OG_IMAGE_ALT: Record<MetaLang, string> = {
  en: "Genia — Gestalt counsellor",
  ru: "Женя — психолог-консультант",
};

export const OG_LOCALE: Record<MetaLang, string> = {
  en: "en_US",
  ru: "ru_RU",
};

// ── Route text ───────────────────────────────────────────────────────────────

/**
 * The homepage text, and the fallback for any page that does not set its own.
 */
export const HOME_TEXT: RouteText = {
  titleEn: "Genia | Counselling & Accompaniment",
  titleRu: "Genia | Психолог-консультант",
  descriptionEn:
    "A warm, compassionate space for therapy. I offer short-term and long-term Gestalt counselling for grief, relationships, and life's existential questions.",
  descriptionRu:
    "Тёплое пространство для терапии. Краткосрочное и долгосрочное гештальт-консультирование — горе, отношения, экзистенциальные вопросы.",
};

export const TAKE_TEXT: RouteText = {
  titleEn: "Take with you — free material | Human Heart",
  titleRu: "С собой — бесплатные материалы | Human Heart",
  descriptionEn:
    "Free material, here if it is useful to you. No session, no account, nothing to sign up for.",
  descriptionRu:
    "Бесплатные материалы. Что-то может пригодиться, что-то нет. Ни сессии, ни регистрации не нужно.",
};

export const FEELINGS_MAP_TEXT: RouteText = {
  titleEn: "What is going on with me — a map of feelings | Human Heart",
  titleRu: "Что со мной происходит — карта чувств | Human Heart",
  descriptionEn:
    "A free interactive map of feelings in six rings: land in the present, find the felt sense, name the feeling, tell it from the one underneath, and reach the need it points at.",
  descriptionRu:
    "Бесплатная интерактивная карта чувств из шести колец: заземлиться в настоящем, найти телесное ощущение, назвать чувство, отличить его от того, что под ним, и дойти до потребности.",
};

export const OFFER_AGREEMENT_TEXT: RouteText = {
  titleEn: "Offer Agreement | Human Heart",
  titleRu: "Договор оферты | Human Heart",
  descriptionEn:
    "Terms and conditions for therapy sessions at Human Heart — Gestalt counselling with Genia.",
  descriptionRu:
    "Условия оказания терапевтических услуг на Human Heart — гештальт-консультирование с Женей.",
};

/**
 * Routes whose text is known at build time.
 *
 * Deliberately absent:
 *   - /feeling — redirects to /take/feelings-map, so it has nothing to index.
 *   - /take/* items not written yet — they render a noindex placeholder.
 *   - /s/:slug, /c/:slug — capability tokens, see FORBIDDEN_PATH_SEGMENTS.
 *   - /book/offer/:slug — hidden offers, unlisted by design.
 *   - /booking-cancelled — noindex transactional page.
 *   - /admin/* — not public.
 *
 * Booking pages are not here either: their text comes from the database
 * row, via bookingRouteText below.
 */
export const STATIC_ROUTES: readonly StaticRoute[] = [
  { path: "", priority: "1.0", changefreq: "monthly", ...HOME_TEXT },
  { path: "/take", priority: "0.7", changefreq: "monthly", ...TAKE_TEXT },
  { path: "/take/feelings-map", priority: "0.7", changefreq: "monthly", ...FEELINGS_MAP_TEXT },
  { path: "/offer-agreement", priority: "0.3", changefreq: "yearly", ...OFFER_AGREEMENT_TEXT },
] as const;

// ── Booking pages ────────────────────────────────────────────────────────────

/** Sitemap weighting for a /book/:slug page. */
export const BOOKING_PRIORITY = "0.8";
export const BOOKING_CHANGEFREQ = "weekly";

/** The columns of a session_types row that the page head is built from. */
export interface BookingMetaSource {
  name: string;
  name_ru?: string | null;
  description?: string | null;
  description_ru?: string | null;
}

/**
 * Google truncates well before this; the limit is here so a long session
 * description cannot push the whole first paragraph into the head.
 */
const DESCRIPTION_MAX = 155;

const clamp = (text: string) =>
  text.slice(0, DESCRIPTION_MAX).trimEnd() + (text.length > DESCRIPTION_MAX ? "…" : "");

/**
 * Head text for a booking page. Falls back per field, not per row: a session
 * with a name but no description still gets its own title.
 */
export const bookingRouteText = (session: BookingMetaSource | null | undefined): RouteText => {
  const russianDescription = session?.description_ru || session?.description || "";

  return {
    titleEn: session
      ? `${session.name} — Book with Genia | Human Heart`
      : "Book a session — Human Heart",
    titleRu: session
      ? `${session.name_ru || session.name} — Записаться к Жене | Human Heart`
      : "Записаться на сессию — Human Heart",
    descriptionEn: session?.description
      ? clamp(session.description)
      : "Book a therapy session with Genia.",
    descriptionRu: russianDescription
      ? clamp(russianDescription)
      : "Запись на терапевтическую сессию с Genia.",
  };
};

// ── Shared helpers ───────────────────────────────────────────────────────────

/** Given "/en/book/foo", returns "/ru/book/foo" and vice-versa. */
export const swapLang = (path: string, from: MetaLang): string => {
  const to: MetaLang = from === "en" ? "ru" : "en";
  if (path.startsWith(`/${from}/`)) return `/${to}/${path.slice(from.length + 2)}`;
  if (path === `/${from}`) return `/${to}`;
  return path;
};

/**
 * Path segments that must never reach a sitemap or a generated page, whatever
 * this module grows into.
 *
 * "s" and "c" are the short session links (/s/<slug>, /c/<slug>). The slug is
 * the only secret guarding a therapy session's video room — publishing one in
 * a sitemap would hand it to every crawler that reads the file, and writing it
 * to a file in dist would publish the room itself. Nothing here can produce
 * these today; this is a tripwire for whoever changes that assumption.
 *
 * Matched as a whole segment anywhere in the path, not as a prefix: the
 * generator prepends /en and /ru, so an offending route shows up as
 * /en/s/<slug>.
 */
export const FORBIDDEN_PATH_SEGMENTS = ["s", "c", "admin"];
