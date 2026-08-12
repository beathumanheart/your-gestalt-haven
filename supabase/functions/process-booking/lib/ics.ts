/**
 * iCalendar generation.
 *
 * The client's .ics syncs to whatever calendar service they use — Google,
 * iCloud, a work Exchange account — and is copied to every device on that
 * account. So the client-facing event carries only what is needed to attend:
 * a non-specific summary, the short join link, and the cancel link. The
 * enquiry text the client typed into the booking form never appears here; it
 * stays in the practitioner's notification and the database.
 */

import { toIcsDateUtc } from "./format.ts";

const PRODID = "-//HumanHeartBeat//Booking//EN";

/** RFC 5545 §3.3.11 — escape TEXT values. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** RFC 5545 §3.1 — fold content lines to 75 octets. */
export function foldIcsLine(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;

  const chunks: string[] = [];
  const decoder = new TextDecoder();
  let offset = 0;
  let limit = 75;
  while (offset < bytes.length) {
    let end = Math.min(offset + limit, bytes.length);
    // Never split a multi-byte UTF-8 sequence.
    while (end > offset && end < bytes.length && (bytes[end] & 0xc0) === 0x80) end--;
    chunks.push(decoder.decode(bytes.slice(offset, end)));
    offset = end;
    limit = 74; // continuation lines lose one octet to the leading space
  }
  return chunks.join("\r\n ");
}

function serialize(lines: string[]): string {
  return lines.filter((l) => l !== "").map(foldIcsLine).join("\r\n");
}

export interface IcsBooking {
  id: string;
  start_time: string;
  end_time: string;
  status?: string;
  client_name: string;
  client_email: string;
  notes?: string | null;
  calendar_sequence?: number | null;
}

export interface IcsOrganizer {
  name: string;
  email: string;
}

export interface ClientIcsInput {
  booking: IcsBooking;
  organizer: IcsOrganizer;
  /** What the client's calendar shows. Deliberately non-specific by default. */
  summary: string;
  /** Human-readable line at the top of DESCRIPTION, e.g. "Individual Therapy with Genia — 50 minutes". */
  descriptionHeading: string;
  joinUrl: string;
  cancelUrl: string;
  now?: Date;
}

/** Reminder 15 minutes before start — the same moment the join link opens. */
const VALARM = [
  "BEGIN:VALARM",
  "ACTION:DISPLAY",
  "DESCRIPTION:Session reminder",
  "TRIGGER:-PT15M",
  "END:VALARM",
];

export function generateClientIcs({
  booking,
  organizer,
  summary,
  descriptionHeading,
  joinUrl,
  cancelUrl,
  now = new Date(),
}: ClientIcsInput): string {
  const description = [
    descriptionHeading,
    `Join: ${joinUrl}`,
    `Need to cancel? ${cancelUrl}`,
  ].join("\n");

  return serialize([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${booking.id}@humanheart.life`,
    `SEQUENCE:${booking.calendar_sequence ?? 0}`,
    `DTSTAMP:${toIcsDateUtc(now)}`,
    `DTSTART:${toIcsDateUtc(new Date(booking.start_time))}`,
    `DTEND:${toIcsDateUtc(new Date(booking.end_time))}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(joinUrl)}`,
    `URL:${joinUrl}`,
    `ORGANIZER;CN=${escapeIcsText(organizer.name)}:mailto:${organizer.email}`,
    `ATTENDEE;CN=${escapeIcsText(booking.client_name)};ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:${booking.client_email}`,
    "STATUS:CONFIRMED",
    ...VALARM,
    "END:VEVENT",
    "END:VCALENDAR",
  ]);
}

export interface PractitionerIcsInput {
  booking: IcsBooking;
  organizer: IcsOrganizer;
  sessionName: string;
  joinUrl: string;
  now?: Date;
}

/** The practitioner's own copy — this one keeps the enquiry. */
export function generatePractitionerIcs({
  booking,
  organizer,
  sessionName,
  joinUrl,
  now = new Date(),
}: PractitionerIcsInput): string {
  const description = [
    `Client: ${booking.client_name} (${booking.client_email})`,
    booking.notes?.trim() ? `Enquiry: ${booking.notes.trim()}` : "",
    `Join (moderator): ${joinUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return serialize([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${booking.id}@humanheart.life`,
    `SEQUENCE:${booking.calendar_sequence ?? 0}`,
    `DTSTAMP:${toIcsDateUtc(now)}`,
    `DTSTART:${toIcsDateUtc(new Date(booking.start_time))}`,
    `DTEND:${toIcsDateUtc(new Date(booking.end_time))}`,
    `SUMMARY:${escapeIcsText(`${sessionName} — ${booking.client_name}`)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `LOCATION:${escapeIcsText(joinUrl)}`,
    `URL:${joinUrl}`,
    `ORGANIZER;CN=${escapeIcsText(organizer.name)}:mailto:${organizer.email}`,
    `ATTENDEE;CN=${escapeIcsText(booking.client_name)}:mailto:${booking.client_email}`,
    "STATUS:CONFIRMED",
    ...VALARM,
    "END:VEVENT",
    "END:VCALENDAR",
  ]);
}

export interface CancelIcsInput {
  booking: IcsBooking;
  organizer: IcsOrganizer;
  summary: string;
  /** Must be higher than the SEQUENCE of the invite being withdrawn. */
  sequence: number;
  now?: Date;
}

/**
 * METHOD:CANCEL with a bumped SEQUENCE. Without both, calendar clients treat
 * this as an unrelated event and the original entry is left orphaned.
 */
export function generateCancelIcs({
  booking,
  organizer,
  summary,
  sequence,
  now = new Date(),
}: CancelIcsInput): string {
  return serialize([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODID}`,
    "CALSCALE:GREGORIAN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${booking.id}@humanheart.life`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${toIcsDateUtc(now)}`,
    `DTSTART:${toIcsDateUtc(new Date(booking.start_time))}`,
    `DTEND:${toIcsDateUtc(new Date(booking.end_time))}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `ORGANIZER;CN=${escapeIcsText(organizer.name)}:mailto:${organizer.email}`,
    `ATTENDEE;CN=${escapeIcsText(booking.client_name)}:mailto:${booking.client_email}`,
    "STATUS:CANCELLED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]);
}
