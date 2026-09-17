/**
 * Every field on the booking form must have an accessible name.
 *
 * All four labels were plain <label> elements with no htmlFor and no id on the
 * control, so a screen reader announced four unlabelled textboxes — including
 * the one where a person is meant to write why they are seeking therapy.
 *
 * Queried by role and accessible name, which is the thing being fixed: these
 * queries could not find the fields before, and that is what surfaced it.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import BookingForm from "@/components/booking/BookingForm";
import { bookingEN, bookingRU } from "@/content/booking";
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
  notes: "",
} as unknown as BookingData;

const renderForm = (t = bookingEN, formId = "f1") =>
  render(
    <BookingForm
      formId={formId}
      booking={booking}
      t={t}
      language="en"
      onBooked={vi.fn()}
      onChange={vi.fn()}
      onSubmittingChange={vi.fn()}
    />,
  );

describe("booking form labels", () => {
  it("names every text field, in English", () => {
    renderForm();
    // getByRole throws when no element has the name, so a regression fails here.
    expect(screen.getByRole("textbox", { name: new RegExp(bookingEN.yourName, "i") })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: new RegExp(bookingEN.yourEmail, "i") })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: new RegExp(bookingEN.notesLabel, "i") })).toBeInTheDocument();
  });

  it("names them in Russian too", () => {
    renderForm(bookingRU, "f2");
    expect(screen.getByRole("textbox", { name: new RegExp(bookingRU.yourName, "i") })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: new RegExp(bookingRU.notesLabel, "i") })).toBeInTheDocument();
  });

  it("keeps the enquiry field's masking while it gains a name", () => {
    // The privacy attributes and the label live on the same element; adding
    // one must not disturb the other. See analyticsPrivacy.test.tsx.
    renderForm();
    const notes = screen.getByRole("textbox", { name: new RegExp(bookingEN.notesLabel, "i") });
    expect(notes.className).toContain("ph-no-capture");
    expect(notes.hasAttribute("data-ph-no-capture")).toBe(true);
  });

  it("scopes ids to the form, so two forms on a page do not collide", () => {
    const { container: a } = renderForm(bookingEN, "alpha");
    const { container: b } = renderForm(bookingEN, "beta");
    const idOf = (c: HTMLElement) => c.querySelector("textarea")?.getAttribute("id");

    expect(idOf(a)).toBe("alpha-notes");
    expect(idOf(b)).toBe("beta-notes");
    expect(idOf(a)).not.toBe(idOf(b));
  });
});
