import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

import {
  buildCancellationEmails,
  buildConfirmationEmails,
  type BrevoMessage,
} from "./lib/emails.ts";
import { formatTimeWithTz } from "./lib/format.ts";
import {
  buildJaasPayload,
  computeJwtWindow,
  jaasRoomUrl,
  roomNameForBooking,
  signJwt,
} from "./lib/jaas.ts";
import { msUntilOpen, resolveJoinState, type JoinState } from "./lib/joinWindow.ts";
import { generateSlug, isValidSlug, shortLink } from "./lib/slug.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THERAPIST_EMAIL = "be@humanheart.life";
const THERAPIST_NAME = "Human Heart Beat";

/** What a client's calendar shows when a session type has no override.
 *  Deliberately less specific than the service name — this string syncs to
 *  third-party calendar infrastructure and every device on that account. */
const DEFAULT_CALENDAR_SUMMARY = "Session with Genia";

function siteUrl(): string {
  return Deno.env.get("SITE_URL") || "https://humanheart.life";
}

// ── Observability ──────────────────────────────────────────────

type EmailResult = { ok: true } | { ok: false; code: "BREVO_UNREACHABLE" | "BREVO_REJECTED" };

function generateRequestId(): string { return crypto.randomUUID(); }

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
  code: "VALIDATION_FAILED" | "SLOT_TAKEN" | "LEAD_TIME_VIOLATION" | "BREVO_UNREACHABLE" | "BREVO_REJECTED" | "RATE_LIMITED" | "NOT_FOUND" | "INTERNAL",
  message: string,
  requestId: string
): Response {
  return new Response(JSON.stringify({ error: { code, message, requestId } }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Rate limiting ──────────────────────────────────────────────

/** The slug is the only secret guarding a room, so it is treated as a
 *  capability token: unauthenticated lookups are capped per client IP. */
const JOIN_RATE_MAX = 30;
const JOIN_RATE_WINDOW_SECS = 300;

async function hashedClientKey(req: Request): Promise<string> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  // Hash so the rate-limit table never stores raw addresses.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function withinRateLimit(supabase: any, bucket: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_bucket: bucket,
    p_max: JOIN_RATE_MAX,
    p_window_seconds: JOIN_RATE_WINDOW_SECS,
  });
  // Fail open on infrastructure errors — a broken counter must not lock a
  // client out of a session that is starting now.
  if (error) return true;
  return data !== false;
}

// ── Session lookup by slug ─────────────────────────────────────

const BOOKING_SELECT =
  "*, session_types(name, duration_minutes, calendar_summary, notification_email_1, notification_email_2, show_second_email), hidden_offers(title, calendar_summary, notification_email)";

interface ResolvedBooking {
  booking: any;
  isModerator: boolean;
}

async function findBookingBySlug(
  supabase: any,
  slug: string
): Promise<ResolvedBooking | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .or(`slug.eq.${slug},moderator_slug.eq.${slug}`)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return { booking: data, isModerator: data.moderator_slug === slug };
}

function sessionNameOf(booking: any): string {
  return booking.session_types?.name || booking.hidden_offers?.title || "Session";
}

function calendarSummaryOf(booking: any): string {
  return (
    booking.session_types?.calendar_summary ||
    booking.hidden_offers?.calendar_summary ||
    DEFAULT_CALENDAR_SUMMARY
  );
}

function firstNameOf(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || fullName.trim() || "Guest";
}

/**
 * Mint a room URL for this booking. Called at click time only — never at
 * booking time, so the token window never has to be guessed in advance.
 * Returns null when JaaS is not configured (falls back to public Jitsi).
 */
