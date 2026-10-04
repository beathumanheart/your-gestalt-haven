import { test, expect } from "@playwright/test";

/**
 * The six service pages, as a crawler receives them.
 *
 * This change removes a wizard from six pages. If nothing replaces it those
 * pages get *thinner*, on a site with only a few thousand characters of
 * indexable text in total — so what matters is not that the routes still
 * answer, but that the bytes they answer with now carry the session
 * description and the invitation to write.
 *
 * Every assertion here uses the `request` fixture, not `page`: it runs no
 * JavaScript, so it sees what a crawler sees before deciding whether to render
 * anything at all. That is the only place the distinction between "the SPA
 * would eventually draw this" and "the document says this" shows up.
 *
 * ⚠️ Status codes prove nothing under `vite preview`, which answers 200 for
 * every path whether a file exists or not — the lesson recorded in
 * docs/writing-guards.md and in static-routes.spec.ts. The discriminators used
 * here are the served head and the served body text.
 */

/** The three active slugs, in both languages: six URLs. */
const SLUGS = [
  "individual-therapy",
  "bioethical-consultation",
  "relationship-interpersonal-therapy",
] as const;

const ROUTES = SLUGS.flatMap((slug) =>
  (["en", "ru"] as const).map((lang) => ({ slug, lang, path: `/${lang}/book/${slug}` })),
);

/** The head every un-generated path falls back to, i.e. index.html's. */
const FALLBACK_TITLE = "Genia | Counselling &amp; Accompaniment";

/** The prerendered body, with tags stripped so markup alone cannot satisfy an assertion. */
const visibleText = (html: string): string => {
  const body = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<!-- prerendered -->/);
  if (!body) return "";
  return body[1]
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<style[\s\S]*?<\/style>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const jsonLdNodes = (html: string): Record<string, unknown>[] =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch {
      return {};
    }
  });

test.describe("every service page is served with its content", () => {
  test("there are six of them, so none of the loops below is vacuous", () => {
    expect(ROUTES).toHaveLength(6);
  });

  for (const { slug, lang, path } of ROUTES) {
    test(`${path} serves the session description without JavaScript`, async ({ request }) => {
      const html = await (await request.get(path)).text();
      const text = visibleText(html);

      expect(html, `${path} has no prerendered body`).toContain("<!-- prerendered -->");

      // Substantial, and specifically this page's reading matter rather than
      // chrome. A page that lost its description would still have a header, a
      // footer and a breadcrumb — so a mere length check is not enough, and a
      // mere length check is also what would pass if the body were only chrome.
      expect(text.length, `${path} looks like chrome with no content`).toBeGreaterThan(600);

      // The description comes from the database, so the exact words are not
      // pinned here — what is pinned is that the page carries prose about the
      // session beyond its own name. The name appears in the breadcrumb and
      // the h1; the description is the part that would silently vanish.
      const chromeOnly = text
        .replace(/Human Heart|About|Services|Credentials|Contact/g, "")
        .trim();
      expect(chromeOnly.length, `${path} carries no session prose`).toBeGreaterThan(400);
    });

    test(`${path} serves the invitation to write`, async ({ request }) => {
      const text = visibleText(await (await request.get(path)).text());

      // The heading of the contact block, in this route's own language — the
      // thing that replaced the wizard. Asserting the language-correct string
      // also catches a page served with the wrong language's content.
      const heading = lang === "ru" ? "Как начать" : "How to begin";
      expect(text, `${path} has no contact block`).toContain(heading);

      // And the address itself, which is the only way to begin.
      expect(text, `${path} does not publish the address`).toContain("be@humanheart.life");
    });

    test(`${path} carries an AggregateOffer with both prices`, async ({ request }) => {
      // Earned in #68 and must survive the flag: crawlers read this, and it is
      // the only machine-readable statement of what a session costs.
      const html = await (await request.get(path)).text();
      const service = jsonLdNodes(html).find((n) => n["@type"] === "Service");

      expect(service, `${path} has no Service node in the served HTML`).toBeTruthy();

      const offers = service!.offers as Record<string, unknown> | undefined;
      expect(offers, `${path} publishes no offer`).toBeTruthy();
      expect(offers).toMatchObject({ "@type": "AggregateOffer" });
      expect(offers!.lowPrice, `${path} offer has no lowPrice`).toBeTruthy();
      expect(offers!.highPrice, `${path} offer has no highPrice`).toBeTruthy();
      // The service is available; the offer never implied online purchase.
      expect(offers!.availability).toBe("https://schema.org/InStock");
    });

    test(`${path} carries its own head, not the homepage's`, async ({ request }) => {
      const html = await (await request.get(path)).text();

      expect(html).toContain(
        `<link rel="canonical" href="https://humanheart.life${path}" />`,
      );
      expect(html).toContain(`<html lang="${lang}">`);
      expect(html, `${path} was served the fallback head`).not.toContain(
        `<title>${FALLBACK_TITLE}</title>`,
      );
    });
  }

  test("no service page offers a calendar or a booking form", async ({ request }) => {
    // The served bytes, so this catches a prerender that captured the wizard
    // even if the flag later hid it on hydration.
    for (const { path } of ROUTES) {
      const html = await (await request.get(path)).text();
      const text = visibleText(html);

      for (const marker of ["Book a Session", "Book a session", "Бронирование"]) {
        expect(text, `${path} still says "${marker}"`).not.toContain(marker);
      }
      // Step 3's consent block only exists inside the wizard.
      expect(html, `${path} prerendered the booking form`).not.toContain('data-testid="terms-block"');
    }
  });

  test("the scale and its figures are in the served bytes of every service page", async ({
    request,
  }) => {
    // With the calendar gone this is the pricing display, and it is the thing
    // most likely to be gated by mistake along with "the booking feature".
    for (const { path } of ROUTES) {
      const html = await (await request.get(path)).text();
      const text = visibleText(html);

      // A currency figure, not merely the word for the scale: the panel
      // without its numbers is the regression.
      expect(text, `${path} prerendered no price figure`).toMatch(/[€$]\s?\d/);
    }
  });

  test("all six are in the sitemap at their priority", async ({ request }) => {
    const xml = await (await request.get("/sitemap.xml")).text();

    for (const { path } of ROUTES) {
      expect(xml, `${path} missing from the sitemap`).toContain(
        `<loc>https://humanheart.life${path}</loc>`,
      );
    }

    const blocks = xml.split("<url>").filter((u) => u.includes("/book/"));
    expect(blocks, "no book routes in the sitemap").toHaveLength(6);
    for (const block of blocks) {
      expect(block).toContain("<priority>0.8</priority>");
    }
  });
});

