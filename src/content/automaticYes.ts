/**
 * ============================================================
 * "THE AUTOMATIC YES" — worksheet on people-pleasing (/take/automatic-yes)
 * ============================================================
 * Every string on the page lives here, except the head (title and
 * description, in src/config/pageMetadata.ts) and the shelf card (in
 * src/content/take.ts), which each have one home already.
 *
 * The same wording is in the downloadable PDF
 * (public/downloads/the-automatic-yes-human-heart.pdf); change one,
 * change the other.
 *
 * English only. There is no Russian version yet: /ru/take/automatic-yes
 * redirects to English, the Russian shelf does not list it, and the route
 * is generated for "en" alone (see STATIC_ROUTES in src/config/pageMetadata.ts).
 *
 * Voice rules for anything added here: no verdicts about the reader, no
 * generalisations about people, history and situation before the inner
 * world, "feeling" rather than "emotion", British spelling. Describe the
 * material; do not promise an outcome (same rule as src/content/take.ts).
 *
 * Field ids (`id`) are the keys answers are held under in memory and, only
 * while the reader has switched "keep" on, in localStorage. Changing an id
 * orphans that answer for anyone who kept theirs — add, don't rename.
 * ============================================================
 */

export interface Quote {
  text: string;
  attribution: string;
}

export type WorksheetBlock =
  | { kind: "text"; n: number; id: string; question: string; hint?: string; rows: number }
  | { kind: "choice"; n: number; id: string; question: string; hint?: string; options: string[]; other: boolean; single: boolean }
  | { kind: "body"; n: number; id: string; question: string; hint: string; rows: number }
  | { kind: "pair"; n: number; id: string; question: string; columns: string[] }
  | { kind: "form"; n: number; id: string; question: string; rows: { label: string; hint: string }[] }
  | { kind: "moments"; n: number; id: string; question: string; hint: string; placeholder: string; choices: string[]; count: number }
  | { kind: "chew"; n: number; id: string; question: string; subs: { question: string; rows: number }[] }
  | { kind: "example"; text: string };

export interface WorksheetPart {
  id: string;
  kicker: string;
  title: string;
  quote?: Quote;
  lead: string[];
  blocks: WorksheetBlock[];
}

export interface PauseMove {
  id: string;
  title: string;
  text: string;
  fields: string[];
  options?: string[];
  other?: boolean;
  single?: boolean;
}

export interface AutomaticYesContent {
  crumb: string;
  crumbHere: string;
  hero: { kicker: string; title: string[]; subtitle: string; meta: string };
  confirmed: string;
  signup: {
    title: string; text: string; label: string; placeholder: string; consent: string; button: string; sending: string;
    small: string; privacy: string; done: string; done_with_letter: string; invalid: string; error: string; rate_limited: string;
  };
  onPage: string;
  keepLabel: string;
  keepHelp: string;
  intro: {
    kicker: string; title: string; paras: string[];
    howto: { label: string; text: string }[];
    lensesTitle: string;
    lenses: { years: string; who: string; role: string; gloss: string; partId: string; linkLabel: string }[];
  };
  parts: WorksheetPart[];
  turn: { mark: string; quote: string; attribution: string; paras: string[] };
  pause: {
    id: string; kicker: string; title: string; lead: string[]; moves: PauseMove[];
    experiment: { id: string; title: string; text: string; whereLabel: string; tryLabel: string; tryOptions: string[] };
    note: string;
  };
  after: { id: string; kicker: string; title: string; lead: string[]; blocks: WorksheetBlock[]; staysTitle: string; stays: string[] };
  worksheetUi: {
    figureHint: string; figureLabel: string; otherPlaceholder: string; print: string; clear: string; clearConfirm: string;
    savedOn: string; savedOff: string;
  };
  letter: { kicker: string; title: string; text: string; button: string; small: string; done: string };
  closing: { quote: string; attribution: string; name: string; role: string; sessions: string; book: string; watch: string; fine: string };
  sourcesTitle: string;
  sources: string[];
}

