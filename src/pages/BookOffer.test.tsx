import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import BookOffer from "./BookOffer";

const mockFrom = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    langPath: (path: string) => `/en${path}`,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/Header", () => ({ default: () => <div /> }));
vi.mock("@/components/Footer", () => ({ default: () => <div /> }));
vi.mock("@/components/booking/BookingWidget", () => ({
  default: () => <div data-testid="booking-widget">BookingWidget</div>,
}));

const OFFER = {
  id: "offer-uuid-1",
  slug: "grief-may-2026-x7k2",
  name: "Grief support",
  title: "Free session for grief support",
  description: "A session to help you through grief.",
  conditions: "This session is offered once per person.",
  notification_email: null,
  price_cents: 0,
  duration_minutes: 60,
  language: "en",
  is_active: true,
  created_at: "2026-05-14T00:00:00Z",
  updated_at: "2026-05-14T00:00:00Z",
};

const buildChain = (result: unknown) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(result),
});

const renderPage = (slug = "grief-may-2026-x7k2", lang = "en") =>
  render(
    <MemoryRouter initialEntries={[`/${lang}/book/offer/${slug}`]}>
      <Routes>
        <Route path="/:lang/book/offer/:slug" element={<BookOffer />} />
        <Route path="/ru/book/offer/:slug" element={<div data-testid="ru-page">RU page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe("BookOffer", () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it("shows the offer title when the offer is found and active", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER, error: null }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Free session for grief support")).toBeInTheDocument()
    );
  });

  it("shows 'offer unavailable' when Supabase returns an error (inactive or missing)", async () => {
    mockFrom.mockReturnValue(
      buildChain({ data: null, error: { message: "No rows found", code: "PGRST116" } })
    );
    renderPage();
    await waitFor(() =>
      expect(
        screen.getByText(/no longer available/i)
      ).toBeInTheDocument()
    );
  });

  it("shows the conditions section before the booking widget is visible", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER, error: null }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Conditions for this offer")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("booking-widget")).not.toBeInTheDocument();
  });

  it("renders Free price when price_cents is 0", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER, error: null }));
    renderPage();
    await waitFor(() => expect(screen.getByText("Free")).toBeInTheDocument());
  });
});
