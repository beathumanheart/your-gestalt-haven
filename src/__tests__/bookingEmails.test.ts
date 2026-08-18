/**
 * Guardrails on what actually leaves the building.
 *
 * These build the real Brevo payloads through the same function the edge
 * function calls, then assert on the bytes — including the base64 .ics
 * attachment — rather than on a reimplementation.
 */

import { describe, expect, it } from "vitest";

import {
  buildCancellationEmails,
  buildConfirmationEmails,
  TRANSACTIONAL_HEADERS,
  type BrevoMessage,
} from "@edge/emails.ts";
import {
  CANCEL_URL,
  ENQUIRY,
  JOIN_URL,
  MODERATOR_JOIN_URL,
  ORGANIZER,
  TERMS_URL,
  makeBooking,
} from "./fixtures/booking";

const FIXED_NOW = new Date("2026-08-12T14:30:00Z");

const CLIENT_RECIPIENTS = [{ email: "sam.rivera@example.com", name: "Sam Rivera" }];
const PRACTITIONER_RECIPIENTS = [{ email: "be@humanheart.life", name: "Human Heart Beat" }];

function confirmation(overrides = {}) {
  return buildConfirmationEmails({
    booking: makeBooking(),
    organizer: ORGANIZER,
    sessionName: "Individual Therapy",
    calendarSummary: "Session with Genia",
    durationMinutes: 50,
    clientTimezone: "Europe/Brussels",
    joinUrl: JOIN_URL,
    cancelUrl: CANCEL_URL,
    moderatorJoinUrl: MODERATOR_JOIN_URL,
    termsUrl: TERMS_URL,
    clientRecipients: CLIENT_RECIPIENTS,
    practitionerRecipients: PRACTITIONER_RECIPIENTS,
    now: FIXED_NOW,
    ...overrides,
  });
}

function cancellation(overrides = {}) {
  return buildCancellationEmails({
    booking: makeBooking({ status: "cancelled", calendar_sequence: 1 }),
    organizer: ORGANIZER,
    sessionName: "Individual Therapy",
    calendarSummary: "Session with Genia",
    clientTimezone: "Europe/Brussels",
    sequence: 1,
    siteUrl: "https://humanheart.life",
    clientRecipients: CLIENT_RECIPIENTS,
    practitionerRecipients: PRACTITIONER_RECIPIENTS,
    now: FIXED_NOW,
    ...overrides,
  });
}

function decodeBase64(content: string): string {
  return new TextDecoder().decode(
    Uint8Array.from(atob(content), (c) => c.charCodeAt(0))
  );
}

function decodedIcs(message: BrevoMessage): string {
  return decodeBase64(message.attachment![0].content);
}

/** Every byte the message contributes to the wire, attachment included. */
function everything(message: BrevoMessage): string {
  return [
    message.subject,
    message.htmlContent,
    message.textContent,
    ...(message.attachment ?? []).map((a) => decodeBase64(a.content)),
  ].join("\n");
}

const allMessages = (): [string, BrevoMessage][] => {
  const c = confirmation();
  const x = cancellation();
  return [
    ["confirmation → client", c.client],
    ["confirmation → practitioner", c.practitioner],
    ["cancellation → client", x.client],
    ["cancellation → practitioner", x.practitioner],
  ];
};

describe("no video-provider URLs escape", () => {
  it.each(allMessages())("%s contains no 8x8.vc reference", (_name, message) => {
    expect(everything(message)).not.toContain("8x8.vc");
  });

  it.each(allMessages())("%s contains no JWT", (_name, message) => {
    const body = everything(message);
    expect(body).not.toContain("jwt=");
    // An RS256 header is "eyJhbGciOiJSUzI1NiIs..." — catch a token pasted in
    // by any route, not just as a query parameter.
    expect(body).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/);
  });

  it("the client's join link is short enough to survive any mail client", () => {
    expect(JOIN_URL.length).toBeLessThan(60);
    expect(confirmation().client.htmlContent).toContain(JOIN_URL);
  });
});

describe("the confirmation carries the agreement the client accepted", () => {
  it("links the terms in both MIME parts", () => {
    const { client } = confirmation();
    expect(client.htmlContent).toContain(TERMS_URL);
    expect(client.textContent).toContain(TERMS_URL);
  });

  // `termsUrl` was interpolated straight into an href with no fallback, so an
  // omitted one shipped `href="undefined"` to every client rather than failing.
  it("never ships a placeholder in place of the link", () => {
    for (const [, message] of allMessages()) {
      expect(everything(message)).not.toContain("undefined");
    }
  });
});

describe("both MIME parts are present", () => {
  it.each(allMessages())("%s has html and plain text", (_name, message) => {
    expect(message.htmlContent.trim().length).toBeGreaterThan(0);
    expect(message.textContent.trim().length).toBeGreaterThan(0);
    expect(message.htmlContent).toContain("<!DOCTYPE html>");
    expect(message.textContent).not.toContain("<");
  });

  it("the plain-text part carries the same links as the html", () => {
    const { client } = confirmation();
    expect(client.textContent).toContain(JOIN_URL);
    expect(client.textContent).toContain(CANCEL_URL);
  });
});

