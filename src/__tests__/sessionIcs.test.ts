/**
 * Guardrails on the calendar objects we hand to clients.
 *
 * The client's .ics syncs to Google / iCloud / a work Exchange account and is
 * copied to every device on it. These tests exist so a future edit can't
 * quietly put clinical material or a tokenised URL back into that pipeline.
 */

import { describe, expect, it } from "vitest";

import {
  escapeIcsText,
  foldIcsLine,
  generateCancelIcs,
  generateClientIcs,
  generatePractitionerIcs,
} from "@edge/ics.ts";
import {
  BOOKING_ID,
  CANCEL_URL,
  ENQUIRY,
  JOIN_URL,
  MODERATOR_JOIN_URL,
  ORGANIZER,
  makeBooking,
  normalizeIcs,
} from "./fixtures/booking";

const FIXED_NOW = new Date("2026-08-12T14:30:00Z");

function clientIcs(overrides = {}) {
  return generateClientIcs({
    booking: makeBooking(),
    organizer: ORGANIZER,
    summary: "Session with Genia",
    descriptionHeading: "Individual Therapy with Genia — 50 minutes",
    joinUrl: JOIN_URL,
    cancelUrl: CANCEL_URL,
    now: FIXED_NOW,
    ...overrides,
  });
}

/** Unfold continuation lines so assertions can look at logical properties. */
function unfold(ics: string): string[] {
  return ics.replace(/\r\n /g, "").split("\r\n");
}

