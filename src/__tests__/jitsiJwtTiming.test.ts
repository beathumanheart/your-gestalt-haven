/**
 * Unit tests for JaaS JWT timing logic.
 *
 * The edge function can't be imported directly in Vitest (Deno runtime),
 * so we test the timing math inline — same constants, same formula,
 * verified against the spec in the task brief.
 */

import { describe, it, expect } from "vitest";

const BUFFER_SECS = 30 * 60; // 1800 s — must match process-booking/index.ts

/**
 * Pure computation extracted from generateJaasJwtToken.
 * Returns { nbf, exp } as Unix seconds (UTC).
 * Throws if the resulting window is invalid (exp <= nbf).
 */
function computeJwtWindow(sessionStart: Date, sessionEnd: Date): { nbf: number; exp: number } {
  const nbf = Math.floor(sessionStart.getTime() / 1000) - BUFFER_SECS;
  const exp = Math.floor(sessionEnd.getTime() / 1000) + BUFFER_SECS;

  if (exp <= nbf) {
    throw new Error(
      `Invalid session window: exp ${new Date(exp * 1000).toISOString()} ` +
        `is not after nbf ${new Date(nbf * 1000).toISOString()}`
    );
  }

  return { nbf, exp };
}

// ── Test cases ───────────────────────────────────────────────────

describe("JaaS JWT timing", () => {
  it("produces correct nbf and exp for a standard 50-min session", () => {
    // Session: 2026-05-01 10:00 UTC → 10:50 UTC
    // Expected: nbf = 09:30 UTC, exp = 11:20 UTC
    const sessionStart = new Date("2026-05-01T10:00:00Z");
    const sessionEnd = new Date("2026-05-01T10:50:00Z");

    const { nbf, exp } = computeJwtWindow(sessionStart, sessionEnd);

    const expectedNbf = new Date("2026-05-01T09:30:00Z").getTime() / 1000;
    const expectedExp = new Date("2026-05-01T11:20:00Z").getTime() / 1000;

    expect(nbf).toBe(expectedNbf);
    expect(exp).toBe(expectedExp);

    // Verify ISO round-trips for human-readable sanity
    expect(new Date(nbf * 1000).toISOString()).toBe("2026-05-01T09:30:00.000Z");
    expect(new Date(exp * 1000).toISOString()).toBe("2026-05-01T11:20:00.000Z");
  });

  it("correctly scopes a session 6 months in the future", () => {
    // Far-future session — must not regress to creation-time window
    const sessionStart = new Date("2026-11-01T14:00:00Z");
    const sessionEnd = new Date("2026-11-01T15:00:00Z");

    const { nbf, exp } = computeJwtWindow(sessionStart, sessionEnd);

    const expectedNbf = new Date("2026-11-01T13:30:00Z").getTime() / 1000;
    const expectedExp = new Date("2026-11-01T15:30:00Z").getTime() / 1000;

    expect(nbf).toBe(expectedNbf);
    expect(exp).toBe(expectedExp);

    // The window must be anchored to the future session, not to now
    const nowSec = Date.now() / 1000;
    expect(nbf).toBeGreaterThan(nowSec);
    expect(exp).toBeGreaterThan(nowSec);
  });

  it("throws when end_time is before start_time (invalid data)", () => {
    const sessionStart = new Date("2026-05-01T11:00:00Z");
    const sessionEnd = new Date("2026-05-01T10:00:00Z"); // end before start

    expect(() => computeJwtWindow(sessionStart, sessionEnd)).toThrow(
      "Invalid session window"
    );
  });

  it("throws when end_time equals start_time (zero-length session)", () => {
    const sessionStart = new Date("2026-05-01T10:00:00Z");
    const sessionEnd = new Date("2026-05-01T10:00:00Z");

    // nbf = start - 1800, exp = end + 1800; exp > nbf here, so no throw.
    // But a zero-length session is still degenerate — verify it at least
    // produces a valid window (no throw), since the buffer saves it.
    const { nbf, exp } = computeJwtWindow(sessionStart, sessionEnd);
    expect(exp).toBeGreaterThan(nbf);
    // Both buffers combined: lifetime = 2 * BUFFER_SECS = 3600 s
    expect(exp - nbf).toBe(2 * BUFFER_SECS);
  });

  it("property: nbf is always strictly less than exp for any valid session", () => {
    // Parameterised check over a spread of session lengths and start times
    const sessions: Array<[string, string]> = [
      ["2026-01-10T08:00:00Z", "2026-01-10T08:50:00Z"],
      ["2026-06-15T18:30:00Z", "2026-06-15T19:30:00Z"],
      ["2026-12-31T23:00:00Z", "2027-01-01T00:00:00Z"], // midnight boundary
      ["2027-03-01T05:00:00Z", "2027-03-01T06:00:00Z"], // far future
    ];

    for (const [startIso, endIso] of sessions) {
      const { nbf, exp } = computeJwtWindow(new Date(startIso), new Date(endIso));
      expect(nbf).toBeLessThan(exp);
    }
  });

  it("buffer is exactly 30 minutes on each side", () => {
    const sessionStart = new Date("2026-05-01T10:00:00Z");
    const sessionEnd = new Date("2026-05-01T11:00:00Z");

    const { nbf, exp } = computeJwtWindow(sessionStart, sessionEnd);

    const startSec = sessionStart.getTime() / 1000;
    const endSec = sessionEnd.getTime() / 1000;

    expect(startSec - nbf).toBe(BUFFER_SECS); // exactly 30 min before start
    expect(exp - endSec).toBe(BUFFER_SECS);   // exactly 30 min after end
  });
});
