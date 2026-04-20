import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Hero from "./Hero";
import { navigationEN, navigationRU } from "@/content/navigation";
import { heroEN, heroRU } from "@/content/hero";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: vi.fn(() => ({ language: "en" })),
}));

vi.mock("@/hooks/useBookingAnalytics", () => ({
  trackBookNowClick: vi.fn(),
}));

vi.mock("@/assets/hero-therapy.jpg", () => ({ default: "hero.jpg" }));

import { useLanguage } from "@/contexts/LanguageContext";
import { trackBookNowClick } from "@/hooks/useBookingAnalytics";

beforeEach(() => {
  vi.clearAllMocks();
  // scrollIntoView is not implemented in jsdom
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  // Default to EN
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({ language: "en" });
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
    (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({ language: "ru" });
    render(<Hero />);
    expect(screen.getByRole("button", { name: navigationRU.bookSession })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: heroRU.learnMore })).toBeInTheDocument();
  });

  it("clicking Book a Session fires trackBookNowClick('hero')", () => {
    render(<Hero />);
    fireEvent.click(screen.getByRole("button", { name: navigationEN.bookSession }));
    expect(trackBookNowClick).toHaveBeenCalledWith("hero");
  });

  it("clicking Book a Session scrolls to the contact section", () => {
    const contactEl = document.createElement("div");
    contactEl.id = "contact";
    document.body.appendChild(contactEl);

    render(<Hero />);
    fireEvent.click(screen.getByRole("button", { name: navigationEN.bookSession }));
    expect(contactEl.scrollIntoView).toHaveBeenCalled();

    document.body.removeChild(contactEl);
  });

  it("clicking Learn More scrolls to the about section", () => {
    const aboutEl = document.createElement("div");
    aboutEl.id = "about";
    document.body.appendChild(aboutEl);

    render(<Hero />);
    fireEvent.click(screen.getByRole("button", { name: heroEN.learnMore }));
    expect(aboutEl.scrollIntoView).toHaveBeenCalled();

    document.body.removeChild(aboutEl);
  });
});

// ── Regression: no duplicate translation key ───────────────────

describe("Hero – translation key reuse (regression)", () => {
  it("uses navigationEN.bookSession — not a separate hero-level key", () => {
    // heroEN must NOT have its own bookSession field
    expect((heroEN as Record<string, unknown>)["bookSession"]).toBeUndefined();
  });

  it("navigationEN.bookSession and navigationRU.bookSession are defined and non-empty", () => {
    expect(navigationEN.bookSession).toBeTruthy();
    expect(navigationRU.bookSession).toBeTruthy();
  });
});
