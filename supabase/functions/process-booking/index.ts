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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return new Response(JSON.stringify({ error: "bookingId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch booking with session type
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*, session_types(name, duration_minutes)")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate Jitsi Meet link
    const meetLink = generateJitsiLink(bookingId);

    // Update booking with meet link
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ google_meet_link: meetLink })
      .eq("id", bookingId);

    if (updateError) {
      console.error("Failed to update booking:", updateError);
    }

    // Send confirmation email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;

    if (resendApiKey) {
      const startDate = new Date(booking.start_time);
      const dateStr = startDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const timeStr = startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      const sessionName = booking.session_types?.name || "Session";
      const duration = booking.session_types?.duration_minutes || 30;

      const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, 'Times New Roman', serif; background: #faf8f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <div style="background: linear-gradient(135deg, #4a7c5f 0%, #5a9470 100%); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 400;">Booking Confirmed ✓</h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">
        Hi <strong>${booking.client_name}</strong>,
      </p>
      <p style="color: #4a4035; font-size: 16px; line-height: 1.6;">
        Your session has been confirmed. Here are the details:
      </p>
      <div style="background: #f5f2ee; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Session</td>
            <td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right; font-weight: 600;">${sessionName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Date</td>
            <td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${dateStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Time</td>
            <td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${timeStr}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Duration</td>
            <td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${duration} min</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${meetLink}" style="display: inline-block; background: linear-gradient(135deg, #4a7c5f, #5a9470); color: white; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-size: 15px; font-weight: 500;">
          Join Video Session →
        </a>
      </div>
      <p style="color: #7a7067; font-size: 13px; text-align: center; line-height: 1.5;">
        Save this link — you'll use it to join the session at the scheduled time.
      </p>
    </div>
  </div>
</body>
</html>`;

      try {
        const fromEmail = Deno.env.get("SENDER_EMAIL") || "noreply@resend.dev";
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `Gestalt Space <${fromEmail}>`,
            to: [booking.client_email],
            subject: `Booking Confirmed: ${sessionName} on ${dateStr}`,
            html: emailHtml,
          }),
        });

        if (res.ok) {
          emailSent = true;
          console.log("Confirmation email sent to", booking.client_email);
        } else {
          const errBody = await res.text();
          console.error("Resend error:", errBody);
        }
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    } else {
      console.warn("RESEND_API_KEY not set — skipping email");
    }

    return new Response(
      JSON.stringify({
        success: true,
        meetLink,
        emailSent,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("process-booking error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
