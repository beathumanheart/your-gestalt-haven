/**
 * "The first session" — the article at /take/first-session.
 *
 * What this pins, and why each one is here rather than being obvious:
 *
 *   - **the headings, in order.** Asserted as a list of text in document
 *     order, not as a count. Seven `<h2>` of the wrong headings, or the right
 *     headings in the wrong order, is a page that reads wrongly while
 *     satisfying `toHaveLength(7)`.
 *   - **the three links resolve from config.** The Telegram handle has changed
 *     once already; the Russian article must reach the Russian agreement.
 *   - **nothing interactive.** No textbox, checkbox or button inside the
 *     article. This is the guard that matters most over time: the page is a
 *     natural place for someone to later add "just a small sign-up", and the
 *     brief's decision is that it stays reading.
 *   - **no storage of its own.** Checked by key, as automaticYes.test.tsx
 *     does — LangLayout legitimately writes `lang`, so asserting
 *     "setItem was never called" would fail for the wrong reason.
 *
 * Each was made to fail before being trusted, per docs/writing-guards.md.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import FirstSession from "@/components/first-session/FirstSession";
import TakeIndex from "@/pages/TakeIndex";
import { firstSessionEN, firstSessionRU, SECTION_IDS } from "@/content/firstSession";
import { takeEN, takeRU } from "@/content/take";
import { SOCIAL_URLS } from "@/config/social";
import { CONTACT_EMAIL } from "@/content/contact";
import { useLanguage } from "@/contexts/LanguageContext";

vi.mock("@/contexts/LanguageContext", () => ({ useLanguage: vi.fn() }));

vi.mock("posthog-js", () => ({ default: { capture: vi.fn(), init: vi.fn() } }));

const asLanguage = (language: "en" | "ru") =>
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language,
    langPath: (path: string) => `/${language}${path === "/" ? "" : path}`,
    setLanguage: vi.fn(),
  });

const renderArticle = (language: "en" | "ru") => {
  asLanguage(language);
  return render(
    <MemoryRouter initialEntries={[`/${language}/take/first-session`]}>
      <FirstSession />
    </MemoryRouter>,
  );
};

/**
 * The headings, written out.
 *
 * Deliberately **not** derived from `firstSessionEN.sections` — that is what
 * the first version of this file did, and it could not fail: renaming a
 * section in the content renamed it in the expectation too. Verified by
 * renaming "Afterwards" and watching the guard pass. These literals are the
 * brief's order, and the content has to match them rather than define them.
 */
const HEADINGS_EN = [
  "What it costs",
  "Before we meet",
  "The fifty minutes",
  "Afterwards",
  "What stays between us",
  "If you are 16 or 17",
  "How to begin",
] as const;

const HEADINGS_RU = [
  "Сколько стоит",
  "До встречи",
  "Пятьдесят минут",
  "После",
  "Что остаётся между нами",
  "Если вам 16 или 17",
  "Как начать",
] as const;

/** The approved copy, one paragraph per line. See the file's own header. */
const approvedCopy = (language: "en" | "ru"): string[] =>
  readFileSync(resolve(__dirname, `fixtures/firstSession.${language}.txt`), "utf-8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

const LANGS = [
  ["en", firstSessionEN, HEADINGS_EN],
  ["ru", firstSessionRU, HEADINGS_RU],
] as const;

afterEach(cleanup);

describe("the article's structure", () => {
  for (const [language, content, headings] of LANGS) {
    it(`${language}: one h1 carrying the title`, () => {
      renderArticle(language);

      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent(content.title);
    });

    it(`${language}: seven h2 in the order the brief gives`, () => {
      renderArticle(language);

      const rendered = screen
        .getAllByRole("heading", { level: 2 })
        .map((h) => h.textContent?.trim());

      // Against the literals above, not against the content module. The order
      // as a list, never the count: seven headings in the wrong order, or
      // seven wrong headings, both satisfy toHaveLength(7).
      expect(rendered).toEqual([...headings]);
    });

    it(`${language}: each section carries the id both languages share`, () => {
      const { container } = renderArticle(language);

      // Shared ids are what make /take/first-session#cost work in either
      // language, so they are asserted against one list, not per language.
      const ids = [...container.querySelectorAll("section")].map((s) => s.id);
      expect(ids).toEqual([...SECTION_IDS]);
    });

    it(`${language}: renders the approved copy, word for word`, () => {
      const { container } = renderArticle(language);

      // Every paragraph the page renders, in document order, against the
      // approved copy on disk. Reworded, reordered, dropped or added — each
      // one fails here, and the failure names the paragraph.
      const rendered = [...container.querySelectorAll("p.fs-p")].map((el) =>
        (el.textContent ?? "").trim(),
      );
      const approved = approvedCopy(language);

      // Not vacuous: an empty fixture would make the comparison meaningless.
      expect(approved.length, `fixtures/firstSession.${language}.txt is empty`).toBe(17);
      expect(rendered).toEqual(approved);
    });

    it(`${language}: goes from the title straight into the first section`, () => {
      // No subtitle and no lead: an earlier draft had one and it was removed
      // deliberately, so nothing may sit between the h1 and the first h2.
      const { container } = renderArticle(language);

      const h1 = container.querySelector("h1")!;
      const node = h1.nextElementSibling;
      expect(node, "nothing follows the h1 at all").toBeTruthy();
      // The next element is the first <section>, whose own first child is its h2.
      expect(node!.tagName).toBe("SECTION");
      expect(node!.firstElementChild?.tagName).toBe("H2");
    });
  }
});

describe("the three links come from config", () => {
  for (const [language, content, headings] of LANGS) {
    it(`${language}: the offer agreement link is this language's agreement`, () => {
      renderArticle(language);
      const label = language === "ru" ? "договоре оферты" : "offer agreement";

      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        `/${language}/offer-agreement`,
      );
    });

    it(`${language}: Telegram's href is SOCIAL_URLS.telegram`, () => {
      renderArticle(language);

      expect(screen.getByRole("link", { name: "Telegram" })).toHaveAttribute(
        "href",
        SOCIAL_URLS.telegram,
      );
    });

    it(`${language}: the email link is a mailto: for the shared address`, () => {
      renderArticle(language);

      const link = screen.getByRole("link", { name: CONTACT_EMAIL });
      expect(link).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
      // The visible text is the address itself, as the brief specifies.
      expect(link).toHaveTextContent(CONTACT_EMAIL);
    });

    it(`${language}: the breadcrumb returns to this language's shelf`, () => {
      renderArticle(language);

      expect(screen.getByRole("link", { name: content.crumb })).toHaveAttribute(
        "href",
        `/${language}/take`,
      );
    });
  }

  it("the crumb matches what each shelf calls itself", () => {
    // The Russian shelf's own title is «С собой», not «Материалы» — the latter
    // is the footer's label for the same page. A breadcrumb names the place it
    // returns to as that place names itself.
    expect(firstSessionEN.crumb).toBe(takeEN.title);
    expect(firstSessionRU.crumb).toBe(takeRU.title);
  });
});

