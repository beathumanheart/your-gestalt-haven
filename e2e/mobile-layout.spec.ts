import { test, expect, type Page } from "@playwright/test";

/**
 * Phone-width layout, measured rather than reasoned about.
 *
 * /en/letter shipped with its text flush against the left edge of the screen
 * at every phone width, and /en/privacy had had the same bug since it shipped.
 * The cause was neither page: `container-narrow` is width and centring only —
 * every caller supplies its own horizontal padding, because the sections want
 * different amounts — and these two `<main>`s did not. `.tk-root` was never
 * involved; the /take pages carry clamp(18px,4vw,40px) and were always fine.
 *
 * So the guard walks routes rather than one page: the next `<main>` that
 * forgets its gutter is caught here rather than on someone's phone.
 *
 * Made to fail first by removing `px-6` from Letter.tsx, which fails the
 * gutter assertions, and by widening an element past the viewport, which
 * fails the overflow one.
 */

const MIN_GUTTER = 16;
const WIDTHS = [320, 375, 414];

/** Every route that renders prose in a container, not only the new one. */
const ROUTES = [
  "/en",
  "/en/letter",
  "/en/letter?letter=confirmed",
  "/en/privacy",
  "/en/take",
  "/en/take/automatic-yes",
  "/en/offer-agreement",
];

/**
 * The narrowest left edge and the narrowest right margin among the things a
 * reader actually sees. Returns null when it found nothing to measure, so a
 * page that rendered blank cannot pass by having no elements to fail.
 */
const gutters = (page: Page, viewport: number) =>
  page.evaluate((vw) => {
    const nodes = document.querySelectorAll<HTMLElement>(
      "main h1, main h2, main p, main dt, main dd, main form, main .card-organic",
    );
    const boxes = [...nodes]
      .map((el) => el.getBoundingClientRect())
      .filter((b) => b.width > 0 && b.height > 0);
    if (boxes.length === 0) return null;

    return {
      counted: boxes.length,
      left: Math.min(...boxes.map((b) => b.left)),
      right: Math.min(...boxes.map((b) => vw - b.right)),
    };
  }, viewport);

test.describe("phone widths", () => {
  for (const width of WIDTHS) {
    test(`every route keeps a ${MIN_GUTTER}px gutter at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });

      for (const route of ROUTES) {
        await page.goto(route, { waitUntil: "load" });
        await page.waitForTimeout(600);

        const g = await gutters(page, width);
        expect(g, `${route} rendered nothing measurable at ${width}px`).not.toBeNull();
        expect(g!.counted, `${route} measured too little to mean anything`).toBeGreaterThan(2);
        expect(g!.left, `${route} sits ${g!.left}px from the left edge at ${width}px`)
          .toBeGreaterThanOrEqual(MIN_GUTTER);
        expect(g!.right, `${route} sits ${g!.right}px from the right edge at ${width}px`)
          .toBeGreaterThanOrEqual(MIN_GUTTER);
      }
    });

    test(`no route scrolls sideways at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 812 });

      for (const route of ROUTES) {
        await page.goto(route, { waitUntil: "load" });
        await page.waitForTimeout(600);

        const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(scrollWidth, `${route} overflows the viewport at ${width}px`)
          .toBeLessThanOrEqual(width);
      }
    });
  }
});

test.describe("the letter page on a phone", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the heading and the cards are inset, queried by role so they must exist", async ({
    page,
  }) => {
    await page.goto("/en/letter", { waitUntil: "load" });

    const heading = page.getByRole("heading", { level: 1, name: "The monthly letter" });
    await expect(heading).toBeVisible();
    expect((await heading.boundingBox())!.x).toBeGreaterThanOrEqual(MIN_GUTTER);

    // The form card's rounded corners were clipped by the viewport edge.
    const card = page.locator("main .card-organic").first();
    await expect(card).toBeVisible();
    const box = (await card.boundingBox())!;
    expect(box.x, "the card's left corner is clipped").toBeGreaterThanOrEqual(MIN_GUTTER);
    expect(375 - (box.x + box.width), "the card's right corner is clipped")
      .toBeGreaterThanOrEqual(MIN_GUTTER);
  });

  test("the confirmation banner is inset too", async ({ page }) => {
    await page.goto("/en/letter?letter=confirmed", { waitUntil: "load" });

    const banner = page.getByRole("heading", { name: "You're on the list" });
    await expect(banner).toBeVisible();
    expect((await banner.boundingBox())!.x).toBeGreaterThanOrEqual(MIN_GUTTER);
  });

  test("the what/when/leave rows are inset, not only what a screenshot showed", async ({
    page,
  }) => {
    await page.goto("/en/letter", { waitUntil: "load" });

    for (const term of ["What it is", "How often", "Leaving"]) {
      const row = page.getByText(term, { exact: true });
      await expect(row, `${term} is missing`).toBeVisible();
      expect((await row.boundingBox())!.x, `${term} is flush with the edge`)
        .toBeGreaterThanOrEqual(MIN_GUTTER);
    }
  });

  test("a short page does not scroll for no reason", async ({ page }) => {
    /*
     * min-h-screen used to be on <main>, so the document was always at least a
     * viewport tall *plus* the header and the footer. On a short page that is
     * a scrollbar with nothing under it and dead space above the footer.
     *
     * Measured on the confirmed state at 420x1100, which is short enough to
     * fit: 1506px of document against an 1100px viewport before, 1100px after.
     *
     * The gap *between* main and the footer is not the tell — min-h-screen
     * puts the dead space inside main, so that distance is 0 either way, which
     * is how the first version of this test passed under the very change it
     * was meant to catch.
     */
    await page.setViewportSize({ width: 420, height: 1100 });
    await page.goto("/en/letter?letter=confirmed", { waitUntil: "load" });
    await page.waitForTimeout(600);

    const m = await page.evaluate(() => ({
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      mainHeight: Math.round(document.querySelector("main")!.getBoundingClientRect().height),
      viewport: window.innerHeight,
    }));

    expect(
      m.mainHeight,
      "main fills the viewport by itself, so this page cannot be short enough to test",
    ).toBeLessThan(m.viewport);
    expect(m.overflow, "a page shorter than the viewport still scrolls").toBeLessThanOrEqual(0);
  });

});

test.describe("the footer's icon row", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("gives every control a 44x44 target, measured", async ({ page }) => {
    // The jsdom test pins the classes; this pins that they actually apply.
    await page.goto("/en", { waitUntil: "load" });

    const controls = page.locator('footer [aria-label="The monthly letter"], footer [aria-label="YouTube"]');
    const count = await controls.count();
    expect(count, "no footer icons found, so this measures nothing").toBeGreaterThan(1);

    for (let i = 0; i < count; i++) {
      const el = controls.nth(i);
      const name = await el.getAttribute("aria-label");
      const box = (await el.boundingBox())!;
      expect(box.width, `${name} is ${box.width}px wide`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${name} is ${box.height}px tall`).toBeGreaterThanOrEqual(44);
    }
  });

  test("keeps the visible circle at 38px", async ({ page }) => {
    // Growing the target must not have grown the look.
    await page.goto("/en", { waitUntil: "load" });

    const circle = page.locator('footer [aria-label="The monthly letter"] span').first();
    const box = (await circle.boundingBox())!;
    expect(Math.round(box.width)).toBe(38);
    expect(Math.round(box.height)).toBe(38);
  });
});
