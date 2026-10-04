/**
 * BOOKING_ENABLED, in both states.
 *
 * Two things are being guarded, and they pull in opposite directions.
 *
 * **The flag works.** Off, no calendar and no wizard is reachable, and no
 * rendered output says "Book a Session". On, the wizard is back. The flag-on
 * half is **not optional**: a flag only ever tested in one state rots, and in
 * six months turning booking back on would be a rebuild rather than a config
 * change. The intro consultation is expected to return, which is the whole
 * reason nothing was deleted.
 *
 * **The flag does not reach past booking.** The scale, the offer derivation
 * and the Service node must all survive it. This is the regression that
 * actually threatens this change: someone removing "the booking feature"
 * tidies away the pricing display with it, because the scale reads from
 * `session_types` and looks like part of the same machinery. It is not — with
 * the calendar off it is the only place the site states a price.
 *
 * ## Why the scale assertion is written the way it is
 *
 * `docs/writing-guards.md`: "not found" is not a pass. A test that asserted
 * "the scale is somewhere in the DOM" would pass if the scale stopped being
 * rendered at all — absence is exactly what the regression looks like. So the
 * assertions are on the **published figures**: 40 and 100 have to appear
 * inside the scale panel. Made to fail by gating `publishedScale()` behind the
 * flag; the recorded result is in the test body.
 *
 * ## Why the flag is a mutable mock rather than `vi.resetModules()`
 *
 * The first version of this file reset the module registry between states and
 * re-imported the components. That gives the re-imported tree a *second* copy
 * of React, which the testing library has not rendered with, and the symptom
 * is `TypeError: Cannot read properties of undefined (reading 'add')` from
 * React's own concurrent-error recovery — not a failure of anything under
 * test. A getter on the mocked module changes what every component sees
 * without duplicating the module graph.
 */

import { render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// ── The flag, switchable per test ─────────────────────────────────

/* vi.hoisted, because vi.mock is lifted to the top of the file and a plain
   `let` up here would not yet be initialised when the factory runs. */
const flag = vi.hoisted(() => ({ enabled: false }));

vi.mock("@/config/booking", () => ({
  // A getter, not a value: the import is read at render time, so flipping
  // `flag.enabled` is enough and no module has to be re-evaluated.
  get BOOKING_ENABLED() {
    return flag.enabled;
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────

/**
 * Three rows shaped like the live ones: a solidarity scale in EUR, widest
 * bounds 40–100. Deliberately not fetched — a guard that depends on the
 * database is a guard that passes when the database is unreachable.
 */
const SESSION_ROWS = vi.hoisted(() => [
  {
    id: "row-individual",
    slug: "individual-therapy",
    name: "Individual Therapy",
    name_ru: "Индивидуальная терапия",
    description: "A regular hour for one person, held weekly.",
    description_ru: "Регулярный час для одного человека, раз в неделю.",
    duration_minutes: 50,
    show_price: true,
    pricing_type: "solidarity",
    price: null,
    min_price: 40,
    max_price: 100,
    currency: "EUR",
    is_active: true,
    sort_order: 1,
  },
  {
    id: "row-relationship",
    slug: "relationship-interpersonal-therapy",
    name: "Relationship Therapy",
    name_ru: "Терапия отношений",
    description: "For two people who want to be understood by each other.",
    description_ru: "Для двоих, кто хочет быть понятым друг другом.",
    duration_minutes: 80,
    show_price: true,
    pricing_type: "solidarity",
    price: null,
    min_price: 60,
    max_price: 100,
    currency: "EUR",
    is_active: true,
    sort_order: 2,
  },
  {
    id: "row-bioethical",
    slug: "bioethical-consultation",
    name: "Bioethical Consultation",
    name_ru: "Биоэтическая консультация",
    description: "A single conversation about a decision that will not wait.",
    description_ru: "Один разговор о решении, которое не ждёт.",
    duration_minutes: 50,
    show_price: true,
    pricing_type: "solidarity",
    price: null,
    min_price: 50,
    max_price: 90,
    currency: "EUR",
    is_active: true,
    sort_order: 3,
  },
]);

// ── Mocks ─────────────────────────────────────────────────────────

vi.mock("@/hooks/useAvailability", () => ({
  useSessionTypes: () => ({ sessionTypes: SESSION_ROWS, loading: false }),
  useAvailableSlots: () => ({ slots: [], loading: false }),
}));

vi.mock("@/integrations/supabase/client", () => {
  const row = { data: SESSION_ROWS[0], error: null };
  return {
    supabase: {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({ single: () => Promise.resolve(row) }),
            order: () => Promise.resolve({ data: SESSION_ROWS, error: null }),
            single: () => Promise.resolve(row),
          }),
        }),
      }),
      functions: { invoke: vi.fn() },
    },
  };
});

vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), init: vi.fn() } }));

vi.mock("@/hooks/useBookingAnalytics", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/hooks/useBookingAnalytics")>()),
  trackBookNowClick: vi.fn(),
  trackServicesView: vi.fn(),
  trackServiceSelected: vi.fn(),
  trackDateTimeView: vi.fn(),
  trackHomepageView: vi.fn(),
}));

const mockLanguage = vi.fn();
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => mockLanguage(),
}));

// Static imports, so there is exactly one React and one module graph.
import Contact from "@/components/Contact";
import Services from "@/components/Services";
import Header from "@/components/Header";
import BookSession from "@/pages/BookSession";
import { ctaLabel, navigationEN, navigationRU } from "@/content/navigation";
import { publishedScale, pricingToOffer, sessionPricing } from "@/lib/pricing";
import { SERVICE_NODE_SELECTOR } from "@/config/serviceNode";

const asLanguage = (language: "en" | "ru") =>
  mockLanguage.mockReturnValue({
    language,
    langPath: (path: string) => `/${language}${path}`,
    setLanguage: vi.fn(),
  });

/* HelmetProvider because the service page renders <PageMeta>, and Helmet
   without its provider throws inside render — which surfaces as React's own
   "Cannot read properties of undefined (reading 'add')" rather than as
   anything to do with the flag. */
/* A real <Route>, not a bare MemoryRouter: BookSession reads :sessionId
   through useParams, and without a matching route that is undefined — the page
   short-circuits to "not found" and every assertion about its content fails
   for a reason that has nothing to do with the flag. */
const renderAt = (ui: React.ReactElement) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={["/en/book/individual-therapy"]}>
        <Routes>
          <Route path="/:lang/book/:sessionId" element={ui} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

beforeEach(() => {
  asLanguage("en");
});

afterEach(() => {
  document.head.querySelectorAll("script[type='application/ld+json']").forEach((n) => n.remove());
});

// ── With the flag off ─────────────────────────────────────────────

