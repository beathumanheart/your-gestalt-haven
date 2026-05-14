import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminOffers from "./AdminOffers";

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

describe("AdminOffers auth gate", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    // VITE_PUBLIC_ADMIN_EMAIL is read from import.meta.env; stub it via vi.stubEnv
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
    mockGetSession.mockResolvedValue({
      data: { session: { user: { email: "be@humanheart.life" } } },
    });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText("Hidden Offers")).toBeInTheDocument()
    );
  });
});
