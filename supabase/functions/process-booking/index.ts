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
    const body = await req.json();
    const { sessionTypeId, clientName, clientEmail, startTime, endTime, notes, timezone } = body;

    if (!sessionTypeId || !clientName || !clientEmail || !startTime || !endTime) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Create the booking using service role (bypasses RLS)
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

    // Generate Jitsi Meet link
    const meetLink = generateJitsiLink(booking.id);

    // Update booking with meet link
    await supabase
      .from("bookings")
      .update({ google_meet_link: meetLink })
      .eq("id", booking.id);

    // Send confirmation email via Brevo
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    let emailSent = false;

    if (brevoApiKey) {
      const startDate = new Date(booking.start_time);
      const dateStr = startDate.toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      });
      const timeStr = startDate.toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hour12: true,
      });
      const sessionName = booking.session_types?.name || "Session";
      const duration = booking.session_types?.duration_minutes || 30;
      const tz = timezone || "UTC";

      // Cancel link — points to edge function
      const cancelUrl = `${supabaseUrl}/functions/v1/process-booking?action=cancel&id=${booking.id}`;

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
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Time</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${timeStr}</td></tr>
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Duration</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${duration} min</td></tr>
          <tr><td style="padding: 8px 0; color: #7a7067; font-size: 14px;">Timezone</td><td style="padding: 8px 0; color: #4a4035; font-size: 14px; text-align: right;">${tz.replace(/_/g, " ")}</td></tr>
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
          headers: {
            "Content-Type": "application/json",
            "api-key": brevoApiKey,
          },
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
    } else {
      console.warn("BREVO_API_KEY not set — skipping email");
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
    // Handle GET cancellation requests
    if (req.method === "GET") {
      const url = new URL(req.url);
      const action = url.searchParams.get("action");
      const id = url.searchParams.get("id");
      
      if (action === "cancel" && id) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const supabase = createClient(supabaseUrl, serviceRoleKey);
          
          await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
          
          return new Response(`
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Booking Cancelled</title></head>
<body style="font-family: Georgia, serif; background: #faf8f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0;">
  <div style="background: white; border-radius: 16px; padding: 48px; text-align: center; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
    <h1 style="color: #4a4035; font-size: 24px; font-weight: 400;">Booking Cancelled</h1>
    <p style="color: #7a7067; font-size: 16px;">Your booking has been successfully cancelled.</p>
  </div>
</body></html>`, {
            headers: { ...corsHeaders, "Content-Type": "text/html" },
          });
        } catch (cancelErr) {
          console.error("Cancel error:", cancelErr);
        }
      }
    }
    
    console.error("process-booking error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
