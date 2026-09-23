/**
 * ============================================================
 * OUTGOING EMAIL — HOW A MESSAGE IS BUILT
 * ============================================================
 * Pure: types and HTML helpers, no Deno globals and no network. That matters
 * beyond tidiness — the app's tests import the booking email builders through
 * the @edge alias, so anything reachable from here is type-checked as browser
 * code. Sending lives in ./send.ts, which nothing in src/ imports.
 *
 * Lifted verbatim out of process-booking so the worksheet email is built and
 * sent exactly the way a booking confirmation is, rather than by a second
 * implementation that drifts from it.
 *
 * ⚠️ Every line below is the original, unchanged. Rewriting any of it changes
 * what a client receives: a first attempt at this file reimplemented `shell`,
 * `button` and `escapeHtml` from memory and would have altered every booking
 * email. src/__tests__/bookingEmails.test.ts asserts on the exact bytes and is
 * the check that this move was inert.
 * ============================================================
 */

export interface BrevoAttachment {
  content: string;
  name: string;
}

export interface BrevoMessage {
  // `name` is optional because not every recipient has one: a booking always
  // carries the client's name, a worksheet request is only an address.
  to: { email: string; name?: string }[];
  subject: string;
  /** Both parts are always present: html-only mail is an accessibility gap
   *  and carries a small spam-score penalty. */
  htmlContent: string;
  textContent: string;
  attachment?: BrevoAttachment[];
  headers?: Record<string, string>;
}

export const THERAPIST_EMAIL = "be@humanheart.life";

export const THERAPIST_NAME = "Genia";

export const TRANSACTIONAL_HEADERS: Record<string, string> = {
  "X-Mailin-Track": "0",
  "X-Mailin-Tag": "transactional",
};

export function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function shell(heading: string, gradient: string, body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: ${gradient}; padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">${heading}</h1>
    </div>
    <div style="padding: 32px;">${body}</div>
  </div>
</body></html>`;
}

export function button(href: string, label: string): string {
  return `<div style="text-align: center; margin: 28px 0;">
        <a href="${href}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">${label}</a>
      </div>`;
}
