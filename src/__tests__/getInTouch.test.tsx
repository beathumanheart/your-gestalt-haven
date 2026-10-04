/**
 * <GetInTouch /> — the invitation that replaced the calendar.
 *
 * Four properties, each of which failed at least once while this was written:
 *
 *   1. the copy button has an accessible name (the pattern this replaced had
 *      none in any of its three copies)
 *   2. the address is both selectable text and a mailto: link, because a bare
 *      mailto: fails silently with no mail client configured
 *   3. the channel order differs by language, asserted on **DOM order** — the
 *      decision is "which does the reader meet first", and presence cannot
 *      tell the two orderings apart
 *   4. the Telegram URL comes from SOCIAL_URLS, with a source scan proving no
 *      component writes a t.me/ literal — the handle has changed once already
 *
 * Each was made to fail before being trusted, per docs/writing-guards.md.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import GetInTouch from "@/components/contact/GetInTouch";
import { CONTACT_EMAIL, getInTouchEN, getInTouchRU } from "@/content/contact";
import { SOCIAL_URLS } from "@/config/social";
import { useLanguage } from "@/contexts/LanguageContext";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: vi.fn(),
}));

const asLanguage = (language: "en" | "ru") => {
  (useLanguage as ReturnType<typeof vi.fn>).mockReturnValue({
    language,
    langPath: (path: string) => `/${language}${path}`,
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  asLanguage("en");
});

describe("the copy button", () => {
  it("has an accessible name, so it is not an unlabelled icon", () => {
    render(<GetInTouch />);

    // By role and name: the failure this catches is a button whose only
    // content is an svg, which queries by test id would still have found.
    expect(
      screen.getByRole("button", { name: getInTouchEN.copyLabel }),
    ).toBeInTheDocument();
  });

  it("confirms a copy in words, not by colour alone", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<GetInTouch />);
    fireEvent.click(screen.getByRole("button", { name: getInTouchEN.copyLabel }));

    expect(writeText).toHaveBeenCalledWith(CONTACT_EMAIL);
    // The words, in a live region — a tick that changes colour tells a
    // screen-reader user and a colourblind reader nothing.
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(getInTouchEN.copiedLabel),
    );
  });

  it("says so when the clipboard refuses, rather than appearing to do nothing", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });

    render(<GetInTouch />);
    fireEvent.click(screen.getByRole("button", { name: getInTouchEN.copyLabel }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(getInTouchEN.copyFailedLabel),
    );
  });
});

describe("the address", () => {
  it("is offered as a mailto: link", () => {
    render(<GetInTouch />);

    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
  });

  it("is also present as readable, selectable text", () => {
    render(<GetInTouch />);

    // Not only an href: someone reading the page, or dragging over it, needs
    // the address itself rendered.
    expect(screen.getByText(CONTACT_EMAIL)).toBeInTheDocument();
  });
});

describe("channel order", () => {
  /** The rendered order of the two channels, by DOM position. */
  const channelOrder = (container: HTMLElement): string[] => {
    const email = container.querySelector(`a[href="mailto:${CONTACT_EMAIL}"]`)!;
    const telegram = container.querySelector(`a[href="${SOCIAL_URLS.telegram}"]`)!;
    expect(email, "no email channel rendered").toBeTruthy();
    expect(telegram, "no telegram channel rendered").toBeTruthy();

    // compareDocumentPosition rather than index arithmetic: it answers the
    // actual question (which comes first in the document) regardless of how
    // the two are nested.
    return email.compareDocumentPosition(telegram) & Node.DOCUMENT_POSITION_FOLLOWING
      ? ["email", "telegram"]
      : ["telegram", "email"];
  };

  it("puts email first in English", () => {
    asLanguage("en");
    const { container } = render(<GetInTouch />);
    expect(channelOrder(container)).toEqual(["email", "telegram"]);
  });

  it("puts Telegram first in Russian, where this audience already is", () => {
    asLanguage("ru");
    const { container } = render(<GetInTouch />);
    expect(channelOrder(container)).toEqual(["telegram", "email"]);
  });

  it("differs between the two languages, which is the decision being guarded", () => {
    // Without this, both cases above could assert the same order and still
    // pass — the ordering would have stopped being a decision and nothing
    // would have noticed.
    expect(getInTouchEN.channels).not.toEqual(getInTouchRU.channels);
  });
});

describe("Telegram's URL", () => {
  it("is the one SOCIAL_URLS publishes", () => {
    render(<GetInTouch />);

    expect(
      screen.getByRole("link", { name: getInTouchEN.telegramLabel }),
    ).toHaveAttribute("href", SOCIAL_URLS.telegram);
  });

  it("is never written as a literal in a component or a content file", () => {
    // The handle has already changed once. A literal anywhere but social.ts
    // is a second place that has to be remembered, and the one that will not
    // be.
    const ROOT = resolve(__dirname, "../..");
    const SOURCE_OF_TRUTH = "src/config/social.ts";

    const walk = (dir: string, acc: string[] = []): string[] => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full, acc);
        else if (/\.(ts|tsx)$/.test(entry)) acc.push(full);
      }
      return acc;
    };

    const files = walk(join(ROOT, "src")).filter((f) => {
      const rel = f.replace(`${ROOT}/`, "");
      // The source of truth may say it; so may the tests that assert on it.
      return rel !== SOURCE_OF_TRUTH && !/\.test\.(ts|tsx)$/.test(rel);
    });

    // Not vacuous: if the walk ever returns nothing, the loop below proves
    // nothing at all.
    expect(files.length, "scanned no source files").toBeGreaterThan(50);

    const offenders = files
      .filter((f) => readFileSync(f, "utf-8").includes("t.me/"))
      .map((f) => f.replace(`${ROOT}/`, ""));

    expect(
      offenders,
      `Telegram's URL must come from SOCIAL_URLS in ${SOURCE_OF_TRUTH}, ` +
        `not be written out here:\n  ${offenders.join("\n  ")}`,
    ).toEqual([]);
  });
});

describe("the invitation itself", () => {
  it("is not a form — no inputs, nothing to submit", () => {
    // The point of the change is that a person writes in their own words from
    // their own mail. A small form instead of a big one would miss it, and
    // would be an easy thing for someone to "improve" this into later.
    const { container } = render(<GetInTouch />);

    expect(container.querySelectorAll("input")).toHaveLength(0);
    expect(container.querySelectorAll("textarea")).toHaveLength(0);
    expect(container.querySelectorAll("form")).toHaveLength(0);
  });

  it("carries the reply time and the spam-folder caveat in both languages", () => {
    for (const [language, content] of [
      ["en", getInTouchEN],
      ["ru", getInTouchRU],
    ] as const) {
      asLanguage(language);
      const { container, unmount } = render(<GetInTouch />);

      expect(container.textContent).toContain(content.heading);
      expect(container.textContent).toContain(content.invitation);
      expect(container.textContent).toContain(content.replyTime);
      unmount();
    }
  });
});