describe("with BOOKING_ENABLED off", () => {
  beforeEach(() => {
    flag.enabled = false;
  });

  it("renders no wizard in the homepage contact section", () => {
    const { container } = renderAt(<Contact />);

    // The wizard's own furniture. Asserted as absence, with the presence of
    // the replacement checked in the next case — so this pair cannot both be
    // satisfied by a section that renders nothing at all.
    expect(container.querySelector(".card-organic")).toBeNull();
    expect(screen.queryByRole("button", { name: /next|далее/i })).toBeNull();
  });

  it("offers the invitation to write instead", () => {
    renderAt(<Contact />);

    expect(screen.getByTestId("get-in-touch")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "be@humanheart.life" })).toBeInTheDocument();
  });

  it("lists the three session types as rows, each linking to its own page", () => {
    renderAt(<Contact />);

    for (const row of SESSION_ROWS) {
      expect(
        screen.getByRole("link", { name: new RegExp(row.name, "i") }),
        `${row.slug} has no row`,
      ).toHaveAttribute("href", `/en/book/${row.slug}`);
    }
  });

  it("still renders the scale WITH ITS VALUES, which is the regression this exists for", () => {
    /* Made to fail: adding `if (!BOOKING_ENABLED) return undefined;` to the
       top of publishedScale() failed this case with "Unable to find an element
       by: [data-testid='solidarity-scale']", while the flag's own cases went
       on passing. That is the point — the scale is not a booking feature, and
       gating it is the mistake that looks like tidying up.

       Asserting the published figures rather than a container's presence: a
       test for "the scale is present" passes trivially when the scale is
       gated, because then it is not present and nothing is checked. */
    renderAt(<Services />);

    const scale = screen.getByTestId("solidarity-scale");
    // €40 appears twice by design — the chosen rate starts at the floor, and
    // the floor is also printed under the track. Both ends must be there.
    expect(within(scale).getAllByText(/€\s*40/).length).toBeGreaterThan(0);
    expect(within(scale).getAllByText(/€\s*100/).length).toBeGreaterThan(0);
  });

  it("keeps the slider itself usable, not just its bounds printed", () => {
    renderAt(<Services />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "40");
    expect(slider).toHaveAttribute("max", "100");
  });

  it("publishes the same scale the database does, flag or no flag", () => {
    // The derivation, not the rendering: the flag must not reach into
    // src/lib/pricing.ts at all.
    expect(publishedScale(SESSION_ROWS)).toEqual({ min: 40, max: 100, currency: "EUR" });
  });

  it("still derives an AggregateOffer for each session", () => {
    for (const row of SESSION_ROWS) {
      expect(
        pricingToOffer(sessionPricing(row), row.duration_minutes),
        `${row.slug} publishes no offer`,
      ).toMatchObject({
        "@type": "AggregateOffer",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      });
    }
  });

  it("renders the service page with description, scale, terms link and contact block", async () => {
    renderAt(<BookSession />);

    // The description arrives from the mocked row after an await.
    expect(await screen.findByText(/A regular hour for one person/)).toBeInTheDocument();
    expect(screen.getByTestId("solidarity-scale")).toBeInTheDocument();
    // Scoped to the terms line: the footer also links to the agreement, and
    // an unscoped query matches both.
    const terms = screen.getByTestId("terms-line");
    expect(within(terms).getByRole("link", { name: /offer agreement/i })).toHaveAttribute(
      "href",
      "/en/offer-agreement",
    );
    expect(screen.getByTestId("get-in-touch")).toBeInTheDocument();
    // The slot for the prose Genia is writing is visible, not silently empty.
    expect(screen.getByTestId("what-this-is-for")).toBeInTheDocument();
  });

  it("puts no date picker or booking submit on the service page", async () => {
    renderAt(<BookSession />);
    await screen.findByText(/A regular hour for one person/);

    expect(screen.queryByRole("grid")).toBeNull(); // the calendar
    expect(screen.queryByTestId("terms-block")).toBeNull(); // step 3's consent block
    expect(screen.queryByRole("textbox")).toBeNull(); // no client details form
  });

  it("keeps the Service node emitter on the page", async () => {
    // Unrelated to booking, and a thing someone would plausibly remove along
    // with "the booking page".
    renderAt(<BookSession />);
    await screen.findByText(/A regular hour for one person/);

    expect(document.head.querySelector(SERVICE_NODE_SELECTOR)).toBeTruthy();
  });

  it('says "Book a Session" nowhere, in either language', async () => {
    for (const language of ["en", "ru"] as const) {
      asLanguage(language);
      const { container, unmount } = renderAt(
        <>
          <Header />
          <Services />
          <Contact />
          <BookSession />
        </>,
      );
      await screen.findByText(/regular hour|Регулярный час/);

      const text = container.textContent ?? "";
      for (const banned of ["Book a Session", "Book a session", "Бронирование", "Записаться"]) {
        expect(text, `"${banned}" still rendered in ${language}`).not.toContain(banned);
      }
      unmount();
    }
  });

  it("labels the CTA as an invitation to write, in both languages", () => {
    expect(ctaLabel(navigationEN)).toBe("Get in touch");
    expect(ctaLabel(navigationRU)).toBe("Написать мне");
  });
});

