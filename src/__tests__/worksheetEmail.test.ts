/**
 * The worksheet email, asserted on the bytes that go out.
 *
 * Beside bookingEmails.test.ts and for the same reason: the message is built
 * as a complete Brevo payload, so a test can read exactly what a person will
 * receive rather than a reimplementation of it.
 */

import { describe, expect, it } from "vitest";
import { buildWorksheetEmail } from "@takesignup/emails.ts";
import { TRANSACTIONAL_HEADERS } from "@shared/email.ts";

const SITE = "https://humanheart.life";
const message = buildWorksheetEmail({
  email: "reader@example.com",
  pdfUrl: `${SITE}/downloads/the-automatic-yes-human-heart.pdf`,
  pageUrl: `${SITE}/en/take/automatic-yes`,
});

describe("the worksheet email", () => {
  it("says what it is in the subject", () => {
    expect(message.subject).toBe("The automatic yes — your worksheet");
  });

  it("links the PDF absolutely, at the path the function controls", () => {
    // Relative links do not resolve in an inbox, and the path comes from the
    // function's own map so a caller cannot substitute one.
    expect(message.htmlContent).toContain(
      `${SITE}/downloads/the-automatic-yes-human-heart.pdf`,
    );
    expect(message.textContent).toContain(
      `${SITE}/downloads/the-automatic-yes-human-heart.pdf`,
    );
    expect(message.htmlContent).not.toMatch(/href="\/downloads/);
  });

  it("carries both parts, so it is readable without HTML", () => {
    expect(message.htmlContent.length).toBeGreaterThan(200);
    expect(message.textContent.length).toBeGreaterThan(200);
    // The plain part spells the URLs out rather than hiding them in anchors.
    expect(message.textContent).toContain(`${SITE}/en/take/automatic-yes`);
    expect(message.textContent).toContain("youtube.com/@beathumanheart");
  });

  it("is transactional: no open pixel, no unsubscribe header", () => {
    // It is one requested email, not a subscription. An unsubscribe tap here
    // would blocklist the address for mail they do want.
    expect(message.headers).toEqual(TRANSACTIONAL_HEADERS);
  });

  it("keeps the care line from the worksheet's first page", () => {
    expect(message.textContent).toContain("better explored with a counsellor or therapist than alone");
  });

  it("puts the reader's address nowhere but `to`", () => {
    expect(message.to).toEqual([{ email: "reader@example.com" }]);
    expect(message.subject).not.toContain("reader@example.com");
    expect(message.htmlContent).not.toContain("reader@example.com");
    expect(message.textContent).not.toContain("reader@example.com");
  });
});
