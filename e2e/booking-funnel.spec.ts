import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows correct name", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Genia/);
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
    const servicesLink = page.locator('[data-section="services"], button:has-text("Services"), a:has-text("Services")').first();
    if (await servicesLink.count() > 0) {
      await servicesLink.click();
    } else {
      await page.evaluate(() => {
        document.getElementById("services")?.scrollIntoView();
      });
    }
    const servicesSection = page.locator("#services");
    await expect(servicesSection).toBeVisible();
  });
});

test.describe("Booking widget", () => {
  test("booking widget container is present", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });
    // The card-organic wrapper is always rendered regardless of Supabase data
    const widget = page.locator(".card-organic").first();
    await expect(widget).toBeVisible({ timeout: 10_000 });
  });

  test("booking widget step indicator renders", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });
    // Look for the step buttons by their rounded-full class — always present
    // regardless of whether session types loaded from Supabase
    const stepButtons = page.locator(".card-organic .rounded-full").first();
    await expect(stepButtons).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("Session direct links", () => {
  test("page loads without crashing when ?session= param is present", async ({ page }) => {
    await page.goto("/?session=00000000-0000-0000-0000-000000000000");
    const widget = page.locator(".card-organic").first();
    await expect(widget).toBeVisible({ timeout: 10_000 });
  });

  test("booking widget is still present and functional with unknown ?session= ID", async ({ page }) => {
    await page.goto("/?session=00000000-0000-0000-0000-000000000000");
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });
    // Step indicator is rendered regardless of session data
    const stepIndicator = page.locator(".card-organic .rounded-full").first();
    await expect(stepIndicator).toBeVisible({ timeout: 10_000 });
  });

  test("/ru route loads correctly with ?session= param", async ({ page }) => {
    await page.goto("/ru?session=00000000-0000-0000-0000-000000000000");
    const widget = page.locator(".card-organic").first();
    await expect(widget).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("PostHog initialisation", () => {
  test("PostHog script is loaded when key is configured", async ({ page }) => {
    await page.goto("/");
    // Check posthog object exists on window (initialised by main.tsx)
    // This passes even in CI as long as the build includes the posthog-js bundle
    const posthogLoaded = await page.evaluate(() => {
      return typeof (window as unknown as Record<string, unknown>).posthog !== "undefined";
    });
    expect(posthogLoaded).toBe(true);
  });

  test("PostHog sends requests when key is present", async ({ page }) => {
    const posthogRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("posthog.com")) {
        posthogRequests.push(request.url());
      }
    });

    await page.goto("/");
    await page.waitForTimeout(3000);

    // Only assert if PostHog is actually configured with a real key
    const hasKey = await page.evaluate(() => {
      const ph = (window as unknown as Record<string, unknown>).posthog as Record<string, unknown> | undefined;
      const token = (ph?.config as Record<string, unknown>)?.token as string | undefined;
      return typeof token === "string" && token.startsWith("phc_");
    });

    if (hasKey) {
      expect(posthogRequests.length).toBeGreaterThan(0);
    } else {
      // Key not set in this environment (expected in CI without secrets) — skip assertion
      test.skip();
    }
  });
});
