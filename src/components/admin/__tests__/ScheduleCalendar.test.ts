import { describe, it, expect } from "vitest";
import { addMonths, getMonth, getYear, format, isWithinInterval } from "date-fns";
import { buildHeaderLabel } from "../ScheduleCalendar";
import { buildMonthGrid } from "@/lib/scheduleCalendar";
import { availabilityEN, availabilityRU } from "@/content/availability";

// ─── buildHeaderLabel ─────────────────────────────────────────────────────────

describe("buildHeaderLabel", () => {
  it("single month: returns 'MMMM yyyy'", () => {
    const may = new Date(2026, 4, 1);
    expect(buildHeaderLabel(may, null)).toBe("May 2026");
  });

  it("two months, same year: 'May – June 2026'", () => {
    const may  = new Date(2026, 4, 1);
    const june = new Date(2026, 5, 1);
    expect(buildHeaderLabel(may, june)).toBe("May – June 2026");
  });

  it("two months, cross-year: 'December 2026 – January 2027'", () => {
    const dec = new Date(2026, 11, 1);
    const jan = new Date(2027, 0, 1);
    expect(buildHeaderLabel(dec, jan)).toBe("December 2026 – January 2027");
  });

  it("second month is always first + 1 when derived correctly", () => {
    const base   = new Date(2026, 4, 1); // May
    const second = addMonths(base, 1);   // June
    const label  = buildHeaderLabel(base, second);
    expect(label).toContain("May");
    expect(label).toContain("June");
    expect(label).toContain("2026");
  });
});

// ─── Two-month derived state ──────────────────────────────────────────────────

describe("two-month navigation derivation", () => {
  it("second month is always addMonths(displayMonth, 1)", () => {
    const base = new Date(2026, 4, 1); // May
    const next = addMonths(base, 1);
    expect(getMonth(next)).toBe(5); // June = index 5
    expect(getYear(next)).toBe(2026);
  });

  it("clicking next: displayMonth shifts forward by 1, second month follows", () => {
    let display = new Date(2026, 4, 1); // May
    display = addMonths(display, 1);     // simulate next click
    const second = addMonths(display, 1);
    expect(format(display, "MMMM yyyy")).toBe("June 2026");
    expect(format(second,  "MMMM yyyy")).toBe("July 2026");
  });

  it("clicking prev: displayMonth shifts backward by 1, second month follows", () => {
    let display = new Date(2026, 4, 1); // May
    display = addMonths(display, -1);    // simulate prev click
    const second = addMonths(display, 1);
    expect(format(display, "MMMM yyyy")).toBe("April 2026");
    expect(format(second,  "MMMM yyyy")).toBe("May 2026");
  });

  it("cross-year: December → second month is January of next year", () => {
    const display = new Date(2026, 11, 1); // December 2026
    const second  = addMonths(display, 1);
    expect(format(display, "MMMM yyyy")).toBe("December 2026");
    expect(format(second,  "MMMM yyyy")).toBe("January 2027");
  });
});

// ─── Cross-month range logic ──────────────────────────────────────────────────

