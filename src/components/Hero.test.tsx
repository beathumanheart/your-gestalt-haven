import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Hero from "./Hero";
import { navigationEN, navigationRU } from "@/content/navigation";
import { heroEN, heroRU } from "@/content/hero";

// ── Mocks ──────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: vi.fn(() => ({
    language: "en",
    langPath: (path: string) => `/en${path}`,
  })),
}));

vi.mock("@/hooks/useBookingAnalytics", () => ({
  trackBookNowClick: vi.fn(),
}));

vi.mock("@/assets/hero-therapy.jpg", () => ({ default: "hero.jpg" }));

import { useLanguage } from "@/contexts/LanguageContext";
import { trackBookNowClick } from "@/hooks/useBookingAnalytics";

beforeEach(() => {
  vi.clearAllMocks();
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language: "en",
    langPath: (path: string) => `/en${path}`,
  });
});

// ── Hero CTA buttons ────────────────────────────────────────────

describe("Hero – CTA buttons", () => {
  it("renders the Learn More button (EN)", () => {
    render(<Hero />);
    expect(screen.getByRole("button", { name: heroEN.learnMore })).toBeInTheDocument();
  });

  it("renders the Book a Session button (EN)", () => {
    render(<Hero />);
    expect(screen.getByRole("button", { name: navigationEN.bookSession })).toBeInTheDocument();
  });

  it("renders the Book a Session button (RU) with the same label as the nav (RU)", () => {
    (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "ru",
      langPath: (path: string) => `/ru${path}`,
    });
    render(<Hero />);
    expect(screen.getByRole("button", { name: navigationRU.bookSession })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: heroRU.learnMore })).toBeInTheDocument();
  });

  it("clicking Book a Session fires trackBookNowClick('hero')", () => {
    render(<Hero />);
    fireEvent.click(screen.getByRole("button", { name: navigationEN.bookSession }));
    expect(trackBookNowClick).toHaveBeenCalledWith("hero");
  });

  it("clicking Book a Session navigates to /#contact", () => {
    render(<Hero />);
    fireEvent.click(screen.getByRole("button", { name: navigationEN.bookSession }));
    expect(mockNavigate).toHaveBeenCalledWith("/en/#contact");
  });

  it("clicking Learn More navigates to /#about", () => {
    render(<Hero />);
    fireEvent.click(screen.getByRole("button", { name: heroEN.learnMore }));
    expect(mockNavigate).toHaveBeenCalledWith("/en/#about");
  });
});

// ── Regression: no duplicate translation key ───────────────────

describe("Hero – translation key reuse (regression)", () => {
  it("uses navigationEN.bookSession — not a separate hero-level key", () => {
    expect((heroEN as Record<string, unknown>)["bookSession"]).toBeUndefined();
  });

  it("navigationEN.bookSession and navigationRU.bookSession are defined and non-empty", () => {
    expect(navigationEN.bookSession).toBeTruthy();
    expect(navigationRU.bookSession).toBeTruthy();
  });
});
