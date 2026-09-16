/**
 * ============================================================
 * SITE-WIDE JSON-LD INJECTION
 * ============================================================
 * index.html carries two placeholder tokens where the Person and
 * ProfessionalService nodes belong. They are substituted at build time
 * rather than written into the file, so src/config/identity.ts stays the
 * only place these facts are stated.
 *
 * The nodes must be static in the served HTML — crawlers that do not run
 * JavaScript are exactly the ones that need them — which is why this is a
 * build step and not a component.
 *
 * Lives here, next to render.ts, because the two are halves of one
 * pipeline: this puts the English nodes into index.html, and render.ts
 * re-emits them per language for each generated file. Sharing the token
 * table means a test can build a realistic template the same way the
 * build does, instead of keeping its own copy of these strings.
 * ============================================================
 */

import { staticPersonNode, staticServiceNode } from "../../src/config/identity";

/**
 * English on purpose: index.html is what "/" serves, and "/" is the English
 * homepage. render.ts rewrites these per language for the /ru files.
 */
const JSONLD_TOKENS = {
  '"__JSONLD_PERSON__"': () => staticPersonNode("en"),
  '"__JSONLD_SERVICE__"': () => staticServiceNode("en"),
} as const;

/** Formatting shared with render.ts, so English pages match index.html byte for byte. */
export const formatJsonLd = (node: unknown): string => JSON.stringify(node, null, 2);

/**
 * Replaces both placeholder tokens, throwing if either is missing — a renamed
 * placeholder would otherwise ship a page with a quoted string where the
 * structured data should be.
 */
export const injectSiteJsonLd = (html: string): string =>
  Object.entries(JSONLD_TOKENS).reduce((acc, [token, build]) => {
    if (!acc.includes(token)) {
      throw new Error(
        `[static-site] ${token} not found in index.html — the JSON-LD placeholder was renamed or removed.`,
      );
    }
    return acc.replace(token, formatJsonLd(build()));
  }, html);
