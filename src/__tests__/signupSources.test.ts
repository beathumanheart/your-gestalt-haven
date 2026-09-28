/**
 * The app's list of sign-up sources must match the function's.
 *
 * `SOURCES` lives in the edge function. Its module is pure, so this test can
 * import it — but the app cannot: the app must not pull edge-function code
 * into its bundle, so `SignupSource` in src/config/signup.ts is a second copy
 * of the same list. Two places that must agree is exactly the shape that
 * drifts, so this compares them.
 *
 * Sending a source the function does not know is a 400 the reader sees as
 * "something went wrong" — and it would only happen for whichever mount point
 * was added last.
 */

import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SOURCES } from "@takesignup/sources.ts";

/** The keys the function will actually accept. */
const functionSources = Object.keys(SOURCES).sort();

/** The members of the SignupSource union in the app. */
const appSources = (() => {
  const src = readFileSync(resolve(__dirname, "../config/signup.ts"), "utf8");
  const union = src.match(/export type SignupSource =([^;]+);/);
  if (!union) throw new Error("SignupSource not found in src/config/signup.ts");
  return [...union[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]).sort();
})();

describe("sign-up sources", () => {
  it("reads a non-empty list from both sides", () => {
    // Either regex failing would otherwise make the comparison below pass on
    // two empty arrays.
    expect(functionSources.length).toBeGreaterThan(1);
    expect(appSources.length).toBeGreaterThan(1);
  });

  it("agree, so no mount point can send a source the function rejects", () => {
    expect(appSources).toEqual(functionSources);
  });

  it("includes the three the site actually uses", () => {
    expect(functionSources).toEqual(["automatic-yes", "letter-footer", "letter-page"]);
  });
});
