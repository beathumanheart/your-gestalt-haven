/**
 * Where a sign-up came from, and what that place is allowed to ask for.
 *
 * Pure, with no Deno globals, so vitest can exercise the rules rather than
 * grep the function for them — the same split as _shared/email.ts (pure) and
 * _shared/send.ts (Deno). index.ts holds the request handling; the decisions
 * about sources live here.
 *
 * Server-side on purpose: neither the PDF path nor the page a reader is
 * returned to is ever taken from the request, so a caller cannot make this
 * function email an arbitrary link over the practice's own domain and
 * signature, nor point Brevo's confirmation link somewhere else.
 */

export interface Source {
  /** Absent when the source has no worksheet to send. */
  pdfPath?: string;
  /** Where a confirmed subscriber is returned to. */
  pagePath: string;
}

/**
 * Declared as a union rather than inferred from the object, so that
 * `SOURCES[source]` is exhaustive and adding a key without adding it here is a
 * type error rather than a silent `string` index.
 */
export type SourceKey = "automatic-yes" | "letter-page" | "letter-footer";

export const SOURCES: Record<SourceKey, Source> = {
  "automatic-yes": {
    pdfPath: "/downloads/the-automatic-yes-human-heart.pdf",
    pagePath: "/en/take/automatic-yes",
  },
  // The letter, from its own page and from the footer modal. Neither sends a
  // PDF; `pdfPath` is absent rather than empty, so asking for one is a
  // validation failure instead of an email carrying a broken link.
  "letter-page": { pagePath: "/en/letter" },
  "letter-footer": { pagePath: "/en/letter" },
};

export const isKnownSource = (value: unknown): value is SourceKey =>
  typeof value === "string" && Object.prototype.hasOwnProperty.call(SOURCES, value);

/** True when this source has a worksheet at all. */
export const hasWorksheet = (source: SourceKey): boolean =>
  typeof SOURCES[source].pdfPath === "string";

/**
 * Why a request cannot be served, or null if it can.
 *
 * Returned as a reason rather than a boolean so index.ts can keep answering
 * with the sentence that fits, and so the rules are readable in one place.
 */
export type Refusal = "unknown-source" | "nothing-asked-for" | "no-worksheet";

export const refuse = (
  source: unknown,
  { pdf, letter }: { pdf: boolean; letter: boolean },
): Refusal | null => {
  if (!isKnownSource(source)) return "unknown-source";
  if (!pdf && !letter) return "nothing-asked-for";
  if (pdf && !hasWorksheet(source)) return "no-worksheet";
  return null;
};

/** The absolute URL of a source's worksheet. Throws if it has none. */
export const worksheetUrl = (siteUrl: string, source: SourceKey): string => {
  const path = SOURCES[source].pdfPath;
  if (!path) throw new Error(`${source} has no worksheet`);
  return `${siteUrl}${path}`;
};

export const pageUrl = (siteUrl: string, source: SourceKey): string =>
  `${siteUrl}${SOURCES[source].pagePath}`;

/**
 * Where Brevo sends someone after they click the link in the confirmation
 * email — the page they subscribed from, which then says so instead of
 * offering the form again.
 */
export const confirmationReturnUrl = (siteUrl: string, source: SourceKey): string =>
  `${pageUrl(siteUrl, source)}?letter=confirmed`;
