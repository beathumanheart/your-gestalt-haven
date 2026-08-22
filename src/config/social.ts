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
 * Note these are deliberately separate values rather than one shared
 * name: the accounts do not use identical handles (Instagram carries a
 * dot, YouTube uses a different word order), and past renames have not
 * moved them in lockstep.
 */
export const HANDLES = {
  instagram: "human.heartbeat",
  youtube: "beathumanheart",
  telegram: "humanheartbeat",
  substack: "humanheartbeat",
} as const;

/** Full profile URLs, built from the handles above. */
export const SOCIAL_URLS = {
  instagram: `https://www.instagram.com/${HANDLES.instagram}`,
  youtube: `https://www.youtube.com/@${HANDLES.youtube}`,
  telegram: `https://t.me/${HANDLES.telegram}`,
  substack: `https://${HANDLES.substack}.substack.com/`,
} as const;

export type SocialPlatform = keyof typeof SOCIAL_URLS;

/**
 * Profiles advertised to search engines via schema.org `sameAs`.
 * Telegram is a contact channel rather than a public profile, so it is
 * intentionally left out.
 */
export const SAME_AS: readonly string[] = [
  SOCIAL_URLS.instagram,
  SOCIAL_URLS.youtube,
  SOCIAL_URLS.substack,
];

/** Display form of a handle, prefixed with "@" — for use in copy. */
export const displayHandle = (platform: keyof typeof HANDLES): string =>
  `@${HANDLES[platform]}`;