describe("cross-month range selection logic", () => {
  it("range spanning two months: start in May, end in June", () => {
    const startDate = new Date(2026, 4, 25); // May 25
    const endDate   = new Date(2026, 5, 8);  // Jun 8

    const start = startDate <= endDate ? startDate : endDate;
    const end   = startDate <= endDate ? endDate : startDate;

    expect(format(start, "yyyy-MM-dd")).toBe("2026-05-25");
    expect(format(end,   "yyyy-MM-dd")).toBe("2026-06-08");
  });

  it("range is order-independent: clicking end before start still produces correct order", () => {
    const firstClick  = new Date(2026, 5, 8);  // Jun 8 (clicked first)
    const secondClick = new Date(2026, 4, 25); // May 25 (clicked second)

    const start = firstClick <= secondClick ? firstClick : secondClick;
    const end   = firstClick <= secondClick ? secondClick : firstClick;

    expect(format(start, "yyyy-MM-dd")).toBe("2026-05-25");
    expect(format(end,   "yyyy-MM-dd")).toBe("2026-06-08");
  });

  it("single-day range: start equals end when same date clicked twice", () => {
    const date = new Date(2026, 4, 15);
    const start = date <= date ? date : date;
    const end   = date <= date ? date : date;
    expect(format(start, "yyyy-MM-dd")).toBe(format(end, "yyyy-MM-dd"));
  });

  it("previewInterval covers all dates between start and hover", () => {
    const rangeStart = new Date(2026, 4, 25);
    const hoverDate  = new Date(2026, 5, 8);
    const interval = { start: rangeStart, end: hoverDate };

    expect(isWithinInterval(new Date(2026, 4, 30), interval)).toBe(true);  // May 30 — in left month
    expect(isWithinInterval(new Date(2026, 5, 1),  interval)).toBe(true);  // Jun 1  — in right month
    expect(isWithinInterval(new Date(2026, 4, 24), interval)).toBe(false); // May 24 — before range
    expect(isWithinInterval(new Date(2026, 5, 9),  interval)).toBe(false); // Jun 9  — after range
  });
});

// ─── Month grid integrity for both months ────────────────────────────────────

describe("buildMonthGrid for both displayed months", () => {
  it("left month (May 2026) contains all 31 days", () => {
    const dates = buildMonthGrid(2026, 4).flat().filter(Boolean);
    expect(dates).toHaveLength(31);
  });

  it("right month (June 2026) contains all 30 days", () => {
    const dates = buildMonthGrid(2026, 5).flat().filter(Boolean);
    expect(dates).toHaveLength(30);
  });

  it("left month trailing nulls do not bleed into right month", () => {
    // May 2026 ends on a Sunday (dow=0), so last row has trailing nulls for Mon–Sat
    const grid = buildMonthGrid(2026, 4);
    const lastRow = grid[grid.length - 1];
    // Index loop rather than findLastIndex: that is ES2023, and widening the
    // app's `lib` to reach it would tell the compiler the browser provides
    // methods it may not.
    let lastDateIdx = -1;
    for (let i = 0; i < lastRow.length; i++) {
      if (lastRow[i] !== null) lastDateIdx = i;
    }
    // All cells after the last real date should be null
    for (let i = lastDateIdx + 1; i < 7; i++) {
      expect(lastRow[i]).toBeNull();
    }
  });

  it("right month leading nulls do not bleed into left month", () => {
    // June 2026 starts on Monday (dow=1), so col 0 (Sunday) is null
    const grid = buildMonthGrid(2026, 5);
    const firstRow = grid[0];
    expect(firstRow[0]).toBeNull();         // Sunday padding
    expect(firstRow[1]).not.toBeNull();     // Monday June 1
    expect(firstRow[1]!.getDate()).toBe(1);
  });
});

// ─── i18n regression ─────────────────────────────────────────────────────────

describe("availability i18n — calendar keys", () => {
  it("EN: all calendar keys are non-empty", () => {
    const calKeys = Object.keys(availabilityEN).filter((k) => k.startsWith("calendar"));
    for (const key of calKeys) {
      expect(
        availabilityEN[key as keyof typeof availabilityEN],
        `EN missing: ${key}`
      ).toBeTruthy();
    }
  });

  it("RU: all calendar keys are non-empty", () => {
    const calKeys = Object.keys(availabilityRU).filter((k) => k.startsWith("calendar"));
    for (const key of calKeys) {
      expect(
        availabilityRU[key as keyof typeof availabilityRU],
        `RU missing: ${key}`
      ).toBeTruthy();
    }
  });

  it("RU has same calendar keys as EN", () => {
    const enKeys = Object.keys(availabilityEN).filter((k) => k.startsWith("calendar")).sort();
    const ruKeys = Object.keys(availabilityRU).filter((k) => k.startsWith("calendar")).sort();
    expect(ruKeys).toEqual(enKeys);
  });
});
