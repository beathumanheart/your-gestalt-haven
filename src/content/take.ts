/**
 * ============================================================
 * "TAKE WITH YOU" — free material index (/take)
 * ============================================================
 * Slugs are English and lowercase in both languages; only the
 * display names are translated.
 *
 * The intro and the card descriptions deliberately make no claim
 * about what any of this material does. Describe it; do not
 * promise an outcome.
 * ============================================================
 */

export type TakeStatus = "live" | "prep" | "later";

export interface TakeItem {
  /** URL segment under /take/. Never translated. */
  slug: string;
  status: TakeStatus;
  /** e.g. "Interactive map" — what kind of thing this is. */
  kind: string;
  title: string;
  description: string;
}

export interface TakeContent {
  /** Footer nav label and page heading. */
  navLabel: string;
  title: string;
  intro: string;
  statuses: Record<TakeStatus, string>;
  items: TakeItem[];
  /** Shown on the not-yet-written item pages. */
  soonBody: string;
  back: string;
}

export const takeEN: TakeContent = {
  navLabel: "Take with you",
  title: "Take with you",
  intro:
    "Free material, here if it is useful to you. No session, no account, nothing to sign up for.",
  statuses: {
    live: "live",
    prep: "in preparation",
    later: "later",
  },
  items: [
    {
      slug: "feelings-map",
      status: "live",
      kind: "Interactive map",
      title: "What is going on with me",
      description: "Six rings, read from the outside in. The middle is the need.",
    },
    {
      // Title is provisional — the page itself is not written yet.
      slug: "safety-plan",
      status: "prep",
      kind: "Worksheet",
      title: "A plan made in advance",
      description: "Written on a steady day, for a day that is not one.",
    },
    {
      slug: "before-a-first-session",
      status: "later",
      kind: "Note",
      title: "Before a first session",
      description: "What the first fifty minutes are, and what they are not.",
    },
    {
      slug: "course",
      status: "later",
      kind: "Course",
      title: "A course, in parts",
      description: "Written in sections and published as each one is finished.",
    },
  ],
  soonBody: "This one is not written yet. The rest of the shelf is here.",
  back: "Back to Take with you",
};

export const takeRU: TakeContent = {
  navLabel: "С собой",
  title: "С собой",
  intro:
    "Бесплатные материалы. Что-то может пригодиться, что-то нет. Ни сессии, ни регистрации не нужно.",
  statuses: {
    live: "доступно",
    prep: "в работе",
    later: "позже",
  },
  items: [
    {
      slug: "feelings-map",
      status: "live",
      kind: "Интерактивная карта",
      title: "Что со мной происходит",
      description: "Шесть кругов, которые читают снаружи внутрь. В середине — потребность.",
    },
    {
      slug: "safety-plan",
      status: "prep",
      kind: "Бланк",
      title: "План, составленный заранее",
      description: "Пишется в спокойный день — для дня, который спокойным не будет.",
    },
    {
      slug: "before-a-first-session",
      status: "later",
      kind: "Заметка",
      title: "Перед первой сессией",
      description: "Что такое первые пятьдесят минут и чем они не являются.",
    },
    {
      slug: "course",
      status: "later",
      kind: "Курс",
      title: "Курс, по частям",
      description: "Пишется частями и выходит по мере готовности каждой.",
    },
  ],
  soonBody: "Этот материал ещё не написан. Остальная полка — здесь.",
  back: "Назад, к материалам",
};

export const takeItemBySlug = (c: TakeContent, slug: string) =>
  c.items.find((i) => i.slug === slug);
