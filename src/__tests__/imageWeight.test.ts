/**
 * Images that ship must stay small.
 *
 * `public/og-image.png` was 2.1 MB, referenced by nothing, and rode along in
 * every deploy because nothing was watching. The portrait was 955 KB —
 * 1440x1920 — to fill a 280 px circle. Neither was noticed by a human for
 * months, which is the argument for a guard rather than a cleanup.
 *
 * Scanned deliberately *before* the build as well as after:
 *
 *   public/      copied verbatim into the deploy
 *   src/assets/  emitted to dist/assets when imported
 *   dist/assets/ the built output, only when it happens to exist
 *
 * CI runs unit tests before `npm run build` (.github/workflows/ci.yml), so
 * dist/ is usually absent here. A guard that only read dist/ would pass
 * vacuously in exactly the place it needs to hold, which is why src/assets is
 * scanned directly.
 *
 * Masters and source material live in design-assets/, which is deliberately
 * not scanned: nothing there is imported, so nothing there ships.
 *
 * There is no allowlist. There was one — the two social cards at ~315 KB
 * apiece — and it is gone because they were re-encoded rather than excused:
 * they carry a photograph, so PNG was the wrong format and JPEG took them to
 * 58 KB with no visible loss. If an exemption is ever genuinely needed, the
 * shape to copy is QUARANTINE in draftContent.test.ts: an exact path with a
 * ceiling that may shrink, fails if it grows, and fails once the file is back
 * under the limit so the entry cannot outlive its reason.
 */

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const KB = 1024;

/**
 * Nothing a page loads should need more than this. A full-bleed hero photo
 * fits comfortably under it at 1920px wide; anything above is a resize or a
 * format choice that has not happened yet.
 */
const LIMIT = 200 * KB;

const IMAGE = /\.(png|jpe?g|webp|gif|avif|svg|heic)$/i;

const SCANNED = ["public", "src/assets", "dist/assets"];

const walk = (dir: string, acc: string[] = []): string[] => {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (IMAGE.test(entry)) acc.push(full);
  }
  return acc;
};

const images = SCANNED.flatMap((d) => walk(join(ROOT, d))).map((full) => ({
  rel: full.replace(`${ROOT}/`, ""),
  bytes: statSync(full).size,
}));

const kb = (bytes: number) => `${Math.round(bytes / KB)} KB`;

describe("shipped images stay within budget", () => {
  it("finds no image over the limit", () => {
    const offenders = images
      .filter(({ bytes }) => bytes > LIMIT)
      .map(({ rel, bytes }) => `${rel}: ${kb(bytes)} (limit ${kb(LIMIT)})`);

    expect(
      offenders,
      `These images ship on every deploy:\n${offenders.join("\n")}\n\n` +
        `Resize or re-encode to the size it actually renders at — a ` +
        `photograph saved as PNG is usually the whole story. If the file is ` +
        `source material rather than something a page loads, move it to ` +
        `design-assets/: nothing there is imported, so nothing there ships.`,
    ).toEqual([]);
  });

  it("scans something, so the budget is not enforced vacuously", () => {
    // A typo'd directory name would silently make every assertion here pass.
    expect(images.length).toBeGreaterThan(3);
    expect(images.map((i) => i.rel)).toContain("public/favicon.svg");
  });
});