describe("transactional, not marketing", () => {
  it.each(allMessages())("%s asks Brevo not to track or unsubscribe", (_name, message) => {
    expect(message.headers).toEqual(TRANSACTIONAL_HEADERS);
    expect(message.headers?.["X-Mailin-Track"]).toBe("0");
  });

  it.each(allMessages())("%s sets no List-Unsubscribe header", (_name, message) => {
    const keys = Object.keys(message.headers ?? {}).map((k) => k.toLowerCase());
    expect(keys).not.toContain("list-unsubscribe");
    expect(keys).not.toContain("list-unsubscribe-post");
  });

  it.each(allMessages())("%s embeds no tracking pixel", (_name, message) => {
    expect(message.htmlContent).not.toContain("sendibt2.com");
    expect(message.htmlContent).not.toMatch(/<img[^>]*width="?1"?/i);
  });
});

describe("the enquiry stays where it belongs", () => {
  it("reaches the practitioner", () => {
    const { practitioner } = confirmation();
    expect(practitioner.textContent).toContain(ENQUIRY);
    expect(practitioner.htmlContent).toContain(ENQUIRY);
    expect(decodedIcs(practitioner).replace(/\r\n /g, "")).toContain(ENQUIRY);
  });

  it("never reaches the client's calendar", () => {
    const { client } = confirmation();
    expect(decodedIcs(client)).not.toContain(ENQUIRY);
    expect(decodedIcs(client)).not.toContain("Enquiry");
  });

  it("never reaches the cancellation .ics for either party", () => {
    const { client, practitioner } = cancellation();
    expect(decodedIcs(client)).not.toContain(ENQUIRY);
    expect(decodedIcs(practitioner)).not.toContain(ENQUIRY);
  });
});

describe("cancellation", () => {
  it("sends a METHOD:CANCEL to the client, not just the practitioner", () => {
    const { client, practitioner } = cancellation();
    for (const message of [client, practitioner]) {
      const ics = decodedIcs(message);
      expect(ics).toContain("METHOD:CANCEL");
      expect(ics).toContain("STATUS:CANCELLED");
      expect(ics).toContain("SEQUENCE:1");
    }
  });

  it("names the attachment so calendar clients pick it up", () => {
    expect(cancellation().client.attachment![0].name).toBe("cancel.ics");
  });
});

describe("times are rendered in the client's timezone", () => {
  it("shows 11:00 Brussels for a 09:00 UTC session", () => {
    const { client } = confirmation();
    expect(client.textContent).toContain("11:00");
    expect(client.textContent).toContain("Monday, August 17, 2026");
  });

  it("holds across the October DST transition", () => {
    // 2026-10-27 10:00 UTC is 11:00 CET — the same wall clock as a 09:00 UTC
    // session a week earlier, when Brussels was still on CEST.
    const beforeDst = confirmation({
      booking: makeBooking({
        start_time: "2026-10-20T09:00:00+00:00",
        end_time: "2026-10-20T09:50:00+00:00",
      }),
    });
    const afterDst = confirmation({
      booking: makeBooking({
        start_time: "2026-10-27T10:00:00+00:00",
        end_time: "2026-10-27T10:50:00+00:00",
      }),
    });

    expect(beforeDst.client.textContent).toContain("11:00");
    expect(afterDst.client.textContent).toContain("11:00");
    expect(beforeDst.client.textContent).toContain("Brussels, GMT+2");
    expect(afterDst.client.textContent).toContain("Brussels, GMT+1");

    // …and the underlying .ics instants differ by the hour DST removed.
    expect(decodedIcs(beforeDst.client)).toContain("DTSTART:20261020T090000Z");
    expect(decodedIcs(afterDst.client)).toContain("DTSTART:20261027T100000Z");
  });

  it("dates the session by the client's calendar day, not the server's", () => {
    // 23:30 Brussels on 2026-10-27 is 22:30 UTC the same day; a session that
    // crosses midnight UTC must still read as the client's evening.
    const lateEvening = confirmation({
      booking: makeBooking({
        start_time: "2026-10-27T23:30:00+00:00", // 00:30 on the 28th in Brussels
        end_time: "2026-10-28T00:20:00+00:00",
      }),
    });
    expect(lateEvening.client.textContent).toContain("Wednesday, October 28, 2026");
  });
});

describe("html escaping", () => {
  it("neutralises markup in client-supplied fields", () => {
    const { client, practitioner } = confirmation({
      booking: makeBooking({
        client_name: "<script>alert(1)</script>",
        notes: "note with <b>markup</b> & an ampersand",
      }),
    });
    expect(client.htmlContent).not.toContain("<script>");
    expect(client.htmlContent).toContain("&lt;script&gt;");
    expect(practitioner.htmlContent).not.toContain("<b>markup</b>");
    expect(practitioner.htmlContent).toContain("&amp; an ampersand");
  });
});
