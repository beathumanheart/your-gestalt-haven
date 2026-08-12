/**
 * Outgoing message bodies.
 *
 * Every message is built here as a complete Brevo payload — html *and* plain
 * text — so the guardrail tests can assert on the exact bytes that go out
 * rather than on a reimplementation of them.
 */

import { formatDateLong, formatTimeWithTz } from "./format.ts";
import {
  generateCancelIcs,
  generateClientIcs,
  generatePractitionerIcs,
  type IcsBooking,
  type IcsOrganizer,
} from "./ics.ts";

export interface BrevoAttachment {
  content: string;
  name: string;
}

export interface BrevoMessage {
  to: { email: string; name: string }[];
  subject: string;
  /** Both parts are always present: html-only mail is an accessibility gap
   *  and carries a small spam-score penalty. */
  htmlContent: string;
  textContent: string;
  attachment?: BrevoAttachment[];
  headers?: Record<string, string>;
}

/**
 * Booking confirmations are transactional. Brevo will otherwise attach an
 * open-tracking pixel, rewrite every link through its click tracker, and add
 * List-Unsubscribe — one tap of which would stop a client receiving the
 * details of sessions they have already paid for.
 *
 * These headers ask Brevo to leave transactional mail alone. The account-level
 * toggles in the Brevo dashboard are authoritative; this is belt and braces.
 */
export const TRANSACTIONAL_HEADERS: Record<string, string> = {
  "X-Mailin-Track": "0",
  "X-Mailin-Tag": "transactional",
};

export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

// ── HTML fragments ─────────────────────────────────────────────

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function detailsTable(rows: string): string {
  return `<div style="background: #f0ede8; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <table style="width: 100%; border-collapse: collapse;">${rows}</table>
  </div>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">${label}</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${value}</td></tr>`;
}

function notesRow(notes: string | null | undefined): string {
  if (!notes || !notes.trim()) return "";
  return `<tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px; vertical-align: top;">Enquiry</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${escapeHtml(notes)}</td></tr>`;
}

function timeValue(time24: string, tzLabel: string): string {
  return `<strong>${time24}</strong> <span style="color: #7a7067; font-size: 12px;">${tzLabel}</span>`;
}

