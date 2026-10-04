/**
 * ============================================================
 * SERVICE PAGE CONTENT
 * ============================================================
 * The chrome around one session type on /:lang/book/:slug — breadcrumb,
 * duration, the terms line, and the heading of the "what this is for"
 * section.
 *
 * The session's own name and description do **not** live here: they come from
 * the `session_types` row, so they can be edited in the admin dashboard
 * without a deploy. (They are prerendered, so a crawler reads whatever the
 * last build saw — see the prerendering note in CLAUDE.md.)
 *
 * ## The pending slot
 *
 * `whatThisIsForPending` is a visible placeholder, not an empty div, and that
 * is the point. Each session row carries roughly 400 characters of
 * description; the section wants two or three hundred words per session type
 * on what happens in one, who it suits, and what the first one is like.
 * Until that exists this change makes six pages shorter rather than better,
 * which is the opposite of what the indexing work was for — so the gap states
 * itself rather than hiding.
 *
 * When the prose arrives: add it keyed by slug and render it in
 * `BookSession.tsx` in place of the placeholder.
 * ============================================================
 */

export interface ServicePageContent {
  breadcrumbLabel: string;
  breadcrumbServices: string;
  minutes: string;
  notFound: string;
  whatThisIsForHeading: string;
  /** Shown until the fuller prose is written. Visible on purpose. */
  whatThisIsForPending: string;
  termsLead: string;
  termsLinkText: string;
  termsTail: string;
}

export const servicePageEN: ServicePageContent = {
  breadcrumbLabel: "Breadcrumb",
  breadcrumbServices: "Services",
  minutes: "minutes",
  notFound: "Session not found.",
  whatThisIsForHeading: "What this is for",
  whatThisIsForPending:
    "A fuller account of this work is being written — what happens in a session, who it tends " +
    "to suit, and what the first one is like. Until then, write to me and ask: I would rather " +
    "answer your question than guess at it here.",
  termsLead: "The terms this work runs under are set out in the",
  termsLinkText: "offer agreement",
  termsTail: ".",
};

export const servicePageRU: ServicePageContent = {
  breadcrumbLabel: "Навигация",
  breadcrumbServices: "Услуги",
  minutes: "минут",
  notFound: "Сессия не найдена.",
  whatThisIsForHeading: "Для чего это",
  whatThisIsForPending:
    "Более подробный рассказ об этой работе пока готовится — что происходит на сессии, кому " +
    "она обычно подходит и как проходит первая встреча. А пока просто напишите мне и " +
    "спросите: я лучше отвечу на ваш вопрос, чем буду угадывать его здесь.",
  termsLead: "Условия, на которых ведётся эта работа, изложены в",
  termsLinkText: "договоре оферты",
  termsTail: ".",
};
