/**
 * JaaS (8x8) room tokens.
 *
 * Tokens are signed at *click* time, not at booking time: the booking may be
 * weeks ahead, and a token minted that early has to guess its own validity
 * window. Here the window is `now - 60s` → `session_end + 30 min`, which is
 * narrow and never needs guessing.
 *
 * The payload carries no email address. It ends up in a redirect URL and
 * therefore in browser history and any intermediate log; JaaS does not need it.
 */

/** Clock-skew leeway on the near side of the window. */
export const JWT_LEEWAY_SECS = 60;
/**
 * How long past the scheduled end the token stays usable.
 *
 * Deliberately longer than JOIN_CLOSES_AFTER_MS (30 min): a client clicking at
 * the very last moment the join window allows must still get a token with time
 * left on it, not one that expires the same second it is issued.
 */
export const JWT_TAIL_SECS = 35 * 60;

export interface JwtWindow {
  nbf: number;
  exp: number;
}

export function computeJwtWindow(now: Date, sessionEnd: Date): JwtWindow {
  const nbf = Math.floor(now.getTime() / 1000) - JWT_LEEWAY_SECS;
  const exp = Math.floor(sessionEnd.getTime() / 1000) + JWT_TAIL_SECS;

  // Throw before signing — never produce a token with a broken window.
  if (exp <= nbf) {
    throw new Error(
      `Invalid session window: exp ${new Date(exp * 1000).toISOString()} ` +
        `is not after nbf ${new Date(nbf * 1000).toISOString()}`
    );
  }

  return { nbf, exp };
}

export interface JaasPayloadInput {
  appId: string;
  roomName: string;
  /** Display name only — shown in the room's participant list. */
  displayName: string;
  /** Opaque identifier. The booking UUID, never an email address. */
  userId: string;
  isModerator: boolean;
  window: JwtWindow;
}

export interface JaasPayload {
  iss: string;
  aud: string;
  sub: string;
  room: string;
  exp: number;
  nbf: number;
  context: {
    /** Display name and an opaque id — no email, no avatar. */
    user: { moderator: string; name: string; id: string };
    features: Record<string, string>;
  };
}

export function buildJaasPayload({
  appId,
  roomName,
  displayName,
  userId,
  isModerator,
  window,
}: JaasPayloadInput): JaasPayload {
  const moderator = isModerator ? "true" : "false";
  return {
    iss: "chat",
    aud: "jitsi",
    sub: appId,
    room: roomName,
    exp: window.exp,
    nbf: window.nbf,
    context: {
      user: {
        moderator,
        name: displayName,
        id: userId,
      },
      features: {
        // Clinical setting: nothing that records or re-broadcasts the session.
        recording: "false",
        livestreaming: "false",
        transcription: "false",
        "outbound-call": "false",
        lobby: "true",
      },
    },
  };
}

// ── RS256 signing ──────────────────────────────────────────────

function base64UrlEncode(data: Uint8Array): string {
  let binary = "";
  for (const byte of data) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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
    binaryDer as unknown as ArrayBuffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

export async function signJwt(
  payload: object,
  privateKeyPem: string,
  kid: string
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT", kid };
  const signingInput = `${textToBase64Url(JSON.stringify(header))}.${textToBase64Url(
    JSON.stringify(payload)
  )}`;

  const privateKey = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signingInput)
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

/** Room name is stable per booking so both parties land in the same room. */
export function roomNameForBooking(bookingId: string): string {
  return `session-${bookingId.replace(/-/g, "").slice(0, 16)}`;
}

/** Client joins into the lobby and knocks; the practitioner admits them. */
export const CLIENT_ROOM_CONFIG =
  "#config.prejoinConfig.enabled=true&config.lobby.autoKnock=true&config.disableModeratorIndicator=false";

export function jaasRoomUrl(
  appId: string,
  roomName: string,
  jwt: string,
  isModerator: boolean
): string {
  const base = `https://8x8.vc/${appId}/${roomName}?jwt=${jwt}`;
  return isModerator ? base : `${base}${CLIENT_ROOM_CONFIG}`;
}
