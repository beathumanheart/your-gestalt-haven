import { test, expect } from "@playwright/test";

/**
 * The site is a client-rendered SPA on a host with no rewrite rules, so for a
 * long time every route but "/" was served as the SPA fallback — the right
 * page to a reader, an HTTP 404 to a crawler. Every URL in the sitemap was one
 * of those, which is why only the homepage was ever indexed.
 *
 * The build now writes a real file at each indexable path. These tests use the
 * `request` fixture rather than `page` on purpose: it does not run JavaScript,
 * so it sees what a crawler sees before deciding whether to render anything —
 * the served status and the served head, not the head React installs later.
 */

const INDEXABLE = [
  { path: "/en", title: "Genia | Counselling &amp; Accompaniment" },
  { path: "/ru", title: "Genia | Психолог-консультант" },
  { path: "/en/take", title: "Take with you — free material | Human Heart" },
  { path: "/ru/take", title: "С собой — бесплатные материалы | Human Heart" },
  {
    path: "/en/take/feelings-map",
    title: "What is going on with me — a map of feelings | Human Heart",
  },
  {
    path: "/ru/take/feelings-map",
    title: "Что со мной происходит — карта чувств | Human Heart",
  },
  { path: "/en/offer-agreement", title: "Offer Agreement | Human Heart" },
  { path: "/ru/offer-agreement", title: "Договор оферты | Human Heart" },
];

test.describe("indexable routes are served, not faked", () => {
  for (const { path, title } of INDEXABLE) {
    test(`${path} answers 200 with its own head`, async ({ request }) => {
      const response = await request.get(path);

      expect(response.status()).toBe(200);

      const html = await response.text();
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(
        `<link rel="canonical" href="https://humanheart.life${path}" />`,
      );
      expect(html).toContain(`<html lang="${path.startsWith("/ru") ? "ru" : "en"}">`);
    });
  }

  test("the trailing-slash form is served too, with the same canonical", async ({ request }) => {
    // Hosts that redirect /en/take to /en/take/ must land on a page that still
    // claims /en/take, or the redirect and the canonical disagree.
    const response = await request.get("/en/take/");

    expect(response.status()).toBe(200);
    expect(await response.text()).toContain(
      '<link rel="canonical" href="https://humanheart.life/en/take" />',
    );
  });

  test("a booking page carries the session's own title, from the database", async ({ request }) => {
    const response = await request.get("/en/book/individual-therapy");

    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain("Book with Genia | Human Heart");
    expect(html).toContain(
      '<link rel="canonical" href="https://humanheart.life/en/book/individual-therapy" />',
    );
  });
});

test.describe("the SPA still routes on the real paths", () => {
  test("a generated page hydrates into the app, not the 404 view", async ({ page }) => {
    await page.goto("/ru/take/feelings-map");

    await expect(page.getByText("404", { exact: true })).toHaveCount(0);
    await expect(page).toHaveTitle("Что со мной происходит — карта чувств | Human Heart");
  });

  test("the trailing-slash path routes to the same page", async ({ page }) => {
    // React Router ignores a trailing slash when matching; if it ever stops,
    // readers arriving from a host that redirects would land on the 404 view.
    await page.goto("/en/take/");

    await expect(page.getByText("404", { exact: true })).toHaveCount(0);
    await expect(page).toHaveTitle("Take with you — free material | Human Heart");
  });

  test("a route with no generated file still falls back to the SPA", async ({ page }) => {
    // /feeling redirects to the map and is deliberately not in the sitemap, so
    // it has no file of its own and must still work for a reader.
    await page.goto("/en/feeling");

    await expect(page.getByText("404", { exact: true })).toHaveCount(0);
  });
});
