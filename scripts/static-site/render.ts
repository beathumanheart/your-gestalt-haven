/**
 * ============================================================
 * STATIC PAGE + SITEMAP RENDERING (pure)
 * ============================================================
 * Turns the built index.html into one real HTML file per indexable
 * route, and builds the sitemap that points at them.
 *
 * Why this exists: the site is a client-rendered SPA on GitHub Pages,
 * which has no rewrite rules. The deploy copies index.html to 404.html
 * so a reader at /en gets the right page — but the status line still
 * says 404, and Googlebot believes the status line, not the pixels.
 * Every URL in the sitemap was being served as a 404. Writing a real
 * file at each path is what makes the response a 200.
 *
 * No fs, no network, no Vite here on purpose — everything in this file
 * is a string in and a string out, so it can be tested directly.
 * ============================================================
 */

import {
  FORBIDDEN_PATH_SEGMENTS,
  OG_IMAGE_ALT,
  OG_LOCALE,
  SITE_URL,
  swapLang,
  type MetaLang,
  type RouteText,
} from "../../src/config/pageMetadata";
import {
  PERSON_ID,
  SERVICE_ID,
  staticPersonNode,
  staticServiceNode,
} from "../../src/config/identity";
import { formatJsonLd } from "./jsonLd";

export interface PageSpec {
  /** Full path including the language prefix, e.g. "/en/take". */
  canonicalPath: string;
  lang: MetaLang;
  text: RouteText;
}

export interface SitemapRoute {
  /** Path after the language prefix. "" is the homepage. */
  path: string;
  priority: string;
  changefreq: string;
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Replaces a tag that must appear exactly once, and throws if it doesn't.
 *
 * The alternative is a silent no-op: someone renames a meta tag in
 * index.html, every generated page keeps the homepage's description, and
 * nothing fails until months of indexing later. Same reasoning as the
 * placeholder check in the siteJsonLd plugin.
 */
const replaceOnce = (
  html: string,
  label: string,
  pattern: RegExp,
  replacer: (...groups: string[]) => string,
): string => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const count = (html.match(new RegExp(pattern.source, flags)) ?? []).length;

  if (count !== 1) {
    throw new Error(
      `[static-site] Expected exactly one ${label} in the built index.html, found ${count}. ` +
        `The template changed — update scripts/static-site/render.ts to match it.`,
    );
  }

  // A function replacer, so a "$" in a session name is never read as a
  // replacement pattern.
  return html.replace(pattern, (...args: unknown[]) => replacer(...(args as string[])));
};

