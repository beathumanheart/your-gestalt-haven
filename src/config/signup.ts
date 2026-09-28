/**
 * Whether the worksheet's email sign-up is live.
 *
 * Milestone 1 shipped the page with this off, so it could go live before
 * Brevo existed. It is on now: the list and template IDs are configured and
 * the privacy notice the small print links to is published.
 *
 * Off means *not rendered*, not "rendered and disabled": a form that cannot
 * submit is worse than no form, and the small print would link to a page that
 * does not exist yet.
 */
export const SIGNUP_ENABLED = true;

/**
 * Where a sign-up came from.
 *
 * Must match the keys of `SOURCES` in
 * supabase/functions/take-signup/lib/sources.ts. That module is pure, but the
 * app must not pull edge-function code into its bundle, so this is a second
 * copy — `signupSources.test.ts` imports the function's list and fails if the
 * two drift.
 *
 * A union rather than `string` so a new mount point has to name itself, and
 * cannot quietly attribute its subscribers to the worksheet.
 */
export type SignupSource = "automatic-yes" | "letter-page" | "letter-footer";
