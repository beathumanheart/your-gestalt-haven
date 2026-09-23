/**
 * ============================================================
 * take-signup — the worksheet PDF, and the monthly letter
 * ============================================================
 * Two things a reader can ask for on a /take page, in one request:
 *
 *   pdf     one transactional email carrying a link to the worksheet
 *   letter  Brevo's double opt-in, which sends its own confirmation and adds
 *           the address to the list only once the reader clicks it
 *
 * They are independent: the PDF goes out whether or not the letter is ticked,
 * and the letter box is separate and unticked by default.
 *
 * ⚠️ The address is never logged, never written to the database, and never
 * echoed in an error. Brevo is the record. The rate-limit table keeps only a
 * hash of the caller's IP, as it already does for the booking function.
 * ============================================================
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendEmail } from "../_shared/send.ts";
import { buildWorksheetEmail } from "./lib/emails.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RATE_MAX = 5;
const RATE_WINDOW_SECS = 600;

/**
 * Where each page's worksheet lives.
 *
 * Server-side on purpose: the PDF URL is never taken from the request, so a
 * caller cannot make this function email an arbitrary link over the
 * practice's own domain and signature.
 */
const SOURCES = {
  "automatic-yes": {
    pdfPath: "/downloads/the-automatic-yes-human-heart.pdf",
    pagePath: "/en/take/automatic-yes",
  },
} as const;

type SourceKey = keyof typeof SOURCES;

const siteUrl = () => Deno.env.get("SITE_URL") || "https://humanheart.life";

function logInfo(requestId: string, step: string, data?: Record<string, unknown>): void {
  console.log(JSON.stringify({ requestId, timestamp: new Date().toISOString(), step, status: "ok", ...data }));
}

function logError(requestId: string, step: string, errorCode: string, errorMessage?: string): void {
  console.error(JSON.stringify({
    requestId,
    timestamp: new Date().toISOString(),
    step,
    status: "error",
    errorCode,
    ...(errorMessage ? { errorMessage } : {}),
  }));
}

function errorResponse(
  status: number,
  code: "VALIDATION_FAILED" | "RATE_LIMITED" | "INTERNAL",
  message: string,
  requestId: string,
): Response {
  return new Response(JSON.stringify({ error: { code, message, requestId } }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function hashedClientKey(req: Request): Promise<string> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  // Hashed so the rate-limit table never stores raw addresses.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// deno-lint-ignore no-explicit-any
async function withinRateLimit(supabase: any, bucket: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_max: RATE_MAX,
    p_window_seconds: RATE_WINDOW_SECS,
  });
  // Fail open on infrastructure errors: a broken counter should not stop
  // someone receiving a worksheet they asked for.
  if (error) return true;
  return data !== false;
}

/** Deliberately loose: the address is proved by the email arriving, not by a regex. */
const PLAUSIBLE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Asks Brevo to send its own double opt-in confirmation.
 *
 * The address reaches the list only after the reader clicks the link in that
 * email; nothing here adds a contact directly.
 */
async function requestLetterConfirmation(
  apiKey: string,
  email: string,
  lang: string,
  source: SourceKey,
  requestId: string,
): Promise<"pending" | "failed"> {
  const listId = Number(Deno.env.get("BREVO_LETTER_LIST_ID"));
  const templateId = Number(Deno.env.get("BREVO_DOI_TEMPLATE_ID"));

  if (!listId || !templateId) {
    logError(requestId, "letter", "NOT_CONFIGURED", "list or template id missing");
    return "failed";
  }

  const payload: Record<string, unknown> = {
    email,
    includeListIds: [listId],
    templateId,
    redirectionUrl: `${siteUrl()}${SOURCES[source].pagePath}?letter=confirmed`,
  };

  // Only when the attributes exist in Brevo; sending unknown ones is rejected.
  if (Deno.env.get("BREVO_CONTACT_ATTRIBUTES") === "1") {
    payload.attributes = { SOURCE: source, LANGUAGE: lang };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": apiKey },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.status === 201 || res.status === 204) return "pending";

    // An address already on the list answers with an error. Treat it as
    // success: the reply must never tell a stranger who is subscribed.
    const body = await res.text();
    if (res.status === 400 && /already|exist/i.test(body)) {
      logInfo(requestId, "letter", { outcome: "already_subscribed" });
      return "pending";
    }

    logError(requestId, "letter", "BREVO_REJECTED", `status=${res.status}`);
    return "failed";
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err instanceof Error && err.name === "AbortError";
    logError(requestId, "letter", isTimeout ? "BREVO_TIMEOUT" : "BREVO_UNREACHABLE");
    return "failed";
  }
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const requestId = crypto.randomUUID();

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return errorResponse(400, "VALIDATION_FAILED", "Malformed request.", requestId);
    }

    // Honeypot: a field no person sees, so anything in it is a bot. Answer as
    // though it worked, and do nothing.
    if (typeof body.company === "string" && body.company.trim() !== "") {
      logInfo(requestId, "honeypot");
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const pdf = body.pdf === true;
    const letter = body.letter === true;
    const lang = body.lang === "ru" ? "ru" : "en";
    const source = body.source as SourceKey;

    if (!email || email.length > 254 || !PLAUSIBLE_EMAIL.test(email)) {
      return errorResponse(400, "VALIDATION_FAILED", "That address does not look right.", requestId);
    }
    if (!(source in SOURCES)) {
      return errorResponse(400, "VALIDATION_FAILED", "Unknown source.", requestId);
    }
    if (!pdf && !letter) {
      return errorResponse(400, "VALIDATION_FAILED", "Nothing was asked for.", requestId);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const key = await hashedClientKey(req);
    if (!(await withinRateLimit(supabase, `take-signup:${key}`))) {
      logError(requestId, "rate_limit", "RATE_LIMITED");
      return errorResponse(429, "RATE_LIMITED", "Too many attempts. Try again a little later.", requestId);
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      logError(requestId, "config", "INTERNAL", "BREVO_API_KEY missing");
      return errorResponse(500, "INTERNAL", "Email is not configured.", requestId);
    }

    let pdfResult: "sent" | "failed" | "skipped" = "skipped";
    if (pdf) {
      const message = buildWorksheetEmail({
        email,
        pdfUrl: `${siteUrl()}${SOURCES[source].pdfPath}`,
        pageUrl: `${siteUrl()}${SOURCES[source].pagePath}`,
      });
      const result = await sendEmail(brevoApiKey, message);
      pdfResult = result.ok ? "sent" : "failed";
      if (!result.ok) logError(requestId, "pdf", result.code);
    }

    let letterResult: "pending" | "failed" | "skipped" = "skipped";
    if (letter) {
      letterResult = await requestLetterConfirmation(brevoApiKey, email, lang, source, requestId);
    }

    // No address anywhere in this line — the outcome is all that is recorded.
    logInfo(requestId, "done", { source, lang, pdf: pdfResult, letter: letterResult });

    return new Response(JSON.stringify({ ok: true, pdf: pdfResult, letter: letterResult, requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    logError(requestId, "unhandled", "INTERNAL", err instanceof Error ? err.name : "unknown");
    return errorResponse(500, "INTERNAL", "Something went wrong.", requestId);
  }
});
