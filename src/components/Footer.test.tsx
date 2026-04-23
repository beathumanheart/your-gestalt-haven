import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Footer from "./Footer";
import { navigationEN, navigationRU } from "@/content/navigation";

// ── Mocks ──────────────────────────────────────────────────────

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: vi.fn(() => ({
    language: "en",
    langPath: (path: string) => `/en${path}`,
  })),
}));

import { useLanguage } from "@/contexts/LanguageContext";

beforeEach(() => {
  vi.clearAllMocks();
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language: "en",
    langPath: (path: string) => `/en${path}`,
  });
});

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

// ── Section links ───────────────────────────────────────────────

describe("Footer – section links", () => {
  it("About link points to /#about", () => {
    renderFooter();
    const link = screen.getByRole("link", { name: navigationEN.footerAbout });
    expect(link).toHaveAttribute("href", "/en/#about");
  });

  it("Services link points to /#services", () => {
    renderFooter();
    const link = screen.getByRole("link", { name: navigationEN.footerServices });
    expect(link).toHaveAttribute("href", "/en/#services");
  });

  it("Contact link points to /#contact", () => {
    renderFooter();
    const link = screen.getByRole("link", { name: navigationEN.footerContact });
    expect(link).toHaveAttribute("href", "/en/#contact");
  });

  it("section links use Russian paths when language is RU", () => {
    (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
      language: "ru",
      langPath: (path: string) => `/ru${path}`,
    });
    renderFooter();
    expect(screen.getByRole("link", { name: navigationRU.footerAbout })).toHaveAttribute("href", "/ru/#about");
    expect(screen.getByRole("link", { name: navigationRU.footerServices })).toHaveAttribute("href", "/ru/#services");
    expect(screen.getByRole("link", { name: navigationRU.footerContact })).toHaveAttribute("href", "/ru/#contact");
  });
});
