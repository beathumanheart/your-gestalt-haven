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
 * Known drafts are quarantined rather than grandfathered silently: the
 * quarantine is an exact path with a ceiling, it can only shrink, and it
 * fails once the file is clean so the entry cannot outlive its purpose.
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

/**
 * Files known to contain draft copy, with the number of markers each may
 * carry. The number is a **ceiling, not a target**: it may shrink freely as
 * strings are replaced, and it exists so that adding more drafts to an
 * already-quarantined file fails like any other new draft would.
 *
 * An entry must be deleted once its file is clean — a test below enforces
 * that, so the quarantine cannot quietly become permanent.
 */
const QUARANTINE: Record<string, number> = {
  // Genia is writing the final Russian as her own sentences. Tracked in #52.
  "src/content/services.ts": 27,
};

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
      .filter(([rel, count]) => count > 0 && !(rel in QUARANTINE))
      .map(([rel, count]) => `${rel}: ${count} marker(s)`);

    expect(
      offenders,
      `Draft copy must be replaced before merging, not marked and shipped:\n${offenders.join(
        "\n",
      )}\n\nIf it genuinely cannot be replaced yet, add the file to QUARANTINE ` +
        `with an issue number — deliberately, not as a reflex.`,
    ).toEqual([]);
  });

  it("scans every content file, so a new one cannot slip past", () => {
    // Guards the glob itself: if this ever reads zero files, every assertion
    // above passes vacuously.
    expect(contentFiles.length).toBeGreaterThan(5);
    expect(contentFiles).toContain("src/content/services.ts");
  });
});

describe("the quarantine", () => {
  it("points only at files that exist", () => {
    for (const rel of Object.keys(QUARANTINE)) {
      expect(existsSync(join(ROOT, rel)), `${rel} is quarantined but missing`).toBe(true);
    }
  });

  it("never grows — a quarantined file may lose markers, not gain them", () => {
    for (const [rel, ceiling] of Object.entries(QUARANTINE)) {
      const count = markerCounts.get(rel) ?? 0;
      expect(
        count,
        `${rel} has ${count} draft markers but is allowed ${ceiling}. ` +
          `Adding draft copy to an already-quarantined file is still adding draft copy.`,
      ).toBeLessThanOrEqual(ceiling);
    }
  });

  it("releases a file once it is clean, instead of outliving its purpose", () => {
    for (const rel of Object.keys(QUARANTINE)) {
      const count = markerCounts.get(rel) ?? 0;
      expect(
        count,
        `${rel} no longer contains draft markers — the copy landed. ` +
          `Remove it from QUARANTINE (and drop the stale warning in its file header).`,
      ).toBeGreaterThan(0);
    }
  });
});
