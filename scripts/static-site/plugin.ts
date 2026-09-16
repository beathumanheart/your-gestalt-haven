/**
 * ============================================================
 * STATIC PAGE + SITEMAP BUILD STEP
 * ============================================================
 * Runs after the bundle is written and emits, for every indexable
 * route, a real HTML file at the route's own path — so the host
 * answers 200 instead of falling through to 404.html.
 *
 * This is a Vite plugin rather than a postbuild node script so that
 * it can import src/config/pageMetadata.ts directly. The route list,
 * the titles and the descriptions then have exactly one definition,
 * shared with the <PageMeta> component that renders them at runtime.
 * A plain node script cannot import TypeScript, which is what forced
 * the old generate-sitemap.mjs to keep its own copy of the route list.
 * ============================================================
 */

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadEnv, type Plugin, type ResolvedConfig } from "vite";
import {
  BOOKING_CHANGEFREQ,
  BOOKING_PRIORITY,
  LANGS,
  STATIC_ROUTES,
  bookingRouteText,
  type BookingMetaSource,
  type RouteText,
} from "../../src/config/pageMetadata";
import {
  assertNoForbiddenPaths,
  renderRoutePage,
  renderSitemap,
  type SitemapRoute,
} from "./render";

interface GeneratedRoute extends SitemapRoute {
  text: RouteText;
}

type SessionRow = BookingMetaSource & { slug: string | null };

/**
 * Session types come from the database, so the booking pages that get a file
 * depend on it being reachable at build time. Unreachable means those routes
 * are left out entirely rather than written wrong — the same choice the old
 * sitemap script made, and the warning is loud because the consequence is now
 * bigger: a missing file is a 404, not just a missing sitemap line.
 */
const fetchSessionRows = async (env: Record<string, string>): Promise<SessionRow[]> => {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  // VITE_SUPABASE_PUBLISHABLE_KEY is what the app and both deploy workflows
  // actually set; the other names are accepted but have never been populated.
  const key =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn(
      "[static-site] No Supabase URL/key at build time — booking pages will be " +
        "absent from dist and from the sitemap, and will 404 in production.",
    );
    return [];
  }

  const { data, error } = await createClient(url, key)
    .from("session_types")
    .select("slug, name, name_ru, description, description_ru")
    .eq("is_active", true);

  if (error) {
    console.warn(
      `[static-site] Could not read session_types (${error.message}) — booking ` +
        "pages will be absent from dist and from the sitemap.",
    );
    return [];
  }

  return (data ?? []).filter((row): row is SessionRow => Boolean(row.slug));
};

const collectRoutes = (sessions: SessionRow[]): GeneratedRoute[] => [
  ...STATIC_ROUTES.map(({ path: routePath, priority, changefreq, ...text }) => ({
    path: routePath,
    priority,
    changefreq,
    text,
  })),
  ...sessions.map((session) => ({
    path: `/book/${session.slug}`,
    priority: BOOKING_PRIORITY,
    changefreq: BOOKING_CHANGEFREQ,
    text: bookingRouteText(session),
  })),
];

export const staticSite = (): Plugin => {
  let config: ResolvedConfig;

  return {
    name: "static-site",
    // Only on build: `vite dev` serves every route from memory already.
    apply: "build",

    configResolved(resolved) {
      config = resolved;
    },

    async closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const templatePath = path.join(outDir, "index.html");

      if (!fs.existsSync(templatePath)) {
        throw new Error(`[static-site] No built index.html at ${templatePath}.`);
      }

      const template = fs.readFileSync(templatePath, "utf8");

      // An empty prefix so this sees plain environment variables in CI as well
      // as the .env files locally. Build-time only — nothing here is injected
      // into the client bundle.
      const env = loadEnv(config.mode, config.root, "");
      const routes = collectRoutes(await fetchSessionRows(env));

      assertNoForbiddenPaths(
        routes.flatMap((route) => LANGS.map((lang) => `/${lang}${route.path}`)),
      );

      let fileCount = 0;

      for (const route of routes) {
        for (const lang of LANGS) {
          const canonicalPath = `/${lang}${route.path}`;
          const html = renderRoutePage(template, { canonicalPath, lang, text: route.text });

          // Written in both shapes, because the sitemap lists the extensionless
          // URL (/en/take) and static hosts disagree about how to serve it:
          //
          //   en/take/index.html  — every host serves this at /en/take/, and
          //                         redirects /en/take to it with a 301.
          //   en/take.html        — hosts with an extensionless HTML fallback,
          //                         GitHub Pages among them, serve this at
          //                         /en/take directly, with no redirect hop.
          //
          // Both carry the same canonical, so whichever one answers, the URL
          // Google keeps is the one in the sitemap. This is tracked debt with
          // a one-curl resolution — see issue #48 — not a permanent design:
          // the .html form is a third reachable URL for the same document.
          const targets = [
            path.join(outDir, canonicalPath, "index.html"),
            path.join(outDir, `${canonicalPath}.html`),
          ];

          for (const target of targets) {
            fs.mkdirSync(path.dirname(target), { recursive: true });
            fs.writeFileSync(target, html, "utf8");
            fileCount += 1;
          }
        }
      }

      const lastmod = new Date().toISOString().slice(0, 10);
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), renderSitemap(routes, lastmod), "utf8");

      console.log(
        `[static-site] ${fileCount} page files for ${routes.length} routes ` +
          `(${routes.length * LANGS.length} URLs), plus sitemap.xml`,
      );
    },
  };
};
