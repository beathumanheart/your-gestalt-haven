/**
 * ============================================================
 * NAVIGATION & FOOTER CONTENT
 * ============================================================
 * Edit this file to update header, nav links, and footer text.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

import { SOCIAL_URLS } from "@/config/social";

export interface NavItem {
  label: string;
  /** Section id for scroll-to anchors (e.g. "about", "services"). */
  sectionId: string;
}

export interface SocialLinks {
  substack: string;
  instagram: string;
  youtube: string;
}

export interface NavigationContent {
  bookSession: string;
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
  substack: SOCIAL_URLS.substack,
  instagram: SOCIAL_URLS.instagram,
  youtube: SOCIAL_URLS.youtube,
};

export const navigationEN: NavigationContent = {
  bookSession: "Book a Session",
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
