/**
 * ============================================================
 * SERVICES SECTION CONTENT
 * ============================================================
 * Edit this file to update all text on the Services section.
 * Both EN and RU translations are side by side for easy editing.
 *
 * The RU strings began as adaptations and were marked provisional until
 * Genia reviewed them; they are approved as they stand (#52). Provisional
 * copy must not be committed here again: the guard in
 * src/__tests__/draftContent.test.ts fails the build on the marker it used
 * to carry, anywhere in src/content. The marker itself is spelled out only
 * in that file, which is the one place exempt from its own check.
 * ============================================================
 */

export interface TopicCard {
  title: string;
  /** Rendered inline, joined by " · " (not a bullet list). Expect 6. */
  subtopics: string[];
}

export interface TermLine {
  term: string;
  line: string;
}

export interface PricingBand {
  label: string;
  note: string;
}

export interface ServicesContent {
  title1: string;
  title2: string;
  subtitle: string;
  /** One prose line under the subtitle, wrapping a link to /take/feelings-map. */

  /** 4 cards, rendered in order with icons [Heart, Users, Flame, Clock]. */
  topics: TopicCard[];

  shortTerm: TermLine;
  longTerm: TermLine;

  pillOnline: string;
  pillDuration: string;
  pillPayment: string;
  paymentMethods: string;

  pricingLabel: string;
  pricingIntro: string;
  perUnit: string;
  /** 3 bands: [tight, fair, helping]. Selected by rate via the slider. */
  bands: PricingBand[];
}

export const servicesEN: ServicesContent = {
  title1: "What We Might",
  title2: "Work On",
  subtitle:
    "None of these will describe you exactly — your story is your own. These are simply the doors people most often come through.",

  topics: [
    {
      title: "Grief & loss",
      subtopics: [
        "Death of someone close",
        "Anticipatory grief and long illness",
        "Miscarriage and childlessness",
        "Losing a home or country",
        "The end of a relationship",
        "Grief no one around you recognises",
      ],
    },
    {
      title: "Relationships",
      subtopics: [
        "Partners and intimacy",
        "Repeating patterns in who you choose",
        "Parents and family roles",
        "Friendship, distance and drifting apart",
        "Conflict and boundaries at work",
        "Loneliness inside a relationship",
      ],
    },
    {
      title: "Anxiety & feeling stuck",
      subtopics: [
        "Constant low-level worry",
        "Dread with no clear cause",
        "Burnout and exhaustion",
        "Procrastination and self-criticism",
        "Shame and perfectionism",
        "Anger you don't know where to put",
      ],
    },
    {
      title: "Transitions & meaning",
      subtopics: [
        "Emigration and life between countries",
        "Career change or losing work",
        "Becoming a parent",
        "Ageing, time and mortality",
        "Identity, values and belonging",
        "“Is this really my life?”",
      ],
    },
  ],

  shortTerm: {
    term: "Short-term",
    line: "Up to 10 sessions — when one thing needs attention, and an end we can both see.",
  },
  longTerm: {
    term: "Long-term",
    line: "Six months and on — when it's less about one thing, and more about how your life fits together.",
  },

  pillOnline: "Online, wherever you are",
  pillDuration: "50 minutes, usually weekly",
  pillPayment: "Payment within 24h",
  paymentMethods: "Bank transfer, Wise, Revolut or crypto.",

  pricingLabel: "Solidarity Pricing",
  pricingIntro:
    "This works because we trust each other — those who can pay more make it possible for those who can't. Choose the number that's honest for your life right now.",
  perUnit: "per 50 min",
  bands: [
    {
      label: "When resources are tight",
      note: "Choose here if you're studying, between jobs, carrying debt or medical costs, or supporting others financially. No explanation asked for.",
    },
    {
      label: "Fair rate",
      note: "Choose here if your income covers your needs with some room left over.",
    },
    {
      label: "Helping someone else access care",
      note: "Choose here if you own property or have savings, travel for pleasure, or have family to fall back on. Your rate quietly funds someone else's.",
    },
  ],
};

export const servicesRU: ServicesContent = {
  title1: "С чем мы можем",
  title2: "поработать",
  subtitle:
    "Ничто из этого не опишет вас в точности — ваша история только ваша. Это просто двери, через которые люди чаще всего входят.",

  topics: [
    {
      title: "Горе и утрата",
      subtopics: [
        "Смерть близкого человека",
        "Предвосхищающее горе и долгая болезнь",
        "Выкидыш и бездетность",
        "Потеря дома или страны",
        "Конец отношений",
        "Горе, которое никто вокруг не признаёт",
      ],
    },
    {
      title: "Отношения",
      subtopics: [
        "Партнёрство и близость",
        "Повторяющиеся сценарии в выборе партнёра",
        "Родители и семейные роли",
        "Дружба, отдаление и охлаждение",
        "Конфликты и границы на работе",
        "Одиночество внутри отношений",
      ],
    },
    {
      title: "Тревога и ощущение тупика",
      subtopics: [
        "Постоянное фоновое беспокойство",
        "Тревога без явной причины",
        "Выгорание и истощение",
        "Прокрастинация и самокритика",
        "Стыд и перфекционизм",
        "Злость, которой некуда деться",
      ],
    },
    {
      title: "Переходы и смысл",
      subtopics: [
        "Эмиграция и жизнь между странами",
        "Смена работы или её потеря",
        "Становление родителем",
        "Старение, время и конечность",
        "Идентичность, ценности и принадлежность",
        "«Это правда моя жизнь?»",
      ],
    },
  ],

  shortTerm: {
    term: "Краткосрочно",
    line: "До 10 сессий — когда есть что-то одно, чему нужно внимание, и понятное завершение.",
  },
  longTerm: {
    term: "Долгосрочно",
    line: "От полугода и дальше — когда дело не в чём-то одном, а в том, как складывается ваша жизнь целиком.",
  },

  pillOnline: "Онлайн, где бы вы ни были",
  pillDuration: "50 минут, обычно раз в неделю",
  pillPayment: "Оплата в течение 24 часов",
  paymentMethods: "Банковский перевод, Wise, Revolut или крипта.",

  pricingLabel: "Солидарная оплата",
  pricingIntro:
    "Это работает, потому что мы доверяем друг другу — те, кто может платить больше, делают это возможным для тех, кто не может. Выберите сумму, честную для вашей жизни сейчас.",
  perUnit: "за 50 минут",
  bands: [
    {
      label: "Когда с ресурсами трудно",
      note: "Выбирайте здесь, если учитесь, между работами, несёте долги или медицинские расходы, или финансово поддерживаете других. Объяснений не нужно.",
    },
    {
      label: "Честная цена",
      note: "Выбирайте здесь, если доход покрывает ваши потребности и остаётся немного сверху.",
    },
    {
      label: "Помогая кому-то ещё получить помощь",
      note: "Выбирайте здесь, если у вас есть собственность или сбережения, вы путешествуете для удовольствия или можете опереться на семью. Ваша ставка тихо оплачивает чью-то ещё.",
    },
  ],
};
