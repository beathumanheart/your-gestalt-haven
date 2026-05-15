import { render, fireEvent } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminOffers, { validateBilingual } from "./AdminOffers";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockRpc = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: vi.fn().mockResolvedValue({}),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
    rpc: (...args: unknown[]) => mockRpc(...args),
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

const ADMIN_SESSION = { user: { id: "user-1", email: "be@humanheart.life" } };

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/admin/offers"]}>
      <Routes>
        <Route path="/admin/offers" element={<AdminOffers />} />
        <Route path="/" element={<div data-testid="home">Home</div>} />
        <Route path="/admin" element={<div data-testid="admin-dashboard">Dashboard</div>} />
        <Route path="/admin/login" element={<div data-testid="login">Login</div>} />
      </Routes>
    </MemoryRouter>
  );

// ── Auth gate ─────────────────────────────────────────────────────────────────

describe("AdminOffers auth gate", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockRpc.mockReset();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  it("redirects to login when there is no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    renderPage();
    // Retry loop takes ~1200ms (delays: 150+350+700ms) before loading resolves
    await waitFor(() => expect(screen.getByTestId("login")).toBeInTheDocument(), { timeout: 2500 });
  });

  it("redirects to admin dashboard when session exists but user lacks admin role", async () => {
    mockGetSession.mockResolvedValue({ data: { session: ADMIN_SESSION } });
    mockRpc.mockResolvedValue({ data: false, error: null });
    renderPage();
    await waitFor(() => expect(screen.getByTestId("admin-dashboard")).toBeInTheDocument());
  });

  it("renders the offers page for authenticated admin users", async () => {
    mockGetSession.mockResolvedValue({ data: { session: ADMIN_SESSION } });
    renderPage();
    await waitFor(() => expect(screen.getByText("Hidden Offers")).toBeInTheDocument());
  });
});

// ── Form: UI error (neither language) ────────────────────────────────────────

describe("AdminOffers form — inline error via UI", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockRpc.mockReset();
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockGetSession.mockResolvedValue({ data: { session: ADMIN_SESSION } });
  });

  it("shows inline error when neither language has any content", async () => {
    renderPage();
    await waitFor(() => screen.getByText("Hidden Offers"));
    fireEvent.click(screen.getByRole("button", { name: /new offer/i }));
    await waitFor(() => screen.getByText("New offer"));

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
