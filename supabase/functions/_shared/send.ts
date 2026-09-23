/**
 * Putting a message on the wire.
 *
 * Separate from email.ts because this needs Deno globals and the network, and
 * email.ts is reachable from the app's test graph through the @edge alias.
 * Keeping them apart is what stops `Deno` being type-checked as browser code.
 *
 * Lifted verbatim from process-booking/index.ts; the booking emails must go
 * out exactly as before.
 */

import { THERAPIST_EMAIL, THERAPIST_NAME, type BrevoMessage } from "./email.ts";

export type EmailResult =
  | { ok: true }
  | { ok: false; code: "BREVO_UNREACHABLE" | "BREVO_REJECTED" };

export async function sendEmail(brevoApiKey: string, message: BrevoMessage): Promise<EmailResult> {
  const senderEmail = Deno.env.get("SENDER_EMAIL") || THERAPIST_EMAIL;
  const senderName = Deno.env.get("SENDER_NAME") || THERAPIST_NAME;

  const payload: Record<string, unknown> = {
    sender: { name: senderName, email: senderEmail },
    to: message.to,
    subject: message.subject,
    htmlContent: message.htmlContent,
    textContent: message.textContent,
  };
  if (message.attachment?.length) payload.attachment = message.attachment;
  if (message.headers) payload.headers = message.headers;

  // Guard against Brevo hanging (e.g. IP verification delay) timing out the whole edge function.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    // /v3/smtp/email is the transactional endpoint. Campaign sends add
    // List-Unsubscribe headers, which must never appear on a booking
    // confirmation — one tap would blocklist the client.
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoApiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      console.error(`[email] Brevo rejected: status=${res.status}`);
      return { ok: false, code: "BREVO_REJECTED" };
    }
    return { ok: true };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    console.error(isTimeout ? "[email] Brevo request timed out after 10s" : "[email] Network error reaching Brevo API");
    return { ok: false, code: "BREVO_UNREACHABLE" };
  }
}
