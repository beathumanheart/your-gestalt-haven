/**
 * The scheduled rebuild must never touch the backend.
 *
 * It runs unattended, on a timer. If it grew a `supabase db push`, whatever
 * migration happened to be sitting on main would be applied to production at
 * 04:00 with nobody watching, and the function it would redeploy alongside is
 * the one that takes bookings.
 *
 * The protection is that those steps are absent, not conditioned — a condition
 * is one edited expression away from running on a timer — so this asserts
 * absence, and asserts the deploy workflow still has them, which is what
 * proves the two were separated rather than the backend steps simply deleted.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (name: string) =>
  readFileSync(resolve(__dirname, "../../.github/workflows", name), "utf8");

const rebuild = read("rebuild-frontend.yml");
const deploy = read("deploy-production.yml");

/**
 * The workflow with full-line comments removed.
 *
 * The prose in this file explains *why* the backend steps are absent, and
 * names them to do it. A guard that reads the comments would fail on the
 * explanation for the thing it is guarding — assert on what runs.
 */
const runs = (yaml: string) =>
  yaml
    .split("\n")
    .filter((line) => !line.trim().startsWith("#"))
    .join("\n");

/** Things that change the backend rather than republish the frontend. */
const BACKEND = [
  "supabase db push",
  "functions deploy",
  "supabase link",
  "supabase/setup-cli",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_ACCESS_TOKEN",
];

describe("the scheduled rebuild", () => {
  it("contains nothing that touches the database or the functions", () => {
    const found = BACKEND.filter((needle) => runs(rebuild).includes(needle));
    expect(
      found,
      `rebuild-frontend.yml runs unattended on a timer and must not carry ` +
        `backend steps:\n  ${found.join("\n  ")}`,
    ).toEqual([]);
  });

  it("can be run by hand and on a schedule", () => {
    expect(rebuild).toContain("workflow_dispatch:");
    expect(rebuild).toMatch(/schedule:\s*\n\s*(#[^\n]*\n\s*)*- cron:/);
  });

  it("shares the deploy's concurrency group, so the two cannot overlap", () => {
    // Both publish to the same Pages branch; interleaving them would let a
    // rebuild overwrite a deploy that was half-published.
    const groupOf = (yaml: string) => yaml.match(/concurrency:\s*\n\s*group:\s*(\S+)/)?.[1];
    expect(groupOf(rebuild)).toBe(groupOf(deploy));
    expect(rebuild).toContain("cancel-in-progress: false");
  });

  it("keeps the checks, because nobody is watching when it runs", () => {
    for (const step of ["npm run lint", "npm run typecheck", "npm run test", "npm run build"]) {
      expect(rebuild, `the rebuild skips ${step}`).toContain(step);
    }
  });

  it("fails if GitHub Pages does not actually publish", () => {
    // peaceiris pushes the branch and exits; the Pages build then runs on its
    // own and can fail silently, which it has.
    expect(rebuild).toContain("pages/builds/latest");
    expect(rebuild).toContain("errored");
  });
});

describe("the production deploy", () => {
  it("still owns the backend steps", () => {
    // If these ever move out of here too, the separation was a deletion.
    for (const needle of ["supabase db push", "functions deploy"]) {
      expect(deploy, `deploy-production.yml no longer runs ${needle}`).toContain(needle);
    }
  });

  it("is still triggered by a push to main, not by a timer", () => {
    expect(deploy).toMatch(/on:\s*\n\s*push:/);
    expect(deploy).not.toContain("- cron:");
  });
});
