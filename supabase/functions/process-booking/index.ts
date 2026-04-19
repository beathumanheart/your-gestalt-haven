import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THERAPIST_EMAIL = "be@humanheart.life";
const THERAPIST_NAME = "Human Heart Beat";

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
  code: "VALIDATION_FAILED" | "SLOT_TAKEN" | "BREVO_UNREACHABLE" | "BREVO_REJECTED" | "INTERNAL",
  message: string,
  requestId: string
): Response {
  return new Response(JSON.stringify({ error: { code, message, requestId } }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── JaaS JWT Token Generation ──────────────────────────────────

function base64UrlEncode(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function textToBase64Url(text: string): string {
  return base64UrlEncode(new TextEncoder().encode(text));
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");
  
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function signJwt(payload: object, privateKeyPem: string, kid: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT", kid };
  const headerB64 = textToBase64Url(JSON.stringify(header));
  const payloadB64 = textToBase64Url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;
  
  const privateKey = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput)
  );
  
  const signatureB64 = base64UrlEncode(new Uint8Array(signature));
  return `${signingInput}.${signatureB64}`;
}

async function generateJaasJwtToken(
  roomName: string,
  userName: string,
  userEmail: string,
  isModerator: boolean
): Promise<string | null> {
  const appId = Deno.env.get("JAAS_APP_ID");
  const privateKey = Deno.env.get("JAAS_PRIVATE_KEY");
  const apiKeyId = Deno.env.get("JAAS_API_KEY_ID");
  
  if (!appId || !privateKey || !apiKeyId) {
    console.warn("JaaS credentials not configured (missing appId, privateKey, or apiKeyId), falling back to public Jitsi");
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 3 * 60 * 60; // 3 hours

  const payload = {
    iss: "chat",
    aud: "jitsi",
    sub: appId,
    room: roomName,
    exp,
    nbf: now - 60,
    context: {
      user: {
        moderator: isModerator ? "true" : "false",
        name: userName,
        email: userEmail,
        avatar: "",
        id: userEmail,
      },
      features: {
        recording: isModerator ? "true" : "false",
        livestreaming: isModerator ? "true" : "false",
        "outbound-call": isModerator ? "true" : "false",
        transcription: isModerator ? "true" : "false",
        "lobby": "true",
      },
    },
  };

  try {
    const normalizedKid = apiKeyId.includes("/") ? apiKeyId : `${appId}/${apiKeyId}`;
    return await signJwt(payload, privateKey, normalizedKid);
  } catch (err) {
    console.error("Failed to generate JaaS JWT:", err);
    return null;
  }
}

function generateRoomName(bookingId: string): string {
  return `session-${bookingId.slice(0, 8)}-${Date.now().toString(36)}`;
}

async function generateJitsiLinks(
  bookingId: string,
  clientName: string,
  clientEmail: string
): Promise<{ clientLink: string; therapistLink: string; roomName: string }> {
  const roomName = generateRoomName(bookingId);
  const appId = Deno.env.get("JAAS_APP_ID");
  
  // Try to generate JaaS tokens
  const [clientToken, therapistToken] = await Promise.all([
    generateJaasJwtToken(roomName, clientName, clientEmail, false),
    generateJaasJwtToken(roomName, THERAPIST_NAME, THERAPIST_EMAIL, true),
  ]);

  if (clientToken && therapistToken && appId) {
    // JaaS links with JWT tokens
    const baseUrl = `https://8x8.vc/${appId}/${roomName}`;
    // Client link: auto-knock on lobby so they wait for moderator approval
    const clientConfig = "#config.prejoinConfig.enabled=true&config.lobby.autoKnock=true&config.disableModeratorIndicator=false";
    return {
      clientLink: `${baseUrl}?jwt=${clientToken}${clientConfig}`,
      therapistLink: `${baseUrl}?jwt=${therapistToken}`,
      roomName,
    };
  }

  // Fallback to public Jitsi
  const fallbackLink = `https://meet.jit.si/${roomName}`;
  return {
    clientLink: fallbackLink,
    therapistLink: fallbackLink,
    roomName,
  };
}

function formatTimeWithTz(date: Date, tz: string): { time24: string; tzLabel: string } {
  const cityName = tz.split("/").pop()?.replace(/_/g, " ") || tz;
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date);
    let offsetPart = parts.find(p => p.type === "timeZoneName")?.value || "";
    // "GMT" alone means GMT+0 — normalize it
    if (offsetPart === "GMT") offsetPart = "GMT+0";
    return {
      time24: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }),
      tzLabel: `${cityName}, ${offsetPart}`,
    };
  } catch {
    return {
      time24: date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
      tzLabel: cityName,
    };
  }
}

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

