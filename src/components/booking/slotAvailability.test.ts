import { describe, it, expect } from "vitest";
import { isBefore, isAfter, addMinutes, format, parseISO } from "date-fns";

/**
 * Pure logic extracted from useAvailability.ts for testability.
 * generateSlots takes availability windows, existing bookings, a duration,
 * a reference date, and "now", and returns available time slots.
 */

interface TimeSlot {
  start: string;
  end: string;
}

interface BookedSlot {
  start: Date;
  end: Date;
}

interface Window {
  start: string; // HH:mm
  end: string;   // HH:mm
}

function generateSlots(
  windows: Window[],
  bookedSlots: BookedSlot[],
  durationMinutes: number,
  date: Date,
  now: Date
): TimeSlot[] {
  const available: TimeSlot[] = [];
  const dateStr = format(date, "yyyy-MM-dd");
  const isToday = dateStr === format(now, "yyyy-MM-dd");

  for (const window of windows) {
    const [startH, startM] = window.start.split(":").map(Number);
    const [endH, endM] = window.end.split(":").map(Number);

    let cursor = new Date(date);
    cursor.setHours(startH, startM, 0, 0);

    const windowEnd = new Date(date);
    windowEnd.setHours(endH, endM, 0, 0);

    while (
      isBefore(addMinutes(cursor, durationMinutes), windowEnd) ||
      addMinutes(cursor, durationMinutes).getTime() === windowEnd.getTime()
    ) {
      const slotEnd = addMinutes(cursor, durationMinutes);

      // Skip past slots
      if (isToday && isBefore(cursor, now)) {
        cursor = addMinutes(cursor, 30);
        continue;
      }

      // Check overlap with booked slots
      const overlaps = bookedSlots.some(
        (b) => isBefore(cursor, b.end) && isAfter(slotEnd, b.start)
      );

      if (!overlaps) {
        available.push({
          start: format(cursor, "HH:mm"),
          end: format(slotEnd, "HH:mm"),
        });
      }

      cursor = addMinutes(cursor, 30);
    }
  }

  return available;
}

describe("generateSlots – slot availability logic", () => {
  // Use a fixed future date to avoid "today" filtering
  const testDate = new Date(2026, 5, 15); // June 15, 2026
  const pastNow = new Date(2026, 5, 15, 0, 0, 0); // midnight, so all slots are in the future

  it("generates correct slots for a simple window", () => {
    const slots = generateSlots(
      [{ start: "09:00", end: "11:00" }],
      [],
      30,
      testDate,
      pastNow
    );
    // 09:00, 09:30, 10:00, 10:30 (4 slots of 30 min fitting in 2h)
    expect(slots).toHaveLength(4);
    expect(slots[0].start).toBe("09:00");
    expect(slots[3].start).toBe("10:30");
    expect(slots[3].end).toBe("11:00");
  });

  it("generates correct slots for 60-minute duration", () => {
    const slots = generateSlots(
      [{ start: "09:00", end: "11:00" }],
      [],
      60,
      testDate,
      pastNow
    );
    // 09:00-10:00, 09:30-10:30, 10:00-11:00 (3 slots with 30-min intervals)
    expect(slots).toHaveLength(3);
    expect(slots[0].start).toBe("09:00");
    expect(slots[2].start).toBe("10:00");
  });

  it("excludes slots that overlap with an existing booking", () => {
    const booked: BookedSlot[] = [
      {
        start: new Date(2026, 5, 15, 10, 0),
        end: new Date(2026, 5, 15, 10, 30),
      },
    ];
    const slots = generateSlots(
      [{ start: "09:00", end: "11:00" }],
      booked,
      30,
      testDate,
      pastNow
    );
    // 09:00, 09:30, 10:30 — 10:00 is booked
    expect(slots).toHaveLength(3);
    expect(slots.map((s) => s.start)).toEqual(["09:00", "09:30", "10:30"]);
  });

  it("excludes overlapping slots for longer duration bookings", () => {
    const booked: BookedSlot[] = [
      {
        start: new Date(2026, 5, 15, 10, 0),
        end: new Date(2026, 5, 15, 11, 0),
      },
    ];
    const slots = generateSlots(
      [{ start: "09:00", end: "12:00" }],
      booked,
      60,
      testDate,
      pastNow
    );
    // 60-min slots at 30-min intervals: 09:00-10:00, 09:30-10:30(overlap), 10:00-11:00(overlap), 10:30-11:30(overlap), 11:00-12:00
    expect(slots.map((s) => s.start)).toEqual(["09:00", "11:00"]);
  });

  it("returns no slots when entire window is booked", () => {
    const booked: BookedSlot[] = [
      {
        start: new Date(2026, 5, 15, 9, 0),
        end: new Date(2026, 5, 15, 11, 0),
      },
    ];
    const slots = generateSlots(
      [{ start: "09:00", end: "11:00" }],
      booked,
      30,
      testDate,
      pastNow
    );
    expect(slots).toHaveLength(0);
  });

  it("handles multiple availability windows", () => {
    const slots = generateSlots(
      [
        { start: "09:00", end: "10:00" },
        { start: "14:00", end: "15:00" },
      ],
      [],
      30,
      testDate,
      pastNow
    );
    // 09:00, 09:30 from first window; 14:00, 14:30 from second
    expect(slots).toHaveLength(4);
    expect(slots[0].start).toBe("09:00");
    expect(slots[2].start).toBe("14:00");
  });

  it("handles multiple bookings across windows", () => {
    const booked: BookedSlot[] = [
      { start: new Date(2026, 5, 15, 9, 0), end: new Date(2026, 5, 15, 9, 30) },
      { start: new Date(2026, 5, 15, 14, 30), end: new Date(2026, 5, 15, 15, 0) },
    ];
    const slots = generateSlots(
      [
        { start: "09:00", end: "10:00" },
        { start: "14:00", end: "15:00" },
      ],
      booked,
      30,
      testDate,
      pastNow
    );
    // 09:30 from first; 14:00 from second
    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.start)).toEqual(["09:30", "14:00"]);
  });

  it("skips past slots when date is today", () => {
    const todayDate = new Date(2026, 5, 15);
    const nowAt1030 = new Date(2026, 5, 15, 10, 30, 0);
    const slots = generateSlots(
      [{ start: "09:00", end: "12:00" }],
      [],
      30,
      todayDate,
      nowAt1030
    );
    // Only slots from 10:30 onwards: 10:30, 11:00, 11:30
    expect(slots[0].start).toBe("10:30");
    expect(slots).toHaveLength(3);
  });

  it("returns empty array for empty windows", () => {
    const slots = generateSlots([], [], 30, testDate, pastNow);
    expect(slots).toHaveLength(0);
  });

  it("returns empty when duration exceeds window", () => {
    const slots = generateSlots(
      [{ start: "09:00", end: "09:30" }],
      [],
      60,
      testDate,
      pastNow
    );
    expect(slots).toHaveLength(0);
  });
});

describe("formatTimezone", () => {
  it("replaces underscores and includes offset", () => {
    // Just test the pure function logic
    const tz = "America/New_York";
    const formatted = formatTimezoneTestable(tz);
    expect(formatted).toContain("America/New York");
    expect(formatted).toMatch(/\(.*\)/);
  });

  it("handles simple timezone", () => {
    const formatted = formatTimezoneTestable("UTC");
    expect(formatted).toContain("UTC");
  });
});

function formatTimezoneTestable(tz: string): string {
  try {
    const offset = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    return `${tz.replace(/_/g, " ")} (${offset || ""})`;
  } catch {
    return tz;
  }
}
