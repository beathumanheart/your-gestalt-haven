import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BookingForm from "./BookingForm";
import { bookingEN } from "@/content/booking";
import type { BookingData } from "./BookingWidget";

// ── Mocks ────────────────────────────────────────────────────────

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock("posthog-js", () => ({
  default: { capture: vi.fn() },
}));

vi.mock("@/hooks/useBookingAnalytics", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/useBookingAnalytics")>();
  return {
    ...actual,
    trackBookingCompleted: vi.fn(),
    trackEmailFailed: vi.fn(),
    trackBookingFailed: vi.fn(),
  };
});

import { supabase } from "@/integrations/supabase/client";
import { trackBookingFailed, trackEmailFailed } from "@/hooks/useBookingAnalytics";

// ── Helpers ───────────────────────────────────────────────────────

function makeFetchError(): Error {
  const err = new Error("Failed to fetch");
  err.name = "FunctionsFetchError";
  return err;
}

function makeHttpError(status: number, body: object): Error {
  const err = new Error(JSON.stringify(body));
  err.name = "FunctionsHttpError";
  (err as unknown as Record<string, unknown>).context = { status };
  return err;
}

const validBooking: Partial<BookingData> = {
  sessionTypeId: "session-1",
  sessionTypeName: "Individual Therapy",
  durationMinutes: 50,
  showSecondEmail: false,
  date: new Date("2026-05-10"),
  timeSlot: "10:00",
  clientName: "Test User",
  clientEmail: "test@example.com",
  notes: "",
  termsAccepted: true,
};

/** The primary action lives in the widget's sticky bar and reaches the form
 *  through the `form` attribute — mirror that here rather than a shape the app
 *  no longer has. */
const FORM_ID = "test-booking-form";

function SubmitButton() {
  return (
    <button type="submit" form={FORM_ID}>
      {bookingEN.bookSession}
    </button>
  );
}

function renderForm(props: Partial<React.ComponentProps<typeof BookingForm>> = {}) {
  return render(
    <>
      <BookingForm
        formId={FORM_ID}
        booking={validBooking as BookingData}
        t={bookingEN}
        language="en"
        onBooked={vi.fn()}
        onChange={vi.fn()}
        onSubmittingChange={vi.fn()}
        {...props}
      />
      <SubmitButton />
    </>
  );
}

function submitForm() {
  fireEvent.click(screen.getByRole("button", { name: bookingEN.bookSession }));
}

// ── Tests ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BookingForm – network error", () => {
  it("shows the network error message when FunctionsFetchError is thrown", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeFetchError(),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByTestId("booking-error")).toBeInTheDocument();
    });
    expect(screen.getByTestId("booking-error").textContent).toContain(
      bookingEN.errorNetwork
    );
  });

  it("calls trackBookingFailed with error_code NETWORK", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeFetchError(),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(vi.mocked(trackBookingFailed)).toHaveBeenCalledWith(
        expect.objectContaining({ error_code: "NETWORK", funnel_step: "booking_details" })
      );
    });
  });

  it("does not include PII in the tracked event for network errors", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeFetchError(),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(vi.mocked(trackBookingFailed)).toHaveBeenCalled();
    });

    const [trackedErr] = vi.mocked(trackBookingFailed).mock.calls[0];
    const PII_KEYS = ["email", "name", "phone", "clientEmail", "clientName", "notes", "message", "enquiry"];
    for (const key of PII_KEYS) {
      expect(trackedErr, `PII field "${key}" must not appear in booking_failed event`).not.toHaveProperty(key);
    }
  });
});

describe("BookingForm – 4xx from edge function", () => {
  it("shows the edge function's own message for slot conflicts (409)", async () => {
    const edgeMessage = "This time slot is no longer available. Please go back and choose another.";
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeHttpError(409, { error: { code: "SLOT_TAKEN", message: edgeMessage, requestId: "req-1" } }),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByTestId("booking-error").textContent).toContain(edgeMessage);
    });
  });

  it("calls trackBookingFailed with SLOT_TAKEN and includes request_id", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeHttpError(409, { error: { code: "SLOT_TAKEN", message: "Slot taken", requestId: "req-xyz" } }),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(vi.mocked(trackBookingFailed)).toHaveBeenCalledWith(
        expect.objectContaining({
          error_code: "SLOT_TAKEN",
          http_status: 409,
          request_id: "req-xyz",
        })
      );
    });
  });

  it("shows edge function message for 400 VALIDATION_FAILED", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeHttpError(400, { error: { code: "VALIDATION_FAILED", message: "Missing required fields", requestId: "req-2" } }),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByTestId("booking-error").textContent).toContain("Missing required fields");
    });
  });
});