function notesRow(notes: string | null | undefined): string {
  if (!notes || !notes.trim()) return "";
  return `<tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px; vertical-align: top;">Enquiry</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${notes}</td></tr>`;
}

function pad2(n: number): string { return n.toString().padStart(2, "0"); }

function toIcsDateUtc(date: Date): string {
  return `${date.getUTCFullYear()}${pad2(date.getUTCMonth() + 1)}${pad2(date.getUTCDate())}T${pad2(date.getUTCHours())}${pad2(date.getUTCMinutes())}00Z`;
}

function generateIcs(booking: any, meetLink: string, sessionName: string, forClient = false): string {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const now = new Date();
  const uid = `${booking.id}@humanheart.life`;
  const description = forClient
    ? [
        `Session: ${sessionName}`,
        booking.notes ? `Enquiry: ${booking.notes}` : "",
        `Video: ${meetLink}`,
      ].filter(Boolean).join("\\n")
    : [
        `Client: ${booking.client_name} (${booking.client_email})`,
        booking.notes ? `Enquiry: ${booking.notes}` : "",
        `Video: ${meetLink}`,
      ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HumanHeartBeat//Booking//EN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateUtc(now)}`,
    `DTSTART:${toIcsDateUtc(start)}`,
    `DTEND:${toIcsDateUtc(end)}`,
    `SUMMARY:${sessionName}${forClient ? "" : ` — ${booking.client_name}`}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${meetLink}`,
    `URL:${meetLink}`,
    `ORGANIZER;CN=${THERAPIST_NAME}:mailto:${THERAPIST_EMAIL}`,
    `ATTENDEE;CN=${booking.client_name}:mailto:${booking.client_email}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function generateCancelIcs(booking: any, sessionName: string): string {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const now = new Date();
  const uid = `${booking.id}@humanheart.life`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//HumanHeartBeat//Booking//EN",
    "METHOD:CANCEL",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toIcsDateUtc(now)}`,
    `DTSTART:${toIcsDateUtc(start)}`,
    `DTEND:${toIcsDateUtc(end)}`,
    `SUMMARY:CANCELLED — ${sessionName} — ${booking.client_name}`,
    "STATUS:CANCELLED",
    `ORGANIZER;CN=${THERAPIST_NAME}:mailto:${THERAPIST_EMAIL}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

async function sendEmail(brevoApiKey: string, opts: {
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  attachment?: { content: string; name: string }[];
}): Promise<EmailResult> {
  const senderEmail = Deno.env.get("SENDER_EMAIL") || THERAPIST_EMAIL;
  const senderName = Deno.env.get("SENDER_NAME") || THERAPIST_NAME;

  const payload: any = {
    sender: { name: senderName, email: senderEmail },
    to: opts.to,
    subject: opts.subject,
    htmlContent: opts.htmlContent,
  };
  if (opts.attachment?.length) {
    payload.attachment = opts.attachment;
  }

  // Guard against Brevo hanging (e.g. IP verification delay) timing out the whole edge function.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);
  try {
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

function detailsTable(rows: string): string {
  return `<div style="background: #f0ede8; border-radius: 12px; padding: 20px; margin: 24px 0;">
    <table style="width: 100%; border-collapse: collapse;">${rows}</table>
  </div>`;
}

function row(label: string, value: string): string {
  return `<tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">${label}</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${value}</td></tr>`;
}

function timeValue(time24: string, tzLabel: string): string {
  return `<strong>${time24}</strong> <span style="color: #7a7067; font-size: 12px;">${tzLabel}</span>`;
}

// ── Cancellation ──────────────────────────────────────────────

async function sendCancellationEmails(booking: any, timezone: string) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) { console.warn("BREVO_API_KEY not set"); return false; }

  const startDate = new Date(booking.start_time);
  const dateStr = startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const tz = timezone || "UTC";
  const { time24, tzLabel } = formatTimeWithTz(startDate, tz);
  const sessionName = booking.session_types?.name || "Session";
  const siteUrl = Deno.env.get("SITE_URL") || "https://humanheart.life";

  const tableRows = row("Session", `<strong>${sessionName}</strong>`)
    + row("Date", dateStr)
    + row("Time", timeValue(time24, tzLabel))
    + notesRow(booking.notes);

  const clientHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #8b5e5e 0%, #a07070 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">Booking Cancelled</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Hi <strong>${booking.client_name}</strong>,</p>
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Your session has been cancelled. Here were the details:</p>
      ${detailsTable(tableRows)}
      <div style="text-align: center; margin: 28px 0;">
        <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">Book a New Session →</a>
      </div>
    </div>
  </div>
