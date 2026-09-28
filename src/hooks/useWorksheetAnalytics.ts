import { trackEvent } from "./useBookingAnalytics";
import type { SignupSource } from "@/config/signup";

/**
 * How often the worksheet PDF is asked for, and how often it arrives.
 *
 * Two events rather than one, because they answer different questions and the
 * gap between them is the interesting number: a request that never becomes a
 * delivery is Brevo failing, and a count of requests alone would hide it.
 *
 * ⚠️ The address is never a property, here or anywhere. Nor is anything that
 * identifies the person: /take/* runs PostHog with `persistence: "memory"` and
 * `person_profiles: "never"`, so these are anonymous counts and must stay that
 * way. If a property is ever added here, check it against src/content/privacy.ts
 * first — privacyNotice.test.ts fails if the notice stops being true.
 *
 * `trackEvent` swallows a missing PostHog rather than throwing, so a blocked
 * or un-initialised analytics script cannot break a worksheet request.
 */

export const WORKSHEET_EVENTS = {
  /** The reader submitted the form asking for the PDF. */
  PDF_REQUESTED: "worksheet_pdf_requested",
  /** The function reported what happened to that request. */
  PDF_RESULT: "worksheet_pdf_result",
} as const;

interface PdfRequest {
  /** Which form it came from. Only "automatic-yes" can ask for a PDF today. */
  source: SignupSource;
  /** Whether the monthly letter was ticked in the same submission. */
  with_letter: boolean;
}

export function trackPdfRequested({ source, with_letter }: PdfRequest) {
  trackEvent(WORKSHEET_EVENTS.PDF_REQUESTED, { source, with_letter });
}

export function trackPdfResult({
  source,
  with_letter,
  outcome,
}: PdfRequest & { outcome: "sent" | "failed" }) {
  trackEvent(WORKSHEET_EVENTS.PDF_RESULT, { source, with_letter, outcome });
}