async function mintRoomUrl(
  booking: any,
  isModerator: boolean,
  now: Date
): Promise<string | null> {
  const appId = Deno.env.get("JAAS_APP_ID");
  const privateKey = Deno.env.get("JAAS_PRIVATE_KEY");
  const apiKeyId = Deno.env.get("JAAS_API_KEY_ID");
  const roomName = roomNameForBooking(booking.id);

  if (!appId || !privateKey || !apiKeyId) {
    console.warn("JaaS credentials not configured, falling back to public Jitsi");
    return `https://meet.jit.si/${roomName}`;
  }

  const window = computeJwtWindow(now, new Date(booking.end_time));
  const payload = buildJaasPayload({
    appId,
    roomName,
    displayName: isModerator ? THERAPIST_NAME : firstNameOf(booking.client_name),
    // Booking UUID, never an email address — this lands in browser history.
    userId: isModerator ? `practitioner:${booking.id}` : booking.id,
    isModerator,
    window,
  });

  try {
    const kid = apiKeyId.includes("/") ? apiKeyId : `${appId}/${apiKeyId}`;
    const jwt = await signJwt(payload, privateKey, kid);
    return jaasRoomUrl(appId, roomName, jwt, isModerator);
  } catch (err) {
    console.error("Failed to generate JaaS JWT:", err instanceof Error ? err.message : "unknown");
    return null;
  }
}

interface JoinOutcome {
  state: JoinState | "not_found";
  joinUrl?: string;
  startsAtIso?: string;
  endsAtIso?: string;
  timezone?: string;
  sessionName?: string;
  isModerator?: boolean;
}

async function resolveJoin(
  supabase: any,
  slug: string,
  requestId: string
): Promise<JoinOutcome> {
  const found = await findBookingBySlug(supabase, slug);

  // Log the lookup, never the resulting token.
  logInfo(requestId, "join_lookup", {
    slugPrefix: slug.slice(0, 4),
    found: !!found,
  });

  if (!found) return { state: "not_found" };

  const { booking, isModerator } = found;
  const now = new Date();
  const state = resolveJoinState({
    status: booking.status,
    startTime: booking.start_time,
    endTime: booking.end_time,
    now,
  });

  const common = {
    startsAtIso: booking.start_time,
    endsAtIso: booking.end_time,
    timezone: booking.client_timezone || "UTC",
    sessionName: sessionNameOf(booking),
    isModerator,
  };

  if (state !== "open") {
    logInfo(requestId, "join_denied", { bookingId: booking.id, state });
    return { state, ...common };
  }

  const joinUrl = await mintRoomUrl(booking, isModerator, now);
  if (!joinUrl) {
    logError(requestId, "join_mint", "INTERNAL", "Token signing failed");
    return { state: "expired", ...common };
  }

  logInfo(requestId, "join_granted", {
    bookingId: booking.id,
    isModerator,
    expIso: new Date(
      computeJwtWindow(now, new Date(booking.end_time)).exp * 1000
    ).toISOString(),
  });

  return { state: "open", joinUrl, ...common };
}

// ── Server-rendered fallback pages ─────────────────────────────
// Used when the endpoint is hit directly (GET). The SPA at /s/<slug> renders
// the same states with the site's own styling; these exist so the function is
// usable behind a subdomain or proxy without the SPA in front of it.

function plainPage(title: string, body: string, status: number): Response {
  return new Response(
    `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${title}</title></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background:#faf8f5; color:#4a4035; margin:0; padding:15vh 24px; text-align:center;">
<div style="max-width:460px;margin:0 auto;">
<h1 style="font-weight:400;font-size:26px;margin:0 0 16px;">${title}</h1>
${body}
<p style="margin-top:32px;"><a href="${siteUrl()}" style="color:#4a7c5f;">humanheart.life</a></p>
</div></body></html>`,
    { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } }
  );
}

