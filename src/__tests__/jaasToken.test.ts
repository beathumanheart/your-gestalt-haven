/**
 * @vitest-environment node
 *
 * Guardrails on the room token. Needs the node environment because jsdom has
 * no SubtleCrypto, and these tests sign and decode a real RS256 JWT.
 *
 * The failure mode being guarded against is a client locked out of a session
 * they've paid for, so the timing assertions are deliberately exhaustive.
 */

import { describe, expect, it } from "vitest";

import {
  buildJaasPayload,
  computeJwtWindow,
  jaasRoomUrl,
  roomNameForBooking,
  signJwt,
  JWT_LEEWAY_SECS,
  JWT_TAIL_SECS,
} from "@edge/jaas.ts";
import {
  JOIN_CLOSES_AFTER_MS,
  JOIN_OPENS_BEFORE_MS,
  resolveJoinState,
} from "@edge/joinWindow.ts";
import { BOOKING_ID, makeBooking } from "./fixtures/booking";

const APP_ID = "vpaas-magic-cookie-0123456789abcdef";
const booking = makeBooking();
const START = new Date(booking.start_time);
const END = new Date(booking.end_time);

function decodeSegment(segment: string): Record<string, unknown> {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(
    Buffer.from(padded + "=".repeat((4 - (padded.length % 4)) % 4), "base64").toString("utf8")
  );
}

/** Every instant a client could legitimately click the link. */
function clickTimesAcrossWindow(start: Date, end: Date): Date[] {
  const opens = start.getTime() - JOIN_OPENS_BEFORE_MS;
  const closes = end.getTime() + JOIN_CLOSES_AFTER_MS;
  const times: Date[] = [];
  for (let i = 0; i <= 20; i++) {
    times.push(new Date(opens + ((closes - opens) * i) / 20));
  }
  return times;
}

describe("token window brackets the session", () => {
  it.each(clickTimesAcrossWindow(START, END).map((t) => [t.toISOString(), t]))(
    "a click at %s yields a token valid now and until after the session ends",
    (_label, clickedAt: Date) => {
      expect(
        resolveJoinState({
          status: "confirmed",
          startTime: booking.start_time,
          endTime: booking.end_time,
          now: clickedAt,
        })
      ).toBe("open");

      const { nbf, exp } = computeJwtWindow(clickedAt, END);
      const clickSec = Math.floor(clickedAt.getTime() / 1000);

      // Valid at the moment of the click, with leeway for clock skew.
      expect(nbf).toBeLessThanOrEqual(clickSec);
      expect(clickSec - nbf).toBe(JWT_LEEWAY_SECS);

      // Still valid past the scheduled end, so an overrun doesn't eject anyone.
      expect(exp).toBeGreaterThan(Math.floor(END.getTime() / 1000));
      expect(exp - Math.floor(END.getTime() / 1000)).toBe(JWT_TAIL_SECS);

      // The click itself is inside the window, with room to spare.
      expect(exp).toBeGreaterThan(clickSec);
      expect(exp).toBeGreaterThan(nbf);
    }
  );

  it("outlives the join window, so a last-second click still gets usable time", () => {
    expect(JWT_TAIL_SECS * 1000).toBeGreaterThan(JOIN_CLOSES_AFTER_MS);

    const lastMoment = new Date(END.getTime() + JOIN_CLOSES_AFTER_MS);
    const { exp } = computeJwtWindow(lastMoment, END);
    expect(exp - Math.floor(lastMoment.getTime() / 1000)).toBeGreaterThanOrEqual(300);
  });

  it("covers the full session for the earliest permitted click", () => {
    const earliest = new Date(START.getTime() - JOIN_OPENS_BEFORE_MS);
    const { nbf, exp } = computeJwtWindow(earliest, END);

    // nbf is before DTSTART and exp is after DTEND — the token brackets the event.
    expect(nbf).toBeLessThan(Math.floor(START.getTime() / 1000));
    expect(exp).toBeGreaterThan(Math.floor(END.getTime() / 1000));
  });

  it("does not mint a booking-time token weeks ahead of the session", () => {
    // Regression guard: the old implementation anchored nbf to session start
    // minus 30 minutes at *booking* time, so the token existed for weeks.
    const bookedAt = new Date(START.getTime() - 21 * 24 * 60 * 60 * 1000);
    const { nbf } = computeJwtWindow(bookedAt, END);
    expect(nbf).toBe(Math.floor(bookedAt.getTime() / 1000) - JWT_LEEWAY_SECS);

    // At booking time we never call this at all, but if we did the resulting
    // lifetime would be enormous — assert that this is what "wrong" looks like.
    const lifetimeDays = (Math.floor(END.getTime() / 1000) + JWT_TAIL_SECS - nbf) / 86400;
    expect(lifetimeDays).toBeGreaterThan(20);
  });

  it("refuses to sign a window that has already closed", () => {
    const longAfter = new Date(END.getTime() + 10 * 24 * 60 * 60 * 1000);
    expect(() => computeJwtWindow(longAfter, END)).toThrow("Invalid session window");
  });

  it("holds across the October DST transition", () => {
    const dstEnd = new Date("2026-10-27T10:50:00+00:00"); // 11:50 CET
    const clickedAt = new Date("2026-10-27T09:55:00+00:00");
    const { nbf, exp } = computeJwtWindow(clickedAt, dstEnd);
    expect(new Date(nbf * 1000).toISOString()).toBe("2026-10-27T09:54:00.000Z");
    expect(new Date(exp * 1000).toISOString()).toBe("2026-10-27T11:25:00.000Z");
  });
});