describe("BookingForm – 5xx from edge function", () => {
  it("shows the errorServer message for 500 responses", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeHttpError(500, { error: { code: "INTERNAL", message: "An unexpected error occurred.", requestId: "req-3" } }),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByTestId("booking-error").textContent).toContain(bookingEN.errorServer);
    });
  });

  it("calls trackBookingFailed with INTERNAL and http_status 500", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeHttpError(500, { error: { code: "INTERNAL", message: "...", requestId: "req-4" } }),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(vi.mocked(trackBookingFailed)).toHaveBeenCalledWith(
        expect.objectContaining({ error_code: "INTERNAL", http_status: 500 })
      );
    });
  });

  it("shows a ref error ID below the error message for server errors", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: makeHttpError(500, { error: { code: "INTERNAL", message: "...", requestId: "req-5" } }),
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByTestId("booking-error-ref")).toBeInTheDocument();
      expect(screen.getByTestId("booking-error-ref").textContent).toMatch(/^ref: [0-9a-f-]{36}$/);
    });
  });
});

describe("BookingForm – email failure (200 with emailSent: false)", () => {
  const successWithNoEmail = {
    data: {
      success: true,
      booking: { id: "b1", start_time: "2026-05-10T10:00:00", end_time: "2026-05-10T10:50:00", google_meet_link: "https://meet.example.com/abc" },
      meetLink: "https://meet.example.com/abc",
      emailSent: false,
      requestId: "req-email-fail",
    },
    error: null,
  };

  it("calls onBooked (shows confirmation) even when emailSent is false", async () => {
    const onBooked = vi.fn();
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce(successWithNoEmail);

    renderForm({ onBooked });
    submitForm();

    await waitFor(() => {
      expect(onBooked).toHaveBeenCalledWith(
        expect.objectContaining({ emailSent: false })
      );
    });
    expect(screen.queryByTestId("booking-error")).not.toBeInTheDocument();
  });

  it("fires trackEmailFailed when emailSent is false", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce(successWithNoEmail);

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(vi.mocked(trackEmailFailed)).toHaveBeenCalledWith(
        expect.objectContaining({ service_name: "Individual Therapy" })
      );
    });
  });

  it("does NOT fire trackEmailFailed when emailSent is true", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { success: true, booking: { id: "b2", start_time: "2026-05-10T10:00:00", end_time: "2026-05-10T10:50:00", google_meet_link: null }, meetLink: null, emailSent: true, requestId: "req-ok" },
      error: null,
    });

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(vi.mocked(supabase.functions.invoke)).toHaveBeenCalled();
    });
    // Give a tick for any async tracking calls
    await new Promise((r) => setTimeout(r, 50));
    expect(vi.mocked(trackEmailFailed)).not.toHaveBeenCalled();
  });

  it("passes client_email from local state, not from server response", async () => {
    const onBooked = vi.fn();
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce(successWithNoEmail);

    renderForm({ onBooked });
    submitForm();

    await waitFor(() => {
      expect(onBooked).toHaveBeenCalledWith(
        expect.objectContaining({ client_email: "test@example.com" })
      );
    });
  });
});

describe("BookingForm – unknown error", () => {
  it("shows errorGeneral for unexpected errors and still shows a ref", async () => {
    vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(new Error("something unexpected"));

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(screen.getByTestId("booking-error").textContent).toContain(bookingEN.errorGeneral);
      expect(screen.getByTestId("booking-error-ref")).toBeInTheDocument();
    });
  });

  it("calls trackBookingFailed with UNKNOWN for unexpected errors", async () => {
    vi.mocked(supabase.functions.invoke).mockRejectedValueOnce(new Error("unexpected"));

    renderForm();
    submitForm();

    await waitFor(() => {
      expect(vi.mocked(trackBookingFailed)).toHaveBeenCalledWith(
        expect.objectContaining({ error_code: "UNKNOWN" })
      );
    });
  });
});
