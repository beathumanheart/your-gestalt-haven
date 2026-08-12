/**
 * The slug is the only secret guarding a session room. These tests hold it to
 * capability-token standards, and pin the join-window state machine the SPA
 * and the edge function both read from.
 */

import { describe, expect, it } from "vitest";

import {
  generateSlug,
  isValidSlug,
  shortLink,
  SLUG_ALPHABET,
  SLUG_LENGTH,
} from "@edge/slug.ts";
import {
  JOIN_CLOSES_AFTER_MS,
  JOIN_OPENS_BEFORE_MS,
  msUntilOpen,
  resolveJoinState,
} from "@edge/joinWindow.ts";
import { makeBooking } from "./fixtures/booking";

const booking = makeBooking();
const START = new Date(booking.start_time);
const END = new Date(booking.end_time);

const at = (offsetMs: number, from: Date = START) => new Date(from.getTime() + offsetMs);

describe("slug generation", () => {
  it("produces a 12-character base62 string", () => {
    for (let i = 0; i < 50; i++) {
      const slug = generateSlug();
      expect(slug).toHaveLength(SLUG_LENGTH);
      expect(slug).toMatch(/^[0-9A-Za-z]{12}$/);
      for (const ch of slug) expect(SLUG_ALPHABET).toContain(ch);
    }
  });

  it("is not sequential or derived from anything guessable", () => {
    const slugs = Array.from({ length: 2000 }, () => generateSlug());
    expect(new Set(slugs).size).toBe(slugs.length);

    // Every alphabet character should appear somewhere across 24k draws —
    // a modulo-bias regression would starve the tail of the alphabet.
    const seen = new Set(slugs.join("").split(""));
    expect(seen.size).toBe(SLUG_ALPHABET.length);
  });

  it("rejects anything that isn't a slug, including injection attempts", () => {
    for (const bad of [
      "",
      "short",
      "waytoolongtobeaslug",
      "k3Qm9ZpX2vT!",
      "k3Qm9ZpX2vT ",
      "*",
      "abc,def.ghi)",
      null,
      undefined,
      42,
    ]) {
      expect(isValidSlug(bad)).toBe(false);
    }
    expect(isValidSlug(generateSlug())).toBe(true);
  });
});

describe("short links", () => {
  it("stay well under the 60-character budget", () => {
    const join = shortLink("https://humanheart.life", "s", generateSlug());
    const cancel = shortLink("https://humanheart.life", "c", generateSlug());
    expect(join.length).toBeLessThan(60);
    expect(cancel.length).toBeLessThan(60);
    expect(join).toMatch(/^https:\/\/humanheart\.life\/s\/[0-9A-Za-z]{12}$/);
    expect(cancel).toMatch(/^https:\/\/humanheart\.life\/c\/[0-9A-Za-z]{12}$/);
  });

  it("tolerates a trailing slash on the configured site URL", () => {
    expect(shortLink("https://humanheart.life/", "s", "k3Qm9ZpX2vTb")).toBe(
      "https://humanheart.life/s/k3Qm9ZpX2vTb"
    );
  });
});

describe("join window", () => {
  const state = (now: Date, status = "confirmed") =>
    resolveJoinState({
      status,
      startTime: booking.start_time,
      endTime: booking.end_time,
      now,
    });

  it("is closed a day early", () => {
    expect(state(at(-24 * 60 * 60 * 1000))).toBe("early");
  });

  it("is closed one millisecond before the 15-minute mark", () => {
    expect(state(at(-JOIN_OPENS_BEFORE_MS - 1))).toBe("early");
  });

  it("opens exactly 15 minutes before start", () => {
    expect(state(at(-JOIN_OPENS_BEFORE_MS))).toBe("open");
  });

  it("stays open through the session", () => {
    expect(state(START)).toBe("open");
    expect(state(at(25 * 60 * 1000))).toBe("open");
    expect(state(END)).toBe("open");
  });

  it("tolerates a 30-minute overrun", () => {
    expect(state(at(JOIN_CLOSES_AFTER_MS, END))).toBe("open");
  });

  it("closes after the overrun grace", () => {
    expect(state(at(JOIN_CLOSES_AFTER_MS + 1, END))).toBe("expired");
  });

  it("is closed for a cancelled booking even inside the window", () => {
    expect(state(START, "cancelled")).toBe("cancelled");
  });

  it("reports how long until the link opens", () => {
    expect(msUntilOpen(booking.start_time, at(-60 * 60 * 1000))).toBe(
      60 * 60 * 1000 - JOIN_OPENS_BEFORE_MS
    );
    expect(msUntilOpen(booking.start_time, START)).toBe(0);
    expect(msUntilOpen(booking.start_time, at(JOIN_CLOSES_AFTER_MS, END))).toBe(0);
  });

  it("handles the October DST transition without drifting an hour", () => {
    // Stored as UTC, so the transition is a non-event — but a regression to
    // local-time arithmetic would show up as a 60-minute offset here.
    const dstBooking = {
      status: "confirmed",
      startTime: "2026-10-27T10:00:00+00:00",
      endTime: "2026-10-27T10:50:00+00:00",
    };
    expect(
      resolveJoinState({ ...dstBooking, now: new Date("2026-10-27T09:44:59Z") })
    ).toBe("early");
    expect(
      resolveJoinState({ ...dstBooking, now: new Date("2026-10-27T09:45:00Z") })
    ).toBe("open");
    expect(
      resolveJoinState({ ...dstBooking, now: new Date("2026-10-27T11:20:01Z") })
    ).toBe("expired");
  });
});
