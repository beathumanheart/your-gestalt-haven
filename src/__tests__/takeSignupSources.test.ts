/**
 * What each sign-up source is allowed to ask for.
 *
 * These rules were the reason the letter needed server changes at all: two new
 * places to subscribe from, neither of which has a worksheet, both of which
 * need their own return address for Brevo's confirmation link. Getting either
 * wrong is invisible in the browser — the reader gets an email with a broken
 * link, or is returned to the wrong page after confirming.
 *
 * The rules live in a pure module so they can be exercised here rather than
 * grepped out of the function. index.ts only turns a refusal into a sentence.
 */

import { describe, expect, it } from "vitest";
import {
  SOURCES,
  confirmationReturnUrl,
  hasWorksheet,
  isKnownSource,
  pageUrl,
  refuse,
  worksheetUrl,
  type SourceKey,
} from "@takesignup/sources.ts";

const SITE = "https://humanheart.life";
const keys = Object.keys(SOURCES) as SourceKey[];

describe("every source", () => {
  it("is a list worth checking", () => {
    // Otherwise every loop below passes on an empty array.
    expect(keys.length).toBeGreaterThan(2);
  });

  it("names a page to return a confirmed subscriber to", () => {
    // Brevo needs a redirectionUrl per source. A source without one would
    // return the reader to Brevo's own page.
    for (const key of keys) {
      expect(SOURCES[key].pagePath, key).toMatch(/^\/[a-z]/);
    }
  });

  it("returns them to the page they subscribed from, saying so", () => {
    for (const key of keys) {
      const url = confirmationReturnUrl(SITE, key);
      expect(url, key).toBe(`${SITE}${SOURCES[key].pagePath}?letter=confirmed`);
      // The page keys off this exact value — see letterSignup.test.tsx.
      expect(url, key).toContain("?letter=confirmed");
    }
  });

  it("builds paths server-side, never from a request", () => {
    // The point of the module: a caller cannot make the function email an
    // arbitrary link over the practice's signature, nor redirect the
    // confirmation anywhere. Both come only from these constants.
    for (const key of keys) {
      expect(pageUrl(SITE, key), key).toBe(`${SITE}${SOURCES[key].pagePath}`);
    }
  });
});

describe("only the worksheet page has a worksheet", () => {
  it("is the one source with a PDF", () => {
    expect(keys.filter(hasWorksheet)).toEqual(["automatic-yes"]);
  });

  it("links it absolutely, at the path the function controls", () => {
    expect(worksheetUrl(SITE, "automatic-yes")).toBe(
      `${SITE}/downloads/the-automatic-yes-human-heart.pdf`,
    );
  });

  it("throws rather than build a URL for a source with none", () => {
    // Unreachable through the handler, which refuses first. This is the
    // second line of defence, so a future caller cannot quietly produce
    // "https://humanheart.life/undefined".
    expect(() => worksheetUrl(SITE, "letter-page")).toThrow(/no worksheet/);
  });
});

describe("refusing a request", () => {
  const letter = { pdf: false, letter: true };
  const pdf = { pdf: true, letter: false };

  it("accepts the letter from all three sources", () => {
    for (const key of keys) {
      expect(refuse(key, letter), key).toBeNull();
    }
  });

  it("accepts the PDF from the worksheet page", () => {
    expect(refuse("automatic-yes", pdf)).toBeNull();
    expect(refuse("automatic-yes", { pdf: true, letter: true })).toBeNull();
  });

  it("refuses a PDF request from a source that has none", () => {
    // The failure this prevents: an email going out with a link to
    // "https://humanheart.life/undefined".
    expect(refuse("letter-page", pdf)).toBe("no-worksheet");
    expect(refuse("letter-footer", pdf)).toBe("no-worksheet");
    // Including when the letter is asked for in the same request.
    expect(refuse("letter-footer", { pdf: true, letter: true })).toBe("no-worksheet");
  });

  it("refuses a source it does not know, whatever it is", () => {
    for (const value of ["", "newsletter", "../automatic-yes", "toString", undefined, null, 7, {}]) {
      expect(refuse(value, letter), String(value)).toBe("unknown-source");
    }
  });

  it("refuses a request that asks for nothing", () => {
    expect(refuse("automatic-yes", { pdf: false, letter: false })).toBe("nothing-asked-for");
  });

  it("does not treat an inherited property as a source", () => {
    // "constructor" and "toString" are on every object; a plain `in` check
    // would accept them and then index undefined.
    expect(isKnownSource("constructor")).toBe(false);
    expect(isKnownSource("toString")).toBe(false);
  });
});
