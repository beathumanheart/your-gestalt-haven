/**
 * ============================================================
 * SERVICE PAGE CONTENT
 * ============================================================
 * The chrome around one session type on /:lang/book/:slug — breadcrumb,
 * duration, and the terms line.
 *
 * The session's own name and description do **not** live here: they come from
 * the `session_types` row, so they can be edited in the admin dashboard
 * without a deploy. (They are prerendered, so a crawler reads whatever the
 * last build saw — see the prerendering note in CLAUDE.md.)
 *
 * ## The fuller "what this is for" prose
 *
 * Not here yet, and no placeholder stands in for it: the slot was removed at
 * Genia's request rather than left showing a note about itself. Each session
 * row carries roughly 400 characters of description, and that is all the page
 * says about the work until the longer prose is written.
 *
 * When it arrives: add it keyed by slug and render it in `BookSession.tsx`
 * between the description and the scale.
 * ============================================================
 */

export interface ServicePageContent {
  breadcrumbLabel: string;
  breadcrumbServices: string;
  minutes: string;
  notFound: string;
  termsLead: string;
  termsLinkText: string;
  termsTail: string;
}

export const servicePageEN: ServicePageContent = {
  breadcrumbLabel: "Breadcrumb",
  breadcrumbServices: "Services",
  minutes: "minutes",
  notFound: "Session not found.",
  termsLead: "The terms this work runs under are set out in the",
  termsLinkText: "offer agreement",
  termsTail: ".",
};

export const servicePageRU: ServicePageContent = {
  breadcrumbLabel: "Навигация",
  breadcrumbServices: "Услуги",
  minutes: "минут",
  notFound: "Сессия не найдена.",
  termsLead: "Условия, на которых ведётся эта работа, изложены в",
  termsLinkText: "договоре оферты",
  termsTail: ".",
};
