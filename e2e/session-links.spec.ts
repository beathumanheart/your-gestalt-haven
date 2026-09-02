import { expect, test } from "@playwright/test";

/**
 * The short links (/s/<slug>, /c/<slug>) are what clients receive in email and
 * in their calendar. They must resolve to the join/cancel pages — not to the
 * SPA's 404, and not to the /:lang route — and they must never reveal the
 * video-provider URL before the join window opens.
 */

const SLUG = "k3Qm9ZpX2vTb";

/** Stub the edge function; the real one needs live Supabase + JaaS secrets. */
async function stubJoin(page: import("@playwright/test").Page, body: unknown, status = 200) {
  await page.route("**/functions/v1/process-booking", (route) =>
    route.fulfill({
      status,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(body),
    })
  );
}

test.describe("/s/<slug> join link", () => {
  test("routes to the join page rather than the SPA 404", async ({ page }) => {
    await stubJoin(page, {
      state: "early",
      startsAtIso: "2099-01-01T09:00:00+00:00",
      timezone: "Europe/Brussels",
      msUntilOpen: 60_000,
    });

    await page.goto(`/s/${SLUG}`);

    await expect(page.getByRole("heading", { name: /not quite yet/i })).toBeVisible({
      timeout: 10_000,
    });
    // Exact match, not /404/: the countdown to the stubbed 2099 start renders a
    // five-figure hour count, and a substring regex matches the digits inside it.
    await expect(page.getByText("404", { exact: true })).toHaveCount(0);
    await expect(page.getByText(/page not found/i)).toHaveCount(0);
  });

  test("tells an early arrival when their session starts, without a room link", async ({
    page,
  }) => {
    await stubJoin(page, {
      state: "early",
      startsAtIso: "2099-06-15T09:00:00+00:00",
      timezone: "Europe/Brussels",
      msUntilOpen: 3_600_000,
    });

    await page.goto(`/s/${SLUG}`);

    await expect(page.getByText(/starts at/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/15 minutes before/i)).toBeVisible();

    const html = await page.content();
    expect(html).not.toContain("8x8.vc");
    expect(html).not.toContain("jwt=");
  });

  test("shows a friendly page for a cancelled booking", async ({ page }) => {
    await stubJoin(page, {
      state: "cancelled",
      startsAtIso: "2099-06-15T09:00:00+00:00",
      timezone: "Europe/Brussels",
    });

    await page.goto(`/s/${SLUG}`);
    await expect(page.getByRole("heading", { name: /cancelled/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test("shows a friendly page for an unknown slug, not a stack trace", async ({ page }) => {
    await stubJoin(page, { state: "not_found" }, 404);

    await page.goto(`/s/${SLUG}`);
    await expect(page.getByRole("heading", { name: /link not found/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe("/c/<slug> cancel link", () => {
  test("asks for confirmation instead of cancelling on load", async ({ page }) => {
    let cancelCalls = 0;
    await page.route("**/functions/v1/process-booking", async (route) => {
      const body = route.request().postDataJSON() as { action?: string };
      if (body?.action === "cancel_by_slug") cancelCalls++;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(
          body?.action === "cancel_by_slug"
            ? { success: true }
            : {
                sessionName: "Individual Therapy",
                startsAtIso: "2099-06-15T09:00:00+00:00",
                timezone: "Europe/Brussels",
                status: "confirmed",
              }
        ),
      });
    });

    await page.goto(`/c/${SLUG}`);

    await expect(page.getByRole("heading", { name: /cancel this booking/i })).toBeVisible({
      timeout: 10_000,
    });
    // Merely opening the link — as a mail client's link scanner would — must
    // not cancel anything.
    expect(cancelCalls).toBe(0);

    await page.getByRole("button", { name: /yes, cancel my booking/i }).click();
    await expect(page.getByRole("heading", { name: /booking cancelled/i })).toBeVisible({
      timeout: 10_000,
    });
    expect(cancelCalls).toBe(1);
  });
});