describe("client .ics", () => {
  it("matches the expected document exactly", () => {
    expect(normalizeIcs(clientIcs())).toBe(
      [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//HumanHeartBeat//Booking//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        `UID:${BOOKING_ID}@humanheart.life`,
        "SEQUENCE:0",
        "DTSTAMP:<generated>",
        "DTSTART:20260817T090000Z",
        "DTEND:20260817T095000Z",
        "SUMMARY:Session with Genia",
        "DESCRIPTION:Individual Therapy with Genia — 50 minutes\\nJoin: https://hum",
        " anheart.life/s/k3Qm9ZpX2vTb\\nNeed to cancel? https://humanheart.life/c/k3Q",
        " m9ZpX2vTb",
        "LOCATION:https://humanheart.life/s/k3Qm9ZpX2vTb",
        "URL:https://humanheart.life/s/k3Qm9ZpX2vTb",
        "ORGANIZER;CN=Human Heart:mailto:be@humanheart.life",
        "ATTENDEE;CN=Sam Rivera;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED:mailto:sam.ri",
        " vera@example.com",
        "STATUS:CONFIRMED",
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        "DESCRIPTION:Session reminder",
        "TRIGGER:-PT15M",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n")
    );
  });

  it("carries none of the client's enquiry text", () => {
    const ics = clientIcs();
    expect(ics).not.toContain(ENQUIRY);
    expect(ics).not.toContain("Enquiry");
    // Spot-check individual clauses in case a future edit truncates rather than removes.
    for (const phrase of ["my father died", "my partner", "struggling"]) {
      expect(ics.toLowerCase()).not.toContain(phrase);
    }
  });

  it("contains no email address outside ORGANIZER, ATTENDEE and UID", () => {
    const offenders = unfold(clientIcs()).filter(
      (line) => line.includes("@") && !/^(ORGANIZER|ATTENDEE|UID)[;:]/.test(line)
    );
    expect(offenders).toEqual([]);
  });

  it("never references the video provider directly", () => {
    expect(clientIcs()).not.toContain("8x8.vc");
    expect(clientIcs()).not.toContain("jwt=");
  });

  it("has SEQUENCE and a 15-minute VALARM", () => {
    const lines = unfold(clientIcs());
    expect(lines).toContain("SEQUENCE:0");
    expect(lines).toContain("BEGIN:VALARM");
    expect(lines).toContain("TRIGGER:-PT15M");
  });

  it("keeps DTSTART/DTEND in UTC with the Z suffix", () => {
    const lines = unfold(clientIcs());
    expect(lines).toContain("DTSTART:20260817T090000Z");
    expect(lines).toContain("DTEND:20260817T095000Z");
    // No floating local times, no TZID parameters.
    expect(clientIcs()).not.toContain("TZID");
  });

  it("carries the SEQUENCE stored on the booking", () => {
    const ics = clientIcs({ booking: makeBooking({ calendar_sequence: 3 }) });
    expect(unfold(ics)).toContain("SEQUENCE:3");
  });

  it("uses the configured summary rather than the service name", () => {
    const ics = clientIcs({ summary: "Appointment" });
    expect(unfold(ics)).toContain("SUMMARY:Appointment");
    expect(ics).not.toContain("SUMMARY:Individual Therapy");
  });
});

describe("practitioner .ics", () => {
  const ics = generatePractitionerIcs({
    booking: makeBooking(),
    organizer: ORGANIZER,
    sessionName: "Individual Therapy",
    joinUrl: MODERATOR_JOIN_URL,
    now: FIXED_NOW,
  });

  it("keeps the enquiry — this is the practitioner's own copy", () => {
    expect(ics.replace(/\r\n /g, "")).toContain(escapeIcsText(ENQUIRY));
  });

  it("identifies the client", () => {
    const flat = ics.replace(/\r\n /g, "");
    expect(flat).toContain("Sam Rivera");
    expect(flat).toContain("sam.rivera@example.com");
  });

  it("still uses a short link, not a provider URL", () => {
    expect(ics).toContain(MODERATOR_JOIN_URL);
    expect(ics).not.toContain("8x8.vc");
  });
});

describe("cancellation .ics", () => {
  const ics = generateCancelIcs({
    booking: makeBooking({ status: "cancelled" }),
    organizer: ORGANIZER,
    summary: "Session with Genia",
    sequence: 1,
    now: FIXED_NOW,
  });
  const lines = unfold(ics);

  it("is a METHOD:CANCEL with STATUS:CANCELLED", () => {
    expect(lines).toContain("METHOD:CANCEL");
    expect(lines).toContain("STATUS:CANCELLED");
  });

  it("bumps SEQUENCE above the invite it withdraws", () => {
    expect(lines).toContain("SEQUENCE:1");
  });

  it("reuses the original UID so clients match it to the existing event", () => {
    expect(lines).toContain(`UID:${BOOKING_ID}@humanheart.life`);
  });

  it("carries no enquiry text and no join link", () => {
    expect(ics).not.toContain(ENQUIRY);
    expect(ics).not.toContain("/s/");
  });
});

describe("DST boundary (Europe/Brussels, late October)", () => {
  // Europe/Brussels leaves CEST (UTC+2) for CET (UTC+1) on 2026-10-25.
  // Both sessions read 11:00 locally but sit at different UTC instants —
  // exactly where naive local-time handling breaks.
  const beforeDst = makeBooking({
    start_time: "2026-10-20T09:00:00+00:00", // 11:00 CEST
    end_time: "2026-10-20T09:50:00+00:00",
  });
  const afterDst = makeBooking({
    start_time: "2026-10-27T10:00:00+00:00", // 11:00 CET
    end_time: "2026-10-27T10:50:00+00:00",
  });

  const render = (booking: typeof beforeDst) =>
    unfold(
      generateClientIcs({
        booking,
        organizer: ORGANIZER,
        summary: "Session with Genia",
        descriptionHeading: "Individual Therapy with Genia — 50 minutes",
        joinUrl: JOIN_URL,
        cancelUrl: CANCEL_URL,
        now: FIXED_NOW,
      })
    );

  it("writes the correct UTC instant on each side of the transition", () => {
    expect(render(beforeDst)).toContain("DTSTART:20261020T090000Z");
    expect(render(afterDst)).toContain("DTSTART:20261027T100000Z");
  });

  it("both render as 11:00 in the client's zone", () => {
    const local = (iso: string) =>
      new Date(iso).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Europe/Brussels",
      });
    expect(local(beforeDst.start_time)).toBe("11:00");
    expect(local(afterDst.start_time)).toBe("11:00");
  });
});

describe("RFC 5545 mechanics", () => {
  it("escapes the characters that would otherwise break parsing", () => {
    expect(escapeIcsText("Therapy, 50 min; note\\here\nsecond line")).toBe(
      "Therapy\\, 50 min\\; note\\\\here\\nsecond line"
    );
  });

  it("folds long lines to 75 octets with a leading space on continuations", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"x".repeat(200)}`);
    for (const line of folded.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(folded.split("\r\n").slice(1).every((l) => l.startsWith(" "))).toBe(true);
  });

  it("never splits a multi-byte character across a fold", () => {
    const folded = foldIcsLine(`SUMMARY:${"—".repeat(60)}`);
    for (const line of folded.split("\r\n")) {
      expect(line).not.toContain("\uFFFD");
    }
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"—".repeat(60)}`);
  });

  it("escapes commas in a summary rather than emitting a bare one", () => {
    const ics = generateClientIcs({
      booking: makeBooking(),
      organizer: ORGANIZER,
      summary: "Session with Genia, 50 min",
      descriptionHeading: "Individual Therapy",
      joinUrl: JOIN_URL,
      cancelUrl: CANCEL_URL,
      now: FIXED_NOW,
    });
    expect(unfold(ics)).toContain("SUMMARY:Session with Genia\\, 50 min");
  });
});
