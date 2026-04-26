import { describe, it, expect } from "vitest";
import {
  findOverrideForDate,
  computeSlots,
  buildAvailableDates,
} from "@/lib/availability";
import type { DateOverride, TimeWindow, BookedSlot } from "@/lib/availability";

// ─── Fixtures ────────────────────────────────────────────────────────────────

function makeOverride(partial: Partial<DateOverride>): DateOverride {
  return {
    id: "test-id",
    override_date: "2026-06-10",
    end_date: "2026-06-10",
    is_available: false,
    start_time: null,
    end_time: null,
    reason: null,
    deleted_at: null,
    buffer_minutes: 0,
    ...partial,
  };
}

const WINDOW_9_17: TimeWindow = { start: "09:00", end: "17:00", buffer_minutes: 0 };
const WINDOW_10_12: TimeWindow = { start: "10:00", end: "12:00", buffer_minutes: 0 };
// Use local-time constructors so setHours() in computeSlots matches the booked slot times
const NOW_8AM = new Date(2026, 5, 10, 8, 0, 0);    // June 10, 08:00 local
const DATE_JUN_10 = new Date(2026, 5, 10, 0, 0, 0); // June 10, midnight local — a Wednesday

// ─── findOverrideForDate ──────────────────────────────────────────────────────

describe("findOverrideForDate", () => {
  it("returns null when no overrides", () => {
    expect(findOverrideForDate("2026-06-10", [])).toBeNull();
  });

  it("returns the matching single-day closed override", () => {
    const o = makeOverride({ override_date: "2026-06-10", end_date: "2026-06-10", is_available: false });
    expect(findOverrideForDate("2026-06-10", [o])).toEqual(o);
  });

  it("matches a date in the middle of a range", () => {
    const o = makeOverride({ override_date: "2026-06-08", end_date: "2026-06-15", is_available: false });
    expect(findOverrideForDate("2026-06-10", [o])).toEqual(o);
  });

  it("does not match a date outside the range", () => {
    const o = makeOverride({ override_date: "2026-06-08", end_date: "2026-06-09", is_available: false });
    expect(findOverrideForDate("2026-06-10", [o])).toBeNull();
  });

  it("ignores soft-deleted overrides", () => {
    const o = makeOverride({ deleted_at: "2026-06-01T00:00:00Z" });
    expect(findOverrideForDate("2026-06-10", [o])).toBeNull();
  });

  it("open override wins over closed when both cover the date", () => {
    const closed = makeOverride({ id: "closed", is_available: false });
    const open = makeOverride({ id: "open", is_available: true, start_time: "10:00", end_time: "12:00" });
    const result = findOverrideForDate("2026-06-10", [closed, open]);
    expect(result?.id).toBe("open");
  });
});

// ─── computeSlots ────────────────────────────────────────────────────────────

describe("computeSlots", () => {
  it("returns slots for a normal date with no bookings", () => {
    const slots = computeSlots(DATE_JUN_10, [WINDOW_10_12], [], 60, 0, NOW_8AM);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].start).toBe("10:00");
    expect(slots[0].disabled).toBeFalsy();
  });

  it("slots within minimum notice window are marked disabled with min_notice reason", () => {
    // now = 09:00 local, min notice = 2h → slots before 11:00 are too soon
    const now = new Date(2026, 5, 10, 9, 0, 0);
    const slots = computeSlots(DATE_JUN_10, [WINDOW_9_17], [], 60, 2, now);
    const disabled = slots.filter((s) => s.disabled);
    const enabled = slots.filter((s) => !s.disabled);
    expect(disabled.length).toBeGreaterThan(0);
    expect(disabled.every((s) => s.disabledReason === "min_notice")).toBe(true);
    expect(enabled.length).toBeGreaterThan(0);
    // enabled slots should start at 11:00 or later
    enabled.forEach((s) => {
      expect(s.start >= "11:00").toBe(true);
    });
  });

  it("slot outside minimum notice window is not disabled", () => {
    const now = new Date(2026, 5, 10, 7, 0, 0); // 7am local, min notice = 0h → all slots ok
    const slots = computeSlots(DATE_JUN_10, [WINDOW_9_17], [], 60, 0, now);
    expect(slots.every((s) => !s.disabled)).toBe(true);
  });

  it("skips past slots on the same day", () => {
    // now = 10:30 local, date is today → 10:00 slot should be skipped
    const now = new Date(2026, 5, 10, 10, 30, 0);
    const slots = computeSlots(DATE_JUN_10, [WINDOW_10_12], [], 60, 0, now);
    expect(slots.find((s) => s.start === "10:00")).toBeUndefined();
  });

  it("returns empty array when window is too short for one slot", () => {
    const tinyWindow: TimeWindow = { start: "10:00", end: "10:30", buffer_minutes: 0 };
    const slots = computeSlots(DATE_JUN_10, [tinyWindow], [], 60, 0, NOW_8AM);
    expect(slots).toHaveLength(0);
  });

  it("filters out slots overlapping a booked slot", () => {
    const booked: BookedSlot = {
      start: new Date(2026, 5, 10, 10, 0, 0), // June 10, 10:00 local
      end: new Date(2026, 5, 10, 11, 0, 0),   // June 10, 11:00 local
    };
    const slots = computeSlots(DATE_JUN_10, [WINDOW_10_12], [booked], 60, 0, NOW_8AM);
    expect(slots.find((s) => s.start === "10:00")).toBeUndefined();
    // 11:00 slot should still exist
    expect(slots.find((s) => s.start === "11:00")).toBeDefined();
  });
});

