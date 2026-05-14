import { render, fireEvent } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminOffers, { validateBilingual } from "./AdminOffers";

const mockGetSession = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: vi.fn().mockReturnValue({ data: [], isLoading: false }),
    useMutation: vi.fn().mockReturnValue({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
    useQueryClient: vi.fn().mockReturnValue({ invalidateQueries: vi.fn() }),
  };
});

vi.mock("@/hooks/useHiddenOffers", () => ({
  useHiddenOffers: () => ({ data: [], isLoading: false }),
  useOfferBookingCounts: () => ({ data: {} }),
  useCreateOffer: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateOffer: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
}));

const ADMIN_SESSION = { data: { session: { user: { email: "be@humanheart.life" } } } };

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/offers"]}>
      <Routes>
        <Route path="/admin/offers" element={<AdminOffers />} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
        <Route path="/admin/login" element={<div data-testid="login">Login</div>} />
      </Routes>
    </MemoryRouter>
  );

// ── Auth gate ─────────────────────────────────────────────────────────────────

describe("AdminOffers auth gate", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    vi.stubEnv("VITE_PUBLIC_ADMIN_EMAIL", "be@humanheart.life");
  });

  it("redirects to home when there is no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderPage();
    await waitFor(() => expect(screen.getByTestId("home")).toBeInTheDocument());
  });

  it("redirects to home when the session email does not match the admin email", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { email: "other@example.com" } } },
    });
    renderPage();
    await waitFor(() => expect(screen.getByTestId("home")).toBeInTheDocument());
  });

  it("renders the offers page when the session email matches the admin email", async () => {
    mockGetSession.mockResolvedValue(ADMIN_SESSION);
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Hidden Offers")).toBeInTheDocument()
    );
  });
});

// ── Form: UI error (neither language) ────────────────────────────────────────

describe("AdminOffers form — inline error via UI", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    vi.stubEnv("VITE_PUBLIC_ADMIN_EMAIL", "be@humanheart.life");
    mockGetSession.mockResolvedValue(ADMIN_SESSION);
  });

  it("shows inline error when neither language has any content", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Hidden Offers"));
    fireEvent.click(screen.getByRole("button", { name: /new offer/i }));
    await waitFor(() => screen.getByText("New offer"));

    // Fill only meta fields; leave all bilingual content empty
    fireEvent.change(screen.getByPlaceholderText("Grief support — May 2026"), {
      target: { value: "Test offer" },
    });
    fireEvent.change(screen.getByPlaceholderText("grief-may-2026"), {
      target: { value: "test-offer" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(screen.getByText(/at least one language/i)).toBeInTheDocument()
    );
  });
});

// ── validateBilingual — pure-function tests ───────────────────────────────────

const empty = {
  title_en: "", title_ru: "",
  description_en: "", description_ru: "",
  conditions_en: "", conditions_ru: "",
};

describe("validateBilingual", () => {
  it("returns an error when neither language is filled", () => {
    expect(validateBilingual(empty)).toMatch(/at least one language/i);
  });

  it("returns an error when EN has only a title (partial set)", () => {
    expect(validateBilingual({ ...empty, title_en: "Some title" })).toMatch(
      /each language must be either fully filled/i
    );
  });

  it("returns an error when RU has only title + description (missing conditions)", () => {
    expect(
      validateBilingual({ ...empty, title_ru: "T", description_ru: "D" })
    ).toMatch(/each language must be either fully filled/i);
  });

  it("returns null when EN is complete", () => {
    expect(
      validateBilingual({
        ...empty,
        title_en: "Title",
        description_en: "Description",
        conditions_en: "Conditions",
      })
    ).toBeNull();
  });

  it("returns null when RU is complete", () => {
    expect(
      validateBilingual({
        ...empty,
        title_ru: "Заголовок",
        description_ru: "Описание",
        conditions_ru: "Условия",
      })
    ).toBeNull();
  });

  it("returns null when both languages are complete", () => {
    expect(
      validateBilingual({
        title_en: "Title",
        description_en: "Description",
        conditions_en: "Conditions",
        title_ru: "Заголовок",
        description_ru: "Описание",
        conditions_ru: "Условия",
      })
    ).toBeNull();
  });
});
