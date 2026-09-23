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
