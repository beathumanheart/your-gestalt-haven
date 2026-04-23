import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Header from "./Header";
import { navigationEN } from "@/content/navigation";

// ── Mocks ──────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  createPortal: (children: React.ReactNode) => children,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: vi.fn(() => ({
    language: "en",
    langPath: (path: string) => `/en${path}`,
  })),
}));

vi.mock("./LanguageSwitcher", () => ({ default: () => null }));

vi.mock("@/hooks/useBookingAnalytics", () => ({
  trackBookNowClick: vi.fn(),
}));

import { useLanguage } from "@/contexts/LanguageContext";

beforeEach(() => {
  vi.clearAllMocks();
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language: "en",
    langPath: (path: string) => `/en${path}`,
  });
});

// ── Navigation ──────────────────────────────────────────────────

describe("Header – navigateToSection", () => {
  it("clicking a nav item navigates to the correct hash path", () => {
    render(<Header />);
    // Click the first nav item (whatever sectionId it has)
    const firstNavItem = navigationEN.navItems[0];
    fireEvent.click(screen.getByRole("button", { name: firstNavItem.label }));
    expect(mockNavigate).toHaveBeenCalledWith(`/en/#${firstNavItem.sectionId}`);
  });

  it("clicking Book a Session navigates to /#contact", () => {
    render(<Header />);
    // The desktop Book a Session button
    const bookButtons = screen.getAllByRole("button", { name: navigationEN.bookSession });
    fireEvent.click(bookButtons[0]);
    expect(mockNavigate).toHaveBeenCalledWith("/en/#contact");
  });

  it("navigate path changes with language (RU)", () => {
    (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "ru",
      langPath: (path: string) => `/ru${path}`,
    });
    render(<Header />);
    const firstNavItem = navigationEN.navItems[0];
    // In RU the labels come from navigationRU, but sectionId is the same
    fireEvent.click(screen.getAllByRole("button")[1]); // first nav button after logo
    expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/^\/ru\/#/));
  });
});
