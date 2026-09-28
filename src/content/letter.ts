/**
 * ============================================================
 * THE MONTHLY LETTER — EVERY STRING, IN ONE PLACE
 * ============================================================
 * Shared by the three places the letter can be subscribed to: the footer
 * modal, the page at /en/letter, and the block at the foot of the worksheet.
 *
 * English only, like the worksheet. A Russian letter would need its own Brevo
 * list and its own double opt-in template, and neither exists — so /ru/letter
 * redirects here rather than offering a form that would subscribe someone to
 * an English one.
 *
 * `byline` is written out rather than assembled from src/content/about.ts:
 * that file carries paragraphs of prose, not a line that says who writes this
 * in one breath. "Gestalt Counsellor" is the approved form — see
 * docs/terminology.md before changing it.
 * ============================================================
 */

export interface LetterContent {
  kicker: string;
  title: string;
  lead: string;

  /** Three short rows on the page: what it is, how often, how to leave. */
  what: string;
  when: string;
  leave: string;

  confirmNote: string;
  privacy: string;
  /** Modal only — the page it points at is the page you are already on. */
  moreLink: string;

  confirmedTitle: string;
  confirmedBody: string;

  modalClose: string;
  footerLink: string;

  byline: string;
}

export const letterEN: LetterContent = {
  kicker: "From Human Heart",
  title: "The monthly letter",
  lead: "One longer piece a month, on feelings and relationships.",

  what: "Not a newsletter about the practice. One piece of writing, the kind that takes a while to read — on something worth sitting with.",
  when: "Once a month. Some months it arrives late.",
  leave: "Every letter carries a link to leave, and leaving takes one click.",

  confirmNote:
    "You'll get one email asking you to confirm this address. Nothing is sent until you do.",
  privacy: "Privacy notice",
  moreLink: "More about the letter",

  confirmedTitle: "You're on the list",
  confirmedBody: "The next letter will arrive at the end of the month.",

  modalClose: "Close",
  footerLink: "The monthly letter",

  byline:
    "Written by Genia, a Gestalt Counsellor working online in English and Russian.",
};
