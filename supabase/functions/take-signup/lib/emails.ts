/**
 * The worksheet email.
 *
 * One message, sent because someone asked for it on the page. Transactional
 * headers, so no open pixel, no link rewriting and no List-Unsubscribe — this
 * is not a subscription, and one unsubscribe tap would blocklist an address
 * for mail they do want.
 */

import {
  button,
  escapeHtml,
  shell,
  TRANSACTIONAL_HEADERS,
  type BrevoMessage,
} from "../../_shared/email.ts";

/** Matches the booking confirmation's heading colour. */
const GREEN = "linear-gradient(135deg, #4a7c5f, #5a9470)";

/**
 * The channel this worksheet accompanies.
 *
 * Hardcoded because an edge function cannot import src/config/social.ts. If
 * the handle changes, it changes there first — this is the copy.
 */
const YOUTUBE_URL = "https://www.youtube.com/@beathumanheart";

export interface WorksheetEmailInput {
  /** Where the reader asked from, resolved server-side — never from the client. */
  email: string;
  pdfUrl: string;
  pageUrl: string;
}

export function buildWorksheetEmail(input: WorksheetEmailInput): BrevoMessage {
  const { email, pdfUrl, pageUrl } = input;

  const body = `
      <p style="font-size: 16px; line-height: 1.7; color: #3d3833; margin: 0 0 18px;">Hello,</p>
      <p style="font-size: 16px; line-height: 1.7; color: #3d3833; margin: 0 0 18px;">Here is the worksheet you asked for — ten pages, printable, to go through at your own pace.</p>
      ${button(escapeHtml(pdfUrl), "Download the PDF")}
      <p style="font-size: 16px; line-height: 1.7; color: #3d3833; margin: 0 0 18px;">It goes with the long-form video on people-pleasing on YouTube, <a href="${escapeHtml(
        YOUTUBE_URL,
      )}" style="color: #4a7c5f;">Genia | Human Heart</a>. If you would rather fill it in on screen, the same worksheet is <a href="${escapeHtml(
    pageUrl,
  )}" style="color: #4a7c5f;">on the site</a>.</p>
      <p style="font-size: 16px; line-height: 1.7; color: #3d3833; margin: 0 0 18px;">One line from the first page: if something surfaces with more force than you can hold, stop. Some of this is better explored with a counsellor or therapist than alone.</p>
      <p style="font-size: 16px; line-height: 1.7; color: #3d3833; margin: 24px 0 0;">Genia<br><span style="color: #7a7168; font-size: 14px;">Gestalt Counsellor · humanheart.life</span></p>
      <p style="font-size: 13px; line-height: 1.6; color: #7a7168; margin: 28px 0 0; padding-top: 18px; border-top: 1px solid #e7e1da;">You received this one email because this address asked for the worksheet on humanheart.life. Nothing else follows, unless you confirm the monthly letter.</p>`;

  const textContent = [
    "Hello,",
    "",
    "Here is the worksheet you asked for — ten pages, printable, to go through at your own pace.",
    "",
    `Download the PDF: ${pdfUrl}`,
    "",
    `It goes with the long-form video on people-pleasing on YouTube, Genia | Human Heart (${YOUTUBE_URL}). If you would rather fill it in on screen, the same worksheet is on the site: ${pageUrl}`,
    "",
    "One line from the first page: if something surfaces with more force than you can hold, stop. Some of this is better explored with a counsellor or therapist than alone.",
    "",
    "Genia",
    "Gestalt Counsellor · humanheart.life",
    "",
    "You received this one email because this address asked for the worksheet on humanheart.life. Nothing else follows, unless you confirm the monthly letter.",
  ].join("\n");

  return {
    to: [{ email }],
    subject: "The automatic yes — your worksheet",
    htmlContent: shell("Your worksheet", GREEN, body),
    textContent,
    headers: TRANSACTIONAL_HEADERS,
  };
}
