/**
 * Acceptance criteria for tasks 6 and 7, as tests.
 *
 * These lock behaviour that is easy to regress by accident: a stray
 * `setStep` turning selection into auto-advance, a checkbox that remembers
 * too much, or a terms link that navigates and takes the form with it.
 */

import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { format } from "date-fns";
import { LanguageProvider } from "@/contexts/LanguageContext";

import BookingWidget from "./BookingWidget";
import { bookingEN } from "@/content/booking";
import { TERMS_VERSION } from "@/content/offerAgreement";

// ── Mocks ────────────────────────────────────────────────────────

const mockSessionTypes = [
  {
    id: "session-1",
    name: "Individual Therapy",
    slug: "individual",
    description:
      "A long description that comfortably exceeds the hundred character threshold used to decide whether a card collapses its text.",
    duration_minutes: 50,
    show_price: false,
    show_second_email: false,
  },
  {
    id: "session-2",
    name: "Couples Therapy",
    slug: "couples",
    description:
      "Another long description, also well past the hundred character threshold, so this card is collapsible too.",
    duration_minutes: 80,
    show_price: false,
    show_second_email: false,
  },
];

/** Every day for the next two months is bookable, so the test never depends on
 *  which month the calendar happens to open on, or on today's date. */
const BOOKABLE_DAYS = new Set(
  Array.from({ length: 60 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return format(d, "yyyy-MM-dd");
  })
);

vi.mock("@/hooks/useAvailability", () => ({
  useSessionTypes: () => ({ sessionTypes: mockSessionTypes, loading: false }),
  // ComputedSlot is { start, end }, not { time, available }.
  useAvailableSlots: () => ({
    slots: [
      { start: "10:00", end: "10:50" },
      { start: "11:00", end: "11:50" },
    ],
    loading: false,
    minimumNoticeMinutes: 0,
  }),
}));

vi.mock("@/hooks/useAvailableDates", () => ({
  // The real hook returns a Set of "yyyy-MM-dd" keys, not Date objects.
  useAvailableDates: () => ({
    availableDays: BOOKABLE_DAYS,
    horizonDate: null,
    loading: false,
  }),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

vi.mock("@/hooks/useBookingAnalytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useBookingAnalytics")>();
  return {
    ...actual,
    trackServicesView: vi.fn(),
    trackServiceSelected: vi.fn(),
    trackDateTimeView: vi.fn(),
    trackDateTimeSelected: vi.fn(),
    trackConfirmationView: vi.fn(),
    trackBookingCompleted: vi.fn(),
    trackEmailFailed: vi.fn(),
    trackBookingFailed: vi.fn(),
  };
});

function renderWidget() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <BookingWidget />
      </LanguageProvider>
    </MemoryRouter>
  );
}

const cards = () => screen.getAllByRole("radio");
const bar = () => screen.getByTestId("action-bar");
/** Scoped to the bar: the calendar has a "next month" button of its own. */
const nextButton = () => within(bar()).getByRole("button", { name: new RegExp(bookingEN.next, "i") });
const backButton = () => within(bar()).getByRole("button", { name: new RegExp(bookingEN.back, "i") });
const bookButton = () => within(bar()).getByRole("button", { name: bookingEN.bookSession });
const summary = () => screen.getByTestId("bar-summary");

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Task 6 ───────────────────────────────────────────────────────

describe("6a — sticky action bar", () => {
  it("is present on step 1 before anything is chosen, with the action disabled", () => {
    renderWidget();
    expect(nextButton()).toBeDisabled();
    expect(nextButton()).toHaveAttribute("aria-disabled", "true");
  });

  it("prompts rather than leaving the disabled button unexplained", () => {
    renderWidget();
    expect(summary()).toHaveTextContent(bookingEN.barChooseSession);
  });

  it("shows the selection quietly once one is made, and enables the action", () => {
    renderWidget();
    fireEvent.click(cards()[0]);
    expect(summary()).toHaveTextContent("Individual Therapy · 50");
    expect(nextButton()).not.toBeDisabled();
  });

  it("names what is missing on the date step", () => {
    renderWidget();
    fireEvent.click(cards()[0]);
    fireEvent.click(nextButton());
    expect(summary()).toHaveTextContent(bookingEN.barChooseDateTime);
    expect(nextButton()).toBeDisabled();
  });
});

describe("6b — expanding a card collapses its siblings", () => {
  it("keeps only one description open at a time", () => {
    renderWidget();
    const more = screen.getAllByRole("button", { name: /more/i });
    expect(more).toHaveLength(2);

    fireEvent.click(more[0]);
    expect(more[0]).toHaveAttribute("aria-expanded", "true");
    expect(more[1]).toHaveAttribute("aria-expanded", "false");

    // Opening the second must close the first, so total height stays put.
    fireEvent.click(more[1]);
    expect(more[0]).toHaveAttribute("aria-expanded", "false");
    expect(more[1]).toHaveAttribute("aria-expanded", "true");
  });

  it("does not change the selection when a description is expanded", () => {
    renderWidget();
    fireEvent.click(screen.getAllByRole("button", { name: /more/i })[0]);
    // Selecting and expanding stay separate affordances.
    expect(cards()[0]).toHaveAttribute("aria-checked", "false");
    expect(nextButton()).toBeDisabled();
  });

  it("does not move the primary action", () => {
    renderWidget();
    const before = nextButton();
    fireEvent.click(screen.getAllByRole("button", { name: /more/i })[0]);
    // Same node, still in the bar — the bar is outside the scrolling content.
    expect(nextButton()).toBe(before);
  });
});

