/**
 * Short-link URLs must never reach a search index.
 *
 * The slug in /s/<slug> is the only secret guarding a therapy session's video
 * room. A crawler reaches one of these URLs by leak — a forwarded confirmation,
 * a synced browser history — never via our own sitemap, so the directive that
 * matters is the one that stops the fetch and does not need JS to run.
 *
 * Since the build began writing a real HTML file per route, there is a second
 * way to publish a token: writing dist/en/s/<slug>.html would publish the room
 * itself, not just a link to it. Both paths through the generator are checked
 * below.
 */

import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assertNoForbiddenPaths,
  renderSitemap,
  type SitemapRoute,
} from "../../scripts/static-site/render";
import { LANGS, STATIC_ROUTES } from "@/config/pageMetadata";

const ROOT = resolve(__dirname, "../..");
const robots = readFileSync(join(ROOT, "public/robots.txt"), "utf-8");

/** A short link as the generator would have to express it to leak one. */
const LEAKED_SHORT_LINK: SitemapRoute = {
  path: "/s/k3Qm9ZpX2vTb",
  priority: "0.5",
  changefreq: "weekly",
};

describe("robots.txt", () => {
  it("disallows both short-link prefixes", () => {
    const disallowed = robots
      .split("\n")
      .filter((line) => line.trim().toLowerCase().startsWith("disallow:"))
      .map((line) => line.split(":")[1].trim());

    expect(disallowed).toContain("/s/");
    expect(disallowed).toContain("/c/");
  });

  it("keeps the rules under a wildcard user-agent", () => {
    // A Disallow only binds the User-agent group it sits in.
    const group = robots.slice(robots.indexOf("User-agent: *"));
    expect(group).toContain("Disallow: /s/");
    expect(group).toContain("Disallow: /c/");
  });

  it("still allows the pages that should be indexed", () => {
    expect(robots).toContain("Allow: /");
    expect(robots).not.toMatch(/^Disallow:\s*\/$/m);
  });
});

describe("sitemap", () => {
  it("never emits a short-link path", () => {
    const locs = [
      ...renderSitemap(STATIC_ROUTES, "2026-01-01").matchAll(/<loc>([^<]+)<\/loc>/g),
    ].map((m) => new URL(m[1]).pathname);

    expect(locs.length).toBeGreaterThan(0);
    for (const path of locs) {
      // Segment-wise: real entries are language-prefixed (/en/book/...), so a
      // leaked short link would read /en/s/<slug>, not /s/<slug>.
      const segments = path.split("/").filter(Boolean);
      expect(segments).not.toContain("s");
      expect(segments).not.toContain("c");
      expect(segments).not.toContain("admin");
    }
  });

  it("refuses to render at all if a short link ever joins the route list", () => {
    // Exercise the tripwire rather than just asserting it exists: a generator
    // that grew a /s/ route must fail the build, not publish a room token.
    expect(() => renderSitemap([...STATIC_ROUTES, LEAKED_SHORT_LINK], "2026-01-01")).toThrow(
      /Refusing to publish/,
    );
  });
});

describe("generated page files", () => {
  it("refuses to write a file at a short-link path", () => {
    // The plugin runs this check over every path it is about to write, so a
    // route that reached the list would fail the build before any file exists.
    const paths = [...STATIC_ROUTES, LEAKED_SHORT_LINK].flatMap((route) =>
      LANGS.map((lang) => `/${lang}${route.path}`),
    );

    expect(() => assertNoForbiddenPaths(paths)).toThrow(/Refusing to publish/);
  });

  it("allows the routes the build really generates", () => {
    const paths = STATIC_ROUTES.flatMap((route) =>
      LANGS.map((lang) => `/${lang}${route.path}`),
    );

    expect(() => assertNoForbiddenPaths(paths)).not.toThrow();
  });
});
