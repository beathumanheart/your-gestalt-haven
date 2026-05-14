// Alphabet excludes visually ambiguous characters: 0/o, 1/l, i
const CHARS = "abcdefghjkmnpqrstuvwxyz23456789";

function randomSuffix(length = 4): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

export function buildOfferSlug(stem: string): string {
  return `${stem}-${randomSuffix()}`;
}

export function isValidSlugStem(stem: string): boolean {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(stem) || /^[a-z0-9]$/.test(stem);
}
