import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import BookingConfirmation from "./BookingConfirmation";
import { bookingEN } from "@/content/booking";
import type { ConfirmedBooking } from "./BookingWidget";

const baseBooking: ConfirmedBooking = {
  id: "booking-1",
  start_time: "2026-05-10T10:00:00",
  end_time: "2026-05-10T10:50:00",
  client_email: "test@example.com",
  google_meet_link: "https://8x8.vc/session-abc123",
  sessionTypeName: "Individual Therapy",
  durationMinutes: 50,
};

function renderConfirmation(overrides: Partial<ConfirmedBooking> = {}) {
  return render(
    <BookingConfirmation
      booking={{ ...baseBooking, ...overrides }}
      t={bookingEN}
      onReset={() => {}}
      onCancel={() => {}}
    />
  );
}

describe("BookingConfirmation – email sent (normal flow)", () => {
  it("shows the confirmation subtitle when email was sent", () => {
    renderConfirmation({ emailSent: true });
    expect(screen.getByText(bookingEN.confirmSubtitle)).toBeInTheDocument();
    expect(screen.queryByTestId("email-warning")).not.toBeInTheDocument();
  });

  it("shows the client email address row", () => {
    renderConfirmation({ emailSent: true });
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("shows emailSent undefined as normal (backward-compat)", () => {
    renderConfirmation();
    expect(screen.getByText(bookingEN.confirmSubtitle)).toBeInTheDocument();
    expect(screen.queryByTestId("email-warning")).not.toBeInTheDocument();
  });
});

describe("BookingConfirmation – email failed (phantom booking scenario)", () => {
  it("shows the email warning notice instead of subtitle", () => {
    renderConfirmation({ emailSent: false });
    expect(screen.getByTestId("email-warning")).toBeInTheDocument();
    expect(screen.getByTestId("email-warning").textContent).toContain(bookingEN.emailWarning);
    expect(screen.queryByText(bookingEN.confirmSubtitle)).not.toBeInTheDocument();
  });

  it("includes Telegram link in the warning", () => {
    renderConfirmation({ emailSent: false });
    const warning = screen.getByTestId("email-warning");
    expect(warning.querySelector(`a[href="${bookingEN.telegramUrl}"]`)).toBeTruthy();
  });

  it("hides the email address row when email failed", () => {
    renderConfirmation({ emailSent: false });
    expect(screen.queryByText("test@example.com")).not.toBeInTheDocument();
  });
});

describe("BookingConfirmation – meet link (regression)", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the meet link as a clickable anchor", () => {
    renderConfirmation({ emailSent: true });
    const link = screen.getByRole("link", { name: /join video session/i });
    expect(link).toHaveAttribute("href", "https://8x8.vc/session-abc123");
  });

  it("does not display the raw URL as text", () => {
    renderConfirmation({ emailSent: true });
    expect(screen.queryByTestId("meet-link-text")).not.toBeInTheDocument();
    expect(screen.queryByText("https://8x8.vc/session-abc123")).not.toBeInTheDocument();
  });

  it("shows copy button that writes URL to clipboard", () => {
    renderConfirmation({ emailSent: true });
    const btn = screen.getByTestId("copy-meet-link");
    expect(btn.textContent).toBe(bookingEN.copyMeetLink);
    fireEvent.click(btn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://8x8.vc/session-abc123");
  });

  it("copy button shows copied feedback then reverts after 2s", () => {
    renderConfirmation({ emailSent: true });
    const btn = screen.getByTestId("copy-meet-link");
    fireEvent.click(btn);
    expect(btn.textContent).toBe(bookingEN.copiedMeetLink);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(btn.textContent).toBe(bookingEN.copyMeetLink);
  });

  it("copy button is present even when emailSent is false — this is the client's lifeline", () => {
    renderConfirmation({ emailSent: false });
    expect(screen.getByTestId("copy-meet-link")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /join video session/i })).toBeInTheDocument();
  });

  it("renders nothing for meet link section when google_meet_link is absent", () => {
    renderConfirmation({ google_meet_link: null });
    expect(screen.queryByTestId("copy-meet-link")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /join video session/i })).not.toBeInTheDocument();
  });
});
