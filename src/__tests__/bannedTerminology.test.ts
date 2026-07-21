import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { resolve, join, basename } from "path";

/**
 * Terminology guard — fails the build if any of these appear in source or
 * built output, case-insensitive. Extend this array to ban more terms.
 *
 * Deliberately NOT banned (documented so they aren't re-added):
 *   - the "психолог" stem — "психолог-консультант" is allowed
 *   - "clinical" — used legitimately (e.g. "clinical diagnoses" in the
 *     offer agreement)
 */
export const BANNED_TERMS = [
  "psychotherap",
  "psychologist",
  "психотерап",
  "EAGT-accredited",
  "EAGT accredited",
  "accredited by EAGT",
  "аккредитован EAGT",
];

/** Returns the banned terms found in `text` (case-insensitive). */
export function findBannedTerms(text: string): string[] {
  const lower = text.toLowerCase();
  return BANNED_TERMS.filter((term) => lower.includes(term.toLowerCase()));
}

const ROOT = resolve(__dirname, "../..");
// This file holds the banned terms as data, so exclude it from the scan.
const SELF = "bannedTerminology.test.ts";

const TEXT_EXT = /\.(ts|tsx|js|jsx|css|html|txt|json|md)$/i;
const SKIP_DIRS = new Set(["node_modules", ".git", "coverage", "playwright-report"]);

function collectFiles(dir: string, acc: string[] = []): string[] {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectFiles(full, acc);
    else if (TEXT_EXT.test(entry) && basename(full) !== SELF) acc.push(full);
  }
  return acc;
}

// Source always; built output too when present (CI builds after unit tests,
// so dist may be absent — that's fine, source is the source of truth).
const targets = [
  join(ROOT, "index.html"),
  ...collectFiles(join(ROOT, "src")),
  ...collectFiles(join(ROOT, "public")),
  ...collectFiles(join(ROOT, "dist")),
].filter((f) => existsSync(f));

describe("terminology guard", () => {
  it("no banned terms appear in source or built output", () => {
    const offenders: string[] = [];
    for (const file of targets) {
      const found = findBannedTerms(readFileSync(file, "utf-8"));
      if (found.length) offenders.push(`${file.replace(`${ROOT}/`, "")}: ${found.join(", ")}`);
    }
    expect(offenders, `Banned terminology found:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("does not ban the 'психолог' stem (психолог-консультант is allowed)", () => {
    expect(findBannedTerms("психолог-консультант")).toEqual([]);
  });

  it("does not ban 'clinical' (clinical diagnoses is used legitimately)", () => {
    expect(
      findBannedTerms(
        "Counselling is not a substitute for psychiatric or medical treatment for clinical diagnoses",
      ),
    ).toEqual([]);
  });
});
