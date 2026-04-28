import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const html = readFileSync(resolve(__dirname, "../../index.html"), "utf-8");

describe("index.html meta tags", () => {
  it("contains no Lovable references", () => {
    expect(html.toLowerCase()).not.toContain("lovable");
    expect(html).not.toContain("lovable.dev");
  });

  it("title is exactly 'Genia | Psychotherapist'", () => {
    expect(html).toContain("<title>Genia | Psychotherapist</title>");
  });

  it("og:title is present and non-empty", () => {
    expect(html).toMatch(/property="og:title"\s+content="[^"]+"/);
  });

  it("og:description is present and non-empty", () => {
    expect(html).toMatch(/property="og:description"\s+content="[^"]+"/);
  });

  it("twitter:title is present and non-empty", () => {
    expect(html).toMatch(/name="twitter:title"\s+content="[^"]+"/);
  });

  it("twitter:description is present and non-empty", () => {
    expect(html).toMatch(/name="twitter:description"\s+content="[^"]+"/);
  });

  it("meta description is present and non-empty", () => {
    expect(html).toMatch(/name="description"\s+content="[^"]+"/);
  });

  it("apple-touch-icon link is present", () => {
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain("apple-touch-icon.png");
  });

  it("SVG favicon link is present", () => {
    expect(html).toContain('type="image/svg+xml"');
    expect(html).toContain("favicon.svg");
  });

  it("canonical URL is present", () => {
    expect(html).toContain('rel="canonical"');
    expect(html).toContain("humanheart.life");
  });
});
