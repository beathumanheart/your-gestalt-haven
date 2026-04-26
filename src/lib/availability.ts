import { format, addMinutes, isBefore, isAfter } from "date-fns";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DateOverride {
  id: string;
  override_date: string; // yyyy-MM-dd (range start)
  end_date: string;      // yyyy-MM-dd (range end, inclusive)
  is_available: boolean; // false = closed, true = open
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  deleted_at: string | null;
  buffer_minutes: number;
}

export interface AvailabilitySettings {
  bookingHorizonDays: number;
  minimumNoticeHours: number;
}

export interface TimeWindow {
  start: string; // HH:mm
  end: string;   // HH:mm
  buffer_minutes: number;
}

export interface BookedSlot {
  start: Date;
  end: Date;
}

export interface ComputedSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
  disabled?: boolean;
  disabledReason?: "min_notice";
}

// ─── Pure functions ───────────────────────────────────────────────────────────

/**
 * Returns the applicable override for a given date string (yyyy-MM-dd).
 * Ignores soft-deleted rows. Open overrides win over closed if both cover the date.
 */
export function findOverrideForDate(
  dateStr: string,
  overrides: DateOverride[]
): DateOverride | null {
  const matching = overrides.filter(
    (o) =>
      o.deleted_at === null &&
      o.override_date <= dateStr &&
      o.end_date >= dateStr
  );
  if (matching.length === 0) return null;
  return matching.find((o) => o.is_available) ?? matching[0];
}

/**
 * Generates available time slots for a date given resolved time windows,
 * existing bookings, session duration, minimum notice, and the current time.
 *
 * Slots within the minimum notice window are returned as disabled (not removed)
 * so the UI can render them greyed out with a tooltip.
 */
export function computeSlots(
  date: Date,
  windows: TimeWindow[],
  bookedSlots: BookedSlot[],
  durationMinutes: number,
  minimumNoticeHours: number,
  now: Date
): ComputedSlot[] {
  const dateStr = format(date, "yyyy-MM-dd");
  const todayStr = format(now, "yyyy-MM-dd");
  const isToday = dateStr === todayStr;
  const minimumNoticeMs = minimumNoticeHours * 60 * 60 * 1000;
  const available: ComputedSlot[] = [];

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

      // Skip slots that have already passed (today only)
      if (isToday && isBefore(cursor, now)) {
        cursor = addMinutes(cursor, 30);
        continue;
      }

      // Skip slots that overlap existing bookings (including post-booking buffer)
      const overlaps = bookedSlots.some(
        (b) =>
          isBefore(cursor, addMinutes(b.end, window.buffer_minutes)) &&
          isAfter(slotEnd, b.start)
      );

      if (!overlaps) {
        const msUntilSlot = cursor.getTime() - now.getTime();
        const tooSoon = msUntilSlot < minimumNoticeMs;
        available.push({
          start: format(cursor, "HH:mm"),
          end: format(slotEnd, "HH:mm"),
          ...(tooSoon ? { disabled: true, disabledReason: "min_notice" as const } : {}),
        });
      }

      cursor = addMinutes(cursor, 30);
    }
  }

  return available;
}

/**
 * Builds the set of available date strings for a calendar month.
 * Applies: past-date filter, horizon cap, date overrides, weekly rules.
 * Returns the available Set and the computed horizon Date for use in the calendar.
 */
export function buildAvailableDates(
  year: number,
  month: number, // 0-indexed
  activeDaysOfWeek: Set<number>,
  overrides: DateOverride[],
  today: Date,
  horizonDays: number
): { availableDays: Set<string>; horizonDate: Date } {
  const horizonDate = new Date(today);
  horizonDate.setDate(today.getDate() + horizonDays);
  horizonDate.setHours(23, 59, 59, 999);

  const available = new Set<string>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (date < today) continue;
    if (date > horizonDate) continue;

    const dateStr = format(date, "yyyy-MM-dd");
    const override = findOverrideForDate(dateStr, overrides);

    if (override) {
      if (override.is_available) available.add(dateStr);
      // closed override: not added
    } else if (activeDaysOfWeek.has(date.getDay())) {
      available.add(dateStr);
    }
  }

  return { availableDays: available, horizonDate };
}