describe("it is reading, not a form", () => {
  for (const [language] of LANGS) {
    it(`${language}: renders no input, checkbox or button`, () => {
      renderArticle(language);

      expect(screen.queryAllByRole("textbox")).toHaveLength(0);
      expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
      expect(screen.queryAllByRole("button")).toHaveLength(0);
      // Links are expected; this confirms the queries above are not vacuous
      // because the page rendered nothing.
      expect(screen.getAllByRole("link").length).toBeGreaterThan(2);
    });

    it(`${language}: renders no form element and nothing to submit`, () => {
      const { container } = renderArticle(language);

      expect(container.querySelectorAll("form")).toHaveLength(0);
      expect(container.querySelectorAll("input, textarea, select")).toHaveLength(0);
    });
  }
});

describe("it writes nothing to the device", () => {
  let setItem: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.localStorage.clear();
    setItem = vi.spyOn(window.localStorage, "setItem");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  for (const [language] of LANGS) {
    it(`${language}: makes no localStorage write of its own`, () => {
      renderArticle(language);

      // By key, not by call count: LangLayout legitimately persists `lang`,
      // and a test for "setItem was never called" would fail on that instead
      // of on anything this page did.
      const keys = setItem.mock.calls.map((call) => call[0]);
      expect(keys.filter((k) => k !== "lang")).toEqual([]);
    });
  }
});

describe("the shelf card", () => {
  /* HelmetProvider because TakeIndex loads the Fraunces stylesheet through
     Helmet, and Helmet without its provider throws inside render — surfacing
     as React's own "Cannot read properties of undefined (reading 'add')"
     rather than as anything about the shelf. */
  const renderShelf = (language: "en" | "ru") => {
    asLanguage(language);
    return render(
      <HelmetProvider>
        <MemoryRouter initialEntries={[`/${language}/take`]}>
          <TakeIndex />
        </MemoryRouter>
      </HelmetProvider>,
    );
  };

  for (const [language, content, headings] of LANGS) {
    it(`${language}: the shelf lists it, live, linking to this language's page`, () => {
      renderShelf(language);

      // A live card is a link; a "later" card is a div. So finding it as a
      // link is what proves the status, rather than reading the badge text.
      const card = screen.getByRole("link", { name: new RegExp(content.title) });
      expect(card).toHaveAttribute("href", `/${language}/take/first-session`);
    });

    it(`${language}: the card is marked live in the content, not only in the markup`, () => {
      const items = language === "ru" ? takeRU.items : takeEN.items;
      const item = items.find((i) => i.slug === "first-session");

      expect(item, `no first-session card in take${language.toUpperCase()}`).toBeTruthy();
      expect(item!.status).toBe("live");
      expect(item!.title).toBe(content.title);
    });
  }
});

describe("the fee and cancellation figures", () => {
  it("state the same scale the site publishes elsewhere", () => {
    // Not a derivation — the article states the terms in prose. This is the
    // tripwire the file header promises: if the published scale moves, this
    // fails and the prose has to be rewritten by a person.
    const en = firstSessionEN.sections[0].paragraphs.join(" ");
    const ru = firstSessionRU.sections[0].paragraphs.join(" ");

    expect(en).toContain("€40");
    expect(en).toContain("€100");
    expect(ru).toContain("40 до 100 €");
    // The cancellation window, in both.
    expect(en).toContain("24 hours");
    expect(ru).toContain("24 часа");
  });
});