/** Matches the content="" of one meta tag, tolerating any inter-attribute spacing. */
const metaPattern = (attr: "name" | "property", key: string) =>
  new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`);

const setMeta = (
  html: string,
  attr: "name" | "property",
  key: string,
  value: string,
): string =>
  replaceOnce(
    html,
    `<meta ${attr}="${key}">`,
    metaPattern(attr, key),
    (_match, open, close) => `${open}${escapeHtml(value)}${close}`,
  );

/**
 * Rewrites the two site-wide JSON-LD nodes in the language of the page.
 *
 * vite.config.ts injects the English nodes into index.html, which is what "/"
 * serves. Every generated file starts from that same head, so without this the
 * Russian pages would describe the practice in English prose.
 *
 * Blocks are identified by the @id inside them, not by their order in the
 * document: the two <script> tags are interchangeable to look at, and
 * swapping the Person and Service nodes would be invisible in review but
 * wrong in the graph.
 */
const JSONLD_BLOCK = /<script type="application\/ld\+json">[\s\S]*?<\/script>/g;

const setJsonLd = (html: string, lang: MetaLang): string => {
  const blocks = html.match(JSONLD_BLOCK) ?? [];

  if (blocks.length !== 2) {
    throw new Error(
      `[static-site] Expected exactly two JSON-LD blocks in the built index.html, ` +
        `found ${blocks.length}. The siteJsonLd plugin or index.html changed — ` +
        `update scripts/static-site/render.ts to match.`,
    );
  }

  const seen = new Set<string>();

  const rendered = html.replace(JSONLD_BLOCK, (block) => {
    const node = block.includes(PERSON_ID)
      ? staticPersonNode(lang)
      : block.includes(SERVICE_ID)
        ? staticServiceNode(lang)
        : null;

    if (!node) {
      throw new Error(
        `[static-site] A JSON-LD block in index.html carries neither ${PERSON_ID} ` +
          `nor ${SERVICE_ID}, so it cannot be localised. Add it to render.ts or ` +
          `give it an @id.`,
      );
    }

    seen.add(node["@id"]);
    // formatJsonLd is shared with the injection step, so the English pages
    // stay byte-identical to index.html and only the Russian ones differ.
    return `<script type="application/ld+json">${formatJsonLd(node)}</script>`;
  });

  if (seen.size !== 2) {
    throw new Error(
      `[static-site] Both JSON-LD blocks in index.html resolved to the same node ` +
        `(${[...seen].join(", ")}). One of them is a duplicate.`,
    );
  }

  return rendered;
};

/**
 * The canonical and hreflang set for one page.
 *
 * Mirrors what PageMeta emits at runtime, x-default included: it points at
 * English, the site's primary language. These are the tags that were already
 * correct in the app and still never reached an indexer, because they are
 * written by React and the document they belonged to was a 404.
 */
const alternateLinks = (canonicalPath: string, lang: MetaLang): string[] => {
  const selfUrl = `${SITE_URL}${canonicalPath}`;
  const altUrl = `${SITE_URL}${swapLang(canonicalPath, lang)}`;
  const otherLang: MetaLang = lang === "en" ? "ru" : "en";

  return [
    `<link rel="canonical" href="${selfUrl}" />`,
    `<link rel="alternate" hreflang="${lang}" href="${selfUrl}" />`,
    `<link rel="alternate" hreflang="${otherLang}" href="${altUrl}" />`,
    `<link rel="alternate" hreflang="x-default" href="${lang === "en" ? selfUrl : altUrl}" />`,
  ];
};

/**
 * Builds the served HTML for one route from the built index.html.
 *
 * The body is left exactly as it is: the same absolute /assets/ script tag
 * boots the same SPA, which then routes on the real path and renders the
 * page. This is not prerendering — there is no content in the file — it is a
 * fetchable document with an honest head, which is the part that was missing.
 */
export const renderRoutePage = (template: string, spec: PageSpec): string => {
  const { canonicalPath, lang, text } = spec;
  const isRu = lang === "ru";
  const title = isRu ? text.titleRu : text.titleEn;
  const description = isRu ? text.descriptionRu : text.descriptionEn;
  const ogImage = `${SITE_URL}/og-image-${lang}.png`;
  const otherLang: MetaLang = isRu ? "en" : "ru";

  let html = replaceOnce(
    template,
    "<html lang>",
    /(<html\s+lang=")[^"]*(")/,
    (_match, open, close) => `${open}${lang}${close}`,
  );

  html = replaceOnce(
    html,
    "<title>",
    /<title>[^<]*<\/title>/,
    () => `<title>${escapeHtml(title)}</title>`,
  );

  html = setMeta(html, "name", "description", description);

  html = setMeta(html, "property", "og:title", title);
  html = setMeta(html, "property", "og:description", description);
  html = setMeta(html, "property", "og:url", `${SITE_URL}${canonicalPath}`);
  html = setMeta(html, "property", "og:image", ogImage);
  html = setMeta(html, "property", "og:image:alt", OG_IMAGE_ALT[lang]);
  html = setMeta(html, "property", "og:locale", OG_LOCALE[lang]);
  html = setMeta(html, "property", "og:locale:alternate", OG_LOCALE[otherLang]);

  html = setMeta(html, "name", "twitter:title", title);
  html = setMeta(html, "name", "twitter:description", description);
  html = setMeta(html, "name", "twitter:image", ogImage);
  html = setMeta(html, "name", "twitter:image:alt", OG_IMAGE_ALT[lang]);

  html = setJsonLd(html, lang);

  const links = alternateLinks(canonicalPath, lang)
    .map((tag) => `    ${tag}`)
    .join("\n");

  // Matches the whitespace before </head> too, so the inserted block is not
  // pushed out by the indentation already on that line.
  return replaceOnce(
    html,
    "</head>",
    /\n\s*<\/head>/,
    () => `\n${links}\n  </head>`,
  );
};

// ── Sitemap ──────────────────────────────────────────────────────────────────

/**
 * One <url> per language, each carrying the full alternate set — including a
 * self-reference, which the spec requires.
 */
const urlEntry = (
  { path: urlPath, priority, changefreq }: SitemapRoute,
  lastmod: string,
): string => {
  const enUrl = `${SITE_URL}/en${urlPath}`;
  const ruUrl = `${SITE_URL}/ru${urlPath}`;

  return `
  <url>
    <loc>${enUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en"        href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ru"        href="${ruUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>
  <url>
    <loc>${ruUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en"        href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ru"        href="${ruUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>`.trimStart();
};

export const assertNoForbiddenPaths = (paths: string[]): void => {
  const offenders = paths.filter((candidate) =>
    candidate
      .split("/")
      .filter(Boolean)
      .some((segment) => FORBIDDEN_PATH_SEGMENTS.includes(segment)),
  );

  if (offenders.length > 0) {
    throw new Error(
      `[static-site] Refusing to publish capability-token or private URLs:\n  ${offenders.join("\n  ")}`,
    );
  }
};

export const renderSitemap = (routes: readonly SitemapRoute[], lastmod: string): string => {
  const entries = routes.map((route) => urlEntry(route, lastmod));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join("\n")}
</urlset>
`;

  assertNoForbiddenPaths([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname));

  return xml;
};
