/**
 * Short-link URLs must never reach a search index.
 *
 * The slug in /s/<slug> is the only secret guarding a therapy session's video
 * room. A crawler reaches one of these URLs by leak — a forwarded confirmation,
 * a synced browser history — never via our own sitemap, so the directive that
 * matters is the one that stops the fetch and does not need JS to run.
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");
const GENERATOR = join(ROOT, "scripts/generate-sitemap.mjs");
const robots = readFileSync(join(ROOT, "public/robots.txt"), "utf-8");
const generator = readFileSync(GENERATOR, "utf-8");

/**
 * Run a sitemap generator with a throwaway working directory.
 *
 * The script writes to `dist/sitemap.xml` relative to cwd, but resolves its
 * imports relative to its own path — so a variant under test has to live in the
 * repo (for node_modules) while writing somewhere disposable.
 */
function runGenerator(scriptPath: string): string {
  const cwd = mkdtempSync(join(tmpdir(), "sitemap-"));
  mkdirSync(join(cwd, "dist"));
  execFileSync("node", [scriptPath], {
    cwd,
    // No credentials: the generator warns and emits its fixed routes, which is
    // the whole surface we care about here.
    env: { ...process.env, SUPABASE_URL: "", SUPABASE_ANON_KEY: "", VITE_SUPABASE_URL: "" },
    stdio: "pipe",
  });
  return readFileSync(join(cwd, "dist/sitemap.xml"), "utf-8");
}

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

describe("sitemap generator", () => {
  it("never emits a short-link path", () => {
    const locs = [...runGenerator(GENERATOR).matchAll(/<loc>([^<]+)<\/loc>/g)].map(
      (m) => new URL(m[1]).pathname
    );

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

  it("refuses to write a sitemap if one ever appears", () => {
    // Exercise the tripwire rather than just asserting it exists: a generator
    // that grew a /s/ route must fail the build, not publish a room token.
    const sabotaged = join(ROOT, "scripts", ".generate-sitemap.tripwire.mjs");
    writeFileSync(
      sabotaged,
      generator.replace(
        'urlEntry({ path: "/offer-agreement", priority: "0.3", changefreq: "yearly" }),',
        'urlEntry({ path: "/offer-agreement", priority: "0.3", changefreq: "yearly" }),\n  urlEntry({ path: "/s/k3Qm9ZpX2vTb" }),'
      ),
      "utf-8"
    );

    try {
      expect(() => runGenerator(sabotaged)).toThrow(/Refusing to write a sitemap/);
    } finally {
      rmSync(sabotaged, { force: true });
    }
  });
});