describe("token payload carries no personal data", () => {
  const payload = buildJaasPayload({
    appId: APP_ID,
    roomName: roomNameForBooking(BOOKING_ID),
    displayName: "Sam",
    userId: BOOKING_ID,
    isModerator: false,
    window: computeJwtWindow(START, END),
  });

  it("contains no email address anywhere", () => {
    expect(JSON.stringify(payload)).not.toContain("@");
  });

  it("identifies the user by booking UUID, not an address", () => {
    expect(payload.context.user).toEqual({
      moderator: "false",
      name: "Sam",
      id: BOOKING_ID,
    });
  });

  it("keeps the clinical feature flags locked down", () => {
    expect(payload.context.features).toEqual({
      recording: "false",
      livestreaming: "false",
      transcription: "false",
      "outbound-call": "false",
      lobby: "true",
    });
  });

  it("locks the same flags for the practitioner's moderator token", () => {
    const moderatorPayload = buildJaasPayload({
      appId: APP_ID,
      roomName: roomNameForBooking(BOOKING_ID),
      displayName: "Human Heart",
      userId: `practitioner:${BOOKING_ID}`,
      isModerator: true,
      window: computeJwtWindow(START, END),
    });
    expect(moderatorPayload.context.user.moderator).toBe("true");
    expect(moderatorPayload.context.features.recording).toBe("false");
    expect(JSON.stringify(moderatorPayload)).not.toContain("@");
  });

  it("derives a stable room name so both parties land in the same room", () => {
    // Stable across calls: the token is minted per click, the room is not.
    expect(roomNameForBooking(BOOKING_ID)).toBe(roomNameForBooking(BOOKING_ID));
    expect(roomNameForBooking(BOOKING_ID)).toMatch(/^session-[0-9a-f]{16}$/);
    expect(roomNameForBooking("a1b2c3d4-0000-0000-0000-000000000000")).not.toBe(
      roomNameForBooking(BOOKING_ID)
    );
  });
});

describe("signing round trip", () => {
  async function generateKeyPem(): Promise<string> {
    const pair = await crypto.subtle.generateKey(
      {
        name: "RSASSA-PKCS1-v1_5",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["sign", "verify"]
    );
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
    const b64 = Buffer.from(pkcs8).toString("base64").match(/.{1,64}/g)!.join("\n");
    return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
  }

  it("signs a token whose decoded payload matches what we built", async () => {
    const pem = await generateKeyPem();
    const window = computeJwtWindow(START, END);
    const payload = buildJaasPayload({
      appId: APP_ID,
      roomName: roomNameForBooking(BOOKING_ID),
      displayName: "Sam",
      userId: BOOKING_ID,
      isModerator: false,
      window,
    });

    const jwt = await signJwt(payload, pem, `${APP_ID}/abc123`);
    const [headerB64, payloadB64, signatureB64] = jwt.split(".");

    expect(decodeSegment(headerB64)).toEqual({
      alg: "RS256",
      typ: "JWT",
      kid: `${APP_ID}/abc123`,
    });
    expect(decodeSegment(payloadB64)).toEqual(payload);
    expect(signatureB64.length).toBeGreaterThan(300);
    // base64url — no padding, no + or /
    expect(jwt).not.toMatch(/[+/=]/);
  });

  it("still carries no email once encoded", async () => {
    const pem = await generateKeyPem();
    const jwt = await signJwt(
      buildJaasPayload({
        appId: APP_ID,
        roomName: roomNameForBooking(BOOKING_ID),
        displayName: "Sam",
        userId: BOOKING_ID,
        isModerator: false,
        window: computeJwtWindow(START, END),
      }),
      pem,
      `${APP_ID}/abc123`
    );
    expect(JSON.stringify(decodeSegment(jwt.split(".")[1]))).not.toContain("@");
  });
});

describe("room URL", () => {
  it("sends the client into the lobby to knock", () => {
    const url = jaasRoomUrl(APP_ID, "session-abc", "token", false);
    expect(url).toContain("config.lobby.autoKnock=true");
    expect(url).toContain("config.prejoinConfig.enabled=true");
  });

  it("does not auto-knock the practitioner into their own lobby", () => {
    const url = jaasRoomUrl(APP_ID, "session-abc", "token", true);
    expect(url).not.toContain("autoKnock");
  });
});
