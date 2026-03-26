import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows correct name", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Genia/);
    // Title must NOT contain the old name
    const title = await page.title();
    expect(title).not.toMatch(/Eugenia/i);
  });

  test("canonical URL is humanheart.life", async ({ page }) => {
    await page.goto("/");
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute("href", "https://humanheart.life");
  });

  test("OG image is self-hosted (not r2.dev or lovable CDN)", async ({ page }) => {
    await page.goto("/");
    const ogImage = page.locator('meta[property="og:image"]');
    const content = await ogImage.getAttribute("content");
    expect(content).toBeTruthy();
    expect(content).not.toMatch(/r2\.dev/i);
    expect(content).not.toMatch(/lovable/i);
    expect(content).toContain("humanheart.life");
  });

  test("page body does not contain 'Eugenia' anywhere", async ({ page }) => {
    await page.goto("/");
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/Eugenia/i);
  });
});

test.describe("Navigation", () => {
  test("services section is reachable and visible", async ({ page }) => {
    await page.goto("/");
    // Click the first nav link that leads to services or a Book Now button
    const servicesLink = page.locator('[data-section="services"], button:has-text("Services"), a:has-text("Services")').first();
    if (await servicesLink.count() > 0) {
      await servicesLink.click();
    } else {
      // Scroll to services section directly
      await page.evaluate(() => {
        document.getElementById("services")?.scrollIntoView();
      });
    }
    const servicesSection = page.locator("#services");
    await expect(servicesSection).toBeVisible();
  });
});

test.describe("Booking widget", () => {
  test("booking widget shows session type options", async ({ page }) => {
    await page.goto("/");
    // Scroll to the contact/booking section
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });
    // Wait for the booking widget to appear
    const widget = page.locator(".card-organic").first();
    await expect(widget).toBeVisible({ timeout: 10_000 });
  });

  test("step indicator is present in booking widget", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });
    // The step indicator contains step numbers
    const stepOne = page.locator("text=1").first();
    await expect(stepOne).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("PostHog events", () => {
  test("PostHog requests are sent to eu.i.posthog.com", async ({ page }) => {
    const posthogRequests: string[] = [];

    page.on("request", (request) => {
      if (request.url().includes("eu.i.posthog.com")) {
        posthogRequests.push(request.url());
      }
    });

    await page.goto("/");
    // Give PostHog time to fire the homepage view event
    await page.waitForTimeout(2000);

    // PostHog should have fired at least one request (homepage_viewed or decide)
    expect(posthogRequests.length).toBeGreaterThan(0);
  });
});
