import { describe, it, expect } from "vitest";
import { classifyDay, buildMonthGrid } from "../scheduleCalendar";
import type { DateOverride } from "../availability";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TODAY = new Date(2026, 3, 25); // 2026-04-25 (Saturday = dow 6)
TODAY.setHours(0, 0, 0, 0);

const HORIZON = new Date(TODAY);
HORIZON.setDate(TODAY.getDate() + 90);
HORIZON.setHours(23, 59, 59, 999);

const MON_WED_FRI = new Set([1, 3, 5]); // Mon, Wed, Fri

function makeOverride(overrides: Partial<DateOverride>): DateOverride {
  return {
    id: "ov-1",
    override_date: "2026-04-28",
    end_date: "2026-04-28",
    is_available: false,
    start_time: null,
    end_time: null,
    reason: null,
    deleted_at: null,
    buffer_minutes: 0,
    ...overrides,
  };
}

// ─── classifyDay ─────────────────────────────────────────────────────────────

describe("classifyDay", () => {
  it("returns 'past' for dates before today", () => {
    const yesterday = new Date(2026, 3, 24);
    const state = classifyDay(yesterday, MON_WED_FRI, [], TODAY, HORIZON);
    expect(state.kind).toBe("past");
  });

  it("returns 'beyond-horizon' for dates past the horizon", () => {
    const far = new Date(2026, 9, 1); // Oct 1 — well beyond 90 days
    const state = classifyDay(far, MON_WED_FRI, [], TODAY, HORIZON);
    expect(state.kind).toBe("beyond-horizon");
  });

  it("returns 'open' for today when it matches an active day-of-week rule", () => {
    // TODAY is Saturday (dow=6) — not in MON_WED_FRI
    // Use a Monday instead
    const monday = new Date(2026, 3, 27); // Mon
    const state = classifyDay(monday, MON_WED_FRI, [], TODAY, HORIZON);
    expect(state.kind).toBe("open");
  });

  it("returns 'closed' for a future date with no matching rule", () => {
    // Saturday 2026-04-25 is today; use Sunday 2026-04-26
    const sunday = new Date(2026, 3, 26);
    const state = classifyDay(sunday, MON_WED_FRI, [], TODAY, HORIZON);
    expect(state.kind).toBe("closed");
  });

  it("returns 'closed-override' when a closed override covers the date", () => {
    const date = new Date(2026, 3, 28); // Tue Apr 28
    const ov = makeOverride({ override_date: "2026-04-28", end_date: "2026-04-28", is_available: false });
    const state = classifyDay(date, MON_WED_FRI, [ov], TODAY, HORIZON);
    expect(state.kind).toBe("closed-override");
    expect(state.override?.id).toBe("ov-1");
  });

  it("returns 'open-override' when an open override covers the date", () => {
    const date = new Date(2026, 3, 26); // Sun Apr 26 — not a rule day
    const ov = makeOverride({
      override_date: "2026-04-26",
      end_date: "2026-04-26",
      is_available: true,
      start_time: "10:00",
      end_time: "14:00",
    });
    const state = classifyDay(date, MON_WED_FRI, [ov], TODAY, HORIZON);
    expect(state.kind).toBe("open-override");
  });

  it("ignores soft-deleted overrides", () => {
    const date = new Date(2026, 3, 28); // Tue — not a rule day
    const deleted = makeOverride({
      override_date: "2026-04-28",
      end_date: "2026-04-28",
      is_available: false,
      deleted_at: "2026-04-20T00:00:00.000Z",
    });
    const state = classifyDay(date, MON_WED_FRI, [deleted], TODAY, HORIZON);
    // Tuesday not in MON_WED_FRI → should fall through to 'closed'
    expect(state.kind).toBe("closed");
  });

  it("open override wins over closed when both cover the same date", () => {
    const date = new Date(2026, 3, 28);
    const closed = makeOverride({ id: "closed", override_date: "2026-04-28", end_date: "2026-04-28", is_available: false });
    const open = makeOverride({ id: "open", override_date: "2026-04-28", end_date: "2026-04-28", is_available: true });
    const state = classifyDay(date, MON_WED_FRI, [closed, open], TODAY, HORIZON);
    expect(state.kind).toBe("open-override");
  });

  it("classifies today itself as 'open' (not past) when rule matches", () => {
    // Make a set that includes Saturday (6) = TODAY
    const state = classifyDay(TODAY, new Set([6]), [], TODAY, HORIZON);
    expect(state.kind).toBe("open");
  });

  it("classifies the horizon date itself as 'open' (not beyond)", () => {
    const horizonDay = new Date(HORIZON);
    horizonDay.setHours(0, 0, 0, 0);
    // Use a set that includes that day-of-week
    const dow = horizonDay.getDay();
    const state = classifyDay(horizonDay, new Set([dow]), [], TODAY, HORIZON);
    expect(state.kind).toBe("open");
  });

  it("classifies the day after horizon as 'beyond-horizon'", () => {
    const beyondDay = new Date(HORIZON);
    beyondDay.setDate(beyondDay.getDate() + 1);
    beyondDay.setHours(0, 0, 0, 0);
    const dow = beyondDay.getDay();
    const state = classifyDay(beyondDay, new Set([dow]), [], TODAY, HORIZON);
    expect(state.kind).toBe("beyond-horizon");
  });
});

// ─── buildMonthGrid ───────────────────────────────────────────────────────────

describe("buildMonthGrid", () => {
  it("contains every day of the month exactly once", () => {
    const grid = buildMonthGrid(2026, 3); // April 2026
    const dates = grid.flat().filter(Boolean) as Date[];
    const dayNums = dates.map((d) => d.getDate()).sort((a, b) => a - b);
    expect(dayNums).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
  });

  it("places the 1st of April 2026 in the correct column (Wednesday = col 3)", () => {
    // April 1 2026 is a Wednesday (dow=3), so columns 0-2 are null
    const grid = buildMonthGrid(2026, 3);
    const firstRow = grid[0];
    expect(firstRow[0]).toBeNull(); // Sun
    expect(firstRow[1]).toBeNull(); // Mon
    expect(firstRow[2]).toBeNull(); // Tue
    expect(firstRow[3]).not.toBeNull(); // Wed Apr 1
    expect(firstRow[3]!.getDate()).toBe(1);
  });

  it("all rows have exactly 7 cells", () => {
    const grid = buildMonthGrid(2026, 3);
    for (const row of grid) expect(row).toHaveLength(7);
  });

  it("total cell count is a multiple of 7", () => {
    const grid = buildMonthGrid(2026, 3);
    expect(grid.flat().length % 7).toBe(0);
  });

  it("works for February in a leap year", () => {
    const grid = buildMonthGrid(2028, 1); // Feb 2028 — leap year, 29 days
    const dates = grid.flat().filter(Boolean) as Date[];
    expect(dates).toHaveLength(29);
    expect(dates[dates.length - 1].getDate()).toBe(29);
  });

  it("works for January (month starts on Thursday in 2026)", () => {
    // Jan 1 2026 is a Thursday (dow=4)
    const grid = buildMonthGrid(2026, 0);
    const firstRow = grid[0];
    expect(firstRow[0]).toBeNull(); // Sun
    expect(firstRow[4]).not.toBeNull(); // Thu Jan 1
    expect(firstRow[4]!.getDate()).toBe(1);
  });
});
