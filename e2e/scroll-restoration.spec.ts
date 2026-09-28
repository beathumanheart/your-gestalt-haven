import { test, expect } from "@playwright/test";

/**
 * Where a navigation leaves the reader.
 *
 * React Router does not reset scroll and the browser keeps the previous
 * offset, so a link followed from the foot of a long page arrived part-way
 * down the next one — beside its footer, which reads as a broken page. Every
 * route-to-route link had this; the letter icon only made it obvious, because
 * it lives at the very bottom.
 *
 * All three tests here guard different halves of the same component, and the
 * second and third exist because the obvious fix — scroll to top on every
 * location change — breaks them both.
 *
 * ⚠️ A cold route hides this bug, which is why the first version of this file
 * was vacuous and passed with ScrollToTop deleted. Every route but the
 * homepage is lazy, and the Suspense fallback is `null`: between the old page
 * unmounting and the new chunk arriving the document has no height, so the
 * browser clamps scroll to 0 and the page appears to have been reset. The bug
 * only shows on a route whose chunk is already loaded — which is precisely
 * the reader's second visit, and precisely what was reported. So these tests
 * warm the destination first. Measured: without ScrollToTop, a warm
 * /en/letter is entered at scrollY 595 of a 595 maximum, i.e. at the footer.
 *
 * ⚠️ And the warming has to be a client-side navigation. `page.goto` loads a
 * fresh document and throws the chunk cache away with it, so a warm-up written
 * that way warms nothing — which is how the second version of this file was
 * still vacuous. Click through; do not goto.
 *
 * Scope: this file covers only what a browser can actually show to fail.
 * Removing <ScrollToTop /> fails both tests below. The component's other two
 * rules — the POP exemption and leaving in-page anchors alone — cannot be
 * failed here: Chromium restores scroll on POP after the effect would run, and
 * Index.tsx has its own hash handler that lands the anchor either way. Those
 * are pinned in src/__tests__/scrollToTop.test.tsx instead, against what the
 * component calls. A test that cannot fail is not a guard.
 */

const bottom = (page: import("@playwright/test").Page) =>
  page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

/** Homepage -> letter page, through the footer dialog. The reported path. */
const openLetterFromFooter = async (page: import("@playwright/test").Page) => {
  await page.getByRole("button", { name: "The monthly letter" }).click();
  await page.getByRole("link", { name: /More about the letter/ }).click();
  await expect(page).toHaveURL(/\/en\/letter$/);
  await page.waitForTimeout(400);
};

/** Back to the homepage the way a reader does it — without a document load. */
const backToHome = async (page: import("@playwright/test").Page) => {
  await page.locator('footer a[href="/en"]').first().click();
  await expect(page).toHaveURL(/\/en$/);
  await page.waitForTimeout(400);
};

test.describe("a route change starts at the top", () => {
  test("the letter page is entered at the top, not beside its footer", async ({ page }) => {
    await page.goto("/en", { waitUntil: "load" });
    await page.waitForTimeout(600);

    // First visit loads the chunk. Second is the one that shows the bug.
    await openLetterFromFooter(page);
    await backToHome(page);

    await bottom(page);
    const before = await page.evaluate(() => window.scrollY);
    expect(before, "the homepage did not scroll, so this proves nothing").toBeGreaterThan(400);

    await openLetterFromFooter(page);

    expect(
      await page.evaluate(() => window.scrollY),
      "entered the letter page part-way down, beside its footer",
    ).toBe(0);
  });

  test("so does any other route reached with its chunk already loaded", async ({ page }) => {
    // Not a letter problem — every route-to-route link had this.
    await page.goto("/en", { waitUntil: "load" });
    await page.waitForTimeout(600);

    await page.getByRole("link", { name: "Offer Agreement" }).click();
    await expect(page).toHaveURL(/offer-agreement$/);
    await page.waitForTimeout(400);
    await backToHome(page);

    await bottom(page);
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(400);

    await page.getByRole("link", { name: "Offer Agreement" }).click();
    await expect(page).toHaveURL(/offer-agreement$/);
    await page.waitForTimeout(500);

    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test.describe("the hash still works end to end", () => {
  test("a cross-route anchor lands on its target", async ({ page }) => {
    /*
     * Not a guard on ScrollToTop — Index.tsx also scrolls the homepage's
     * anchors, so this passes with the hash branch deleted. What it does catch
     * is the two handlers fighting: if ScrollToTop ever sent a hashed
     * navigation to the top, the reader would see a jump to the top and then a
     * smooth scroll back down, and #contact would still end up in view. So
     * this asserts the anchor lands, and the unit test asserts who did it.
     */
    await page.goto("/en/letter", { waitUntil: "load" });
    await page.waitForTimeout(600);

    await page.getByRole("link", { name: "Contact" }).first().click();
    await page.waitForTimeout(900);

    const contact = page.locator("#contact");
    await expect(contact).toBeVisible();
    const box = (await contact.boundingBox())!;
    expect(box.y, "#contact is below the fold, so the anchor was lost")
      .toBeLessThan(page.viewportSize()!.height);
    expect(await page.evaluate(() => window.scrollY), "landed at the top instead of the anchor")
      .toBeGreaterThan(0);
  });
});
