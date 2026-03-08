import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const THERAPIST_EMAIL = "be@humanheart.life";
const THERAPIST_NAME = "Human Heart Beat";

function generateJitsiLink(bookingId: string): string {
  const roomName = `session-${bookingId.slice(0, 8)}-${Date.now().toString(36)}`;
  return `https://meet.jit.si/${roomName}`;
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

function generateIcs(booking: any, meetLink: string, sessionName: string): string {
  const start = new Date(booking.start_time);
  const end = new Date(booking.end_time);
  const now = new Date();
  const uid = `${booking.id}@humanheart.life`;
  const description = [
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
    `SUMMARY:${sessionName} — ${booking.client_name}`,
    `DESCRIPTION:${description}`,
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
}) {
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

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-key": brevoApiKey },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error("Brevo error:", await res.text());
    return false;
  }
  return true;
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

  const [clientOk, therapistOk] = await Promise.all([
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

  console.log(`Cancel emails: client=${clientOk}, therapist=${therapistOk}`);
  return clientOk;
}

async function handleCancel(bookingId: string, timezone: string) {
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

  const emailSent = await sendCancellationEmails(booking, timezone);
  return { success: true, emailSent };
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Booking creation ──
    const { sessionTypeId, clientName, clientEmail, startTime, endTime, notes, timezone } = body;

    if (!sessionTypeId || !clientName || !clientEmail || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabase();

    // Overlap check
    const { data: existing } = await supabase
      .from("bookings").select("id").neq("status", "cancelled")
      .lt("start_time", endTime).gt("end_time", startTime).limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "This time slot is no longer available" }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        session_type_id: sessionTypeId,
        client_name: clientName, client_email: clientEmail,
        start_time: startTime, end_time: endTime,
        notes: notes || null, status: "confirmed",
      })
      .select("*, session_types(name, duration_minutes)")
      .single();

    if (insertError || !booking) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create booking" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meetLink = generateJitsiLink(booking.id);
    await supabase.from("bookings").update({ google_meet_link: meetLink }).eq("id", booking.id);

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

      // Client confirmation email
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
        <a href="${meetLink}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">Join Video Session →</a>
      </div>
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5;">Save this link — you'll use it to join the session at the scheduled time.</p>
      <hr style="border: none; border-top: 1px solid #e5e0da; margin: 24px 0;" />
      <p style="color: #a09890; font-size: 12px; text-align: center; line-height: 1.5;">
        Need to cancel? <a href="${cancelUrl}" style="color: #b04040; text-decoration: underline;">Cancel this booking</a>
      </p>
    </div>
  </div>
</body></html>`;

      // Therapist notification email
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
        <a href="${meetLink}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">Join Video Session →</a>
      </div>
    </div>
  </div>
</body></html>`;

      const icsContent = generateIcs(booking, meetLink, sessionName);
      const icsBase64 = btoa(unescape(encodeURIComponent(icsContent)));

      try {
        const [clientOk, therapistOk] = await Promise.all([
          sendEmail(brevoApiKey, {
            to: [{ email: booking.client_email, name: booking.client_name }],
            subject: `Booking Confirmed: ${sessionName} on ${dateStr}`,
            htmlContent: clientHtml,
          }),
          sendEmail(brevoApiKey, {
            to: [{ email: THERAPIST_EMAIL, name: THERAPIST_NAME }],
            subject: `New Booking: ${sessionName} — ${booking.client_name} on ${dateStr}`,
            htmlContent: therapistHtml,
            attachment: [{ content: icsBase64, name: "booking.ics" }],
          }),
        ]);
        emailSent = clientOk;
        console.log(`Emails: client=${clientOk}, therapist=${therapistOk}`);
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, booking: { ...booking, google_meet_link: meetLink }, meetLink, emailSent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-booking error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
