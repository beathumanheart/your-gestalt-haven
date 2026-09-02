import type { IcsBooking } from "@edge/ics.ts";

/** The exact free text a client typed into the booking form. Guardrail tests
 *  assert this string never reaches a client-facing calendar object. */
export const ENQUIRY =
  "I've been struggling since my father died in March and I can't talk to my partner about it.";

export const ORGANIZER = { name: "Human Heart", email: "be@humanheart.life" };

export const BOOKING_ID = "3f2b1c8e-7d4a-4c19-9b6e-2a5f8d0c1e73";

export const SLUG = "k3Qm9ZpX2vTb";
export const MODERATOR_SLUG = "Rd7Wq1LnH4sY";

export const JOIN_URL = `https://humanheart.life/s/${SLUG}`;
export const CANCEL_URL = `https://humanheart.life/c/${SLUG}`;
export const MODERATOR_JOIN_URL = `https://humanheart.life/s/${MODERATOR_SLUG}`;
export const TERMS_URL = "https://humanheart.life/en/offer-agreement";

/** 2026-08-17 09:00–09:50 UTC = 11:00–11:50 Europe/Brussels (CEST). */
export function makeBooking(overrides: Partial<IcsBooking> = {}): IcsBooking {
  return {
    id: BOOKING_ID,
    start_time: "2026-08-17T09:00:00+00:00",
    end_time: "2026-08-17T09:50:00+00:00",
    status: "confirmed",
    client_name: "Sam Rivera",
    client_email: "sam.rivera@example.com",
    notes: ENQUIRY,
    calendar_sequence: 0,
    ...overrides,
  };
}

/** Strip the wall-clock-dependent line so .ics output can be compared exactly. */
export function normalizeIcs(ics: string): string {
  return ics.replace(/^DTSTAMP:.*$/m, "DTSTAMP:<generated>");
}