/**
 * The short links stay routable with booking off.
 *
 * They are dormant, not dead: `/s/<slug>` is the only way into an existing
 * session's video room and `/c/<slug>` the only way to cancel one. Neither has
 * a generated file — the slug is a capability token and writing a file at one
 * would publish the room — so both must fall through to the SPA and render.
 *
 * ⚠️ These paths are **not** language-prefixed. The brief for this change
 * described them as `/:lang/s/:slug`, and App.tsx mounts `/s/:slug` and
 * `/c/:slug` at the root — `/en/s/<slug>` has never been a route and renders
 * the 404 view. Asserted here in the shape that actually exists, because a
 * test written to the brief's shape passes only by reaching the 404 page.
 */
test.describe("the dormant short links", () => {
  for (const prefix of ["s", "c"] as const) {
    test(`/${prefix}/<slug> resolves rather than 404ing`, async ({ page }) => {
      await page.goto(`/${prefix}/not-a-real-token`);

      // The SPA's own 404 view would mean the route is gone from the router.
      await expect(page.getByText("404", { exact: true })).toHaveCount(0);
    });

    test(`/${prefix}/<slug> has no generated file, which is deliberate`, async ({ request }) => {
      // A file here would publish the token. The tripwire is in
      // pageMetadata's FORBIDDEN_PATH_SEGMENTS; this confirms the outcome.
      const html = await (await request.get(`/${prefix}/not-a-real-token`)).text();
      expect(html).not.toContain("<!-- prerendered -->");
    });

    test(`/${prefix}/ never appears in the sitemap`, async ({ request }) => {
      const xml = await (await request.get("/sitemap.xml")).text();
      const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);

      // Matched as a segment, not a prefix: a leaked token would read
      // /en/s/<slug>, which a startsWith check would sail past.
      const offenders = paths.filter((p) => p.split("/").includes(prefix));
      expect(offenders, `capability tokens in the sitemap: ${offenders.join(", ")}`).toEqual([]);
    });
  }
});

/**
 * The homepage contact section, which lost the wizard too.
 */
test.describe("the homepage invitation", () => {
  test("offers the three sessions as links, and the invitation to write", async ({ request }) => {
    const html = await (await request.get("/en")).text();
    const text = visibleText(html);

    expect(text).toContain("How to begin");
    expect(text).toContain("be@humanheart.life");

    // Each session links to its own page, in the served markup.
    for (const slug of SLUGS) {
      expect(html, `/en does not link to ${slug}`).toContain(`/en/book/${slug}`);
    }
  });

  test("keeps the homepage scale exactly where it was", async ({ request }) => {
    const text = visibleText(await (await request.get("/en")).text());

    // The scale lives in the services section and is unchanged by this work.
    expect(text).toContain("Solidarity Pricing");
    expect(text).toMatch(/[€$]\s?\d/);
  });

  test("says nothing about booking a session", async ({ request }) => {
    const text = visibleText(await (await request.get("/en")).text());
    expect(text).not.toContain("Book a Session");
    expect(text).not.toContain("Book a session");
  });

  test("the Russian homepage leads with Telegram", async ({ request }) => {
    const html = await (await request.get("/ru")).text();
    const text = visibleText(html);

    expect(text).toContain("Как начать");

    // Order in the served bytes: Telegram before the address in Russian.
    const telegram = html.indexOf("t.me/");
    const email = html.indexOf("mailto:be@humanheart.life");
    expect(telegram, "no Telegram link in the Russian page").toBeGreaterThan(-1);
    expect(email, "no address in the Russian page").toBeGreaterThan(-1);
    expect(telegram, "Russian should lead with Telegram").toBeLessThan(email);
  });
});
