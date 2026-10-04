/**
 * ============================================================
 * HOMEPAGE #contact SECTION — THE PARTS THAT ARE NOT THE INVITATION
 * ============================================================
 * The eyebrow label and the session-row chrome. The invitation itself lives
 * in src/content/contact.ts, with <GetInTouch />.
 *
 * Separate from `booking.ts` on purpose: that file is the wizard's copy and
 * stays as it is behind `BOOKING_ENABLED`, so turning booking back on
 * restores its wording without anything here having to be edited back.
 * ============================================================
 */

export interface ContactSectionContent {
  /** Eyebrow above "Ready to Begin?" — replaces the wizard's "Book a Session". */
  label: string;
  minutes: string;
  readMore: string;
}

export const contactSectionEN: ContactSectionContent = {
  label: "Get in touch",
  minutes: "minutes",
  readMore: "Read more",
};

export const contactSectionRU: ContactSectionContent = {
  label: "Написать мне",
  minutes: "минут",
  readMore: "Подробнее",
};
