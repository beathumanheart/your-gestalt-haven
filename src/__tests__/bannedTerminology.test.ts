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

/**
 * The one file where the banned terms may be written.
 *
 * The scan covers comments as well as strings, on purpose: it caught a term
 * in an explanatory code comment once, and a guard scoped to user-facing
 * strings would have missed it. The cost is that the *reasoning* for avoiding
 * a term had nowhere to live, and that reasoning is what stops someone
 * reintroducing the term later — so one document is exempt, and its only job
 * is to explain the bans.
 *
 * Matched as an exact repo-relative path, never a directory or a glob. A copy
 * of this document anywhere else — including one that somehow reached dist —
 * is still scanned and still fails. Widening this to a directory would hand
 * back the blind spot the guard exists to close.
 */
const RATIONALE_DOC = "docs/terminology.md";

const relative = (file: string) => file.replace(`${ROOT}/`, "");

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
//
// docs/ is scanned as well. It used to be outside the scan, which made it a
// silent blind spot: "EAGT-accredited" in a runbook would have shipped
// uncaught. Bringing it in is what makes RATIONALE_DOC a deliberate
// exemption rather than an accident of which directories were listed here.
const targets = [
  join(ROOT, "index.html"),
  ...collectFiles(join(ROOT, "src")),
  ...collectFiles(join(ROOT, "public")),
  ...collectFiles(join(ROOT, "docs")),
  ...collectFiles(join(ROOT, "dist")),
].filter((f) => existsSync(f) && relative(f) !== RATIONALE_DOC);

describe("terminology guard", () => {
  it("no banned terms appear in source or built output", () => {
    const offenders: string[] = [];
    for (const file of targets) {
      const found = findBannedTerms(readFileSync(file, "utf-8"));
      if (found.length) offenders.push(`${relative(file)}: ${found.join(", ")}`);
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

describe("the rationale document", () => {
  const doc = join(ROOT, RATIONALE_DOC);

  it("exists, so the exemption is not pointing at nothing", () => {
    expect(existsSync(doc)).toBe(true);
  });

  it("explains every banned term, so the exemption stays earned", () => {
    // An exemption for a file that stopped explaining the bans is just a
    // hole. Each term must appear there, which is the one place it may.
    const text = readFileSync(doc, "utf-8").toLowerCase();
    for (const term of BANNED_TERMS) {
      expect(text, `${RATIONALE_DOC} does not mention "${term}"`).toContain(
        term.toLowerCase(),
      );
    }
  });

  it("is never shipped to users", () => {
    // The exemption is only safe because this file is documentation: docs/ is
    // not copied into the build. A copy under public/ or dist/ would be
    // served, and would also still be scanned — this asserts the first half.
    expect(existsSync(join(ROOT, "public", RATIONALE_DOC))).toBe(false);
    expect(existsSync(join(ROOT, "dist", RATIONALE_DOC))).toBe(false);
  });

  it("is exempt by exact path, not by directory", () => {
    // A sibling doc gets no exemption, so the hole cannot widen by accident.
    expect(relative(join(ROOT, "docs/terminology.md"))).toBe(RATIONALE_DOC);
    expect(relative(join(ROOT, "docs/terminology-notes.md"))).not.toBe(RATIONALE_DOC);
    expect(relative(join(ROOT, "dist/docs/terminology.md"))).not.toBe(RATIONALE_DOC);
  });
});
