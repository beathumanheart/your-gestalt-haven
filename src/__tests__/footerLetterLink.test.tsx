/**
 * The footer's letter control: named, and big enough to hit.
 *
 * It is an icon with no visible words, at the very bottom of the page. Both
 * properties make it easy to get wrong in ways nothing else catches — an
 * unlabelled control is silent to a screen reader, and a target under 44px is
 * one a thumb misses, which at the foot of a page scrolls instead.
 */

import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Footer from "@/components/Footer";
import { letterEN } from "@/content/letter";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: vi.fn(() => ({
    language: "en",
    setLanguage: vi.fn(),
    langPath: (path: string) => `/en${path}`,
  })),
}));

import { useLanguage } from "@/contexts/LanguageContext";

const setLanguage = (language: "en" | "ru") =>
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language,
    setLanguage: vi.fn(),
    langPath: (path: string) => `/${language}${path}`,
  });

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

/**
 * Tailwind's w-11 = 44px.
 *
 * ⚠️ jsdom computes no layout, so this file can only check that the classes
 * are on the right elements — getBoundingClientRect would report 0 here
 * whatever the CSS says. The actual measured 44x44 is asserted in
 * e2e/mobile-layout.spec.ts, in a browser. Neither is redundant: this one
 * catches the structure being undone, that one catches the CSS not applying.
 */
const MIN_TARGET = "w-11";

beforeEach(() => setLanguage("en"));
afterEach(cleanup);

describe("the letter control is named", () => {
  it("can be found by role and name, in both languages", () => {
    // Queried the way assistive technology reaches it, not by test id: if the
    // name is lost, there is nothing to find and this fails.
    renderFooter();
    expect(screen.getByRole("button", { name: letterEN.footerLink })).toBeInTheDocument();

    cleanup();
    setLanguage("ru");
    renderFooter();
    expect(screen.getByRole("link", { name: letterEN.footerLink })).toBeInTheDocument();
  });

  it("names itself on hover as well, for a sighted reader with a mouse", () => {
    renderFooter();
    expect(screen.getByRole("button", { name: letterEN.footerLink })).toHaveAttribute(
      "title",
      letterEN.footerLink,
    );
  });

  it("names every other control in the row too", () => {
    // The letter is not a special case — an unlabelled icon anywhere in this
    // row is the same bug.
    renderFooter();
    const row = screen.getByRole("button", { name: letterEN.footerLink }).parentElement!;

    for (const el of row.children) {
      const name = el.getAttribute("aria-label");
      expect(name, `${el.tagName} in the social row has no accessible name`).toBeTruthy();
    }
  });
});

describe("the letter control is built to be big enough to hit", () => {
  it("carries the 44px classes on the control and the 38px circle on the span", () => {
    // The visible ring is an inner span, so the circle can stay the size it
    // is while the thing you tap is the minimum comfortable size.
    renderFooter();
    const control = screen.getByRole("button", { name: letterEN.footerLink });

    expect(control.className, "the tap target is still the 38px circle").toContain(MIN_TARGET);
    expect(control.className).toContain("h-11");
    expect(
      control.querySelector("span")?.className,
      "no inner span, so growing the target grew the circle too",
    ).toContain("w-[38px]");
  });

  it("gives the same target to every control in the row", () => {
    renderFooter();
    const youtube = screen.getByRole("link", { name: "YouTube" });
    const letter = screen.getByRole("button", { name: letterEN.footerLink });

    expect(youtube.className).toBe(letter.className);
  });
});