function shell(heading: string, gradient: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: ${gradient}; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">${heading}</h1>
    </div>
    <div style="padding: 32px;">${body}</div>
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<div style="text-align: center; margin: 28px 0;">
        <a href="${href}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">${label}</a>
      </div>`;
}

const GREEN = "linear-gradient(135deg, #4a7c5f 0%, #5a9470 100%)";
const RED = "linear-gradient(135deg, #8b5e5e 0%, #a07070 100%)";

// ── Confirmation ───────────────────────────────────────────────

export interface ConfirmationInput {
  booking: IcsBooking & { client_email_2?: string | null };
  organizer: IcsOrganizer;
  /** Service name, e.g. "Individual Therapy". Practitioner-facing. */
  sessionName: string;
  /** What the client's calendar shows. Non-specific by default. */
  calendarSummary: string;
  durationMinutes: number;
  clientTimezone: string;
  /** https://humanheart.life/s/<slug> */
  joinUrl: string;
  /** https://humanheart.life/c/<slug> */
  cancelUrl: string;
  /** https://humanheart.life/s/<moderator_slug> */
  moderatorJoinUrl: string;
  clientRecipients: { email: string; name: string }[];
  practitionerRecipients: { email: string; name: string }[];
  now?: Date;
}

export function buildConfirmationEmails(input: ConfirmationInput): {
  client: BrevoMessage;
  practitioner: BrevoMessage;
} {
  const {
    booking,
    organizer,
    sessionName,
    calendarSummary,
    durationMinutes,
    clientTimezone,
    joinUrl,
    cancelUrl,
    moderatorJoinUrl,
    clientRecipients,
    practitionerRecipients,
    now = new Date(),
  } = input;

  const start = new Date(booking.start_time);
  const dateStr = formatDateLong(start, clientTimezone);
  const { time24, tzLabel } = formatTimeWithTz(start, clientTimezone);

  const baseRows =
    row("Session", `<strong>${escapeHtml(sessionName)}</strong>`) +
    row("Date", dateStr) +
    row("Time", timeValue(time24, tzLabel)) +
    row("Duration", `${durationMinutes} min`);

  // The enquiry appears in both emails — the client's own words back in their
  // own inbox, and the practitioner's working copy. It never reaches the .ics.
  const detailRows = baseRows + notesRow(booking.notes);

  const clientHtml = shell(
    "Booking Confirmed ✓",
    GREEN,
    `<p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Hi <strong>${escapeHtml(booking.client_name)}</strong>,</p>
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Your session has been confirmed. Here are the details:</p>
      ${detailsTable(detailRows)}
      ${button(joinUrl, "Join Video Session →")}
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5;">📅 A calendar invite (.ics) is attached — open it to add this session to your calendar.</p>
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5; margin-top: 8px;">The link opens 15 minutes before your session starts.</p>
      <hr style="border: none; border-top: 1px solid #e5e0da; margin: 24px 0;" />
      <p style="color: #a09890; font-size: 12px; text-align: center; line-height: 1.5;">
        Need to cancel? <a href="${cancelUrl}" style="color: #b04040; text-decoration: underline;">Cancel this booking</a>
      </p>`
  );

  const clientText = [
    `Hi ${booking.client_name},`,
    "",
    "Your session has been confirmed.",
    "",
    `Session:  ${sessionName}`,
    `Date:     ${dateStr}`,
    `Time:     ${time24} (${tzLabel})`,
    `Duration: ${durationMinutes} min`,
    "",
    `Join your session: ${joinUrl}`,
    "The link opens 15 minutes before your session starts.",
    "",
    "A calendar invite (.ics) is attached — open it to add this session to your calendar.",
    "",
    `Need to cancel? ${cancelUrl}`,
    "",
    organizer.name,
  ].join("\n");

  const practitionerHtml = shell(
    "New Booking 📅",
    GREEN,
    `<p style="color: #4a4035; font-size: 16px; line-height: 1.6;"><strong>${escapeHtml(booking.client_name)}</strong> (${escapeHtml(booking.client_email)}) has booked a session.</p>
      ${detailsTable(detailRows)}
      ${button(moderatorJoinUrl, "Join as Moderator →")}
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5;">Lobby is enabled on this room — you'll be asked to admit the client.</p>`
  );

  const practitionerText = [
    `${booking.client_name} (${booking.client_email}) has booked a session.`,
    "",
    `Session:  ${sessionName}`,
    `Date:     ${dateStr}`,
    `Time:     ${time24} (${tzLabel})`,
    `Duration: ${durationMinutes} min`,
    booking.notes?.trim() ? `Enquiry:  ${booking.notes.trim()}` : "",
    "",
    `Join as moderator: ${moderatorJoinUrl}`,
    "Lobby is enabled on this room — you'll be asked to admit the client.",
  ]
    .filter((line, i, all) => !(line === "" && all[i - 1] === ""))
    .join("\n");

  const clientIcs = generateClientIcs({
    booking,
    organizer,
    summary: calendarSummary,
    descriptionHeading: `${sessionName} with ${organizer.name} — ${durationMinutes} minutes`,
    joinUrl,
    cancelUrl,
    now,
  });

  const practitionerIcs = generatePractitionerIcs({
    booking,
    organizer,
    sessionName,
    joinUrl: moderatorJoinUrl,
    now,
  });

  return {
    client: {
      to: clientRecipients,
      subject: `Booking Confirmed: ${sessionName} on ${dateStr}`,
      htmlContent: clientHtml,
      textContent: clientText,
      attachment: [{ content: utf8ToBase64(clientIcs), name: "session.ics" }],
      headers: TRANSACTIONAL_HEADERS,
    },
    practitioner: {
      to: practitionerRecipients,
      subject: `New Booking: ${sessionName} — ${booking.client_name} on ${dateStr}`,
      htmlContent: practitionerHtml,
      textContent: practitionerText,
      attachment: [{ content: utf8ToBase64(practitionerIcs), name: "booking.ics" }],
      headers: TRANSACTIONAL_HEADERS,
    },
  };
}

