/**
 * When a short link actually opens the room.
 *
 * The link is minted at booking time but the session may be days away, so the
 * decision is made at click time and the JWT is only signed inside the window.
 */

export const JOIN_OPENS_BEFORE_MS = 15 * 60 * 1000; // 15 min before start
export const JOIN_CLOSES_AFTER_MS = 30 * 60 * 1000; // 30 min after end

export type JoinState = "early" | "open" | "expired" | "cancelled";

export interface JoinWindowInput {
  status: string;
  startTime: string | Date;
  endTime: string | Date;
  now?: Date;
}

export function resolveJoinState({
  status,
  startTime,
  endTime,
  now = new Date(),
}: JoinWindowInput): JoinState {
  if (status === "cancelled") return "cancelled";

  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const t = now.getTime();

  if (t < start - JOIN_OPENS_BEFORE_MS) return "early";
  if (t > end + JOIN_CLOSES_AFTER_MS) return "expired";
  return "open";
}

/** Milliseconds until the room opens; 0 once it is open or past. */
export function msUntilOpen(startTime: string | Date, now: Date = new Date()): number {
  const opensAt = new Date(startTime).getTime() - JOIN_OPENS_BEFORE_MS;
  return Math.max(0, opensAt - now.getTime());
}