function joinPageFor(outcome: JoinOutcome): Response {
  switch (outcome.state) {
    case "early": {
      const { time24, tzLabel } = formatTimeWithTz(
        new Date(outcome.startsAtIso!),
        outcome.timezone || "UTC"
      );
      return plainPage(
        "Not quite yet",
        `<p>Your session with Genia starts at <strong>${time24}</strong> (${tzLabel}).</p>
         <p>This page will let you in 15 minutes before.</p>`,
        200
      );
    }
    case "expired":
      return plainPage(
        "This session has ended",
        `<p>The join link for this session is no longer active.</p>
         <p><a href="${siteUrl()}" style="color:#4a7c5f;">Book another session</a></p>`,
        410
      );
    case "cancelled":
      return plainPage(
        "This session was cancelled",
        `<p>This booking has been cancelled, so the room is closed.</p>
         <p><a href="${siteUrl()}" style="color:#4a7c5f;">Book another session</a></p>`,
        410
      );
    default:
      return plainPage(
        "Link not found",
        `<p>We couldn't find a session for this link. It may have been mistyped or truncated by an email client.</p>`,
        404
      );
  }
}

// ── Email transport ────────────────────────────────────────────

async function sendEmail(brevoApiKey: string, message: BrevoMessage): Promise<EmailResult> {
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

function practitionerRecipientsFor(booking: any): { email: string; name: string }[] {
  const senderFallback = Deno.env.get("SENDER_EMAIL") || THERAPIST_EMAIL;

  if (booking.hidden_offer_id) {
    return [
      { email: booking.hidden_offers?.notification_email || senderFallback, name: THERAPIST_NAME },
    ];
  }

  const sessionType = booking.session_types;
  const recipients = [
    { email: sessionType?.notification_email_1 || THERAPIST_EMAIL, name: THERAPIST_NAME },
  ];
  if (sessionType?.show_second_email && sessionType?.notification_email_2) {
    recipients.push({ email: sessionType.notification_email_2, name: THERAPIST_NAME });
  }
  return recipients;
}

function clientRecipientsFor(booking: any): { email: string; name: string }[] {
  const recipients = [{ email: booking.client_email, name: booking.client_name }];
  if (booking.client_email_2) {
    recipients.push({ email: booking.client_email_2, name: booking.client_name });
  }
  return recipients;
}

// ── Cancellation ──────────────────────────────────────────────

async function handleCancel(bookingId: string, requestId: string) {
  const supabase = getSupabase();

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { success: false, error: "Booking not found" };
  if (booking.status === "cancelled") return { success: false, error: "Already cancelled" };

  // Bump SEQUENCE so calendar clients treat the CANCEL as an update to the
  // invite they already hold rather than an unrelated event.
  const nextSequence = (booking.calendar_sequence ?? 0) + 1;

  const { error: cancelError } = await supabase
    .from("bookings")
    .update({ status: "cancelled", calendar_sequence: nextSequence })
    .eq("id", bookingId);

  if (cancelError) return { success: false, error: "Failed to cancel" };

  const emailSent = await sendCancellationEmails(
    { ...booking, calendar_sequence: nextSequence },
    nextSequence,
    requestId
  );
  return { success: true, emailSent };
}

async function sendCancellationEmails(
  booking: any,
  sequence: number,
  requestId: string
): Promise<boolean> {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    logError(requestId, "email_config", "INTERNAL", "BREVO_API_KEY not configured");
    return false;
  }

  const messages = buildCancellationEmails({
    booking,
    organizer: { name: THERAPIST_NAME, email: THERAPIST_EMAIL },
    sessionName: sessionNameOf(booking),
    calendarSummary: calendarSummaryOf(booking),
    clientTimezone: booking.client_timezone || "UTC",
    sequence,
    siteUrl: siteUrl(),
    clientRecipients: clientRecipientsFor(booking),
    practitionerRecipients: practitionerRecipientsFor(booking),
  });

  const [clientResult, practitionerResult] = await Promise.all([
    sendEmail(brevoApiKey, messages.client),
    sendEmail(brevoApiKey, messages.practitioner),
  ]);

  logInfo(requestId, "cancel_email", {
    clientOk: clientResult.ok,
    practitionerOk: practitionerResult.ok,
  });
  return clientResult.ok;
}

