/**
 * ============================================================
 * ABOUT SECTION CONTENT
 * ============================================================
 * Edit this file to update all text on the About section.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

export interface AboutContent {
  label: string;
  title1: string;
  title2: string;
  paragraphs: string[];
  /** The last paragraph is highlighted (styled as accent text). */
  highlightParagraph: string;
}

export const aboutEN: AboutContent = {
  label: "Welcome",
  title1: "I'm glad",
  title2: "you're here",
  paragraphs: [
    "I work with what makes us human — grief and loss, relationships of all kinds (romantic, family, friendships, work), questions of meaning, loneliness, time, and purpose.",
    "If you're feeling scared, uncertain, anxious, or just... stuck — that's already enough reason to reach out.",
    "In longer-term work, we go deeper — exploring patterns, reactions, and what drives them. With commitment from both of us, real and lasting change becomes possible.",
  ],
  highlightParagraph:
    "Even considering therapy is a brave step. You're already looking inward.",
};

export const aboutRU: AboutContent = {
  label: "Привет",
  title1: "Рада,",
  title2: "что вы здесь",
  paragraphs: [
    "Я работаю с тем, что по-настоящему важно в жизни: с горем и потерями, с отношениями — в паре, в семье, с друзьями и коллегами, — с чувством одиночества, вопросами смысла и поиском себя.",
    "Если вам страшно, тревожно или неуверенно.",
    "Если вы не понимаете, как жить дальше.",
    "Этого уже достаточно, чтобы прийти.",
    "В долгосрочной терапии мы идём глубже: замечаем повторяющиеся реакции, исследуем привычные сценарии и понимаем, что за ними стоит.",
    "Когда мы оба включены в процесс, изменения становятся реальными.",
  ],
  highlightParagraph:
    "Само то, что вы задумываетесь о терапии, — уже шаг. Вы уже начинаете смотреть внутрь.",
};
