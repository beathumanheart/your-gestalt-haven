import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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

  it("includes Telegram and Signal links in the warning", () => {
    renderConfirmation({ emailSent: false });
    const warning = screen.getByTestId("email-warning");
    expect(warning.querySelector(`a[href="${bookingEN.telegramUrl}"]`)).toBeTruthy();
    expect(warning.querySelector(`a[href="${bookingEN.signalUrl}"]`)).toBeTruthy();
  });

  it("hides the email address row when email failed", () => {
    renderConfirmation({ emailSent: false });
    expect(screen.queryByText("test@example.com")).not.toBeInTheDocument();
  });
});

describe("BookingConfirmation – meet link (regression)", () => {
  it("shows the meet link as a clickable button", () => {
    renderConfirmation({ emailSent: true });
    const link = screen.getByRole("link", { name: /join video session/i });
    expect(link).toHaveAttribute("href", "https://8x8.vc/session-abc123");
  });

  it("shows the meet link URL as visible selectable text", () => {
    renderConfirmation({ emailSent: true });
    expect(screen.getByTestId("meet-link-text").textContent).toBe("https://8x8.vc/session-abc123");
  });

  it("meet link text is present even when emailSent is false — this is the client's lifeline", () => {
    renderConfirmation({ emailSent: false });
    expect(screen.getByTestId("meet-link-text").textContent).toBe("https://8x8.vc/session-abc123");
    expect(screen.getByRole("link", { name: /join video session/i })).toBeInTheDocument();
  });

  it("renders nothing for meet link section when google_meet_link is absent", () => {
    renderConfirmation({ google_meet_link: null });
    expect(screen.queryByTestId("meet-link-text")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /join video session/i })).not.toBeInTheDocument();
  });
});
