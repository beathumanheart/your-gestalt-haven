import { render } from "@testing-library/react";
import { screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockRpc = vi.fn();
const mockSignOut = vi.fn();

vi.mock("@/components/admin/BookingsList", () => ({
  default: () => <div>Bookings Stub</div>,
}));

vi.mock("@/components/admin/AvailabilityManager", () => ({
  default: () => <div>Availability Stub</div>,
}));

vi.mock("@/components/admin/SessionTypeManager", () => ({
  default: () => <div>Session Types Stub</div>,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

describe("AdminDashboard", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockRpc.mockReset();
    mockSignOut.mockReset();

    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockRpc.mockResolvedValue({ data: true, error: null });
  });

  it("renders dashboard for authenticated admin users", async () => {
    const mockSession = { user: { id: "user-1" } };

    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /admin dashboard/i })).toBeInTheDocument();
    });

    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });
});
