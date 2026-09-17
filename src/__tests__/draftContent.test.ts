/**
 * Draft copy must not reach production.
 *
 * `src/content/services.ts` shipped with 26 lines of RU strings marked
 * `// DRAFT RU`, under a file header saying to replace them before merging.
 * Nothing enforced that, so it merged, deployed twice, and the draft Russian
 * has been rendering to readers ever since (#52).
 *
 * The marker was doing no work. This makes it fail the build instead.
 *
 * Those drafts were quarantined rather than grandfathered silently — an exact
 * path with a ceiling that could only shrink, and that failed once the file
 * was clean. It did exactly that when the reviewed copy landed (#52), which
 * is how the entry came to be removed rather than forgotten. There is no
 * quarantine now, and a marker anywhere in src/content fails the build.
 *
 * If one is ever needed again, that is the shape to rebuild: a ceiling, not a
 * blessing. An entry that cannot expire is just a hole.
 */

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(__dirname, "../..");
const CONTENT_DIR = "src/content";

/**
 * The marker, matched case-sensitively and in full caps.
 *
 * That is the convention in use ("// DRAFT RU"), and it keeps ordinary prose
 * clear of the guard — a sentence about a "draft" of something is not a
 * marker. Verified at the time of writing: no case-insensitive "draft"
 * appears anywhere else in src/.
 */
const MARKER = /DRAFT/g;

const countMarkers = (text: string) => (text.match(MARKER) ?? []).length;

const contentFiles = readdirSync(join(ROOT, CONTENT_DIR))
  .filter((f) => f.endsWith(".ts"))
  .map((f) => `${CONTENT_DIR}/${f}`);

const markerCounts = new Map(
  contentFiles.map((rel) => [rel, countMarkers(readFileSync(join(ROOT, rel), "utf-8"))]),
);

describe("draft copy never ships", () => {
  it("finds no draft markers outside the quarantine", () => {
    const offenders = [...markerCounts]
      .filter(([, count]) => count > 0)
      .map(([rel, count]) => `${rel}: ${count} marker(s)`);

    expect(
      offenders,
      `Draft copy must be replaced before merging, not marked and shipped:\n${offenders.join(
        "\n",
      )}\n\nReplace the copy. If it genuinely cannot be replaced yet, see the ` +
        `note at the top of this file — deliberately, not as a reflex.`,
    ).toEqual([]);
  });

  it("scans every content file, so a new one cannot slip past", () => {
    // Guards the glob itself: if this ever reads zero files, every assertion
    // above passes vacuously.
    expect(contentFiles.length).toBeGreaterThan(5);
    expect(contentFiles).toContain("src/content/services.ts");
  });
});
