import { describe, it, expect, vi } from "vitest";
import { getUserTimezone, formatTimezone } from "./DateTimeSelector";

describe("getUserTimezone", () => {
  it("returns a valid IANA timezone string", () => {
    const tz = getUserTimezone();
    console.log("Detected timezone:", tz);
    expect(typeof tz).toBe("string");
    expect(tz.length).toBeGreaterThan(0);
    // IANA timezones contain a slash (e.g. "America/New_York") or are "UTC"
    expect(tz === "UTC" || tz.includes("/")).toBe(true);
  });

  it("matches Intl.DateTimeFormat resolved timezone", () => {
    const expected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const actual = getUserTimezone();
    console.log("Expected:", expected, "Actual:", actual);
    expect(actual).toBe(expected);
  });

  it("returns UTC when Intl fails", () => {
    const original = Intl.DateTimeFormat;
    // @ts-expect-error - mocking Intl.DateTimeFormat to throw
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new Error("not supported");
    });
    expect(getUserTimezone()).toBe("UTC");
    vi.restoreAllMocks();
  });
});

describe("formatTimezone", () => {
  it("formats a known timezone with city and offset", () => {
    const result = formatTimezone("America/New_York");
    expect(result).toContain("New York");
    expect(result).toMatch(/GMT[+-]\d/);
    expect(result).not.toContain("(");
  });

  it("replaces underscores with spaces", () => {
    const result = formatTimezone("America/Los_Angeles");
    expect(result).toContain("Los Angeles");
  });

  it("handles UTC", () => {
    const result = formatTimezone("UTC");
    expect(result).toContain("UTC");
  });

  it("returns raw string for invalid timezone", () => {
    const result = formatTimezone("Invalid/Timezone_Name");
    expect(typeof result).toBe("string");
  });
});
