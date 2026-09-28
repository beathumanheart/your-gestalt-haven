/**
 * ============================================================
 * SIGN-UP FIELD AND MESSAGE STRINGS
 * ============================================================
 * The words every sign-up form on the site shares: the field, the button, and
 * what each outcome says.
 *
 * ⚠️ This module exists for a size reason as much as a tidiness one. The
 * footer renders on every page and is not lazy-loaded, so anything it imports
 * lands in the entry chunk. When the letter's form read these strings from
 * src/content/automaticYes.ts, Rollup pulled that module — 23 KB of worksheet
 * prose, Ferenczi and all — out of the worksheet's chunk and into the bundle
 * every visitor downloads before seeing the homepage. e2e/bundle-splitting
 * pins that it stays out.
 *
 * automaticYes.ts reads its own signup strings from here, so there is still
 * one copy of each sentence rather than two that can drift.
 * ============================================================
 */

export const signupMessages = {
  label: "Email",
  placeholder: "you@example.com",
  sending: "Sending…",
  subscribe: "Subscribe",

  /** The letter was accepted; Brevo's confirmation email decides the rest. */
  letterPending: "Thank you. Please confirm your address from the email that has just been sent.",

  invalid: "That address doesn’t look complete yet.",
  error: "Something went wrong on the way. Please try again in a minute.",
  rate_limited: "Too many attempts from here. Please wait a few minutes and try again.",
} as const;

/**
 * What useSignup needs to report every outcome. A form supplies these rather
 * than a whole page's content object, so a form on a page that is always
 * loaded does not drag that page's prose into the bundle.
 */
export interface SignupOutcomeMessages {
  /** PDF only. */
  done: string;
  /** PDF and letter together. */
  done_with_letter: string;
  /** Letter only. */
  letter_done: string;
  invalid: string;
  error: string;
  rate_limited: string;
}
