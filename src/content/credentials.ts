/**
 * ============================================================
 * CREDENTIALS SECTION CONTENT
 * ============================================================
 * Edit this file to update all text on the Credentials section.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

export interface CredentialItem {
  text: string;
  /** Optional URL — item will be rendered as a link when present. */
  link?: string;
  /** When `link` is set, only this substring of `text` is linkified (defaults to whole text). */
  linkText?: string;
}

export interface CredentialGroup {
  title: string;
  items: CredentialItem[];
}

export interface CredentialsContent {
  label: string;
  title1: string;
  title2: string;
  subtitle: string;

  education: CredentialGroup;
  ethics: CredentialGroup;
  clinical: CredentialGroup;

  quote: string;
}

export const credentialsEN: CredentialsContent = {
  label: "About Me",
  title1: "Training &",
  title2: "Background",
  subtitle:
    "I share what's professionally relevant and leave space for you to discover the rest through our work together.",

  education: {
    title: "Education",
    items: [
      { text: "Diploma in Psychological Counselling (Saint Petersburg, Russia)" },
      { text: "MSc in Bioethics (KU Leuven, Belgium)" },
      { text: "MA in Philosophy (University of Tartu, Estonia)" },
      {
        text: "Training at International Institute of Gestalt, Montenegro (ongoing)",
        link: "https://mig.institute/",
        linkText: "International Institute of Gestalt",
      },
    ],
  },

  ethics: {
    title: "Ethics & Practice",
    items: [
      {
        text: "I work to the ethical standards published by the European Association for Gestalt Therapy (EAGT)",
      },
      { text: "Weekly personal therapy and supervision" },
      { text: "I welcome everyone — all backgrounds, identities, and ways of being" },
    ],
  },

  clinical: {
    title: "Working Alongside",
    items: [
      { text: "If you are already working with a psychiatrist or doctor, I can work alongside that care — with your consent." },
    ],
  },

  quote:
    '"I walk beside you, not ahead. Together, we explore what it means to be fully alive in this moment."',
};

export const credentialsRU: CredentialsContent = {
  label: "Обо мне",
  title1: "Образование и",
  title2: "опыт",
  subtitle:
    "Я делюсь тем, что важно с профессиональной точки зрения, и оставляю пространство, чтобы остальное вы открыли вместе с терапией.",

  education: {
    title: "Образование",
    items: [
      { text: "Диплом психолога-консультанта (Санкт-Петербург, Россия)" },
      { text: "Магистр биоэтики (KU Leuven, Бельгия)" },
      { text: "Магистр философии (Тартуский университет, Эстония)" },
      {
        text: "Обучение в Международном Институте Гештальта, Черногория (вторая ступень)",
        link: "https://mig.institute/",
        linkText: "Международном Институте Гештальта",
      },
    ],
  },

  ethics: {
    title: "Этика и практика",
    items: [
      {
        text: "Работаю в соответствии с этическими стандартами, опубликованными Европейской ассоциацией гештальт-терапии (EAGT)",
      },
      { text: "Еженедельная личная терапия и супервизии" },
      { text: "Принимаю всех — любого происхождения, идентичности и способа быть" },
    ],
  },

  clinical: {
    title: "Совместная работа",
    items: [
      { text: "Если вы уже наблюдаетесь у психиатра или врача, я могу работать параллельно с этим лечением — с вашего согласия." },
    ],
  },

  quote:
    "«Я иду рядом, не впереди. Вместе мы исследуем, что значит быть по-настоящему живым — прямо сейчас.»",
};
