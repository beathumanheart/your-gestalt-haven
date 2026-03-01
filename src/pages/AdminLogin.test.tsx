import { render } from "@testing-library/react";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminLogin from "./AdminLogin";

const mockNavigate = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
  },
}));

describe("AdminLogin", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockSignInWithPassword.mockReset();
    mockGetSession.mockReset();
    mockOnAuthStateChange.mockReset();
    mockResetPasswordForEmail.mockReset();

    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mockSignInWithPassword.mockResolvedValue({ error: null });
  });

  it("signs in and redirects to admin dashboard", async () => {
    render(<AdminLogin />);

    fireEvent.change(screen.getByPlaceholderText("admin@example.com"), {
      target: { value: "  beathumanheart@gmail.com " },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "super-secret-password" },
    });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "beathumanheart@gmail.com",
        password: "super-secret-password",
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin", { replace: true });
    });
  });
});
