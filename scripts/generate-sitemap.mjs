/**
 * Postbuild: generates dist/sitemap.xml with hreflang alternates.
 *
 * Routes included:
 *   - Homepage (EN + RU)
 *   - /book/:slug for each active session_type (EN + RU)
 *   - /offer-agreement (EN + RU, priority 0.3)
 *
 * Routes excluded:
 *   - /s/:slug and /c/:slug (short session links — capability tokens, see below)
 *   - /book/offer/:slug (hidden offers — unlisted by design)
 *   - /booking-cancelled (noindex transactional page)
 *   - /admin/* (not public)
 *   - 404 catch-all
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = "https://humanheart.life";
const LANGS = ["en", "ru"];
const TODAY = new Date().toISOString().slice(0, 10);

/**
 * Path segments that must never reach a sitemap, whatever this script grows into.
 *
 * "s" and "c" are the short session links (/s/<slug>, /c/<slug>). The slug is
 * the only secret guarding a therapy session's video room — publishing one in a
 * sitemap would hand it to every crawler that reads the file. The generator has
 * no way to produce these today (it emits a fixed allowlist), so this is a
 * tripwire for whoever changes that assumption.
 *
 * Matched as a whole segment anywhere in the path, not as a prefix: urlEntry()
 * prepends /en and /ru, so an offending route shows up as /en/s/<slug>.
 */
const FORBIDDEN_PATH_SEGMENTS = ["s", "c", "admin"];

function assertNoForbiddenLocs(xml) {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const offenders = locs.filter((loc) => {
    const segments = new URL(loc).pathname.split("/").filter(Boolean);
    return segments.some((segment) => FORBIDDEN_PATH_SEGMENTS.includes(segment));
  });

  if (offenders.length > 0) {
    throw new Error(
      `[sitemap] Refusing to write a sitemap containing capability-token or ` +
        `private URLs:\n  ${offenders.join("\n  ")}`
    );
  }
}

// ── Supabase session-type slugs ───────────────────────────────────────────────
async function fetchSessionSlugs() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[sitemap] SUPABASE_URL / SUPABASE_ANON_KEY not set — session-type pages will be omitted from sitemap."
    );
    return [];
  }

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("session_types")
    .select("slug")
    .eq("is_active", true);

  if (error) {
    console.warn("[sitemap] Could not fetch session_types:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.slug).filter(Boolean);
}

// ── URL set builder ───────────────────────────────────────────────────────────
function urlEntry({ path: urlPath, priority = "0.7", changefreq = "weekly" }) {
  const enUrl = `${SITE_URL}/en${urlPath}`;
  const ruUrl = `${SITE_URL}/ru${urlPath}`;

  return `
  <url>
    <loc>${enUrl}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en"        href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ru"        href="${ruUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>
  <url>
    <loc>${ruUrl}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en"        href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="ru"        href="${ruUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}" />
  </url>`.trimStart();
}

// ── Main ──────────────────────────────────────────────────────────────────────
const sessionSlugs = await fetchSessionSlugs();

const entries = [
  // Homepage — highest priority
  urlEntry({ path: "", priority: "1.0", changefreq: "monthly" }),

  // Public session-type booking pages
  ...sessionSlugs.map((slug) =>
    urlEntry({ path: `/book/${slug}`, priority: "0.8", changefreq: "weekly" })
  ),

  // Free interactive tools
  urlEntry({ path: "/feeling", priority: "0.7", changefreq: "monthly" }),

  // Legal / informational
  urlEntry({ path: "/offer-agreement", priority: "0.3", changefreq: "yearly" }),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${entries.join("\n")}
</urlset>
`;

assertNoForbiddenLocs(xml);

const outPath = path.resolve("dist", "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf8");
// Each entry already emits an EN and a RU <url>, so it is one pair.
console.log(`[sitemap] Written ${outPath} (${entries.length} route pairs)`);
