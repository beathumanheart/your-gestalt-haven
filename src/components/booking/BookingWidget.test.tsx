import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BookingWidget from "./BookingWidget";

const mockSessionTypes = [
  {
    id: "session-1",
    name: "Individual Therapy",
    name_ru: "Индивидуальная терапия",
    duration_minutes: 50,
    show_price: false,
    show_second_email: false,
  },
  {
    id: "session-2",
    name: "Couples Therapy",
    duration_minutes: 80,
    show_price: false,
    show_second_email: false,
  },
];

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/hooks/useAvailability", () => ({
  useSessionTypes: () => ({ sessionTypes: mockSessionTypes, loading: false }),
}));

vi.mock("@/hooks/useBookingAnalytics", () => ({
  trackServicesView: vi.fn(),
  trackServiceSelected: vi.fn(),
  trackDateTimeView: vi.fn(),
  trackDateTimeSelected: vi.fn(),
  trackConfirmationView: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

// Stub heavy child components — BookingWidget behaviour is what's under test
vi.mock("./DateTimeSelector", () => ({
  default: () => <div data-testid="datetime-selector" />,
}));

vi.mock("./BookingForm", () => ({
  default: () => <div data-testid="booking-form" />,
}));

vi.mock("./BookingConfirmation", () => ({
  default: () => <div data-testid="booking-confirmation" />,
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<BookingWidget />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("BookingWidget – initial render", () => {
  it("shows step 1 session selector when no ?session param is present", async () => {
    renderAt("/");
    await waitFor(() =>
      expect(screen.getByText("Individual Therapy")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("datetime-selector")).not.toBeInTheDocument();
  });

  it("renders the three-step progress indicator", async () => {
    renderAt("/");
    await waitFor(() =>
      expect(screen.getByText("Individual Therapy")).toBeInTheDocument()
    );
    // Step labels come from bookingEN content
    const steps = screen.getAllByText(/session|date|details/i);
    expect(steps.length).toBeGreaterThanOrEqual(3);
  });
});

describe("BookingWidget – direct session links (?session=)", () => {
  it("auto-advances to the datetime step when ?session= matches a loaded session", async () => {
    renderAt("/?session=session-1");
    await waitFor(() =>
      expect(screen.getByTestId("datetime-selector")).toBeInTheDocument()
    );
    expect(screen.queryByText("Individual Therapy")).not.toBeInTheDocument();
  });

  it("stays on session selector when ?session= ID does not match any session", async () => {
    renderAt("/?session=00000000-0000-0000-0000-000000000000");
    await waitFor(() =>
      expect(screen.getByText("Individual Therapy")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("datetime-selector")).not.toBeInTheDocument();
  });

  it("works for the second session type too", async () => {
    renderAt("/?session=session-2");
    await waitFor(() =>
      expect(screen.getByTestId("datetime-selector")).toBeInTheDocument()
    );
    expect(screen.queryByText("Couples Therapy")).not.toBeInTheDocument();
  });

  it("does not auto-advance when ?session= is an empty string", async () => {
    renderAt("/?session=");
    await waitFor(() =>
      expect(screen.getByText("Individual Therapy")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("datetime-selector")).not.toBeInTheDocument();
  });
});

describe("BookingWidget – share link icons", () => {
  it("renders link icons for each session type on step 1", async () => {
    renderAt("/");
    await waitFor(() =>
      expect(screen.getAllByTitle("Copy link")).toHaveLength(
        mockSessionTypes.length
      )
    );
  });
});
