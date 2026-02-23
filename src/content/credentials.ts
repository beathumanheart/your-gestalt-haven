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
      { text: "MA in Philosophy" },
      { text: "MSc in Psychology & Bioethics" },
      { text: "Training at International Gestalt Institute (ongoing)" },
    ],
  },

  ethics: {
    title: "Ethics & Practice",
    items: [
      {
        text: "Working under EAGT (European Association for Gestalt Therapy) ethical standards",
      },
      { text: "Weekly personal therapy and supervision" },
      { text: "I welcome everyone — all backgrounds, identities, and ways of being" },
    ],
  },

  clinical: {
    title: "Clinical Work",
    items: [
      { text: "I work with clinical cases alongside your psychiatrist" },
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
      { text: "Магистр философии" },
      { text: "Магистр психологии и биоэтики" },
      { text: "Обучение в Международном Институте Гештальта (в процессе)" },
    ],
  },

  ethics: {
    title: "Этика и практика",
    items: [
      {
        text: "Работаю по этическим стандартам EAGT (Европейская Ассоциация Гештальт-терапии)",
      },
      { text: "Еженедельная личная терапия и супервизии" },
      { text: "Принимаю всех — любого происхождения, идентичности и способа быть" },
    ],
  },

  clinical: {
    title: "Клиническая работа",
    items: [
      { text: "Работаю с клиническими случаями вместе с вашим психиатром" },
    ],
  },

  quote:
    "«Я иду рядом, не впереди. Вместе мы исследуем, что значит быть по-настоящему живым — прямо сейчас.»",
};
