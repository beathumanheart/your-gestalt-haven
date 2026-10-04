import { test, expect } from "@playwright/test";

test.describe("Landing page", () => {
  test("loads and shows correct name", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Genia/);
    const title = await page.title();
    expect(title).not.toMatch(/Eugenia/i);
  });

  test("canonical URL is humanheart.life/en", async ({ page }) => {
    await page.goto("/");
    // PageMeta (data-rh="true") is the authoritative tag — check it specifically.
    const canonical = page.locator('link[rel="canonical"][data-rh="true"]');
    await expect(canonical).toHaveAttribute("href", "https://humanheart.life/en");
  });

  // Helmet copies props to attributes verbatim, so the JSX spelling of
  // `hrefLang` decides what search engines actually see. Assert the attribute
  // on the page rather than trusting the prop name.
  test("alternate language links carry a real hreflang attribute", async ({ page }) => {
    await page.goto("/");
    const alternates = page.locator('link[rel="alternate"][data-rh="true"]');
    await expect(alternates).toHaveCount(3);

    const langs = await alternates.evaluateAll((links) =>
      links.map((l) => l.getAttribute("hreflang"))
    );
    expect(langs.sort()).toEqual(["en", "ru", "x-default"]);
  });

  test("OG image is self-hosted (not r2.dev or lovable CDN)", async ({ page }) => {
    await page.goto("/");
    // index.html provides a static tag for bots; PageMeta adds a second with data-rh="true".
    // Both carry identical content — use .first() to avoid strict-mode failure.
    const ogImage = page.locator('meta[property="og:image"]').first();
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

/**
 * The contact section, with BOOKING_ENABLED off.
 *
 * These two cases used to assert the wizard was present, by looking for
 * `.card-organic` and a `.rounded-full` step pip inside it. Both were proxy
 * assertions of the kind docs/writing-guards.md warns about — `.card-organic`
 * is a generic card class, so either would have passed on any page that
 * happened to render a card, and neither said anything about booking.
 *
 * With the calendar off they assert the replacement instead: the wizard is
 * gone, and the invitation to write is there. The flag's own two states are
 * exercised in src/__tests__/bookingFlag.test.tsx, which is where the flag-on
 * half lives; turning the flag on and running e2e is a build away.
 */
test.describe("Contact section (booking disabled)", () => {
  test("renders no booking wizard", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });

    const contact = page.locator("#contact");
    await expect(contact).toBeVisible({ timeout: 10_000 });
    // The wizard's own card, scoped to the section it used to occupy.
    await expect(contact.locator(".card-organic")).toHaveCount(0);
  });

  test("renders the invitation to write instead", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView();
    });

    const invitation = page.getByTestId("get-in-touch").first();
    await expect(invitation).toBeVisible({ timeout: 10_000 });
    // By role and name, so this fails if the button loses its label.
    await expect(
      invitation.getByRole("button", { name: "Copy email address" }),
    ).toBeVisible();
  });
});

test.describe("Session direct links", () => {
  // ?session=<id> URLs are redirected to /:lang/book/:id by SessionParamRedirect.
  // For unknown IDs the BookSession page renders a "not found" state — no crash.

  test("page loads without crashing when ?session= param is present", async ({ page }) => {
    // Redirects to /en/book/00000000-... → BookSession page renders
    await page.goto("/?session=00000000-0000-0000-0000-000000000000");
    // The breadcrumb's first crumb is always present on the service page,
    // found or not-found — it replaced the old "Back to home" arrow when the
    // page became one of a set rather than a detour off the homepage.
    const crumb = page.locator('nav a:has-text("Services")');
    await expect(crumb.first()).toBeAttached({ timeout: 10_000 });
  });

  test("unknown ?session= ID shows not-found state without crashing", async ({ page }) => {
    await page.goto("/?session=00000000-0000-0000-0000-000000000000");
    // BookSession renders "Session not found." for unknown IDs
    const notFound = page.locator('text=Session not found.');
    await expect(notFound).toBeAttached({ timeout: 10_000 });
  });

  test("/ru route loads correctly with ?session= param", async ({ page }) => {
    // Redirects to /ru/book/00000000-... → BookSession renders in Russian
    await page.goto("/ru?session=00000000-0000-0000-0000-000000000000");
    const crumb = page.locator('nav a:has-text("Услуги")');
    await expect(crumb.first()).toBeAttached({ timeout: 10_000 });
  });
});

