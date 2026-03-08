import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function generateJitsiLink(bookingId: string): string {
  const roomName = `session-${bookingId.slice(0, 8)}-${Date.now().toString(36)}`;
  return `https://meet.jit.si/${roomName}`;
}

function formatTimeWithTz(date: Date, tz: string): { time24: string; tzLabel: string } {
  const cityName = tz.split("/").pop()?.replace(/_/g, " ") || tz;
  // Compute GMT offset
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date);
    const offsetPart = parts.find(p => p.type === "timeZoneName")?.value || "";
    // offsetPart is like "GMT+1" or "GMT-5"
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


  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function sendCancellationEmail(booking: any, timezone: string) {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    console.warn("BREVO_API_KEY not set — skipping cancellation email");
    return false;
  }

  const startDate = new Date(booking.start_time);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const tz = timezone || "UTC";
  const { time24, tzLabel } = formatTimeWithTz(startDate, tz);
  const sessionName = booking.session_types?.name || "Session";

  const siteUrl = Deno.env.get("SITE_URL") || "https://humanheart.life";

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #8b5e5e 0%, #a07070 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">Booking Cancelled</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Hi <strong>${booking.client_name}</strong>,</p>
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Your session has been cancelled. Here were the details:</p>
      <div style="background: #f0ede8; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Session</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right; font-weight: 600;">${sessionName}</td></tr>
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${dateStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;"><strong>${time24}</strong> <span style="color: #7a7067; font-size: 12px;">${tzLabel}</span></td></tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">Book a New Session →</a>
      </div>
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5;">If this was a mistake, please book a new session at your convenience.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const senderEmail = Deno.env.get("SENDER_EMAIL") || "be@humanheart.life";
    const senderName = Deno.env.get("SENDER_NAME") || "Human Heart Beat";

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": brevoApiKey },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: booking.client_email, name: booking.client_name }],
        subject: `Booking Cancelled: ${sessionName} on ${dateStr}`,
        htmlContent: emailHtml,
      }),
    });
    if (res.ok) {
      console.log("Cancellation email sent to", booking.client_email);
      return true;
    } else {
      console.error("Brevo error:", await res.text());
      return false;
    }
  } catch (err) {
    console.error("Cancellation email failed:", err);
    return false;
  }
}

async function handleCancel(bookingId: string, timezone: string) {
  const supabase = getSupabase();

  // Fetch booking details before cancelling
  const { data: booking, error: fetchErr } = await supabase
    .from("bookings")
    .select("*, session_types(name)")
    .eq("id", bookingId)
    .single();

  if (fetchErr || !booking) {
    return { success: false, error: "Booking not found" };
  }

  if (booking.status === "cancelled") {
    return { success: false, error: "Already cancelled" };
  }

  const { error: cancelError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (cancelError) {
    return { success: false, error: "Failed to cancel" };
  }

  const emailSent = await sendCancellationEmail(booking, timezone);
  return { success: true, emailSent };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET cancellation (from email link)
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
      return new Response(null, {
        status: 302,
        headers: { ...corsHeaders, Location: redirectUrl },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();

    // Handle POST cancellation (from website)
    if (body.action === "cancel" && body.bookingId) {
      const result = await handleCancel(body.bookingId, body.timezone || "UTC");
      const status = result.success ? 200 : 400;
      return new Response(JSON.stringify(result), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle booking creation
    const { sessionTypeId, clientName, clientEmail, startTime, endTime, notes, timezone } = body;

    if (!sessionTypeId || !clientName || !clientEmail || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = getSupabase();

    // Check for overlapping bookings
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .neq("status", "cancelled")
      .lt("start_time", endTime)
      .gt("end_time", startTime)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "This time slot is no longer available" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: booking, error: insertError } = await supabase
      .from("bookings")
      .insert({
        session_type_id: sessionTypeId,
        client_name: clientName,
        client_email: clientEmail,
        start_time: startTime,
        end_time: endTime,
        notes: notes || null,
        status: "confirmed",
      })
      .select("*, session_types(name, duration_minutes)")
      .single();

    if (insertError || !booking) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create booking" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const meetLink = generateJitsiLink(booking.id);
    await supabase.from("bookings").update({ google_meet_link: meetLink }).eq("id", booking.id);

    // Send confirmation email
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    let emailSent = false;

    if (brevoApiKey) {
      const startDate = new Date(booking.start_time);
      const dateStr = startDate.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      const sessionName = booking.session_types?.name || "Session";
      const duration = booking.session_types?.duration_minutes || 30;
      const tz = timezone || "UTC";
      const { time24, tzLabel } = formatTimeWithTz(startDate, tz);

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const siteUrl = Deno.env.get("SITE_URL") || "https://humanheart.life";
      const cancelUrl = `${supabaseUrl}/functions/v1/process-booking?action=cancel&id=${booking.id}&redirect=${encodeURIComponent(siteUrl)}`;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #ffffff; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #faf8f5; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #4a7c5f 0%, #5a9470 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">Booking Confirmed ✓</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Hi <strong>${booking.client_name}</strong>,</p>
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">Your session has been confirmed. Here are the details:</p>
      <div style="background: #f0ede8; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Session</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right; font-weight: 600;">${sessionName}</td></tr>
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Date</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${dateStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;"><strong>${time24}</strong> <span style="color: #7a7067; font-size: 12px;">${tzLabel}</span></td></tr>
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Duration</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${duration} min</td></tr>
        </table>
      </div>
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
</body>
</html>`;

      try {
        const senderEmail = Deno.env.get("SENDER_EMAIL") || "be@humanheart.life";
        const senderName = Deno.env.get("SENDER_NAME") || "Human Heart Beat";

        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "Content-Type": "application/json", "api-key": brevoApiKey },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: booking.client_email, name: booking.client_name }],
            subject: `Booking Confirmed: ${sessionName} on ${dateStr}`,
            htmlContent: emailHtml,
          }),
        });
        if (res.ok) {
          emailSent = true;
          console.log("Confirmation email sent to", booking.client_email);
        } else {
          console.error("Brevo error:", await res.text());
        }
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        booking: { ...booking, google_meet_link: meetLink },
        meetLink,
        emailSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("process-booking error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
