/**
 * The site links to the channels it actually uses.
 *
 * Instagram and Substack were removed: the monthly letter runs from Brevo now,
 * and neither is linked from the site. This is not a claim that the accounts
 * do not exist — it is the list the site points at, and the list search
 * engines are told to associate with the practice.
 *
 * A stale `sameAs` is worse than a short one: it asserts to a crawler that a
 * profile belongs to this practice, and it keeps asserting it after the
 * profile stops being maintained.
 */

import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HANDLES, SAME_AS, SOCIAL_URLS } from "@/config/social";
import { navigationEN, navigationRU } from "@/content/navigation";
import Footer from "@/components/Footer";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), langPath: (p: string) => `/en${p}` }),
}));

afterEach(cleanup);

const GONE = ["instagram", "substack"];

describe("the channels the site points at", () => {
  it("has no handle or URL for a channel that was removed", () => {
    const blob = JSON.stringify({ HANDLES, SOCIAL_URLS, SAME_AS }).toLowerCase();
    for (const channel of GONE) {
      expect(blob, `social.ts still carries ${channel}`).not.toContain(channel);
    }
  });

  it("keeps the ones that are used", () => {
    expect(SOCIAL_URLS.youtube).toContain("youtube.com/@");
    expect(SOCIAL_URLS.telegram).toContain("t.me/");
  });

  it("advertises only YouTube to search engines", () => {
    // Telegram is a contact channel rather than a public profile, so it stays
    // out of sameAs — that was already true and is not a removal.
    expect(SAME_AS).toEqual([SOCIAL_URLS.youtube]);
  });

  it("offers neither in the footer, in either language", () => {
    for (const nav of [navigationEN, navigationRU]) {
      const blob = JSON.stringify(nav.social).toLowerCase();
      for (const channel of GONE) {
        expect(blob, `navigation still offers ${channel}`).not.toContain(channel);
      }
    }
  });

  it("renders no link to a removed channel", () => {
    // The rendered output is the thing a reader can click, so assert there
    // too and not only on the config behind it.
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    for (const channel of GONE) {
      expect(
        hrefs.filter((h) => h.toLowerCase().includes(channel)),
        `the footer still links to ${channel}`,
      ).toEqual([]);
    }
    expect(hrefs.some((h) => h.includes("youtube.com"))).toBe(true);
  });
});
