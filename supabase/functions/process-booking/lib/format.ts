/** Date/time formatting shared by the email bodies and the .ics builder. */

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** iCalendar UTC timestamp — always with the Z suffix, never floating local. */
export function toIcsDateUtc(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}` +
    `T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}${pad2(date.getUTCSeconds())}Z`
  );
}

export function formatDateLong(date: Date, timeZone?: string): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatTimeWithTz(
  date: Date,
  tz: string
): { time24: string; tzLabel: string } {
  const cityName = tz.split("/").pop()?.replace(/_/g, " ") || tz;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(date);
    let offsetPart = parts.find((p) => p.type === "timeZoneName")?.value || "";
    // "GMT" alone means GMT+0 — normalize it
    if (offsetPart === "GMT") offsetPart = "GMT+0";
    return {
      time24: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: tz,
      }),
      tzLabel: `${cityName}, ${offsetPart}`,
    };
  } catch {
    return {
      time24: date.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      tzLabel: cityName,
    };
  }
}