// ── With the flag on ──────────────────────────────────────────────

describe("with BOOKING_ENABLED on", () => {
  beforeEach(() => {
    flag.enabled = true;
  });

  it("renders the wizard in the homepage contact section", () => {
    // Not optional. Turning booking back on has to stay a config change, and
    // a flag exercised in one state only stops being one.
    const { container } = renderAt(<Contact />);

    expect(container.querySelector(".card-organic")).toBeTruthy();
  });

  it("renders the wizard on the service page, above the invitation", async () => {
    const { container } = renderAt(<BookSession />);
    await screen.findByText(/A regular hour for one person/);

    const widget = container.querySelector(".card-organic");
    const invitation = screen.getByTestId("get-in-touch");

    expect(widget, "no booking widget with the flag on").toBeTruthy();
    // Order, not just presence: with booking on the picker is the way in and
    // the invitation is the secondary route beneath it.
    expect(
      widget!.compareDocumentPosition(invitation) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("restores the old CTA wording from one place", () => {
    expect(ctaLabel(navigationEN)).toBe("Book a Session");
    expect(ctaLabel(navigationRU)).toBe("Записаться");
  });

  it("still renders the scale, so the flag changes nothing about pricing", () => {
    renderAt(<Services />);

    const scale = screen.getByTestId("solidarity-scale");
    expect(within(scale).getAllByText(/€\s*40/).length).toBeGreaterThan(0);
  });

  it("is actually switching something, so neither block is vacuous", () => {
    // The two describe blocks above would both pass if the flag never changed
    // — one of them by accident. This is the control.
    flag.enabled = false;
    const off = render(
      <MemoryRouter initialEntries={["/en"]}>
        <Contact />
      </MemoryRouter>,
    );
    const withoutWizard = off.container.querySelector(".card-organic");
    off.unmount();

    flag.enabled = true;
    const on = render(
      <MemoryRouter initialEntries={["/en"]}>
        <Contact />
      </MemoryRouter>,
    );
    const withWizard = on.container.querySelector(".card-organic");

    expect(withoutWizard).toBeNull();
    expect(withWizard).toBeTruthy();
  });
});

// ── The flag's reach ──────────────────────────────────────────────

describe("what the flag must never touch", () => {
  /** Source scans: the runtime cases show the flag is not consulted today;
   *  these show it cannot start being consulted without a failure. */
  const sourceOf = async (file: string) => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    return readFileSync(resolve(__dirname, "../..", file), "utf-8");
  };

  it("is absent from the pricing derivation and the offer builder", async () => {
    for (const file of ["src/lib/pricing.ts", "src/config/serviceNode.ts"]) {
      expect(
        await sourceOf(file),
        `${file} must not consult BOOKING_ENABLED: the price and the offer are ` +
          `published whether or not the calendar is open`,
      ).not.toContain("BOOKING_ENABLED");
    }
  });

  it("is absent from the short-link pages, which are dormant and not dead", async () => {
    for (const file of ["src/pages/SessionJoin.tsx", "src/pages/SessionCancel.tsx"]) {
      expect(
        await sourceOf(file),
        `${file} must keep working with booking off: it is the only way into ` +
          `an existing session's video room`,
      ).not.toContain("BOOKING_ENABLED");
    }
  });

  it("leaves the /s/ and /c/ routes mounted in the router", async () => {
    const app = await sourceOf("src/App.tsx");

    expect(app).toContain('path="/s/:slug"');
    expect(app).toContain('path="/c/:slug"');
  });

  it("leaves the process-booking deployment in the production workflow", async () => {
    // The flag is front-end only. The function still serves join and cancel
    // for the dormant short links, and the admin dashboard.
    const workflow = await sourceOf(".github/workflows/deploy-production.yml");
    expect(workflow).toContain("process-booking");
  });
});
