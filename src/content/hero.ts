/**
 * ============================================================
 * HERO SECTION CONTENT
 * ============================================================
 * Edit this file to update all text on the Hero section.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

export interface HeroContent {
  tagline: string;
  title1: string;
  title2: string;
  subtitle: string;
  cta: string;
  learnMore: string;
}

export const heroEN: HeroContent = {
  tagline: "Therapy with Genia",
  title1: "A Space for You",
  title2: "to Breathe",
  subtitle:
    "I'm here to walk with you through life's hardest moments — with presence, compassion, and care.",
  cta: "Begin Your Journey",
  learnMore: "Learn More",
};

export const heroRU: HeroContent = {
  tagline: "Терапия с Женей",
  title1: "Пространство,",
  title2: "где можно дышать",
  subtitle:
    "Я рядом, чтобы пройти с вами через самое сложное — с присутствием, вниманием и заботой.",
  cta: "Записаться",
  learnMore: "Подробнее",
};
