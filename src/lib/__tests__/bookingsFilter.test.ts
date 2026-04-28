import { describe, it, expect } from "vitest";
import {
  filterByTimeRange,
  filterByStatus,
  filterBySearch,
  sortBookings,
  groupByProximity,
  getProximityGroup,
  isUpcoming,
  isPast,
} from "../bookingsFilter";
import type { BookingRow } from "../bookingsFilter";
import { bookingsAdminEN, bookingsAdminRU } from "@/content/bookingsAdmin";
import type { BookingsAdminContent } from "@/content/bookingsAdmin";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date(2026, 3, 25, 12, 0, 0); // 2026-04-25 12:00 local

function makeBooking(overrides: Partial<BookingRow> & { start_time: string; end_time: string }): BookingRow {
  return {
    id: "test-id",
    client_name: "Alice",
    client_email: "alice@example.com",
    status: "confirmed",
    notes: null,
    created_at: "2026-04-01T10:00:00.000Z",
    session_types: { name: "Therapy", duration_minutes: 50 },
    ...overrides,
  };
}

const todayBooking = makeBooking({
  id: "today",
  start_time: "2026-04-25T14:00:00.000Z",
  end_time: "2026-04-25T14:50:00.000Z",
});

const thisWeekBooking = makeBooking({
  id: "week",
  start_time: "2026-04-28T10:00:00.000Z",
  end_time: "2026-04-28T10:50:00.000Z",
});

const thisMonthBooking = makeBooking({
  id: "month",
  start_time: "2026-05-10T10:00:00.000Z",
  end_time: "2026-05-10T10:50:00.000Z",
});

const laterBooking = makeBooking({
  id: "later",
  start_time: "2026-07-01T10:00:00.000Z",
  end_time: "2026-07-01T10:50:00.000Z",
});

const pastBooking = makeBooking({
  id: "past",
  start_time: "2026-04-10T10:00:00.000Z",
  end_time: "2026-04-10T10:50:00.000Z",
  status: "completed",
});

const allBookings = [todayBooking, thisWeekBooking, thisMonthBooking, laterBooking, pastBooking];

// ─── isUpcoming / isPast ──────────────────────────────────────────────────────

describe("isUpcoming / isPast", () => {
  it("considers a booking upcoming if end_time is after now", () => {
    expect(isUpcoming(todayBooking, NOW)).toBe(true);
  });

  it("considers a booking past if end_time is before now", () => {
    expect(isPast(pastBooking, NOW)).toBe(true);
  });

  it("isUpcoming and isPast are mutually exclusive for clear cases", () => {
    expect(isUpcoming(pastBooking, NOW)).toBe(false);
    expect(isPast(todayBooking, NOW)).toBe(false);
  });
});

// ─── filterByTimeRange ────────────────────────────────────────────────────────

describe("filterByTimeRange", () => {
  const upcomingSet = [todayBooking, thisWeekBooking, thisMonthBooking, laterBooking];

  it("today: returns only today's bookings", () => {
    const result = filterByTimeRange(upcomingSet, "today", NOW);
    expect(result.map((b) => b.id)).toEqual(["today"]);
  });

  it("this-week: returns bookings within 7 days", () => {
    const result = filterByTimeRange(upcomingSet, "this-week", NOW);
    const ids = result.map((b) => b.id);
    expect(ids).toContain("today");
    expect(ids).toContain("week");
    expect(ids).not.toContain("month");
    expect(ids).not.toContain("later");
  });

  it("this-month: returns bookings within 30 days", () => {
    const result = filterByTimeRange(upcomingSet, "this-month", NOW);
    const ids = result.map((b) => b.id);
    expect(ids).toContain("today");
    expect(ids).toContain("week");
    expect(ids).toContain("month");
    expect(ids).not.toContain("later");
  });

  it("all-upcoming: returns all bookings unchanged", () => {
    const result = filterByTimeRange(upcomingSet, "all-upcoming", NOW);
    expect(result).toHaveLength(upcomingSet.length);
  });

  it("custom: filters by customStart/customEnd", () => {
    const from = new Date(2026, 3, 28); // Apr 28
    const to = new Date(2026, 4, 15);   // May 15
    const result = filterByTimeRange(upcomingSet, "custom", NOW, from, to);
    const ids = result.map((b) => b.id);
    expect(ids).toContain("week");
    expect(ids).toContain("month");
    expect(ids).not.toContain("today");
    expect(ids).not.toContain("later");
  });
});

// ─── filterByStatus ───────────────────────────────────────────────────────────

describe("filterByStatus", () => {
  it("empty set returns all bookings", () => {
    expect(filterByStatus(allBookings, new Set())).toHaveLength(allBookings.length);
  });

  it("filters to confirmed only", () => {
    const result = filterByStatus(allBookings, new Set(["confirmed"]));
    expect(result.every((b) => b.status === "confirmed")).toBe(true);
    expect(result.some((b) => b.status === "completed")).toBe(false);
  });

  it("filters to multiple statuses", () => {
    const result = filterByStatus(allBookings, new Set(["confirmed", "completed"]));
    const statuses = new Set(result.map((b) => b.status));
    expect(statuses.has("confirmed")).toBe(true);
    expect(statuses.has("completed")).toBe(true);
    expect(statuses.has("cancelled")).toBe(false);
  });
});

// ─── filterBySearch ───────────────────────────────────────────────────────────

