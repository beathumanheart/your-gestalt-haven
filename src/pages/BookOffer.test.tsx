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

// Language mock — overridden per test using vi.mocked
const languageMock = { language: "en", langPath: (p: string) => `/en${p}` };
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => languageMock,
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/Header", () => ({ default: () => <div /> }));
vi.mock("@/components/Footer", () => ({ default: () => <div /> }));
vi.mock("@/components/booking/BookingWidget", () => ({
  default: () => <div data-testid="booking-widget">BookingWidget</div>,
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE_OFFER = {
  id: "offer-uuid-1",
  slug: "grief-may-2026-x7k2",
  name: "Grief support",
  title_en: null,
  title_ru: null,
  description_en: null,
  description_ru: null,
  conditions_en: null,
  conditions_ru: null,
  notification_email: null,
  price_cents: 0,
  duration_minutes: 60,
  is_active: true,
  created_at: "2026-05-14T00:00:00Z",
  updated_at: "2026-05-14T00:00:00Z",
};

const OFFER_EN_ONLY = {
  ...BASE_OFFER,
  title_en: "Free session for grief support",
  description_en: "A session to help you through grief.",
  conditions_en: "This session is offered once per person.",
};

const OFFER_RU_ONLY = {
  ...BASE_OFFER,
  title_ru: "Бесплатная сессия поддержки",
  description_ru: "Сессия для работы с горем.",
  conditions_ru: "Предложение действует один раз.",
};

const OFFER_BILINGUAL = {
  ...OFFER_EN_ONLY,
  title_ru: "Бесплатная сессия поддержки",
  description_ru: "Сессия для работы с горем.",
  conditions_ru: "Предложение действует один раз.",
};

const buildChain = (result: unknown) => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(result),
});

const renderPage = (slug = "grief-may-2026-x7k2", lang = "en") => {
  languageMock.language = lang;
  languageMock.langPath = (p: string) => `/${lang}${p}`;
  return render(
    <MemoryRouter initialEntries={[`/${lang}/book/offer/${slug}`]}>
      <Routes>
        <Route path="/:lang/book/offer/:slug" element={<BookOffer />} />
      </Routes>
    </MemoryRouter>
  );
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("BookOffer", () => {
  beforeEach(() => {
    mockFrom.mockReset();
    languageMock.language = "en";
    languageMock.langPath = (p: string) => `/en${p}`;
  });

  it("shows the offer title when an EN-only offer is loaded with lang=en", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER_EN_ONLY, error: null }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Free session for grief support")).toBeInTheDocument()
    );
  });

  it("shows 'offer unavailable' when Supabase returns an error", async () => {
    mockFrom.mockReturnValue(
      buildChain({ data: null, error: { message: "No rows found", code: "PGRST116" } })
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByText(/no longer available/i)).toBeInTheDocument()
    );
  });

  it("shows the conditions section before the booking widget is visible", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER_EN_ONLY, error: null }));
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Conditions for this offer")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("booking-widget")).not.toBeInTheDocument();
  });

  it("renders Free price when price_cents is 0", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER_EN_ONLY, error: null }));
    renderPage();
    await waitFor(() => expect(screen.getByText("Free")).toBeInTheDocument());
  });

  it("shows language notice when EN-only offer is loaded with lang=ru", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER_EN_ONLY, error: null }));
    renderPage("grief-may-2026-x7k2", "ru");
    await waitFor(() =>
      // EN-only offer shown to RU visitor → notice in RU
      expect(
        screen.getByText(/доступно только на английском/i)
      ).toBeInTheDocument()
    );
  });

  it("shows language notice when RU-only offer is loaded with lang=en", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER_RU_ONLY, error: null }));
    renderPage("grief-may-2026-x7k2", "en");
    await waitFor(() =>
      // RU-only offer shown to EN visitor → notice in EN
      expect(
        screen.getByText(/only available in russian/i)
      ).toBeInTheDocument()
    );
  });

  it("shows no language notice when bilingual offer matches visitor language", async () => {
    mockFrom.mockReturnValue(buildChain({ data: OFFER_BILINGUAL, error: null }));
    renderPage("grief-may-2026-x7k2", "en");
    await waitFor(() =>
      expect(screen.getByText("Free session for grief support")).toBeInTheDocument()
    );
    expect(screen.queryByText(/only available/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/доступно только/i)).not.toBeInTheDocument();
  });
});
