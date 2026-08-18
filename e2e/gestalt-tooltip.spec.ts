import { test, expect } from "@playwright/test";

/**
 * The definition panel used to be absolutely positioned next to the word, which
 * put it 77px off the right edge of a 375px viewport and, inside the offer
 * dialog, inside a scroll container that clipped it. Neither failure is
 * reachable from jsdom — it has no layout — so it has to be measured here.
 */
test.describe("Gestalt definition panel", () => {
  test("stays inside a narrow viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/offer-agreement");

    const word = page.locator("span.cursor-help").first();
    await word.scrollIntoViewIfNeeded();
    await word.hover();

    const panel = page.locator("[data-radix-popper-content-wrapper]").first();
    await expect(panel).toBeVisible();

    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });

  test("is not confined to an ancestor that could clip it", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/en/offer-agreement");

    const word = page.locator("span.cursor-help").first();
    await word.scrollIntoViewIfNeeded();
    await word.hover();
    await expect(page.locator("[data-radix-popper-content-wrapper]").first()).toBeVisible();

    // Portalled to body — so no `overflow` box in the page (or in the booking
    // dialog, which reuses this component) can cut it off.
    const clipped = await page.evaluate(() => {
      const panel = document.querySelector("[data-radix-popper-content-wrapper]");
      if (!panel) return "panel missing";
      const r = panel.getBoundingClientRect();
      for (let p = panel.parentElement; p && p !== document.body; p = p.parentElement) {
        const s = getComputedStyle(p);
        if (s.overflowX === "visible" && s.overflowY === "visible") continue;
        const pr = p.getBoundingClientRect();
        if (r.left < pr.left - 1 || r.right > pr.right + 1 || r.bottom > pr.bottom + 1) {
          return `clipped by ${p.tagName}`;
        }
      }
      return null;
    });
    expect(clipped).toBeNull();
  });
});
