/**
 * ============================================================
 * GET IN TOUCH — THE INVITATION TO WRITE
 * ============================================================
 * The copy for <GetInTouch />, which stands where the booking wizard used to
 * and is the only way to begin while BOOKING_ENABLED is false.
 *
 * Two contact points, shown as text: the email address, and Telegram. There
 * is deliberately **no form**. The point of taking the calendar off the site
 * is that a person writes in their own words from their own mail — replacing
 * a big widget with a small one would miss it entirely.
 *
 * The channel order flips by language, and that is not a translation detail:
 * this audience is already on Telegram in Russian and already on email in
 * English, so each language leads with the one its readers actually use. The
 * order is expressed by `channels` below rather than by two copies of the
 * markup, so the components cannot drift from the decision.
 *
 * Telegram is a doorbell, not a consulting room. Its ordinary chats are not
 * end-to-end encrypted, so clinical content belongs in email — and the copy
 * says so by inviting the reader to continue there, without explaining
 * cryptography to anyone who did not ask.
 *
 * The spam line is an honest patch over a real deliverability problem, not a
 * fix. The clients it costs are the ones who never think to look in the junk
 * folder; the mail route is still outstanding.
 * ============================================================
 */

import { SOCIAL_URLS } from "@/config/social";

/** The one address the site publishes. */
export const CONTACT_EMAIL = "be@humanheart.life";

/**
 * Which channel is offered first.
 *
 * DOM order, not styling — a reader on a screen reader or a narrow phone gets
 * the same ordering a sighted reader does, and `getInTouch.test.tsx` asserts
 * on the order rather than on mere presence.
 */
export type ContactChannel = "email" | "telegram";

export interface GetInTouchContent {
  heading: string;
  /** The invitation itself: write, and what is useful to say. */
  invitation: string;
  /** Reply time, and the spam-folder warning that comes with it. */
  replyTime: string;
  /** Accessible name for the copy button — a button labelled by an icon is not labelled. */
  copyLabel: string;
  /** Confirmation after a copy. Rendered as words, so it does not depend on colour. */
  copiedLabel: string;
  /** Shown when the clipboard is unavailable or refused, so the click is never silent. */
  copyFailedLabel: string;
  /** The word that carries the Telegram link. */
  telegramLabel: string;
  /** What Telegram is good for, and where to go instead. Prose, around the link. */
  telegramNote: string;
  telegramUrl: string;
  /** Email first in English, Telegram first in Russian. */
  channels: readonly [ContactChannel, ContactChannel];
}

export const getInTouchEN: GetInTouchContent = {
  heading: "How to begin",
  invitation:
    "Write to me. A few lines about what brings you is plenty. If you'd like to begin soon, " +
    "suggest three times that would suit you — dates and your time zone — and I'll check them " +
    "against my diary.",
  replyTime:
    "I reply within two working days. Check your spam folder too — my mail provider is " +
    "privacy-focused, which some of the big ones hold against it.",
  copyLabel: "Copy email address",
  copiedLabel: "Copied",
  copyFailedLabel: "Press ⌘C to copy",
  telegramLabel: "Telegram",
  telegramNote: " — good for a first hello; anything longer, let's continue by email.",
  telegramUrl: SOCIAL_URLS.telegram,
  channels: ["email", "telegram"],
};

export const getInTouchRU: GetInTouchContent = {
  heading: "Как начать",
  invitation:
    "Просто напишите мне — нескольких строк о том, что вас привело, будет достаточно. " +
    "Если хотите начать в ближайшее время, предложите три удобных для вас варианта — " +
    "даты, время и ваш часовой пояс, — и я сверюсь со своим расписанием.",
  replyTime:
    "Я отвечаю в течение двух рабочих дней. Загляните, пожалуйста, и в папку «Спам»: " +
    "мой почтовый сервис дорожит приватностью, и большие почтовые системы иногда ему " +
    "этого не прощают.",
  copyLabel: "Скопировать адрес почты",
  copiedLabel: "Скопировано",
  copyFailedLabel: "Нажмите ⌘C, чтобы скопировать",
  telegramLabel: "Telegram",
  telegramNote:
    " — удобно поздороваться и задать короткий вопрос. Всё, что длиннее, предлагаю " +
    "продолжить по почте.",
  telegramUrl: SOCIAL_URLS.telegram,
  channels: ["telegram", "email"],
};