describe("filterBySearch", () => {
  const bob = makeBooking({
    id: "bob",
    start_time: "2026-04-30T10:00:00.000Z",
    end_time: "2026-04-30T10:50:00.000Z",
    client_name: "Bob Smith",
    client_email: "bob@example.com",
    notes: "prefers morning sessions",
  });
  const set = [todayBooking, bob]; // Alice + Bob

  it("empty query returns all", () => {
    expect(filterBySearch(set, "")).toHaveLength(2);
    expect(filterBySearch(set, "  ")).toHaveLength(2);
  });

  it("matches by name (case-insensitive)", () => {
    const result = filterBySearch(set, "alice");
    expect(result.map((b) => b.client_name)).toEqual(["Alice"]);
  });

  it("matches by email", () => {
    const result = filterBySearch(set, "bob@");
    expect(result.map((b) => b.id)).toEqual(["bob"]);
  });

  it("matches by notes", () => {
    const result = filterBySearch(set, "morning");
    expect(result.map((b) => b.id)).toEqual(["bob"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterBySearch(set, "zzz-no-match")).toHaveLength(0);
  });
});

// ─── sortBookings ─────────────────────────────────────────────────────────────

describe("sortBookings", () => {
  const unsorted = [laterBooking, todayBooking, thisMonthBooking, thisWeekBooking];

  it("soonest: ascending by start_time", () => {
    const result = sortBookings(unsorted, "soonest");
    const ids = result.map((b) => b.id);
    expect(ids).toEqual(["today", "week", "month", "later"]);
  });

  it("latest: descending by start_time", () => {
    const result = sortBookings(unsorted, "latest");
    const ids = result.map((b) => b.id);
    expect(ids).toEqual(["later", "month", "week", "today"]);
  });

  it("newest-booked: descending by created_at", () => {
    const a = makeBooking({ id: "a", start_time: "2026-05-01T10:00:00.000Z", end_time: "2026-05-01T10:50:00.000Z", created_at: "2026-04-20T08:00:00.000Z" });
    const b = makeBooking({ id: "b", start_time: "2026-05-02T10:00:00.000Z", end_time: "2026-05-02T10:50:00.000Z", created_at: "2026-04-01T08:00:00.000Z" });
    const result = sortBookings([b, a], "newest-booked");
    expect(result.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("oldest-booked: ascending by created_at", () => {
    const a = makeBooking({ id: "a", start_time: "2026-05-01T10:00:00.000Z", end_time: "2026-05-01T10:50:00.000Z", created_at: "2026-04-20T08:00:00.000Z" });
    const b = makeBooking({ id: "b", start_time: "2026-05-02T10:00:00.000Z", end_time: "2026-05-02T10:50:00.000Z", created_at: "2026-04-01T08:00:00.000Z" });
    const result = sortBookings([a, b], "oldest-booked");
    expect(result.map((x) => x.id)).toEqual(["b", "a"]);
  });

  it("does not mutate the original array", () => {
    const original = [laterBooking, todayBooking];
    sortBookings(original, "soonest");
    expect(original[0].id).toBe("later");
  });
});

// ─── getProximityGroup / groupByProximity ─────────────────────────────────────

describe("getProximityGroup", () => {
  it("classifies today's start as 'today'", () => {
    const start = new Date(2026, 3, 25, 15, 0, 0);
    expect(getProximityGroup(start, NOW)).toBe("today");
  });

  it("classifies within 7 days as 'this-week'", () => {
    const start = new Date(2026, 3, 28, 10, 0, 0);
    expect(getProximityGroup(start, NOW)).toBe("this-week");
  });

  it("classifies within 30 days as 'this-month'", () => {
    const start = new Date(2026, 4, 10, 10, 0, 0);
    expect(getProximityGroup(start, NOW)).toBe("this-month");
  });

  it("classifies beyond 30 days as 'later'", () => {
    const start = new Date(2026, 6, 1, 10, 0, 0);
    expect(getProximityGroup(start, NOW)).toBe("later");
  });
});

describe("groupByProximity", () => {
  it("places bookings into correct groups", () => {
    const result = groupByProximity(
      [todayBooking, thisWeekBooking, thisMonthBooking, laterBooking],
      NOW
    );
    expect(result.get("today")?.map((b) => b.id)).toContain("today");
    expect(result.get("this-week")?.map((b) => b.id)).toContain("week");
    expect(result.get("this-month")?.map((b) => b.id)).toContain("month");
    expect(result.get("later")?.map((b) => b.id)).toContain("later");
  });

  it("returns all four group keys even when empty", () => {
    const result = groupByProximity([], NOW);
    expect(Array.from(result.keys())).toEqual(["today", "this-week", "this-month", "later"]);
  });
});

// ─── i18n regression ─────────────────────────────────────────────────────────

describe("bookingsAdmin i18n", () => {
  const allKeys = Object.keys(bookingsAdminEN) as (keyof BookingsAdminContent)[];

  it("EN: all keys are non-empty strings", () => {
    for (const key of allKeys) {
      expect(bookingsAdminEN[key], `EN missing: ${key}`).toBeTruthy();
    }
  });

  it("RU: all keys are non-empty strings", () => {
    for (const key of allKeys) {
      expect(bookingsAdminRU[key], `RU missing: ${key}`).toBeTruthy();
    }
  });

  it("RU has the same keys as EN", () => {
    const ruKeys = Object.keys(bookingsAdminRU) as (keyof BookingsAdminContent)[];
    expect(ruKeys.sort()).toEqual(allKeys.sort());
  });
});
