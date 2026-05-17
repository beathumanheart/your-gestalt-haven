/**
 * Postbuild: generates dist/sitemap.xml with hreflang alternates.
 *
 * Routes included:
 *   - Homepage (EN + RU)
 *   - /book/:slug for each active session_type (EN + RU)
 *   - /offer-agreement (EN + RU, priority 0.3)
 *
 * Routes excluded:
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

const outPath = path.resolve("dist", "sitemap.xml");
fs.writeFileSync(outPath, xml, "utf8");
console.log(`[sitemap] Written ${outPath} (${entries.length / 2} route pairs)`);