// ── Cancellation ───────────────────────────────────────────────

export interface CancellationInput {
  booking: IcsBooking;
  organizer: IcsOrganizer;
  sessionName: string;
  calendarSummary: string;
  clientTimezone: string;
  /** Must exceed the SEQUENCE of the invite being withdrawn. */
  sequence: number;
  siteUrl: string;
  clientRecipients: { email: string; name: string }[];
  practitionerRecipients: { email: string; name: string }[];
  now?: Date;
}

export function buildCancellationEmails(input: CancellationInput): {
  client: BrevoMessage;
  practitioner: BrevoMessage;
} {
  const {
    booking,
    organizer,
    sessionName,
    calendarSummary,
    clientTimezone,
    sequence,
    siteUrl,
    clientRecipients,
    practitionerRecipients,
    now = new Date(),
  } = input;

  const start = new Date(booking.start_time);
  const dateStr = formatDateLong(start, clientTimezone);
  const { time24, tzLabel } = formatTimeWithTz(start, clientTimezone);

  const rows =
    row("Session", `<strong>${escapeHtml(sessionName)}</strong>`) +
    row("Date", dateStr) +
    row("Time", timeValue(time24, tzLabel));

  const clientHtml = shell(
    "Booking Cancelled",
    RED,
    `<p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Hi <strong>${escapeHtml(booking.client_name)}</strong>,</p>
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Your session has been cancelled. Here were the details:</p>
      ${detailsTable(rows)}
      ${button(siteUrl, "Book a New Session →")}
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5;">The attached calendar update removes this session from your calendar.</p>`
  );

  const clientText = [
    `Hi ${booking.client_name},`,
    "",
    "Your session has been cancelled. Here were the details:",
    "",
    `Session: ${sessionName}`,
    `Date:    ${dateStr}`,
    `Time:    ${time24} (${tzLabel})`,
    "",
    "The attached calendar update removes this session from your calendar.",
    "",
    `Book a new session: ${siteUrl}`,
    "",
    organizer.name,
  ].join("\n");

  const practitionerHtml = shell(
    "Booking Cancelled",
    RED,
    `<p style="color: #4a4035; font-size: 16px; line-height: 1.6;"><strong>${escapeHtml(booking.client_name)}</strong> (${escapeHtml(booking.client_email)}) has cancelled their session.</p>
      ${detailsTable(rows + notesRow(booking.notes))}`
  );

  const practitionerText = [
    `${booking.client_name} (${booking.client_email}) has cancelled their session.`,
    "",
    `Session: ${sessionName}`,
    `Date:    ${dateStr}`,
    `Time:    ${time24} (${tzLabel})`,
    booking.notes?.trim() ? `Enquiry: ${booking.notes.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // Both parties get METHOD:CANCEL. The client is the one left with an
  // orphaned calendar entry otherwise.
  const clientCancelIcs = generateCancelIcs({
    booking,
    organizer,
    summary: calendarSummary,
    sequence,
    now,
  });
  const practitionerCancelIcs = generateCancelIcs({
    booking,
    organizer,
    summary: `${sessionName} — ${booking.client_name}`,
    sequence,
    now,
  });

  const subject = `Booking Cancelled: ${sessionName} on ${dateStr}`;

  return {
    client: {
      to: clientRecipients,
      subject,
      htmlContent: clientHtml,
      textContent: clientText,
      attachment: [{ content: utf8ToBase64(clientCancelIcs), name: "cancel.ics" }],
      headers: TRANSACTIONAL_HEADERS,
    },
    practitioner: {
      to: practitionerRecipients,
      subject,
      htmlContent: practitionerHtml,
      textContent: practitionerText,
      attachment: [
        { content: utf8ToBase64(practitionerCancelIcs), name: "cancel.ics" },
      ],
      headers: TRANSACTIONAL_HEADERS,
    },
  };
}
