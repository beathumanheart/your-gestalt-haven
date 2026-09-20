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
import { buildServiceNode } from "../../src/config/serviceNode";
import { prerenderRoutes, type PrerenderTarget } from "./prerender";

interface GeneratedRoute extends SitemapRoute {
  text: RouteText;
  /** Present for booking routes: the row their Service node is built from. */
  session?: SessionRow;
}

/**
 * The pricing columns come along because the page's Service node carries the
 * offer derived from them. They are read, never interpreted, here —
 * `sessionPricing` decides what a row publishes, so `show_price: false` keeps
 * a withheld price out of the markup by construction.
 */
type SessionRow = BookingMetaSource & {
  slug: string | null;
  show_price?: boolean | null;
  pricing_type?: string | null;
  price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  currency?: string | null;
  duration_minutes?: number | null;
};

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
    .select(
      "slug, name, name_ru, description, description_ru, " +
        "show_price, pricing_type, price, min_price, max_price, currency, duration_minutes",
    )
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
    session,
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
      const targets: PrerenderTarget[] = [];

      for (const route of routes) {
        for (const lang of LANGS) {
          const canonicalPath = `/${lang}${route.path}`;
          const html = renderRoutePage(template, {
            canonicalPath,
            lang,
            text: route.text,
            // Booking routes only: the session's own Service node, so the
            // offer is in the served HTML rather than injected after mount.
            serviceNode: route.session
              ? buildServiceNode(
                  {
                    nameEn: route.session.name,
                    nameRu: route.session.name_ru || route.session.name,
                    descriptionEn: route.session.description || "",
                    descriptionRu: route.session.description_ru || route.session.description || "",
                    urlPath: canonicalPath,
                    session: route.session,
                  },
                  lang,
                )
              : undefined,
          });

          // One file per route, at `<path>.html`.
          //
          // This host resolves an extensionless request to the sibling .html
          // file and serves it directly, with no redirect: /404 returns 200
          // from 404.html, which has no directory of its own. The directory
          // form would work too, but only via a 301 — /en/book, a directory
          // with no .html sibling, redirects to /en/book/ — and that would
          // make every URL in the sitemap a redirect to its own canonical.
          //
          // So the sitemap URL is served directly, and the only other shape
          // reachable for the same document is the literal /en/take.html,
          // which the canonical consolidates. Measured on the deploy of #49;
          // see issue #48 for the full evidence.
          const target = path.join(outDir, `${canonicalPath}.html`);

          fs.mkdirSync(path.dirname(target), { recursive: true });
          fs.writeFileSync(target, html, "utf8");
          fileCount += 1;
          targets.push({ file: target, urlPath: canonicalPath });
        }
      }

      const lastmod = new Date().toISOString().slice(0, 10);
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), renderSitemap(routes, lastmod), "utf8");

      console.log(
        `[static-site] ${fileCount} page files for ${routes.length} routes ` +
          `(${routes.length * LANGS.length} URLs), plus sitemap.xml`,
      );

      await prerender(outDir, targets);
    },
  };
};

/**
 * Fills in the body of every generated page.
 *
 * On by default, so the deploy cannot skip it by forgetting a flag — the
 * failure mode of an opt-in would be publishing empty pages silently, which
 * is the thing being fixed. PRERENDER=0 opts out explicitly and says so in
 * the log; use it for a quick local build, never in a deploy. The e2e suite
 * asserts a prerendered body is present, so a deploy that skipped it fails.
 *
 * Playwright is a devDependency and already installed in both deploy
 * workflows for the e2e step. It is imported here rather than at the top of
 * the file so that PRERENDER=0 does not require a browser at all.
 */
const prerender = async (outDir: string, targets: PrerenderTarget[]) => {
  if (process.env.PRERENDER === "0") {
    console.warn(
      "[prerender] Skipped (PRERENDER=0). Pages ship with an empty #root, " +
        "which is what this step exists to prevent — do not deploy this build.",
    );
    return;
  }

  const started = Date.now();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();

  try {
    const results = await prerenderRoutes(browser, outDir, targets);
    const total = results.reduce((sum, r) => sum + r.bytes, 0);
    console.log(
      `[prerender] ${results.length} routes in ${((Date.now() - started) / 1000).toFixed(1)}s, ` +
        `${Math.round(total / 1024)} KB of rendered body`,
    );
  } finally {
    await browser.close();
  }
};
