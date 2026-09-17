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
 * the served head, not the head React installs later.
 *
 * ⚠️ Status codes prove nothing here. `vite preview` answers 200 for every
 * path, real file or not, so an `expect(status).toBe(200)` would pass even if
 * the build wrote no files at all — which is the whole bug these tests exist
 * to catch. The discriminator is the served *head*: a path with no file of
 * its own falls back to index.html and carries the English homepage's title,
 * so asserting each route's own title is what distinguishes a real file from
 * the fallback. The status itself is only checkable against the real host,
 * and is recorded in issue #48.
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

/** The head every un-generated path falls back to, i.e. index.html's. */
const FALLBACK_TITLE = "Genia | Counselling &amp; Accompaniment";

test.describe("indexable routes are served, not faked", () => {
  for (const { path, title } of INDEXABLE) {
    test(`${path} is served from its own file`, async ({ request }) => {
      const html = await (await request.get(path)).text();

      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(
        `<link rel="canonical" href="https://humanheart.life${path}" />`,
      );
      expect(html).toContain(`<html lang="${path.startsWith("/ru") ? "ru" : "en"}">`);
    });
  }

  test("a path with no file of its own falls back to the homepage head", async ({ request }) => {
    // The negative control the assertions above depend on. If this ever
    // returned a route's own head, the fallback would be indistinguishable
    // from a generated file and every test here would be vacuous.
    const html = await (await request.get("/en/not-a-generated-route")).text();

    expect(html).toContain(`<title>${FALLBACK_TITLE}</title>`);
    expect(html).not.toContain("Take with you");
  });

  test("a Russian route does not serve the English fallback head", async ({ request }) => {
    // The exact failure before this work: /ru/take existed only as a fallback,
    // so it was served with the English homepage's title and description.
    const html = await (await request.get("/ru/take")).text();

    expect(html).not.toContain(FALLBACK_TITLE);
    expect(html).toContain('<html lang="ru">');
    expect(html).toContain('<meta property="og:locale" content="ru_RU" />');
  });

  test("a booking page carries the session's own title, from the database", async ({ request }) => {
    const html = await (await request.get("/en/book/individual-therapy")).text();

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

  test("the app never links to a trailing-slash URL", async ({ page }) => {
    // Only /en.html is written, so /en/ has no file and would 404 on the real
    // host. langPath("/") must therefore produce /en, not /en/ — the footer
    // wordmark and every "back to home" link go through it.
    await page.goto("/en/take");

    const homeHrefs = await page
      .locator('a[href$="/en/"], a[href$="/ru/"]')
      .count();
    expect(homeHrefs).toBe(0);
  });

  test("a route with no generated file still falls back to the SPA", async ({ page }) => {
    // /feeling redirects to the map and is deliberately not in the sitemap, so
    // it has no file of its own and must still work for a reader.
    await page.goto("/en/feeling");

    await expect(page.getByText("404", { exact: true })).toHaveCount(0);
  });
});

/**
 * Prerendering: the body must carry the page's content, not just its head.
 *
 * #49 made every route a real file with a correct <head>, and left the body an
 * empty #root — so Google had nothing to rank and crawlers that do not run
 * JavaScript saw nothing. These assertions are on the *served bytes*, with no
 * JavaScript executed, which is the only place the distinction shows.
 *
 * They also catch a build that skipped prerendering: PRERENDER=0 exists for a
 * quick local build and would otherwise ship empty pages silently.
 */
test.describe("prerendered bodies", () => {
  const withoutJs = async (request: import("@playwright/test").APIRequestContext, path: string) =>
    (await request.get(path)).text();

  /** Strip tags so an assertion cannot be satisfied by markup alone. */
  const visibleText = (html: string) => {
    const body = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<!-- prerendered -->/);
    if (!body) return "";
    return body[1]
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  test("the homepage serves its copy without running JavaScript", async ({ request }) => {
    const text = visibleText(await withoutJs(request, "/en"));

    // Substantial, and specifically the page's own words rather than boilerplate.
    expect(text.length, "the homepage body is empty or not prerendered").toBeGreaterThan(2000);
    expect(text).toContain("Gestalt");
  });

  test("the Russian homepage serves Russian copy, not the English fallback", async ({ request }) => {
    const text = visibleText(await withoutJs(request, "/ru"));

    expect(text.length).toBeGreaterThan(2000);
    // Counted, not matched as a run: no Russian word is 20 letters long, so a
    // {20,} pattern never matches however Russian the page is.
    const cyrillic = (text.match(/[А-Яа-яЁё]/g) ?? []).length;
    expect(cyrillic, "the Russian homepage body is not in Russian").toBeGreaterThan(1500);
    expect(text).not.toContain("A Space for You");
  });

  test("a booking page serves the session's name and description from the database", async ({
    request,
  }) => {
    const text = visibleText(await withoutJs(request, "/en/book/individual-therapy"));

    expect(text).toContain("Individual Therapy");
    // And it is not the loading state: skeletons carry no words.
    expect(text.length, "looks like a prerendered skeleton rather than content").toBeGreaterThan(400);
  });

  test("no route ships a loading skeleton", async ({ request }) => {
    // A page prerendered too early says nothing while looking like it renders.
    for (const path of ["/en", "/ru", "/en/take", "/en/book/individual-therapy"]) {
      const html = await withoutJs(request, path);
      const skeletons = (html.match(/animate-pulse(?!-soft)/g) ?? []).length;
      expect(skeletons, `${path} was prerendered mid-load`).toBe(0);
    }
  });

  test("every indexable route is prerendered, not just the ones checked above", async ({
    request,
  }) => {
    for (const { path } of INDEXABLE) {
      const html = await withoutJs(request, path);
      expect(html, `${path} has no prerendered body`).toContain("<!-- prerendered -->");
      expect(visibleText(html).length, `${path} prerendered an empty body`).toBeGreaterThan(200);
    }
  });
});
