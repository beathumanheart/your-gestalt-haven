/**
 * The letter page at /en/letter, and the form it shares with the dialog.
 *
 * The form's markup is its own (LetterSignupForm), but the submit path is the
 * worksheet's — one request shape, one set of messages. What is tested here is
 * what the *page* is for: something a person can be sent a link to, read, and
 * decide on, including the place Brevo returns them to after they confirm.
 */

import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Letter from "@/pages/Letter";
import { letterEN } from "@/content/letter";
import { signupMessages } from "@/content/signupMessages";
import { LETTER_TEXT, STATIC_ROUTES } from "@/config/pageMetadata";

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

const setLanguage = (language: "en" | "ru") =>
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language,
    setLanguage: vi.fn(),
    langPath: (path: string) => `/${language}${path}`,
  });

const renderPage = (search = "") =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/en/letter${search}`]}>
        <Letter />
      </MemoryRouter>
    </HelmetProvider>,
  );

beforeEach(() => {
  invoke.mockReset();
  setLanguage("en");
});
afterEach(cleanup);

describe("what the page says", () => {
  it("names the letter and says what it is, before asking for anything", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: letterEN.title })).toBeInTheDocument();
    expect(screen.getByText(letterEN.lead)).toBeInTheDocument();
    expect(screen.getByText(letterEN.what)).toBeInTheDocument();
    expect(screen.getByText(letterEN.when)).toBeInTheDocument();
    expect(screen.getByText(letterEN.leave)).toBeInTheDocument();
  });

  it("says who writes it", () => {
    renderPage();
    expect(screen.getByText(letterEN.byline)).toBeInTheDocument();
  });

  it("says that nothing is sent before the address is confirmed", () => {
    // Double opt-in is the whole shape of this: a page that did not say so
    // would look like it had subscribed someone who never clicked the email.
    renderPage();
    expect(screen.getByText(new RegExp(letterEN.confirmNote.slice(0, 30)))).toBeInTheDocument();
  });

  it("links the privacy notice from beside the field", () => {
    renderPage();
    expect(screen.getByRole("link", { name: letterEN.privacy })).toHaveAttribute(
      "href",
      "/en/privacy",
    );
  });

  it("does not point back at the dialog it is reached from", () => {
    // The modal links here. A link the other way would be a loop.
    renderPage();
    expect(screen.queryByText(letterEN.moreLink)).toBeNull();
  });
});

describe("subscribing from the page", () => {
  const fill = (email = "reader@example.com") => {
    fireEvent.change(screen.getByLabelText(new RegExp(signupMessages.label, "i")), {
      target: { value: email },
    });
    fireEvent.click(screen.getByRole("button", { name: signupMessages.subscribe }));
  };

  it("names itself letter-page, so the two surfaces are told apart in Brevo", () => {
    invoke.mockResolvedValue({ data: { ok: true, letter: "pending" }, error: null });
    renderPage();
    fill();

    return waitFor(() => {
      expect(invoke.mock.calls[0][1].body).toMatchObject({
        source: "letter-page",
        letter: true,
        pdf: false,
        lang: "en",
      });
    });
  });

  it("asks for no PDF from here, because there is none to ask for", async () => {
    // take-signup answers 400 to a PDF request from this source; the form must
    // never make one.
    invoke.mockResolvedValue({ data: { ok: true, letter: "pending" }, error: null });
    renderPage();
    fill();

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][1].body.pdf).toBe(false);
  });

  it("replaces the form with what happens next, rather than saying nothing", async () => {
    invoke.mockResolvedValue({ data: { ok: true, letter: "pending" }, error: null });
    renderPage();
    fill();

    const said = await screen.findByRole("status");
    expect(said.textContent).toBe(signupMessages.letterPending);
    // Visible, not a node sitting in the DOM with display:none — which is what
    // "I clicked and nothing happened" was last time.
    expect(said.className).toContain("ls-done");
    expect(screen.queryByRole("button", { name: signupMessages.subscribe })).toBeNull();
  });

  it("says try again, and leaves the address in the field, when the call fails", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 500 } } });
    renderPage();
    fill();

    expect((await screen.findByRole("status")).textContent).toBe(signupMessages.error);
    // Re-typing an address you already typed is the second annoyance after the
    // failure itself.
    expect(screen.getByLabelText(new RegExp(signupMessages.label, "i"))).toHaveValue(
      "reader@example.com",
    );
  });

  it("distinguishes an unusable address from a rate limit from a fault", async () => {
    const cases: [number, string][] = [
      [400, signupMessages.invalid],
      [429, signupMessages.rate_limited],
      [500, signupMessages.error],
    ];

    for (const [status, expected] of cases) {
      invoke.mockResolvedValue({ data: null, error: { context: { status } } });
      renderPage();
      fill();
      expect((await screen.findByRole("status")).textContent, `status ${status}`).toBe(expected);
      cleanup();
    }
  });

  it("does not claim success when the letter did not go pending", async () => {
    invoke.mockResolvedValue({ data: { ok: true, letter: "skipped" }, error: null });
    renderPage();
    fill();

    expect((await screen.findByRole("status")).textContent).toBe(signupMessages.error);
  });

  it("keeps the typed address out of autocapture and out of session replay", () => {
    // Two different mechanisms, two different markers, neither a substitute
    // for the other — see analyticsPrivacy.test.tsx.
    renderPage();
    const field = screen.getByLabelText(new RegExp(signupMessages.label, "i"));

    expect(field).toHaveAttribute("data-ph-no-capture");
    expect(field.className).toContain("ph-no-capture");
  });

  it("carries an off-screen field a person never fills in", () => {
    renderPage();
    const pot = document.querySelector('input[name="company"]')!;

    expect(pot).toBeTruthy();
    expect(pot).toHaveAttribute("tabindex", "-1");
    expect(pot).toHaveAttribute("aria-hidden", "true");
  });
});

describe("coming back from the confirmation email", () => {
  it("says the address is confirmed rather than showing the form again", () => {
    // ?letter=confirmed is the redirectionUrl take-signup hands Brevo. Showing
    // the form here reads as though the confirmation had not worked.
    renderPage("?letter=confirmed");

    expect(screen.getByRole("heading", { name: letterEN.confirmedTitle })).toBeInTheDocument();
    expect(screen.getByText(letterEN.confirmedBody)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: signupMessages.subscribe })).toBeNull();
  });

  it("shows the form for any other query, so the check is on the value", () => {
    renderPage("?letter=something-else");
    expect(
      screen.getByRole("button", { name: signupMessages.subscribe }),
    ).toBeInTheDocument();
  });
});

describe("the page is English only", () => {
  it("sends a Russian reader to the English page rather than a Russian form", () => {
    // One Brevo list, one confirmation template, both English.
    setLanguage("ru");
    renderPage();

    expect(screen.queryByRole("button", { name: signupMessages.subscribe })).toBeNull();
    expect(screen.queryByRole("heading", { name: letterEN.title })).toBeNull();
  });

  it("is registered as a single-language route, so the build writes no /ru file", () => {
    const route = STATIC_ROUTES.find((r) => r.path === "/letter");
    expect(route, "/letter is missing from STATIC_ROUTES, so it gets no file at all").toBeTruthy();
    expect(route!.langs).toEqual(["en"]);
    expect(route!.titleEn).toBe(LETTER_TEXT.titleEn);
  });
});
