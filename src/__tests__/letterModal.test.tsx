/**
 * The footer item, and the dialog it opens.
 *
 * The load-bearing assertion in this file is the negative one: the dialog must
 * never appear without a click. Every mechanism that would make it appear on
 * its own — a timer, scroll depth, exit intent, "first visit" — is a change to
 * a practice site that would ask a reader for their address before it had
 * given them anything. So the test advances fake timers, fires scroll and
 * mouseleave, and re-renders, and expects nothing to open.
 *
 * Made to fail first: with `useEffect(() => setLetterOpen(true), [])` added to
 * Footer, "does not open by itself" fails on the timer case, the scroll case
 * and the remount case; with the timers assertion alone it failed on none.
 */

import { render, screen, fireEvent, waitFor, cleanup, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Footer from "@/components/Footer";
import { letterEN } from "@/content/letter";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: vi.fn(() => ({
    language: "en",
    setLanguage: vi.fn(),
    langPath: (path: string) => `/en${path}`,
  })),
}));

import { useLanguage } from "@/contexts/LanguageContext";

const asEnglish = () =>
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language: "en",
    setLanguage: vi.fn(),
    langPath: (path: string) => `/en${path}`,
  });

const asRussian = () =>
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language: "ru",
    setLanguage: vi.fn(),
    langPath: (path: string) => `/ru${path}`,
  });

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>,
  );

const dialog = () => screen.queryByRole("dialog");
const footerItem = () => screen.getByText(letterEN.footerLink);

beforeEach(() => {
  invoke.mockReset();
  asEnglish();
  // Cleared, or the "stores nothing" test below compares a snapshot that an
  // earlier test in this file already polluted — which is exactly how it
  // passed under a sabotaged Footer that did write a flag.
  localStorage.clear();
});
afterEach(cleanup);

describe("the footer item", () => {
  it("is there, worded as the letter is named", () => {
    renderFooter();
    expect(footerItem()).toBeInTheDocument();
  });

  it("opens the dialog when clicked", () => {
    renderFooter();
    expect(dialog()).toBeNull();

    fireEvent.click(footerItem());

    expect(dialog()).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: letterEN.title })).toBeInTheDocument();
  });

  it("is a link to the English page for a Russian reader, not a form", () => {
    // There is one Brevo list and one confirmation template, both English. A
    // Russian form here would subscribe someone to a letter they cannot read.
    asRussian();
    renderFooter();

    const link = screen.getByRole("link", { name: letterEN.footerLink });
    expect(link).toHaveAttribute("href", "/en/letter");
    expect(screen.queryByRole("button", { name: letterEN.footerLink })).toBeNull();
  });
});

describe("the dialog never opens by itself", () => {
  it("does not open on a timer, on scroll, on exit intent, or on a remount", () => {
    vi.useFakeTimers();
    try {
      const { unmount } = renderFooter();
      expect(dialog()).toBeNull();

      act(() => {
        vi.advanceTimersByTime(120_000);
      });
      expect(dialog(), "opened on a timer").toBeNull();

      fireEvent.scroll(window, { target: { scrollY: 4000 } });
      expect(dialog(), "opened on scroll depth").toBeNull();

      fireEvent.mouseLeave(document.body);
      fireEvent.mouseOut(document.documentElement, { clientY: -10 });
      expect(dialog(), "opened on exit intent").toBeNull();

      unmount();
      renderFooter();
      act(() => {
        vi.advanceTimersByTime(120_000);
      });
      expect(dialog(), "opened on a first/later visit").toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("stores nothing that a later visit could act on", () => {
    // A "shown once" flag is the usual way an automatic dialog is built. There
    // isn't one, and this fails if one appears.
    // `length`, not Object.keys: the test setup installs a plain-object
    // Storage mock, so Object.keys returns its methods rather than its keys.
    expect(localStorage.length).toBe(0);
    renderFooter();
    expect(localStorage.length).toBe(0);
  });
});

describe("closing it", () => {
  it("closes on the close button", () => {
    renderFooter();
    fireEvent.click(footerItem());

    fireEvent.click(screen.getByRole("button", { name: letterEN.modalClose }));
    expect(dialog()).toBeNull();
  });

  it("closes on Escape", () => {
    renderFooter();
    fireEvent.click(footerItem());

    fireEvent.keyDown(document, { key: "Escape" });
    expect(dialog()).toBeNull();
  });

  it("closes on a click on the scrim, but not on one that began inside the card", () => {
    renderFooter();
    fireEvent.click(footerItem());

    // A drag that starts on the text and ends outside must not close it.
    fireEvent.mouseDown(screen.getByRole("heading", { name: letterEN.title }));
    expect(dialog()).toBeInTheDocument();

    fireEvent.mouseDown(document.querySelector(".lm-scrim")!);
    expect(dialog()).toBeNull();
  });

  it("gives the page its scroll back however it was closed", () => {
    // Escape is the path that leaves a page stuck when the restore lives in
    // the close button's handler instead of the effect's cleanup.
    renderFooter();
    fireEvent.click(footerItem());
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.body.style.overflow).not.toBe("hidden");
  });
});

describe("the dialog's form", () => {
  it("subscribes from letter-footer, letter only and no PDF", async () => {
    invoke.mockResolvedValue({ data: { ok: true, letter: "pending" }, error: null });
    renderFooter();
    fireEvent.click(footerItem());

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][1].body).toMatchObject({
      email: "reader@example.com",
      source: "letter-footer",
      letter: true,
      pdf: false,
    });
  });

  it("says what happens next, in place, without closing under the reader", async () => {
    invoke.mockResolvedValue({ data: { ok: true, letter: "pending" }, error: null });
    renderFooter();
    fireEvent.click(footerItem());

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /subscribe/i }));

    const said = await screen.findByRole("status");
    expect(said.textContent).toMatch(/confirm/i);
    expect(dialog(), "the dialog closed before the reader could read it").toBeInTheDocument();
  });
});
