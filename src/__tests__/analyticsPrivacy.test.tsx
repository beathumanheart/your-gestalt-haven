/**
 * The enquiry field must not reach analytics.
 *
 * The booking form's notes textarea is where someone writes why they are
 * seeking therapy. That is health data — special category under GDPR
 * Article 9 — and it is not ours to collect through a product analytics tool.
 *
 * Three things protect it, and this pins all three, because each covers a
 * mechanism the others do not:
 *
 *   disable_session_recording   replay never starts
 *   ph-no-capture (class)      if it ever does, rrweb masks this element
 *   data-ph-no-capture (attr)  autocapture never sends the value
 *
 * Asserted on the rendered element rather than on the source text, and the
 * query throws if the textarea is missing rather than passing — see
 * docs/writing-guards.md for why that distinction is the whole point.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { siteConfig, takeConfig } from "@/config/analytics";
import BookingForm from "@/components/booking/BookingForm";
import { bookingEN } from "@/content/booking";
import type { BookingData } from "@/components/booking/BookingWidget";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));
vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const booking = {
  sessionTypeId: "s1",
  date: "2026-01-01",
  time: "10:00",
  clientName: "A",
  clientEmail: "a@example.com",
  clientEmail2: "a@example.com",
  notes: "why I am here",
} as unknown as BookingData;

const renderForm = () =>
  render(
    <BookingForm
      formId="f"
      booking={booking}
      t={bookingEN}
      language="en"
      onBooked={vi.fn()}
      onChange={vi.fn()}
      onSubmittingChange={vi.fn()}
    />,
  );

describe("the enquiry textarea", () => {
  it("is masked for session replay and for autocapture", () => {
    renderForm();
    // Queried by placeholder, because none of this form's field labels are
    // associated with their controls (no htmlFor/id, so no accessible name —
    // a pre-existing a11y gap, not this field's). getBy* throws when absent,
    // so a missing textarea fails this test rather than satisfying it.
    const notes = screen.getByPlaceholderText(bookingEN.notesPlaceholder);

    expect(
      notes.className,
      "the notes textarea needs the ph-no-capture class, which is what session replay honours",
    ).toContain("ph-no-capture");
    expect(
      notes.hasAttribute("data-ph-no-capture"),
      "the notes textarea needs data-ph-no-capture, which is what autocapture honours",
    ).toBe(true);
  });
});

describe("analytics configuration", () => {
  it("never starts session replay on the marketing site or booking pages", () => {
    expect(
      siteConfig.disable_session_recording,
      "replay must be off in code, not only in the PostHog project settings — " +
        "a UI toggle would otherwise start recording with no deploy",
    ).toBe(true);
  });

  it("keeps input masking configured as a second layer", () => {
    expect(siteConfig.session_recording?.maskAllInputs).toBe(true);
  });

  it("still has the free material capturing nothing", () => {
    expect(takeConfig.disable_session_recording).toBe(true);
    expect(takeConfig.autocapture).toBe(false);
    expect(takeConfig.persistence).toBe("memory");
  });
});