export const automaticYesEN: AutomaticYesContent = {
  crumb: "Take with you",
  crumbHere: "Worksheet",
  hero: {
    kicker: "Worksheet · free",
    title: ["The", "automatic", "yes"],
    subtitle: "A worksheet on people-pleasing, through Ferenczi, Winnicott and Gestalt.",
    meta: "Five short parts. About forty minutes. Go through it on this page, or take the PDF.",
  },
  confirmed: "Confirmed. The monthly letter will come to this address.",
  signup: {
    title: "Take the PDF with you",
    text: "Ten printable pages, sent to your inbox.",
    label: "Email",
    placeholder: "you@example.com",
    consent: "Also send me the monthly letter: one longer piece a month, on feelings and relationships. Leaving takes one click.",
    button: "Send me the PDF",
    sending: "Sending…",
    small: "Your address is used only for what you choose here. The emails go out through Brevo; the address is not passed on to anyone else.",
    privacy: "Privacy",
    done: "Sent. It should arrive within a few minutes — if not, the spam folder is worth a look.",
    done_with_letter: "Sent. It should arrive within a few minutes. A second email asks you to confirm the monthly letter.",
    invalid: "That address doesn’t look complete yet.",
    error: "Something went wrong on the way. Please try again in a minute.",
    rate_limited: "Too many attempts from here. Please wait a few minutes and try again.",
  },
  onPage: "Or go through it here. Nothing you write is sent anywhere — not to me, not to anyone. It isn’t saved either, unless you choose to keep it on this device; at the end you can print it or save it as a PDF.",
  keepLabel: "Keep my answers on this device",
  keepHelp: "Stored in this browser only. Switch off to delete them.",
  intro: {
    kicker: "Before you begin",
    title: "A yes that arrives before you do",
    paras: [
      "Some yeses are chosen: you know what you want, you weigh it, you agree. Others arrive first — before you have checked with yourself, sometimes before the other person has finished asking. This worksheet is about the second kind.",
      "It looks at that yes through three lenses from one lineage, then asks you to meet it: slowly on paper, and once in real life.",
    ],
    howto: [
      {
        label: "Time",
        text: "About forty minutes in one sitting, or one part a day.",
      },
      {
        label: "You need",
        text: "One recent yes you would like to look at more closely — and a pen, if you print it.",
      },
      {
        label: "Answers",
        text: "Write what is true today. There is nothing to get right.",
      },
      {
        label: "Care",
        text: "If something surfaces with more force than you can hold, stop. Feel your feet on the floor and name five things you can see. Some of this is better explored with a counsellor or therapist than alone.",
      },
    ],
    lensesTitle: "Three lenses, one lineage",
    lenses: [
      {
        years: "1932",
        who: "Sándor Ferenczi",
        role: "Where it begins",
        gloss: "Reading another person closely and early, when refusing them is not possible.",
        partId: "ferenczi",
        linkLabel: "Go to part two",
      },
      {
        years: "1960",
        who: "D. W. Winnicott",
        role: "What it becomes",
        gloss: "A caretaker self that protects something more alive underneath.",
        partId: "winnicott",
        linkLabel: "Go to part three",
      },
      {
        years: "1951–1970",
        who: "Gestalt",
        role: "How it lives now",
        gloss: "At the boundary between you and another person, where it can be noticed, chewed over and met.",
        partId: "introjection",
        linkLabel: "Go to part four",
      },
    ],
  },
  parts: [
    {
      id: "now",
      kicker: "Part one · Now",
      title: "Catch one yes",
      lead: [
        "Start with something recent and ordinary: a favour, a plan, an extra task, a “sure” that came out before you had thought about it. Stay with the details. They carry the information.",
      ],
      blocks: [
        {
          kind: "text",
          n: 1,
          id: "now-1",
          question: "What happened? Where were you, who asked, and what for?",
          rows: 3,
        },
        {
          kind: "text",
          n: 2,
          id: "now-2",
          question: "What did you sense they wanted — including anything they didn’t say?",
          rows: 2,
        },
        {
          kind: "choice",
          n: 3,
          id: "now-3",
          question: "How long between the asking and your yes?",
          options: ["before they had finished", "a second or two", "after I had thought it over"],
          other: false,
          single: true,
        },
        {
          kind: "body",
          n: 4,
          id: "now-4",
          question: "Just before the yes, what happened in your body? Mark it on the figure.",
          hint: "Throat, chest, stomach, jaw, face, breath — whatever you noticed.",
          rows: 5,
        },
        {
          kind: "text",
          n: 5,
          id: "now-5",
          question: "What did you want, if anything?",
          rows: 2,
          hint: "A small preference counts.",
        },
        {
          kind: "pair",
          n: 6,
          id: "now-6",
          question: "Afterwards, looking at both sides:",
          columns: ["What the yes cost", "What the yes kept safe"],
        },
      ],
    },
    {
      id: "ferenczi",
      kicker: "Part two · Where it began",
      title: "The radar",
      quote: {
        text: "…subordinate themselves like automata to the will of the aggressor, to divine each one of his desires and to gratify these; completely oblivious of themselves…",
        attribution: "Sándor Ferenczi · Confusion of Tongues between Adults and the Child · 1932",
      },
      lead: [
        "Ferenczi was describing children overwhelmed by adults they could not refuse. For them, reading the adult closely was the most intelligent response available: it kept the bond intact, even when the bond was also where the danger came from. A 2025 paper in the Journal of Trauma & Dissociation returns to his work and describes this adaptation as what lets an overwhelmed child keep “a bond of tenderness” with the adult.",
        "Your own history may be much quieter. An adult’s temper, fragility, exhaustion or grief can call for the same skill.",
      ],
      blocks: [
        {
          kind: "text",
          n: 1,
          id: "ferenczi-1",
          question: "Whose moods did you learn to read first — and roughly how old were you?",
          rows: 2,
        },
        {
          kind: "text",
          n: 2,
          id: "ferenczi-2",
          question: "What were the early signals?",
          rows: 2,
          hint: "A tone of voice, footsteps, a silence, the way a door closed.",
        },
        {
          kind: "choice",
          n: 3,
          id: "ferenczi-3",
          question: "What did reading them early make possible?",
          options: [
            "keeping the peace",
            "staying close",
            "protecting someone else",
            "avoiding punishment",
            "being wanted",
          ],
          other: true,
          single: false,
        },
        {
          kind: "text",
          n: 4,
          id: "ferenczi-4",
          question: "Where does the radar switch on now? With whom, in which rooms?",
          rows: 3,
        },
        {
          kind: "choice",
          n: 5,
          id: "ferenczi-5",
          question: "While it is on, what goes quiet in you?",
          options: ["hunger", "tiredness", "an opinion", "anger", "a wish to leave"],
          other: true,
          single: false,
        },
        {
          kind: "text",
          n: 6,
          id: "ferenczi-6",
          question: "It picks up what others miss. Where could you use it by choice, rather than by reflex?",
          rows: 3,
        },
      ],
    },
    {
      id: "winnicott",
      kicker: "Part three · What it became",
      title: "The caretaker",
      quote: {
        text: "Only the True Self can be creative and only the True Self can feel real.",
        attribution: "D. W. Winnicott · Ego Distortion in Terms of True and False Self · 1960",
      },
      lead: [
        "When a baby’s spontaneous gestures keep being met with the adult’s own instead, Winnicott observed, the baby learns to comply — and compliance slowly becomes a self. He called it the False Self; one of his patients called hers the “Caretaker Self”. Its job, he wrote, is “to hide and protect the True Self, whatever that may be.” Compliance in itself is not the problem: “the ability to compromise is an achievement.” The difficulty begins when the caretaker is the only one who ever answers the door.",
      ],
      blocks: [
        {
          kind: "form",
          n: 1,
          id: "winnicott-1",
          question: "Write its job description.",
          rows: [
            {
              label: "Working hours",
              hint: "When and where does it clock in?",
            },
            {
              label: "Core skills",
              hint: "What is it excellent at?",
            },
            {
              label: "House rules",
              hint: "What is it never allowed to do?",
            },
            {
              label: "A day off",
              hint: "If it took one, what might happen?",
            },
          ],
        },
        {
          kind: "text",
          n: 2,
          id: "winnicott-2",
          question: "What has it been protecting?",
          rows: 2,
          hint: "Behind the caretaker: a want, a feeling, a way of being yourself.",
        },
        {
          kind: "moments",
          n: 3,
          id: "winnicott-3",
          question: "“The spontaneous gesture is the True Self in action.” This week, catch three moments when your body moved first.",
          hint: "A laugh, a reach, a wish to leave, a “no” in the throat.",
          placeholder: "The moment",
          choices: ["acted on it", "held it", "swallowed it"],
          count: 3,
        },
      ],
    },
    {
      id: "introjection",
      kicker: "Part four · The rule underneath",
      title: "Chew the rule",
      lead: [
        "Ferenczi gave psychoanalysis the word introjection in 1909. Fritz and Laura Perls carried it into Gestalt therapy with a bodily image: an introject is something swallowed whole — a rule taken in before it could be tasted, chewed, and then kept or refused. The automatic yes often rests on one or two of them.",
      ],
      blocks: [
        {
          kind: "choice",
          n: 1,
          id: "introjection-1",
          question: "Tick any that sound familiar, or add your own.",
          options: [
            "“Don’t make a fuss.”",
            "“Keep the peace.”",
            "“Their feelings are your job.”",
            "“Needing things is a burden.”",
            "“Be easy to be around.”",
            "“If someone is upset, fix it.”",
            "“Good people don’t disappoint.”",
          ],
          other: true,
          single: false,
        },
        {
          kind: "text",
          n: 2,
          id: "introjection-2",
          question: "Choose one and write it here, word for word.",
          rows: 2,
        },
        {
          kind: "chew",
          n: 3,
          id: "introjection-3",
          question: "Now chew it, slowly.",
          subs: [
            {
              question: "Whose voice does it speak in?",
              rows: 1,
            },
            {
              question: "When did it make sense — in which situation?",
              rows: 2,
            },
            {
              question: "What did it protect, and whom?",
              rows: 2,
            },
            {
              question: "What in it is still worth keeping?",
              rows: 1,
            },
            {
              question: "What in it no longer fits your life?",
              rows: 1,
            },
          ],
        },
        {
          kind: "text",
          n: 4,
          id: "introjection-4",
          question: "Rewrite it in your own words, as something you would choose.",
          rows: 3,
        },
        {
          kind: "example",
          text: "For instance, “Keep the peace” might become: “I care about peace, and I can live through some friction on the way to a real one.”",
        },
      ],
    },
  ],
  turn: {
    mark: "the turn",
    quote: "Change occurs when one becomes what he is, not when he tries to become what he is not.",
    attribution: "Arnold Beisser · The Paradoxical Theory of Change · 1970",
    paras: [
      "So what follows does not ask you to stop saying yes. It asks you to be there when you say it.",
      "A yes you are present for is already a different yes.",
    ],
  },
  pause: {
    id: "pause",
    kicker: "Part five · Next time",
    title: "A pause at the boundary",
    lead: [
      "Gestalt has a name for what the yes once was: a creative adjustment — the best response available in a situation that needed it. The situation has changed; the response stayed. What moves it is contact: being there with your body and your want, while the other person is there too.",
    ],
    moves: [
      {
        id: "pause-1",
        title: "Feel the pull.",
        text: "Notice where it lands — perhaps the place you marked in part one. Say to yourself: there’s the pull.",
        fields: ["Where it lands for me:"],
      },
      {
        id: "pause-2",
        title: "Buy a breath.",
        text: "Pick a sentence that makes room, or write your own:",
        fields: [],
        options: [
          "“Let me check and come back to you.”",
          "“Give me a minute to think.”",
          "“I’m not sure yet.”",
          "“Can I tell you tomorrow?”",
        ],
        other: true,
        single: false,
      },
      {
        id: "pause-3",
        title: "Find your part.",
        text: "What do I want here, even a little? What am I willing to give — all of it, some of it, none of it? Answer from there:",
        fields: ["What I want:", "What I’m willing to give:"],
        options: ["yes", "partly", "not now", "no"],
        other: false,
        single: true,
      },
    ],
    experiment: {
      id: "experiment",
      title: "A small experiment",
      text: "Choose one low-stakes moment this week, with someone where a little friction is survivable. The first solution was right for a bond that could not hold a no. The experiment finds out whether this one can.",
      whereLabel: "Where, and with whom:",
      tryLabel: "What I’ll try:",
      tryOptions: ["a pause", "a partial yes", "saying a preference", "a small no"],
    },
    note: "If a no has ever been met with threats, punishment or harm in a relationship, the old solution may still be protecting you there. That belongs with support, not with an experiment.",
  },
  after: {
    id: "after",
    kicker: "Afterwards",
    title: "What happened",
    lead: ["Fill this in after the experiment, while it is still fresh."],
    blocks: [
      {
        kind: "text",
        n: 1,
        id: "after-1",
        question: "What I did:",
        rows: 3,
      },
      {
        kind: "text",
        n: 2,
        id: "after-2",
        question: "What I felt, and where:",
        rows: 3,
      },
      {
        kind: "text",
        n: 3,
        id: "after-3",
        question: "What the other person did:",
        rows: 3,
      },
      {
        kind: "text",
        n: 4,
        id: "after-4",
        question: "What happened between us afterwards — that day, that week:",
        rows: 3,
      },
      {
        kind: "text",
        n: 5,
        id: "after-5",
        question: "What I learned:",
        rows: 3,
      },
    ],
    staysTitle: "What stays with you",
    stays: ["Something I noticed", "A rule I’m chewing", "The next experiment"],
  },
  worksheetUi: {
    figureHint: "Tap the figure to mark a spot; tap a mark to remove it.",
    figureLabel: "Body outline. Tap to mark where you felt it.",
    otherPlaceholder: "your own",
    print: "Print or save as PDF",
    clear: "Clear my answers",
    clearConfirm: "Clear everything? Tap again",
    savedOn: "Kept on this device.",
    savedOff: "Not saved — print or save as PDF to keep your answers.",
  },
  letter: {
    kicker: "The monthly letter",
    title: "A longer letter, once a month",
    text: "What doesn’t fit into a video: one question about feelings and relationships, thought through slowly.",
    button: "Subscribe",
    small: "One email a month. Leaving takes one click.",
    done: "Thank you. Please confirm your address from the email that has just been sent.",
  },
  closing: {
    quote: "The True Self comes from the aliveness of the body tissues and the working of body-functions, including the heart’s action and breathing.",
    attribution: "D. W. Winnicott · 1960",
    name: "Genia",
    role: "Gestalt Counsellor · Human Heart",
    sessions: "Sessions online, in English and Russian.",
    book: "Book a Session",
    watch: "Watch on YouTube",
    fine: "For reflection and self-study. This worksheet is not counselling and does not replace it.",
  },
  sourcesTitle: "Sources",
  sources: [
    "Beisser, A. (1970). The paradoxical theory of change. In J. Fagan & I. L. Shepherd (Eds.), Gestalt Therapy Now. Palo Alto: Science and Behavior Books.",
    "Ferenczi, S. (1909). Introjection and transference. In First Contributions to Psycho-Analysis (1952). London: Hogarth Press.",
    "Ferenczi, S. (1949). Confusion of tongues between the adults and the child: The language of tenderness and of passion. International Journal of Psycho-Analysis, 30(4), 225–230. Read at Wiesbaden, 1932.",
    "Frankel, J. (2002). Exploring Ferenczi’s concept of identification with the aggressor: Its role in trauma, everyday life, and the therapeutic relationship. Psychoanalytic Dialogues, 12(1), 101–139.",
    "Howell, E. F. (2026). The buried, but recently unearthed treasure of Sandor Ferenczi’s work: Its relevance to current practice and sociocultural life. Journal of Trauma & Dissociation, 27(1), 50–62. Published online November 2025.",
    "Perls, F. S. (1947). Ego, Hunger and Aggression. London: Allen & Unwin.",
    "Perls, F., Hefferline, R., & Goodman, P. (1951). Gestalt Therapy: Excitement and Growth in the Human Personality. New York: Julian Press.",
    "Winnicott, D. W. (1965). Ego distortion in terms of true and false self (1960). In The Maturational Processes and the Facilitating Environment (pp. 140–152). London: Hogarth Press.",
  ],
};