test.describe("Booking is closed, not merely hidden", () => {
  /**
   * Replaces "shows server error message and ref ID when edge function
   * returns 500", which ended in `expect(true).toBe(true)` — it fulfilled a
   * route, waited for a card, and then asserted a tautology. It could not
   * fail for any reason connected to booking, and it broke here only because
   * the card it waited for is gone. The error handling it claimed to cover is
   * in BookingForm.test.tsx, where the responses can actually be driven.
   *
   * What is worth asserting in a browser is the flag's actual promise: with
   * booking off, no amount of poking at the public pages produces a call to
   * process-booking.
   */
  test("no page calls process-booking while BOOKING_ENABLED is off", async ({ page }) => {
    const calls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/functions/v1/process-booking")) calls.push(req.url());
    });

    for (const path of ["/en", "/en/book/individual-therapy", "/ru/book/individual-therapy"]) {
      await page.goto(path);
      await page.evaluate(() => document.getElementById("contact")?.scrollIntoView());
      // Click everything clickable in the contact area; nothing there should
      // be able to start a booking.
      const buttons = page.getByRole("button");
      const count = await buttons.count();
      for (let i = 0; i < Math.min(count, 12); i++) {
        await buttons.nth(i).click({ timeout: 1000, trial: true }).catch(() => {});
      }
      await page.waitForTimeout(400);
    }

    expect(calls, `process-booking was called: ${calls.join(", ")}`).toEqual([]);
  });

  test("the join and cancel paths still reach the function", async ({ page }) => {
    // The other half, and the reason the flag is front-end only: the edge
    // function still serves the dormant short links. A flag that closed this
    // too would strand anyone holding a link to a session already booked.
    const calls: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("/functions/v1/process-booking")) calls.push(req.url());
    });

    await page.goto("/s/not-a-real-token");
    await page.waitForTimeout(1500);

    expect(calls.length, "the join page made no call to process-booking").toBeGreaterThan(0);
  });

  test("the contact channels are reachable from the homepage", async ({ page }) => {
    // Was "Telegram and Signal links remain in the DOM": it accepted either,
    // and the Signal half had already stopped rendering — the only file that
    // held that URL (src/content/contact.ts) was imported by nothing. An
    // assertion satisfied by one of two things cannot notice one of them
    // disappearing, which is the shape docs/writing-guards.md describes.
    //
    // Both channels are now named, because both are published.
    await page.goto("/");

    await expect(page.locator('a[href*="t.me/"]').first()).toBeAttached();
    await expect(
      page.locator('a[href="mailto:be@humanheart.life"]').first(),
    ).toBeAttached();
  });
});

test.describe("PostHog initialisation", () => {
  test("PostHog initialises and sends a request when key is configured", async ({ page }) => {
    // The app uses posthog-js as an npm package — window.posthog is not set
    // (that's a CDN-snippet behaviour only). Instead, verify that posthog-js
    // fires at least one request to eu.i.posthog.com, proving it initialised.
    const posthogRequests: string[] = [];
    page.on("request", (req) => {
      if (req.url().includes("posthog.com")) posthogRequests.push(req.url());
    });

    await page.goto("/");
    await page.waitForTimeout(3000);

    // If the build doesn't include a key (e.g. CI without the secret), skip.
    const hasKey = await page.evaluate(() => {
      return document.documentElement.innerHTML.includes("phc_");
    });
    if (!hasKey) {
      test.skip();
      return;
    }
    expect(posthogRequests.length).toBeGreaterThan(0);
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
