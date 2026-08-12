/**
 * Short-link slugs.
 *
 * A slug is the only secret guarding a session room, so it is generated from a
 * CSPRNG and never derived from the booking UUID or any sequence.
 * 12 base62 chars ≈ 71 bits.
 *
 * Mirrors public.generate_booking_slug() in the SQL migration — same alphabet,
 * same rejection cutoff — so backfilled and runtime slugs are indistinguishable.
 */

export const SLUG_ALPHABET =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const SLUG_LENGTH = 12;

/** 248 = 4 * 62. Bytes at or above it are discarded rather than folded, which
 *  would over-weight the first 8 characters of the alphabet. */
const REJECTION_CUTOFF = 248;

export function generateSlug(length: number = SLUG_LENGTH): string {
  let out = "";
  while (out.length < length) {
    const batch = new Uint8Array(length * 2);
    crypto.getRandomValues(batch);
    for (const byte of batch) {
      if (byte >= REJECTION_CUTOFF) continue;
      out += SLUG_ALPHABET[byte % SLUG_ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

/** Cheap shape check before hitting the database. */
export function isValidSlug(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === SLUG_LENGTH &&
    /^[0-9A-Za-z]+$/.test(value)
  );
}

export function shortLink(baseUrl: string, kind: "s" | "c", slug: string): string {
  return `${baseUrl.replace(/\/+$/, "")}/${kind}/${slug}`;
}