// ── Booking creation ───────────────────────────────────────────

interface OfferRecord {
  id: string;
  title: string;
  min_lead_time_minutes: number | null;
}

/** Two independent slugs: the client's link must never confer moderator rights. */
async function allocateSlugs(supabase: any): Promise<{ slug: string; moderatorSlug: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = generateSlug();
    const moderatorSlug = generateSlug();
    const { data } = await supabase
      .from("bookings")
      .select("id")
      .or(
        `slug.eq.${slug},slug.eq.${moderatorSlug},moderator_slug.eq.${slug},moderator_slug.eq.${moderatorSlug}`
      )
      .limit(1);
    if (!data || data.length === 0) return { slug, moderatorSlug };
  }
  throw new Error("Could not allocate unique slugs");
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startMs = Date.now();

  if (req.method === "GET") {
    const url = new URL(req.url);
    const supabase = getSupabase();

    // Short-link join, server-rendered. A 302 into the room when the window is
    // open; a friendly page otherwise.
    const slug = url.searchParams.get("slug") || url.searchParams.get("s");
    if (slug) {
      if (!isValidSlug(slug)) return joinPageFor({ state: "not_found" });

      const bucket = `join:${await hashedClientKey(req)}`;
      if (!(await withinRateLimit(supabase, bucket))) {
        logError(requestId, "join", "RATE_LIMITED");
        return plainPage("Too many attempts", "<p>Please wait a few minutes and try again.</p>", 429);
      }

      const outcome = await resolveJoin(supabase, slug, requestId);
      if (outcome.state === "open" && outcome.joinUrl) {
        return new Response(null, {
          status: 302,
          headers: { ...corsHeaders, Location: outcome.joinUrl, "Cache-Control": "no-store" },
        });
      }
      return joinPageFor(outcome);
    }

    // Legacy cancellation link (already-sent confirmations). New emails point
    // at /c/<slug>, which asks for confirmation before cancelling.
    const action = url.searchParams.get("action");
    const id = url.searchParams.get("id");
    const redirect = url.searchParams.get("redirect") || siteUrl();

    if (action === "cancel" && id) {
      const result = await handleCancel(id, requestId);
      const redirectUrl = result.success
        ? `${redirect}/en/booking-cancelled?success=true`
        : `${redirect}/en/booking-cancelled?success=false`;
      return new Response(null, { status: 302, headers: { ...corsHeaders, Location: redirectUrl } });
    }

    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // ── Short-link join, JSON (the SPA at /s/<slug>) ──
    if (body.action === "join" && body.slug) {
      const supabase = getSupabase();
      if (!isValidSlug(body.slug)) {
        return new Response(JSON.stringify({ state: "not_found", requestId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const bucket = `join:${await hashedClientKey(req)}`;
      if (!(await withinRateLimit(supabase, bucket))) {
        logError(requestId, "join", "RATE_LIMITED");
        return errorResponse(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.", requestId);
      }

      const outcome = await resolveJoin(supabase, body.slug, requestId);
      // 200 even for "not_found": an unknown slug is an application state the
      // page renders, not a transport failure. Reserving non-2xx for genuine
      // errors keeps the client's error handling honest.
      return new Response(
        JSON.stringify({
          ...outcome,
          msUntilOpen: outcome.startsAtIso ? msUntilOpen(outcome.startsAtIso) : undefined,
          requestId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    // ── Short-link cancel details (the SPA at /c/<slug>) ──
    if (body.action === "cancel_details" && body.slug) {
      const supabase = getSupabase();
      if (!isValidSlug(body.slug)) {
        return errorResponse(404, "NOT_FOUND", "Booking not found", requestId);
      }

      const bucket = `join:${await hashedClientKey(req)}`;
      if (!(await withinRateLimit(supabase, bucket))) {
        return errorResponse(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.", requestId);
      }

      const found = await findBookingBySlug(supabase, body.slug);
      if (!found) return errorResponse(404, "NOT_FOUND", "Booking not found", requestId);

      const { booking } = found;
      return new Response(
        JSON.stringify({
          sessionName: sessionNameOf(booking),
          startsAtIso: booking.start_time,
          timezone: booking.client_timezone || "UTC",
          status: booking.status,
          requestId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } }
      );
    }

    // ── Short-link cancel, confirmed by the client ──
    // POST-only on purpose: email clients and link scanners prefetch GET URLs,
    // which would silently cancel bookings.
    if (body.action === "cancel_by_slug" && body.slug) {
      const supabase = getSupabase();
      if (!isValidSlug(body.slug)) {
        return errorResponse(404, "NOT_FOUND", "Booking not found", requestId);
      }

      const bucket = `cancel:${await hashedClientKey(req)}`;
      if (!(await withinRateLimit(supabase, bucket))) {
        return errorResponse(429, "RATE_LIMITED", "Too many attempts. Please wait a few minutes.", requestId);
      }

      const found = await findBookingBySlug(supabase, body.slug);
      if (!found) return errorResponse(404, "NOT_FOUND", "Booking not found", requestId);

      const result = await handleCancel(found.booking.id, requestId);
      logInfo(requestId, "cancel_by_slug", { success: result.success });
      return new Response(JSON.stringify({ ...result, requestId }), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST cancellation (admin / website, by id)
    if (body.action === "cancel" && body.bookingId) {
      const result = await handleCancel(body.bookingId, requestId);
      logInfo(requestId, "cancel", { success: result.success });
      return new Response(JSON.stringify({ ...result, requestId }), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Booking creation ──
    const { sessionTypeId, hiddenOfferId, clientName, clientEmail, clientEmail2, startTime, endTime, notes, timezone } = body;

    const isOfferBooking = !!hiddenOfferId;
    if ((!sessionTypeId && !hiddenOfferId) || !clientName || !clientEmail || !startTime || !endTime) {
      logError(requestId, "validation", "VALIDATION_FAILED");
      return errorResponse(400, "VALIDATION_FAILED", "Missing required fields", requestId);
    }

    const supabase = getSupabase();

    // For offer bookings: validate the offer exists and is active
    let offerRecord: OfferRecord | null = null;
    if (isOfferBooking) {
      const { data: offer, error: offerErr } = await supabase
        .from("hidden_offers")
        .select("id, title, min_lead_time_minutes")
        .eq("id", hiddenOfferId)
        .eq("is_active", true)
        .single();
      if (offerErr || !offer) {
        logError(requestId, "offer_lookup", "VALIDATION_FAILED", "Offer not found or inactive");
        return errorResponse(400, "VALIDATION_FAILED", "This offer is no longer available.", requestId);
      }
      offerRecord = offer as OfferRecord;
    }

    // Lead time check
    {
      const DEFAULT_LEAD_MINUTES = 1200;
      const { data: settingsRows } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "booking_min_lead_time_minutes")
        .single();
      const globalLeadMinutes: number =
        typeof settingsRows?.value === "number"
          ? settingsRows.value
          : DEFAULT_LEAD_MINUTES;
      const leadMinutes =
        offerRecord?.min_lead_time_minutes != null
          ? offerRecord.min_lead_time_minutes
          : globalLeadMinutes;
      const sessionStartMs = new Date(startTime).getTime();
      const leadTimeMs = leadMinutes * 60 * 1000;
      if (sessionStartMs - Date.now() < leadTimeMs) {
        logError(requestId, "lead_time_check", "LEAD_TIME_VIOLATION");
        return errorResponse(400, "LEAD_TIME_VIOLATION", "This time slot is no longer available. Please choose a later time.", requestId);
      }
    }

    // Overlap check
    const { data: existing } = await supabase
      .from("bookings").select("id").neq("status", "cancelled")
      .lt("start_time", endTime).gt("end_time", startTime).limit(1);

    if (existing && existing.length > 0) {
      logError(requestId, "slot_check", "SLOT_TAKEN");
      return errorResponse(409, "SLOT_TAKEN", "This time slot is no longer available. Please go back and choose another.", requestId);
    }

    const { slug, moderatorSlug } = await allocateSlugs(supabase);

    const insertRow = {
      session_type_id: isOfferBooking ? null : sessionTypeId,
      hidden_offer_id: isOfferBooking ? hiddenOfferId : null,
      ...(isOfferBooking ? { conditions_accepted_at: new Date().toISOString() } : {}),
      client_name: clientName,
      client_email: clientEmail,
      client_email_2: clientEmail2 || null,
      start_time: startTime,
      end_time: endTime,
      notes: notes || null,
      status: "confirmed",
      client_timezone: timezone || "UTC",
      slug,
      moderator_slug: moderatorSlug,
      calendar_sequence: 0,
    };

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert(insertRow)
      .select(BOOKING_SELECT)
      .single();

    if (insertError || !booking) {
      logError(requestId, "db_insert", "INTERNAL", insertError?.message);
      return errorResponse(500, "INTERNAL", "Failed to create booking. Please try again.", requestId);
    }

    // Short links on our own domain. No JaaS URL and no JWT is minted here —
    // the token is signed when the client actually clicks, inside a narrow window.
    const base = siteUrl();
    const joinUrl = shortLink(base, "s", slug);
    const cancelUrl = shortLink(base, "c", slug);
    const moderatorJoinUrl = shortLink(base, "s", moderatorSlug);

    await supabase.from("bookings").update({ google_meet_link: joinUrl }).eq("id", booking.id);

    // ── Send emails ──
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    let emailSent = false;

    if (brevoApiKey) {
      const messages = buildConfirmationEmails({
        booking,
        organizer: { name: THERAPIST_NAME, email: THERAPIST_EMAIL },
        sessionName: isOfferBooking
          ? offerRecord?.title || "Session"
          : sessionNameOf(booking),
        calendarSummary: calendarSummaryOf(booking),
        durationMinutes: booking.session_types?.duration_minutes || 60,
        clientTimezone: timezone || "UTC",
        joinUrl,
        cancelUrl,
        moderatorJoinUrl,
        clientRecipients: clientRecipientsFor(booking),
        practitionerRecipients: practitionerRecipientsFor(booking),
      });

      try {
        const [clientResult, practitionerResult] = await Promise.all([
          sendEmail(brevoApiKey, messages.client),
          sendEmail(brevoApiKey, messages.practitioner),
        ]);
        emailSent = clientResult.ok;
        logInfo(requestId, "email", { clientOk: clientResult.ok, therapistOk: practitionerResult.ok });
        if (!clientResult.ok) logError(requestId, "email_client", clientResult.code);
        if (!practitionerResult.ok) logError(requestId, "email_therapist", practitionerResult.code);
      } catch {
        logError(requestId, "email", "INTERNAL", "Unexpected error during email sending");
      }
    } else {
      logError(requestId, "email_config", "INTERNAL", "BREVO_API_KEY not configured");
    }

    logInfo(requestId, "complete", { durationMs: Date.now() - startMs });
    // client_email is intentionally excluded — the client already knows their email.
    const bookingResponse = {
      id: booking.id,
      start_time: booking.start_time,
      end_time: booking.end_time,
      session_type_id: booking.session_type_id,
      client_timezone: booking.client_timezone,
      google_meet_link: joinUrl,
    };
    return new Response(
      JSON.stringify({ success: true, booking: bookingResponse, meetLink: joinUrl, emailSent, requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    logError(requestId, "handler", "INTERNAL");
    return errorResponse(500, "INTERNAL", "An unexpected error occurred. Please try again.", requestId);
  }
});
