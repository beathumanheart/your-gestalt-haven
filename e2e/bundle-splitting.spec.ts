import { test, expect } from "@playwright/test";

/**
 * The homepage must not download code only other routes need.
 *
 * Every route component used to be imported eagerly in App.tsx, so one chunk
 * held the whole app: a prospective client downloaded the admin dashboard,
 * the offers editor, the availability manager and the 143 KB feelings-map
 * dataset before they could read the front page.
 *
 * This runs against the built app, which is the only place it can: the split
 * is a property of the bundle, not of the source. A unit test asserting that
 * App.tsx "contains lazy(" would pass while the boundaries did nothing.
 *
 * ⚠️ It asserts on the *content and size* of what the homepage downloads,
 * never on which chunk filenames appear. An earlier version of this file
 * checked for `/assets/AdminDashboard-*.js` and passed when that page was
 * imported eagerly — because then the chunk does not exist at all; its code
 * is inlined into the entry, which is the regression being guarded against.
 * Verified by making that change and watching this fail.
 */

/** Strings that exist in exactly one route's source and survive minification. */
const OTHER_ROUTE_MARKERS: Array<[string, string]> = [
  ["the feelings-map dataset", "Карта описывает и спрашивает"],
  ["the admin offers editor", "Free session for grief support"],
];

/**
 * Ceiling for the first-party JavaScript the homepage pulls in, uncompressed.
 *
 * It was ~1349 KB as one chunk and is ~895 KB now. A ratchet, not a target:
 * if it fails, either something was pulled back into the entry, or the entry
 * genuinely grew and the right response is the former first.
 *
 * Only /assets/ is counted. PostHog fetches another ~137 KB of its own
 * modules at runtime from its CDN — surveys.js alone is 102 KB — which is
 * real weight on the page but not something route splitting can move, and
 * counting it here would make this fail for an unrelated reason.
 */
const JS_BUDGET_BYTES = 960 * 1024;

/** Our own bundle, as opposed to analytics fetched from a third party. */
const isFirstParty = (url: string) => new URL(url).pathname.startsWith("/assets/");

test.describe("route code-splitting", () => {
  test("the homepage downloads no other route's code", async ({ page, request }) => {
    const scripts: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "script") scripts.push(r.url());
    });

    await page.goto("/en", { waitUntil: "load" });
    await page.waitForTimeout(1200);

    expect(
      scripts.filter(isFirstParty).length,
      "no first-party scripts recorded — the check would be vacuous",
    ).toBeGreaterThan(0);

    let bytes = 0;
    const found: string[] = [];
    for (const url of scripts.filter(isFirstParty)) {
      const body = await (await request.get(url)).text();
      bytes += Buffer.byteLength(body, "utf8");
      for (const [what, marker] of OTHER_ROUTE_MARKERS) {
        if (body.includes(marker)) found.push(`${what} (matched "${marker}")`);
      }
    }

    expect(
      found,
      `The homepage's JavaScript contains code belonging to other routes:\n  ${found.join(
        "\n  ",
      )}\n\nSomething in the eager graph imports a lazily-routed page directly. ` +
        `Check the imports at the top of src/App.tsx.`,
    ).toEqual([]);

    expect(
      bytes,
      `The homepage pulls in ${Math.round(bytes / 1024)} KB of first-party ` +
        `JavaScript, over the ${Math.round(JS_BUDGET_BYTES / 1024)} KB budget.`,
    ).toBeLessThan(JS_BUDGET_BYTES);
  });

  test("the feelings map still loads its dataset when visited", async ({ page, request }) => {
    // The other half of the property: the split must not have broken the
    // route, and the dataset must actually arrive on demand.
    const scripts: string[] = [];
    page.on("request", (r) => {
      if (r.resourceType() === "script") scripts.push(r.url());
    });

    await page.goto("/en/take/feelings-map", { waitUntil: "load" });
    await expect(page.getByText("404", { exact: true })).toHaveCount(0);
    await page.waitForTimeout(1500);

    let hasDataset = false;
    for (const url of scripts) {
      if ((await (await request.get(url)).text()).includes("Карта описывает и спрашивает")) {
        hasDataset = true;
      }
    }
    expect(hasDataset, "the feelings dataset never arrived on its own page").toBe(true);
  });

  test("a lazy route renders after client-side navigation", async ({ page }) => {
    // Suspense sits above <Routes>, so a chunk that failed to resolve would
    // leave the page blank rather than erroring visibly. Worth pinning.
    await page.goto("/en");
    await page.waitForLoadState("load");
    await page.goto("/en/offer-agreement");
    await expect(page.locator("h1")).toBeVisible({ timeout: 15000 });
  });
});