// ─── buildAvailableDates ──────────────────────────────────────────────────────

describe("buildAvailableDates", () => {
  // June 2026 — day 10 is Wednesday (3), day 1 is Monday (1)
  const june2026Today = new Date(2026, 5, 1); // June 1, not in past

  it("includes weekdays matching active rules when no overrides", () => {
    const activeDays = new Set([3]); // Wednesday
    const { availableDays } = buildAvailableDates(2026, 5, activeDays, [], june2026Today, 180);
    expect(availableDays.has("2026-06-10")).toBe(true); // Jun 10 = Wednesday
    expect(availableDays.has("2026-06-09")).toBe(false); // Jun 9 = Tuesday
  });

  it("excludes dates beyond the horizon", () => {
    const activeDays = new Set([3]); // Wednesday
    // horizon = 8 days from June 1 → cap at June 9
    const { availableDays } = buildAvailableDates(2026, 5, activeDays, [], june2026Today, 8);
    expect(availableDays.has("2026-06-10")).toBe(false); // June 10 is beyond horizon
    expect(availableDays.has("2026-06-03")).toBe(true);  // June 3 is Wednesday within horizon
  });

  it("closed override removes the date from available set", () => {
    const activeDays = new Set([3]); // Wednesday
    const closed = makeOverride({ override_date: "2026-06-10", end_date: "2026-06-10", is_available: false });
    const { availableDays } = buildAvailableDates(2026, 5, activeDays, [closed], june2026Today, 180);
    expect(availableDays.has("2026-06-10")).toBe(false);
  });

  it("open override adds a date not in weekly schedule", () => {
    const activeDays = new Set([3]); // Wednesday
    // June 9 is Tuesday — not a Wednesday, but open override makes it available
    const open = makeOverride({
      override_date: "2026-06-09",
      end_date: "2026-06-09",
      is_available: true,
      start_time: "10:00",
      end_time: "12:00",
    });
    const { availableDays } = buildAvailableDates(2026, 5, activeDays, [open], june2026Today, 180);
    expect(availableDays.has("2026-06-09")).toBe(true);
  });

  it("soft-deleted override is ignored", () => {
    const activeDays = new Set([3]); // Wednesday
    const deleted = makeOverride({
      override_date: "2026-06-10",
      end_date: "2026-06-10",
      is_available: false,
      deleted_at: "2026-06-01T00:00:00Z",
    });
    const { availableDays } = buildAvailableDates(2026, 5, activeDays, [deleted], june2026Today, 180);
    // June 10 is Wednesday and override is deleted, so it should be available
    expect(availableDays.has("2026-06-10")).toBe(true);
  });

  it("past dates are excluded regardless of rules", () => {
    const activeDays = new Set([1, 2, 3, 4, 5]); // Mon–Fri
    const today = new Date(2026, 5, 15); // June 15
    const { availableDays } = buildAvailableDates(2026, 5, activeDays, [], today, 180);
    expect(availableDays.has("2026-06-01")).toBe(false);
  });

  it("returns correct horizonDate", () => {
    const activeDays = new Set<number>();
    const today = new Date(2026, 5, 1);
    const { horizonDate } = buildAvailableDates(2026, 5, activeDays, [], today, 30);
    // horizonDate should be June 1 + 30 days = July 1
    expect(horizonDate.getFullYear()).toBe(2026);
    expect(horizonDate.getMonth()).toBe(6); // July = month 6
    expect(horizonDate.getDate()).toBe(1);
  });
});

// ─── i18n regression ─────────────────────────────────────────────────────────

import { availabilityEN, availabilityRU } from "@/content/availability";
import type { AvailabilityContent } from "@/content/availability";
import { bookingEN, bookingRU } from "@/content/booking";
import type { BookingContent } from "@/content/booking";

describe("i18n completeness", () => {
  it("every AvailabilityContent key has a non-empty EN value", () => {
    const keys = Object.keys(availabilityEN) as (keyof AvailabilityContent)[];
    for (const key of keys) {
      expect(availabilityEN[key], `EN missing: ${key}`).toBeTruthy();
    }
  });

  it("every AvailabilityContent key has a non-empty RU value", () => {
    const keys = Object.keys(availabilityEN) as (keyof AvailabilityContent)[];
    for (const key of keys) {
      expect(availabilityRU[key], `RU missing: ${key}`).toBeTruthy();
    }
  });

  it("every BookingContent key has a non-empty EN value", () => {
    const keys = Object.keys(bookingEN) as (keyof BookingContent)[];
    for (const key of keys) {
      expect(bookingEN[key], `EN booking missing: ${key}`).toBeTruthy();
    }
  });

  it("every BookingContent key has a non-empty RU value", () => {
    const keys = Object.keys(bookingEN) as (keyof BookingContent)[];
    for (const key of keys) {
      expect(bookingRU[key], `RU booking missing: ${key}`).toBeTruthy();
    }
  });

  it("RU has same keys as EN for AvailabilityContent", () => {
    const enKeys = Object.keys(availabilityEN).sort();
    const ruKeys = Object.keys(availabilityRU).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
