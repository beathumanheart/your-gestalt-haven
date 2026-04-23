/**
 * regenerate-booking-tokens
 *
 * One-time cleanup function: re-generates JaaS JWT meeting links for all
 * future confirmed bookings that were created before the JWT expiration bug
 * was fixed (tokens were scoped to booking-creation time + 3h instead of the
 * actual session window).
 *
 * Security: requires a secret header — never callable without it.
 * Invoke: POST /functions/v1/regenerate-booking-tokens
 *         Authorization: Bearer <REGEN_SECRET>
 *
 * Returns: { regenerated: N, skipped: M, errors: string[] }
 * Does NOT send any emails.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

const THERAPIST_EMAIL = "be@humanheart.life";
const THERAPIST_NAME = "Human Heart Beat";
const BUFFER_SECS = 30 * 60; // 30 minutes

// ── JWT helpers (duplicated from process-booking — edge functions are isolated) ──

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
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function generateJaasJwtToken(
  roomName: string,
  userName: string,
  userEmail: string,
  isModerator: boolean,
  sessionStart: Date,
  sessionEnd: Date,
): Promise<string | null> {
  const nbf = Math.floor(sessionStart.getTime() / 1000) - BUFFER_SECS;
  const exp = Math.floor(sessionEnd.getTime() / 1000) + BUFFER_SECS;

  if (exp <= nbf) {
    throw new Error(
      `Invalid session window: exp ${new Date(exp * 1000).toISOString()} ` +
      `is not after nbf ${new Date(nbf * 1000).toISOString()}`
    );
  }

  const appId = Deno.env.get("JAAS_APP_ID");
  const privateKey = Deno.env.get("JAAS_PRIVATE_KEY");
  const apiKeyId = Deno.env.get("JAAS_API_KEY_ID");

  if (!appId || !privateKey || !apiKeyId) return null;

  const payload = {
    iss: "chat",
    aud: "jitsi",
    sub: appId,
    room: roomName,
    exp,
    nbf,
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

  const normalizedKid = apiKeyId.includes("/") ? apiKeyId : `${appId}/${apiKeyId}`;
  return await signJwt(payload, privateKey, normalizedKid);
}

// ── Auth helpers ───────────────────────────────────────────────

/**
 * Constant-time string comparison.
 *
 * Standard string equality (===) can short-circuit on the first mismatched
 * byte, leaking information about how many leading bytes matched. An attacker
 * who can observe response-time variations could progressively narrow down the
 * secret one character at a time. This function always inspects every byte
 * regardless of where the first mismatch occurs, eliminating that signal.
 *
 * Approach: XOR each byte pair and OR the results. Any differing byte
 * produces a non-zero bit; length mismatches are flagged via the initial
 * length XOR. Both arrays are padded to the same length so the loop never
 * exits early.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);

  const len = Math.max(aBytes.length, bBytes.length);
  const aPadded = new Uint8Array(len);
  const bPadded = new Uint8Array(len);
  aPadded.set(aBytes);
  bPadded.set(bBytes);

  // Seed diff with length XOR so different-length strings are always unequal
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    diff |= aPadded[i] ^ bPadded[i];
  }
  return diff === 0;
}

// ── Main handler ──────────────────────────────────────────────

Deno.serve(async (req) => {
  const corsHeaders = { "Content-Type": "application/json" };

  // Security: reject anything without the correct secret header.
  // Constant-time comparison guards against timing-based secret enumeration.
  const regenSecret = Deno.env.get("REGEN_SECRET");
  const authHeader = req.headers.get("Authorization") ?? "";
  const expected = regenSecret ? `Bearer ${regenSecret}` : "";
  if (!regenSecret || !timingSafeEqual(authHeader, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const appId = Deno.env.get("JAAS_APP_ID");

  // Fetch all future confirmed bookings
  const { data: bookings, error: fetchError } = await supabase
    .from("bookings")
    .select("id, start_time, end_time, client_name, client_email, google_meet_link")
    .eq("status", "confirmed")
    .gt("start_time", new Date().toISOString())
    .order("start_time");

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const results: { regenerated: number; skipped: number; errors: string[] } = {
    regenerated: 0,
    skipped: 0,
    errors: [],
  };

  for (const booking of bookings ?? []) {
    const sessionStart = new Date(booking.start_time);
    const sessionEnd = new Date(booking.end_time);

    // Extract room name from existing link so the URL stays the same.
    // Existing link format: https://8x8.vc/<appId>/<roomName>?jwt=...#config...
    const existingLink: string = booking.google_meet_link ?? "";
    const isJaasLink = appId && existingLink.includes(`8x8.vc/${appId}/`);

    if (!isJaasLink) {
      // Public Jitsi fallback or no link — nothing to regenerate
      console.log(JSON.stringify({ event: "skip_not_jaas", bookingId: booking.id }));
      results.skipped++;
      continue;
    }

    // Extract roomName from the existing URL path
    const urlPath = existingLink.split("?")[0]; // strip jwt + config fragment
    const roomName = urlPath.split(`/${appId}/`)[1];

    if (!roomName) {
      results.errors.push(`${booking.id}: could not extract roomName from link`);
      continue;
    }

    try {
      const [clientToken, therapistToken] = await Promise.all([
        generateJaasJwtToken(roomName, booking.client_name, booking.client_email, false, sessionStart, sessionEnd),
        generateJaasJwtToken(roomName, THERAPIST_NAME, THERAPIST_EMAIL, true, sessionStart, sessionEnd),
      ]);

      if (!clientToken) {
        results.errors.push(`${booking.id}: JaaS credentials missing or token generation returned null`);
        continue;
      }

      const baseUrl = `https://8x8.vc/${appId}/${roomName}`;
      const clientConfig = "#config.prejoinConfig.enabled=true&config.lobby.autoKnock=true&config.disableModeratorIndicator=false";
      const newClientLink = `${baseUrl}?jwt=${clientToken}${clientConfig}`;

      const { error: updateError } = await supabase
        .from("bookings")
        .update({ google_meet_link: newClientLink })
        .eq("id", booking.id);

      if (updateError) {
        results.errors.push(`${booking.id}: ${updateError.message}`);
      } else {
        const nbfSec = Math.floor(sessionStart.getTime() / 1000) - BUFFER_SECS;
        const expSec = Math.floor(sessionEnd.getTime() / 1000) + BUFFER_SECS;
        console.log(JSON.stringify({
          event: "token_regenerated",
          bookingId: booking.id,
          sessionStartIso: sessionStart.toISOString(),
          sessionEndIso: sessionEnd.toISOString(),
          nbfIso: new Date(nbfSec * 1000).toISOString(),
          expIso: new Date(expSec * 1000).toISOString(),
        }));
        results.regenerated++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.errors.push(`${booking.id}: ${message}`);
      console.error(JSON.stringify({ event: "regen_error", bookingId: booking.id, error: message }));
    }
  }

  return new Response(JSON.stringify(results), { headers: corsHeaders });
});