describe("6d — no auto-advance", () => {
  it("stays on step 1 when a card is selected", () => {
    renderWidget();
    fireEvent.click(cards()[0]);
    // Still choosing a session type, not choosing a date.
    expect(screen.getByText(bookingEN.selectSession)).toBeInTheDocument();
    expect(cards()).toHaveLength(2);
  });

  it("advances only on an explicit Next", () => {
    renderWidget();
    fireEvent.click(cards()[0]);
    fireEvent.click(nextButton());
    expect(screen.queryByText(bookingEN.selectSession)).not.toBeInTheDocument();
  });
});

describe("accessibility floor", () => {
  it("exposes the cards as a radio group", () => {
    renderWidget();
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(cards()).toHaveLength(2);
  });

  it("marks the active step with aria-current", () => {
    renderWidget();
    const current = screen.getAllByRole("button").filter(
      (b) => b.getAttribute("aria-current") === "step"
    );
    expect(current).toHaveLength(1);
  });

  it("selects a card with the keyboard", () => {
    renderWidget();
    cards()[0].focus();
    fireEvent.keyDown(cards()[0], { key: " " });
    expect(cards()[0]).toHaveAttribute("aria-checked", "true");
    expect(nextButton()).not.toBeDisabled();
  });

  it("keeps the group to a single tab stop", () => {
    renderWidget();
    expect(cards()[0]).toHaveAttribute("tabindex", "0");
    expect(cards()[1]).toHaveAttribute("tabindex", "-1");
  });
});

// ── Task 7 ───────────────────────────────────────────────────────

/**
 * Drive the widget to step 3. Every hop is asserted — a helper that silently
 * gives up would make every test below pass without testing anything.
 */
async function goToDetails() {
  renderWidget();
  fireEvent.click(cards()[0]);
  fireEvent.click(nextButton());

  // Whichever day cell the calendar offers as selectable — the component's own
  // disabled predicate decides, so the test does not have to model it.
  // react-day-picker renders days as <button role="gridcell">, not role="button".
  const dayButton = screen
    .getAllByRole("gridcell")
    .find((b) => /^\d{1,2}$/.test(b.textContent?.trim() ?? "") && !(b as HTMLButtonElement).disabled);
  expect(dayButton, "calendar offered no selectable day").toBeDefined();
  fireEvent.click(dayButton!);

  const slot = await screen.findByRole("button", { name: "10:00" });
  fireEvent.click(slot);

  fireEvent.click(nextButton());

  // Step 3 is genuinely on screen before anything below runs.
  await waitFor(() => expect(screen.getByTestId("terms-block")).toBeInTheDocument());
}

describe("7b — consent checkbox", () => {
  it("is never pre-ticked on first arrival at step 3", async () => {
    await goToDetails();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("blocks the primary action until it is ticked", async () => {
    await goToDetails();
    const book = bookButton();

    // Name and email come first in the bar's ordering of what is missing.
    expect(book).toBeDisabled();
    expect(summary()).toHaveTextContent(bookingEN.barFillDetails);

    fireEvent.change(screen.getByPlaceholderText(bookingEN.namePlaceholder), {
      target: { value: "Sam Rivera" },
    });
    fireEvent.change(screen.getByPlaceholderText(bookingEN.emailPlaceholder), {
      target: { value: "sam@example.com" },
    });

    // With the fields filled, consent is the only thing left.
    await waitFor(() => expect(summary()).toHaveTextContent(bookingEN.barAgreeTerms));
    expect(book).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(book).not.toBeDisabled());
  });

  it("keeps the user's own tick when they go back and forward again", async () => {
    await goToDetails();
    fireEvent.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());

    fireEvent.click(backButton());
    fireEvent.click(nextButton());

    await waitFor(() => expect(screen.getByRole("checkbox")).toBeChecked());
  });
});

describe("7a — key terms", () => {
  it("states all four facts above the action", async () => {
    await goToDetails();
    const block = screen.getByTestId("terms-block");
    for (const line of [
      bookingEN.termsFee,
      bookingEN.termsCancellation,
      bookingEN.termsPayment,
      bookingEN.termsConfidentiality,
    ]) {
      expect(within(block).getByText(line)).toBeInTheDocument();
    }
  });
});

describe("7c — the terms link must not navigate", () => {
  it("opens a dialog rather than a link, so form state survives", async () => {
    await goToDetails();

    const trigger = screen.getByRole("button", { name: bookingEN.termsLinkText });
    // Critically not an anchor: a route change would discard the form.
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).not.toHaveAttribute("href");

    fireEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByRole("dialog")).toHaveTextContent(TERMS_VERSION);
  });
});