</body></html>`;

  const therapistHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #8b5e5e 0%, #a07070 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">Booking Cancelled</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;"><strong>${booking.client_name}</strong> (${booking.client_email}) has cancelled their session.</p>
      ${detailsTable(tableRows)}
    </div>
  </div>
</body></html>`;

  const cancelIcs = generateCancelIcs(booking, sessionName);
  const icsBase64 = btoa(unescape(encodeURIComponent(cancelIcs)));

  const subject = `Booking Cancelled: ${sessionName} on ${dateStr}`;

  const [clientResult, therapistResult] = await Promise.all([
    sendEmail(brevoApiKey, {
      to: [{ email: booking.client_email, name: booking.client_name }],
      subject,
      htmlContent: clientHtml,
    }),
    sendEmail(brevoApiKey, {
      to: [{ email: THERAPIST_EMAIL, name: THERAPIST_NAME }],
      subject,
      htmlContent: therapistHtml,
      attachment: [{ content: icsBase64, name: "cancel.ics" }],
    }),
  ]);

  console.log(`Cancel emails: client=${clientResult.ok}, therapist=${therapistResult.ok}`);
  return clientResult.ok;
}

async function handleCancel(bookingId: string, _timezone: string) {
  const supabase = getSupabase();

  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*, session_types(name)")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) return { success: false, error: "Booking not found" };
  if (booking.status === "cancelled") return { success: false, error: "Already cancelled" };

  const { error: cancelError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (cancelError) return { success: false, error: "Failed to cancel" };

  // Use stored timezone from booking, not the cancel request
  const emailSent = await sendCancellationEmails(booking, booking.client_timezone || _timezone);
  return { success: true, emailSent };
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = generateRequestId();
  const startMs = Date.now();

  // GET cancellation (email link)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const id = url.searchParams.get("id");
    const redirect = url.searchParams.get("redirect") || "https://humanheart.life";

    if (action === "cancel" && id) {
      const result = await handleCancel(id, "UTC");
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

    // POST cancellation (website)
    if (body.action === "cancel" && body.bookingId) {
      const result = await handleCancel(body.bookingId, body.timezone || "UTC");
      logInfo(requestId, "cancel", { success: result.success });
      return new Response(JSON.stringify({ ...result, requestId }), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Booking creation ──
    const { sessionTypeId, clientName, clientEmail, clientEmail2, startTime, endTime, notes, timezone } = body;

    if (!sessionTypeId || !clientName || !clientEmail || !startTime || !endTime) {
      logError(requestId, "validation", "VALIDATION_FAILED");
      return errorResponse(400, "VALIDATION_FAILED", "Missing required fields", requestId);
    }

    const supabase = getSupabase();

    // Overlap check
    const { data: existing } = await supabase
      .from("bookings").select("id").neq("status", "cancelled")
      .lt("start_time", endTime).gt("end_time", startTime).limit(1);

    if (existing && existing.length > 0) {
      logError(requestId, "slot_check", "SLOT_TAKEN");
      return errorResponse(409, "SLOT_TAKEN", "This time slot is no longer available. Please go back and choose another.", requestId);
    }

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        session_type_id: sessionTypeId,
        client_name: clientName, client_email: clientEmail,
        client_email_2: clientEmail2 || null,
        start_time: startTime, end_time: endTime,
        notes: notes || null, status: "confirmed",
        client_timezone: timezone || "UTC",
      })
      .select("*, session_types(name, duration_minutes, notification_email_1, notification_email_2, show_second_email)")
      .single();

    if (insertError || !booking) {
      logError(requestId, "db_insert", "INTERNAL", insertError?.message);
      return errorResponse(500, "INTERNAL", "Failed to create booking. Please try again.", requestId);
    }

    // Generate separate JaaS links for client (non-moderator) and therapist (moderator)
    const { clientLink, therapistLink } = await generateJitsiLinks(
      booking.id,
      booking.client_name,
      booking.client_email
    );
    
    // Store client link in DB (what client sees)
    await supabase.from("bookings").update({ google_meet_link: clientLink }).eq("id", booking.id);

    // ── Send emails ──
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    let emailSent = false;

    if (brevoApiKey) {
      const startDate = new Date(booking.start_time);
      const dateStr = startDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
      const sessionName = booking.session_types?.name || "Session";
      const duration = booking.session_types?.duration_minutes || 30;
      const tz = timezone || "UTC";
      const { time24, tzLabel } = formatTimeWithTz(startDate, tz);

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const siteUrl = Deno.env.get("SITE_URL") || "https://humanheart.life";
      const cancelUrl = `${supabaseUrl}/functions/v1/process-booking?action=cancel&id=${booking.id}&redirect=${encodeURIComponent(siteUrl)}`;

      const tableRows = row("Session", `<strong>${sessionName}</strong>`)
        + row("Date", dateStr)
        + row("Time", timeValue(time24, tzLabel))
        + row("Duration", `${duration} min`)
        + notesRow(booking.notes);

      // Client confirmation email (with client link - non-moderator)
      const clientHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #4a7c5f 0%, #5a9470 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">Booking Confirmed ✓</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Hi <strong>${booking.client_name}</strong>,</p>
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Your session has been confirmed. Here are the details:</p>
      ${detailsTable(tableRows)}
      <div style="text-align: center; margin: 28px 0;">
        <a href="${clientLink}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">Join Video Session →</a>
      </div>
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5;">📅 A calendar invite (.ics) is attached — open it to add this session to your calendar.</p>
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5; margin-top: 8px;">Save the video link above — you'll use it to join at the scheduled time.</p>
      <hr style="border: none; border-top: 1px solid #e5e0da; margin: 24px 0;" />
      <p style="color: #a09890; font-size: 12px; text-align: center; line-height: 1.5;">
        Need to cancel? <a href="${cancelUrl}" style="color: #b04040; text-decoration: underline;">Cancel this booking</a>
      </p>
    </div>
  </div>
</body></html>`;

      // Therapist notification email (with therapist link - moderator)
      const therapistHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #4a7c5f 0%, #5a9470 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">New Booking 📅</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;"><strong>${booking.client_name}</strong> (${booking.client_email}) has booked a session.</p>
      ${detailsTable(tableRows)}
      <div style="text-align: center; margin: 28px 0;">
        <a href="${therapistLink}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">Join as Moderator →</a>
      </div>
      <div style="background: #fff8e1; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
        <p style="color: #7a6520; font-size: 13px; margin: 0; line-height: 1.5;">🔒 <strong>Reminder:</strong> After joining, click the Security icon (shield) and enable <strong>"Lobby mode"</strong> to require your approval before the client can enter.</p>
      </div>
    </div>
  </div>
</body></html>`;

      // Generate .ics for therapist and client
      const therapistIcs = generateIcs(booking, therapistLink, sessionName, false);
      const therapistIcsBase64 = btoa(unescape(encodeURIComponent(therapistIcs)));

      const clientIcs = generateIcs(booking, clientLink, sessionName, true);
      const clientIcsBase64 = btoa(unescape(encodeURIComponent(clientIcs)));

      // Determine notification recipients
      const sessionType = booking.session_types;
      const notifEmail1 = sessionType?.notification_email_1 || THERAPIST_EMAIL;
      const notifEmail2 = sessionType?.show_second_email && sessionType?.notification_email_2 ? sessionType.notification_email_2 : null;

      const therapistRecipients = [{ email: notifEmail1, name: THERAPIST_NAME }];
      if (notifEmail2) {
        therapistRecipients.push({ email: notifEmail2, name: THERAPIST_NAME });
      }

      // Build client recipients list (primary + optional second email)
      const clientRecipients = [{ email: booking.client_email, name: booking.client_name }];
      if (booking.client_email_2) {
        clientRecipients.push({ email: booking.client_email_2, name: booking.client_name });
      }

      try {
        const [clientResult, therapistResult] = await Promise.all([
          sendEmail(brevoApiKey, {
            to: clientRecipients,
            subject: `Booking Confirmed: ${sessionName} on ${dateStr}`,
            htmlContent: clientHtml,
            attachment: [{ content: clientIcsBase64, name: "session.ics" }],
          }),
          sendEmail(brevoApiKey, {
            to: therapistRecipients,
            subject: `New Booking: ${sessionName} — ${booking.client_name} on ${dateStr}`,
            htmlContent: therapistHtml,
            attachment: [{ content: therapistIcsBase64, name: "booking.ics" }],
          }),
        ]);
        emailSent = clientResult.ok;
        logInfo(requestId, "email", { clientOk: clientResult.ok, therapistOk: therapistResult.ok });
        if (!clientResult.ok) logError(requestId, "email_client", clientResult.code);
        if (!therapistResult.ok) logError(requestId, "email_therapist", therapistResult.code);
      } catch (emailErr) {
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
      google_meet_link: clientLink,
    };
    return new Response(
      JSON.stringify({ success: true, booking: bookingResponse, meetLink: clientLink, emailSent, requestId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    logError(requestId, "handler", "INTERNAL");
    return errorResponse(500, "INTERNAL", "An unexpected error occurred. Please try again.", requestId);
  }
});
