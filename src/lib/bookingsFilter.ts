import { parseISO, isAfter, isBefore, startOfDay, endOfDay, addDays } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingRow {
  id: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_email: string;
  status: string;
  notes?: string | null;
  created_at: string;
  session_types?: { name: string; duration_minutes: number } | null;
}

export type TimeRange =
  | "upcoming-90"
  | "today"
  | "this-week"
  | "this-month"
  | "all-upcoming"
  | "custom";

export type SortOption =
  | "soonest"
  | "latest"
  | "newest-booked"
  | "oldest-booked";

export type ProximityGroup = "today" | "this-week" | "this-month" | "later";

// ─── Filters ──────────────────────────────────────────────────────────────────

export function filterByTimeRange(
  bookings: BookingRow[],
  range: TimeRange,
  now: Date,
  customStart?: Date,
  customEnd?: Date
): BookingRow[] {
  const todayStart = startOfDay(now);
  switch (range) {
    case "today":
      return bookings.filter((b) => {
        const s = parseISO(b.start_time);
        return s >= todayStart && s <= endOfDay(now);
      });
    case "this-week":
      return bookings.filter((b) => parseISO(b.start_time) <= addDays(todayStart, 7));
    case "this-month":
      return bookings.filter((b) => parseISO(b.start_time) <= addDays(todayStart, 30));
    case "upcoming-90":
      return bookings.filter((b) => parseISO(b.start_time) <= addDays(todayStart, 90));
    case "all-upcoming":
      return bookings;
    case "custom":
      return bookings.filter((b) => {
        const s = parseISO(b.start_time);
        return (
          (!customStart || s >= startOfDay(customStart)) &&
          (!customEnd || s <= endOfDay(customEnd))
        );
      });
    default:
      return bookings;
  }
}

export function filterByStatus(
  bookings: BookingRow[],
  statuses: Set<string>
): BookingRow[] {
  if (statuses.size === 0) return bookings;
  return bookings.filter((b) => statuses.has(b.status));
}

// Case-insensitive substring match across name, email, notes
export function filterBySearch(bookings: BookingRow[], query: string): BookingRow[] {
  if (!query.trim()) return bookings;
  const q = query.toLowerCase();
  return bookings.filter(
    (b) =>
      b.client_name.toLowerCase().includes(q) ||
      b.client_email.toLowerCase().includes(q) ||
      (b.notes ?? "").toLowerCase().includes(q)
  );
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export function sortBookings(bookings: BookingRow[], sort: SortOption): BookingRow[] {
  const copy = [...bookings];
  switch (sort) {
    case "soonest":
      return copy.sort(
        (a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
      );
    case "latest":
      return copy.sort(
        (a, b) => parseISO(b.start_time).getTime() - parseISO(a.start_time).getTime()
      );
    case "newest-booked":
      return copy.sort(
        (a, b) => parseISO(b.created_at).getTime() - parseISO(a.created_at).getTime()
      );
    case "oldest-booked":
      return copy.sort(
        (a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime()
      );
  }
}

// ─── Time-proximity grouping ──────────────────────────────────────────────────

export function getProximityGroup(startTime: Date, now: Date): ProximityGroup {
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  if (startTime >= todayStart && startTime <= todayEnd) return "today";
  if (startTime <= addDays(todayStart, 7)) return "this-week";
  if (startTime <= addDays(todayStart, 30)) return "this-month";
  return "later";
}

export function groupByProximity(
  bookings: BookingRow[],
  now: Date
): Map<ProximityGroup, BookingRow[]> {
  const groups = new Map<ProximityGroup, BookingRow[]>([
    ["today", []],
    ["this-week", []],
    ["this-month", []],
    ["later", []],
  ]);
  for (const b of bookings) {
    const group = getProximityGroup(parseISO(b.start_time), now);
    groups.get(group)!.push(b);
  }
  return groups;
}

// ─── Archive cutoff ───────────────────────────────────────────────────────────

// A booking is "past" only when its end_time has passed (not start_time)
// so an in-progress session still shows in upcoming.
export function isUpcoming(booking: BookingRow, now: Date): boolean {
  return isAfter(parseISO(booking.end_time), now);
}

export function isPast(booking: BookingRow, now: Date): boolean {
  return isBefore(parseISO(booking.end_time), now);
}

// NOTE: For now, all filtering other than upcoming/archive split is client-side.
// The DB query only fetches the upcoming or past set (end_time based cutoff).
// When booking volume grows, push time-range and status filters to the DB query.
