/**
 * ============================================================
 * PRERENDERING ROUTE BODIES
 * ============================================================
 * #49 gave every indexable route a real file with an honest <head>, which
 * fixed indexing and social previews. The body stayed an empty #root, so
 * Google had nothing to rank and the many crawlers that do not execute
 * JavaScript saw nothing at all. This fills the body in at build time.
 *
 * Each route is loaded in a headless browser against the built output, and
 * the rendered #root is written back into its file.
 *
 * ── What this does and does not buy ─────────────────────────────────────
 *
 * ⚠️ `src/main.tsx` uses `createRoot`, which **discards** server markup and
 * re-renders from scratch rather than adopting it. The expectation was that
 * this makes prerendering worthless for human visitors — generated, shipped,
 * thrown away — and worth it only for crawlers.
 *
 * Measured, that is wrong, and the numbers are the reason this note exists
 * rather than the prediction. Slow 4G, mobile viewport, median of three:
 *
 *     first contentful paint   1.85s -> 0.98s
 *     largest contentful paint 3.07s -> 2.39s
 *     cumulative layout shift  0.0008 -> 0.0005
 *     text without JavaScript  0 -> 5689 characters
 *
 * Discarding the tree is not the same as not painting it. The browser paints
 * the static markup as soon as it arrives, and — the larger effect — it finds
 * the hero `<img>` in the initial HTML instead of after the bundle has parsed
 * and executed, so the LCP image starts downloading far earlier. React then
 * replaces the tree, which costs a re-render but measurably no layout shift.
 *
 * What is still left on the table is hydration: `hydrateRoot` would adopt the
 * markup instead of rebuilding it, saving that re-render and improving time
 * to interactive. It requires the server and client trees to match exactly,
 * which is a separate change with its own failure modes — mismatched text,
 * dates, anything read from localStorage on first render. Not attempted here.
 *
 * So the honest summary: the crawler benefit is categorical (content exists
 * at all), and the human benefit is real but smaller and for a different
 * reason than prerendering is usually credited with.
 *
 * ── Failure is fatal, on purpose ────────────────────────────────────────
 *
 * If one route times out or throws, the build fails. Writing an empty #root
 * for that page would reintroduce exactly the bug #49 fixed, on one page,
 * invisibly — and it would be whichever page nobody thinks to check. Same
 * reasoning as render.ts throwing when a tag it must replace is missing.
 * ============================================================
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import type { Browser } from "playwright";

/** One route to render: the file to fill in, and the path to visit. */
export interface PrerenderTarget {
  /** Absolute path of the built HTML file. */
  file: string;
  /** Path to load, e.g. "/en/take". */
  urlPath: string;
}

const MIME: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

/**
 * Serves the built output the way the host does, so a route resolves to the
 * same file in the browser here as it will in production: an extensionless
 * request falls back to `<path>.html`, and anything unknown falls back to
 * index.html the way 404.html does.
 */
const serveDist = (root: string): Promise<{ port: number; close: () => void }> =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url ?? "/").split("?")[0]);
      let file = path.join(root, urlPath);

      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        const asHtml = `${file.replace(/\/$/, "")}.html`;
        file = fs.existsSync(asHtml) ? asHtml : path.join(root, "index.html");
      }

      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
      fs.createReadStream(file).pipe(res);
    });

    server.listen(0, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      resolve({ port, close: () => server.close() });
    });
  });

/** Where the body goes. The built file carries exactly this, empty. */
const ROOT_DIV = '<div id="root"></div>';

export const PRERENDER_MARKER = "<!-- prerendered -->";

/**
 * Waits until the route has actually rendered its content, not its skeleton.
 *
 * `#root` having children is not enough: the booking pages render pulsing
 * placeholders while they fetch the session, and baking those in would
 * publish a page that says nothing. Every indexable route renders a non-empty
 * `h1` once it has its content — including the booking pages, whose heading
 * *is* the session name from the database — so that is the signal.
 *
 * Note it cannot be "no skeletons present": the homepage keeps one
 * animate-pulse element permanently, as decoration.
 */
const contentReady = () => {
  const root = document.querySelector("#root");
  if (!root || root.children.length === 0) return false;
  const h1 = document.querySelector("h1");
  return !!h1 && (h1.textContent || "").trim().length > 0;
};

export interface PrerenderResult {
  urlPath: string;
  bytes: number;
}

/**
 * Fills in the body of every target file. Throws on the first route that
 * fails, having written nothing for it.
 */
export const prerenderRoutes = async (
  browser: Browser,
  outDir: string,
  targets: readonly PrerenderTarget[],
  options: { timeoutMs?: number } = {},
): Promise<PrerenderResult[]> => {
  const timeout = options.timeoutMs ?? 30_000;
  const server = await serveDist(outDir);
  const results: PrerenderResult[] = [];

  try {
    for (const target of targets) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();

      // Analytics must not fire from a build machine: it would put phantom
      // pageviews in the funnel, from a "visitor" that is CI.
      await page.route(/posthog\.com|i\.posthog\.com/i, (route) => route.abort());

      try {
        // networkidle, not load: every route fetches on mount — the session
        // row for a booking page, the session types for its widget, the
        // published pricing scale for the homepage — and "load" fires before
        // any of that lands, which bakes in pulsing placeholders.
        await page.goto(`http://127.0.0.1:${server.port}${target.urlPath}`, {
          waitUntil: "networkidle",
          timeout,
        });
        // The function itself, never its source as a string: Playwright
        // evaluates a string as an *expression*, and "() => {...}" evaluates
        // to a truthy function object, so the wait resolves immediately
        // without running the check. That shipped a booking page containing
        // its loading skeleton once.
        await page.waitForFunction(contentReady, undefined, { timeout });

        const body = await page.evaluate(() => document.querySelector("#root")?.innerHTML ?? "");
        if (body.trim().length === 0) {
          throw new Error("#root rendered empty");
        }

        const html = fs.readFileSync(target.file, "utf8");
        if (!html.includes(ROOT_DIV)) {
          throw new Error(
            `${path.basename(target.file)} does not contain ${ROOT_DIV} — the ` +
              `template changed and prerendering has nowhere to write.`,
          );
        }

        fs.writeFileSync(
          target.file,
          html.replace(ROOT_DIV, `<div id="root">${body}</div>\n    ${PRERENDER_MARKER}`),
          "utf8",
        );
        results.push({ urlPath: target.urlPath, bytes: Buffer.byteLength(body, "utf8") });
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(
          `[prerender] ${target.urlPath} did not render: ${reason}\n\n` +
            `The build stops here rather than publishing that route with an ` +
            `empty #root, which is the bug prerendering exists to fix and ` +
            `would be invisible on one page. If the route is genuinely not ` +
            `meant to be prerendered, take it out of the indexable set in ` +
            `src/config/pageMetadata.ts.`,
        );
      } finally {
        await context.close();
      }
    }
  } finally {
    server.close();
  }

  return results;
};
