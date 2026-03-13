/**
 * ============================================================
 * SERVICES SECTION CONTENT
 * ============================================================
 * Edit this file to update all text on the Services section.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

export interface ServiceCard {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
}

export interface SlidingTier {
  range: string;
  description: string;
}

export interface SessionDetail {
  label: string;
  description: string;
}

export interface AreaOfFocus {
  label: string;
}

export interface ServicesContent {
  label: string;
  title1: string;
  title2: string;
  subtitle: string;

  longTerm: ServiceCard;
  shortTerm: ServiceCard;

  sessionDetailsTitle: string;
  online: SessionDetail;
  duration: SessionDetail;
  paymentNote: string;

  slidingTitle: string;
  price: string;
  priceDesc: string;
  slidingDesc: string;
  slidingHow: string;

  slidingHigher: string;
  slidingHigherList: string;
  slidingLower: string;
  slidingLowerList: string;

  slidingTiers: SlidingTier[];

  areasLabel: string;
  areas: AreaOfFocus[];
}

export const servicesEN: ServicesContent = {
  label: "My Approach",
  title1: "How I Can",
  title2: "Support You",
  subtitle:
    "I offer both short-term and long-term therapy in the Gestalt tradition — meeting you exactly where you are, right now.",

  longTerm: {
    title: "Long-Term Therapy",
    subtitle: "6+ months",
    description:
      "For those ready to go deeper. We'll explore the patterns that shape your life and relationships. With time and trust, real transformation happens.",
    features: [
      "Personal growth",
      "Understanding patterns",
      "Relationship work",
      "Lasting change",
    ],
  },

  shortTerm: {
    title: "Short-Term Support",
    subtitle: "Up to 10 sessions",
    description:
      "Sometimes you need focused support for something specific — a crisis, a decision, a transition. We work with clarity and intention.",
    features: [
      "Crisis support",
      "Life transitions",
      "Focused goals",
      "Clear timeline",
    ],
  },

  sessionDetailsTitle: "How It Works",
  online: { label: "Online", description: "" },
  duration: { label: "50 minutes", description: "" },
  paymentNote: "Payment within 24h of session. Bank transfer, Wise, Revolut, or crypto.",

  slidingTitle: "Solidarity Pricing",
  price: "€40 – €190",
  priceDesc: "Sliding scale",
  slidingDesc:
    "This works because we trust each other. Those who can pay more make it possible for those who can't. It's a small circle of care.",
  slidingHow: "Choosing your rate",

  slidingHigher: "You might pay more if you:",
  slidingHigherList:
    "Own property or have savings • Travel for pleasure • Have family to fall back on • Have stable earning power",
  slidingLower: "You might pay less if you:",
  slidingLowerList:
    "Support others financially • Carry debt or medical costs • Receive assistance • Are studying or between jobs",

  slidingTiers: [
    { range: "€40–60", description: "When resources are tight" },
    { range: "€70–110", description: "A fair rate for most" },
    { range: "€110–190", description: "Helping others access care" },
  ],

  areasLabel: "I often work with:",
  areas: [
    { label: "Grief & Loss" },
    { label: "Relationships" },
    { label: "Life Transitions" },
  ],
};

export const servicesRU: ServicesContent = {
  label: "Подход",
  title1: "Как я могу",
  title2: "вас поддержать",
  subtitle:
    "Краткосрочная и долгосрочная гештальт-терапия — бережно работаем с тем, где вы находитесь сейчас.",

  longTerm: {
    title: "Долгосрочная терапия",
    subtitle: "От 6 месяцев",
    description:
      "Для тех, кто готов идти вглубь. Мы исследуем паттерны, которые формируют вашу жизнь и отношения. Со временем и доверием происходит настоящая трансформация.",
    features: [
      "Личностный рост",
      "Понимание паттернов",
      "Работа с отношениями",
      "Глубинные изменения",
    ],
  },

  shortTerm: {
    title: "Краткосрочная поддержка",
    subtitle: "До 10 сессий",
    description:
      "Иногда нужна точечная помощь — кризис, решение, перемены. Работаем с ясностью и намерением.",
    features: [
      "Поддержка в кризисе",
      "Жизненные переходы",
      "Конкретные цели",
      "Понятные сроки",
    ],
  },

  sessionDetailsTitle: "Как проходит терапия",
  online: { label: "Онлайн", description: "За сессию" },
  duration: { label: "50 минут", description: "Одна сессия" },
  paymentNote: "Оплата в течение 24ч. Перевод, Wise, Revolut или крипта.",

  slidingTitle: "Гибкая стоимость — по вашим возможностям",
  price: "€40 – €190",
  priceDesc: "Скользящая шкала",
  slidingDesc:
    "Это работает на доверии. Те, кто могут платить больше, поддерживают тех, кому сейчас сложнее. Так создаётся небольшой круг заботы.",
  slidingHow: "Как выбрать ставку",

  slidingHigher: "Вы можете платить больше, если:",
  slidingHigherList:
    "Есть жильё или накопления • Путешествуете для удовольствия • Есть поддержка близких • Стабильный доход",
  slidingLower: "Вы можете платить меньше, если:",
  slidingLowerList:
    "Содержите других • Есть долги или расходы на лечение • Получаете помощь от государства • Учитесь или между работами",

  slidingTiers: [
    { range: "€40–60", description: "Если сейчас мало ресурсов" },
    { range: "€70–110", description: "Оптимальная ставка" },
    { range: "€110–190", description: "Помогаете другим получить помощь" },
  ],

  areasLabel: "С чем я часто работаю:",
  areas: [
    { label: "Горе и утрата" },
    { label: "Отношения" },
    { label: "Жизненные перемены" },
  ],
};
