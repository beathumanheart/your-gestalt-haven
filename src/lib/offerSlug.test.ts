import { describe, it, expect } from "vitest";
import { buildOfferSlug, isValidSlugStem } from "./offerSlug";

const ALLOWED = new Set("abcdefghjkmnpqrstuvwxyz23456789".split(""));
const AMBIGUOUS = new Set(["0", "o", "1", "l", "i"]);

describe("buildOfferSlug", () => {
  it("appends a 4-char suffix separated by a hyphen", () => {
    const slug = buildOfferSlug("test-stem");
    expect(slug).toMatch(/^test-stem-[a-z0-9]{4}$/);
  });

  it("preserves the stem exactly", () => {
    const slug = buildOfferSlug("grief-may-2026");
    expect(slug.startsWith("grief-may-2026-")).toBe(true);
  });

  it("suffix contains only allowed characters", () => {
    for (let i = 0; i < 200; i++) {
      const slug = buildOfferSlug("x");
      const suffix = slug.slice(-4);
      for (const ch of suffix) {
        expect(ALLOWED.has(ch), `'${ch}' is not in the allowed set`).toBe(true);
      }
    }
  });

  it("suffix never contains ambiguous characters", () => {
    for (let i = 0; i < 200; i++) {
      const slug = buildOfferSlug("x");
      const suffix = slug.slice(-4);
      for (const ch of suffix) {
        expect(AMBIGUOUS.has(ch), `'${ch}' is ambiguous and should not appear`).toBe(false);
      }
    }
  });

  it("suffix is exactly 4 characters long", () => {
    const slug = buildOfferSlug("a");
    const suffix = slug.replace(/^a-/, "");
    expect(suffix).toHaveLength(4);
  });

  it("generates different slugs from the same stem (probabilistic)", () => {
    const slugs = new Set(Array.from({ length: 50 }, () => buildOfferSlug("stem")));
    expect(slugs.size).toBeGreaterThan(1);
  });
});

describe("isValidSlugStem", () => {
  it("accepts lowercase alphanumeric stems", () => {
    expect(isValidSlugStem("grief")).toBe(true);
    expect(isValidSlugStem("a")).toBe(true);
    expect(isValidSlugStem("test123")).toBe(true);
  });

  it("accepts stems with internal hyphens", () => {
    expect(isValidSlugStem("grief-may-2026")).toBe(true);
    expect(isValidSlugStem("pro-bono-summer")).toBe(true);
  });

  it("rejects stems with leading or trailing hyphens", () => {
    expect(isValidSlugStem("-grief")).toBe(false);
    expect(isValidSlugStem("grief-")).toBe(false);
  });

  it("rejects stems with uppercase letters", () => {
    expect(isValidSlugStem("Grief")).toBe(false);
    expect(isValidSlugStem("GRIEF")).toBe(false);
  });

  it("rejects stems with spaces or special characters", () => {
    expect(isValidSlugStem("grief may")).toBe(false);
    expect(isValidSlugStem("grief_may")).toBe(false);
    expect(isValidSlugStem("grief.may")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidSlugStem("")).toBe(false);
  });
});
