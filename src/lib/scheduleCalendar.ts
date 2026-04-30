import { format, eachDayOfInterval, getDay } from "date-fns";
import { findOverrideForDate } from "./availability";
import type { DateOverride } from "./availability";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DayKind =
  | "past"
  | "beyond-horizon"
  | "open-override"
  | "closed-override"
  | "open"
  | "closed";

export interface DayState {
  kind: DayKind;
  override?: DateOverride;
}

// ─── Pure functions ───────────────────────────────────────────────────────────

/**
 * Classifies a single calendar day for the schedule preview.
 * `today` and `horizonDate` must be midnight-normalised by the caller.
 */
export function classifyDay(
  date: Date,
  activeDaysOfWeek: Set<number>,
  overrides: DateOverride[],
  today: Date,
  horizonDate: Date
): DayState {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d < today) return { kind: "past" };
  if (d > horizonDate) return { kind: "beyond-horizon" };

  const dateStr = format(date, "yyyy-MM-dd");
  const override = findOverrideForDate(dateStr, overrides);
  if (override) {
    return override.is_available
      ? { kind: "open-override", override }
      : { kind: "closed-override", override };
  }

  return activeDaysOfWeek.has(date.getDay()) ? { kind: "open" } : { kind: "closed" };
}

/**
 * Returns week rows for a month grid (Sunday-first).
 * Null entries are padding cells before the 1st and after the last day.
 */
export function buildMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = eachDayOfInterval({ start: first, end: last });

  const cells: (Date | null)[] = [
    ...Array<null>(getDay(first)).fill(null),
    ...days,
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}
