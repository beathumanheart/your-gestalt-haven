/**
 * ============================================================
 * NAVIGATION & FOOTER CONTENT
 * ============================================================
 * Edit this file to update header, nav links, and footer text.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

import { SOCIAL_URLS } from "@/config/social";
import { BOOKING_ENABLED } from "@/config/booking";

export interface NavItem {
  label: string;
  /** Section id for scroll-to anchors (e.g. "about", "services"). */
  sectionId: string;
}

export interface SocialLinks {
  youtube: string;
}

export interface NavigationContent {
  /**
   * The header, hero and mobile-menu CTA.
   *
   * Two labels, chosen by `BOOKING_ENABLED` in `ctaLabel()` below, because
   * with the calendar off "Book a Session" promises something the page cannot
   * do. Both are kept so turning booking back on restores the old wording
   * from one place rather than from four call sites.
   */
  bookSession: string;
  getInTouch: string;
  navItems: NavItem[];

  footerAbout: string;
  footerServices: string;
  footerContact: string;
  footerOfferAgreement: string;
  footerTakeWithYou: string;
  footerRights: string;
  footerEmail: string;

  social: SocialLinks;
}

// Same URLs for both languages. The handles themselves live in
// src/config/social.ts — change them there, not here.
const SOCIAL_LINKS: SocialLinks = {
  youtube: SOCIAL_URLS.youtube,
};

export const navigationEN: NavigationContent = {
  bookSession: "Book a Session",
  getInTouch: "Get in touch",
  navItems: [
    { label: "About", sectionId: "about" },
    { label: "Services", sectionId: "services" },
    { label: "Credentials", sectionId: "credentials" },
    { label: "Contact", sectionId: "contact" },
  ],

  footerAbout: "About",
  footerServices: "Services",
  footerContact: "Contact",
  footerOfferAgreement: "Offer Agreement",
  footerTakeWithYou: "Take with you",
  footerRights: "All rights reserved.",
  footerEmail: "be@humanheart.life",
  social: SOCIAL_LINKS,
};

export const navigationRU: NavigationContent = {
  bookSession: "Записаться",
  getInTouch: "Написать мне",
  navItems: [
    { label: "Обо мне", sectionId: "about" },
    { label: "Услуги", sectionId: "services" },
    { label: "Квалификация", sectionId: "credentials" },
    { label: "Контакты", sectionId: "contact" },
  ],

  footerAbout: "Обо мне",
  footerServices: "Услуги",
  footerContact: "Контакты",
  footerOfferAgreement: "Договор оферты",
  footerTakeWithYou: "Материалы",
  footerRights: "Все права защищены.",
  footerEmail: "be@humanheart.life",
  social: SOCIAL_LINKS,
};

/**
 * The label for every CTA that points at #contact.
 *
 * One function, so the header, the mobile menu and the hero cannot disagree
 * with each other or with what the section they scroll to actually offers.
 * The anchor itself does not change — only what the button promises.
 */
export const ctaLabel = (c: NavigationContent): string =>
  BOOKING_ENABLED ? c.bookSession : c.getInTouch;
