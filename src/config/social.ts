/**
 * ============================================================
 * SOCIAL HANDLES — SINGLE SOURCE OF TRUTH
 * ============================================================
 * Every social link on the site derives from this file: the footer
 * icons, and the JSON-LD `sameAs` array injected into index.html at
 * build time (see the socialSameAs plugin in vite.config.ts).
 *
 * To change a handle, edit HANDLES below and nothing else. Do not
 * hardcode a profile URL in a component or in a content/*.ts string.
 * ============================================================
 */

/**
 * Bare handles, without the leading "@".
 *
 * Deliberately separate values rather than one shared name: the accounts do
 * not use identical handles, and past renames have not moved them in lockstep.
 *
 * Instagram and Substack were here and are gone — the letter runs from Brevo
 * now, and neither is linked from the site. Nothing here is a claim that an
 * account does not exist; it is the list the site points at.
 */
export const HANDLES = {
  youtube: "beathumanheart",
  telegram: "humanheartbeat",
} as const;

/** Full profile URLs, built from the handles above. */
export const SOCIAL_URLS = {
  youtube: `https://www.youtube.com/@${HANDLES.youtube}`,
  telegram: `https://t.me/${HANDLES.telegram}`,
} as const;

export type SocialPlatform = keyof typeof SOCIAL_URLS;

/**
 * Profiles advertised to search engines via schema.org `sameAs`.
 * Telegram is a contact channel rather than a public profile, so it is
 * intentionally left out.
 */
export const SAME_AS: readonly string[] = [SOCIAL_URLS.youtube];

/** Display form of a handle, prefixed with "@" — for use in copy. */
export const displayHandle = (platform: keyof typeof HANDLES): string =>
  `@${HANDLES[platform]}`;
