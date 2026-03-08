/**
 * ============================================================
 * NAVIGATION & FOOTER CONTENT
 * ============================================================
 * Edit this file to update header, nav links, and footer text.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

export interface NavItem {
  label: string;
  /** Section id for scroll-to anchors (e.g. "about", "services"). */
  sectionId: string;
}

export interface NavigationContent {
  bookSession: string;
  navItems: NavItem[];

  footerAbout: string;
  footerServices: string;
  footerContact: string;
  footerOfferAgreement: string;
  footerRights: string;
  footerEmail: string;
}

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
  footerRights: "All rights reserved.",
  footerEmail: "be@humanheart.life",
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
  footerRights: "Все права защищены.",
  footerEmail: "beathumanheart@gmail.com",
};
