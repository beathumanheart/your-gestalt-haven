/**
 * Whether the worksheet's email sign-up is live.
 *
 * Milestone 1 ships the page with this off: the sign-up card and the letter
 * block are not rendered at all, so the page can go live before Brevo exists.
 * Milestone 2 turns it on, once the list and template IDs are configured and
 * the privacy notice the small print links to is published.
 *
 * Off means *not rendered*, not "rendered and disabled": a form that cannot
 * submit is worse than no form, and the small print would link to a page that
 * does not exist yet.
 */
export const SIGNUP_ENABLED = false;
