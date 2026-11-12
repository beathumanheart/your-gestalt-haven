/**
 * ============================================================
 * "THE FIRST SESSION" — the article at /take/first-session
 * ============================================================
 * ⚠️ The fee range (€40–€100) and the cancellation rule (24 hours, then paid
 * in full) are also stated in the offer agreement and in the `session_types`
 * rows the service pages price from. If either changes, this text changes
 * with it — there is no derivation here, because the article states the terms
 * in prose rather than quoting a figure, and prose cannot be generated from a
 * column.
 *
 * The two languages are not line-by-line translations. The Russian is written
 * in Russian; where its rhythm differs from the English that is deliberate,
 * so do not "harmonise" them.
 *
 * Links are keys, resolved by the component against config — never written
 * out here. `telegram` comes from SOCIAL_URLS, `email` from the same
 * CONTACT_EMAIL that <GetInTouch /> uses, and `offer` through langPath, so the
 * Russian article links to the Russian agreement.
 * ============================================================
 */

import { CONTACT_EMAIL } from "./contact";

/** Where an inline link points. Resolved in the component, not here. */
export type LinkKey = "offer" | "email" | "telegram";

/** A run of text, or a run of text that is a link. */
export type Inline = string | { text: string; link: LinkKey };

/** A paragraph: plain prose, or prose with links in it. */
export type Paragraph = string | Inline[];

export interface FirstSessionSection {
  /** Stable across both languages, so a link to #cost works in either. */
  id: string;
  heading: string;
  paragraphs: Paragraph[];
}

export interface FirstSessionContent {
  /** Back to the shelf. Matches what the shelf calls itself in this language. */
  crumb: string;
  crumbHere: string;
  kicker: string;
  title: string;
  sections: FirstSessionSection[];
}

export const firstSessionEN: FirstSessionContent = {
  crumb: "Take with you",
  crumbHere: "The first session",
  kicker: "Article",
  title: "The first session",
  sections: [
    {
      id: "cost",
      heading: "What it costs",
      paragraphs: [
        "The first session costs the same as every session after it: between €40 and €100 for fifty minutes. You choose the amount, and I don’t ask for a reason.",
        "The range is a solidarity scale. Those who can pay more make the lower end possible for those who can’t. The lower end is there if you are studying, between jobs, carrying debt or medical costs, or supporting other people.",
        "You pay after the session, within 24 hours, by bank transfer, Wise, Revolut or cryptocurrency. Nothing is paid in advance. If your plans change, tell me 24 hours ahead; a session cancelled later than that, or missed, is paid in full.",
      ],
    },
    {
      id: "before",
      heading: "Before we meet",
      paragraphs: [
        "It starts with a few lines from you, by email or Telegram: what brings you, and three times that would suit you, with your time zone. I reply within two working days.",
        "Once we have agreed a time, I send a link for the video call. I may ask where you will be during the session, and for the contact of someone I could reach in an emergency. We work online, so I am not in the room with you; this is what lets me act if you are ever in danger.",
        "For the call itself, two things help: a place where nobody can overhear you, and ten free minutes afterwards if you can manage them.",
      ],
    },
    {
      id: "session",
      heading: "The fifty minutes",
      paragraphs: [
        "Nothing needs preparing. You can begin with the thing that made you write, with something that happened this morning, or with “I don’t know where to start”. Each of these is a beginning.",
        "There is no questionnaire and no test, and I don’t diagnose. I listen and I ask. Sometimes I suggest slowing down to notice what is happening as you speak: a feeling that arrives, a breath held, a sentence that trails off. Gestalt work pays attention to what is here right now.",
        "How far to go is yours to decide. Something can be named and left for another time, or not said at all. Silence is fine. So are tears, and so is laughing.",
        "Toward the end we stop and look at how it was. You can ask me anything about the way I work. Then the practical part: whether to meet again, and when.",
      ],
    },
    {
      id: "afterwards",
      heading: "Afterwards",
      paragraphs: [
        "One session commits you to nothing. Sometimes a person comes once, gets what they came for, and the work is complete. If we continue, the usual rhythm is weekly, at the same hour: up to ten sessions when one thing needs attention, or from six months onward when the question is how your life as a whole is taking shape.",
        "A first session can leave you tired, lighter, or unsettled for a day or two. That happens when something kept inside for a long time is said aloud.",
      ],
    },
    {
      id: "confidentiality",
      heading: "What stays between us",
      paragraphs: [
        [
          "Everything said in our work is confidential. Two limits apply: a serious risk to life or safety, yours or another person’s, and cases where the law requires disclosure. I discuss my work in supervision, without names or recognisable details; supervision is bound by confidentiality too. The full terms are in the ",
          { text: "offer agreement", link: "offer" },
          ".",
        ],
      ],
    },
    {
      id: "under-18",
      heading: "If you are 16 or 17",
      paragraphs: [
        "I work with people from the age of 16. Until you are 18, one of your parents or guardians needs to know that we are meeting and to agree to it in writing; a short email from them is enough. That adult is also the emergency contact, and usually the one who pays.",
        "What you say in a session stays between you and me. I don’t pass our conversations on to your parents, and if one of them writes to me, you will know about it. The exception is the same one adults have: a serious risk to your life or to someone’s safety.",
        "If you are a parent writing for your son or daughter: I am glad to answer your questions by email before we meet. The session itself I hold with them alone, and it matters that the wish to come is at least partly their own.",
      ],
    },
    {
      id: "begin",
      heading: "How to begin",
      paragraphs: [
        [
          "Write to ",
          { text: CONTACT_EMAIL, link: "email" },
          ", or say hello on ",
          { text: "Telegram", link: "telegram" },
          ". A few lines are plenty.",
        ],
      ],
    },
  ],
};

export const firstSessionRU: FirstSessionContent = {
  /* «Материалы», which is now the shelf's one Russian name: its own title and
     nav label (takeRU), the footer's link to it (navigationRU), and this
     crumb. It used to be called «С собой» in three of those four places and
     «Материалы» in the footer, so a reader met the same page under two names.
     A breadcrumb names the place it returns to as that place names itself —
     the rule the English crumb follows too (it equals takeEN.title). */
  crumb: "Материалы",
  crumbHere: "Первая встреча",
  kicker: "Статья",
  title: "Первая встреча",
  sections: [
    {
      id: "cost",
      heading: "Сколько стоит",
      paragraphs: [
        "Первая встреча стоит столько же, сколько любая следующая: от 40 до 100 € за пятьдесят минут. Сумму выбираете вы, и объяснять свой выбор не нужно.",
        "Это солидарная оплата. Те, кто может платить больше, делают встречи доступными для тех, кому сейчас трудно. Нижняя граница — для вас, если вы учитесь, ищете работу, выплачиваете долги, оплачиваете лечение или поддерживаете близких деньгами.",
        "Оплата — после сессии, в течение 24 часов: банковским переводом, через Wise, Revolut или криптовалютой. Заранее платить ничего не нужно. Если планы меняются, предупредите меня за 24 часа; при более поздней отмене и при пропуске сессия оплачивается полностью.",
      ],
    },
    {
      id: "before",
      heading: "До встречи",
      paragraphs: [
        "Всё начинается с вашего письма или сообщения в Telegram. Нескольких строк достаточно: что вас привело и три удобных варианта времени с вашим часовым поясом. Я отвечаю в течение двух рабочих дней.",
        "Когда мы договорились о времени, я присылаю ссылку на видеозвонок. Я могу спросить, где вы будете во время сессии, и попросить контакт близкого человека для экстренной связи. Мы работаем онлайн, меня нет с вами в одной комнате — так я смогу помочь, если вам будет угрожать опасность.",
        "Для самой встречи пригодятся место, где вас никто не услышит, и, если получится, десять свободных минут после.",
      ],
    },
    {
      id: "session",
      heading: "Пятьдесят минут",
      paragraphs: [
        "Готовиться не нужно. Начать можно с того, из-за чего вы написали, с того, что случилось сегодня утром, или со слов «не знаю, с чего начать». Любое из этих начал подходит.",
        "Анкет и тестов нет, диагнозов я не ставлю. Я слушаю и спрашиваю. Иногда предлагаю замедлиться и заметить, что происходит, пока вы говорите: какое чувство поднялось, где замерло дыхание, на каком слове фраза оборвалась. Гештальт-подход внимателен к тому, что есть прямо сейчас.",
        "Как далеко идти, решаете вы. Что-то можно назвать и отложить, о чём-то не говорить вовсе. Молчать можно. Плакать и смеяться — тоже.",
        "Ближе к концу мы останавливаемся и смотрим, как это было. Вы можете спросить меня о том, как я работаю. После этого — практическое: встречаться ли снова и когда.",
      ],
    },
    {
      id: "afterwards",
      heading: "После",
      paragraphs: [
        "Одна встреча ни к чему не обязывает. Бывает, что человек приходит один раз, получает то, за чем пришёл, и на этом работа закончена. Если мы продолжаем, обычный ритм — раз в неделю в одно и то же время: до десяти встреч, когда внимания требует что-то одно, или от полугода и дальше, когда вопрос в том, как складывается жизнь целиком.",
        "После первой сессии бывает усталость, бывает облегчение, а иногда день-два внутри неспокойно. Так случается, когда вслух звучит то, что долго оставалось внутри.",
      ],
    },
    {
      id: "confidentiality",
      heading: "Что остаётся между нами",
      paragraphs: [
        [
          "Всё, о чём мы говорим, конфиденциально. Ограничений два: серьёзная угроза жизни или безопасности, вашей или другого человека, и случаи, когда раскрытия требует закон. Свою работу я обсуждаю на супервизии, без имён и узнаваемых деталей; супервизия тоже связана конфиденциальностью. Полные условия — в ",
          { text: "договоре оферты", link: "offer" },
          ".",
        ],
      ],
    },
    {
      id: "under-18",
      heading: "Если вам 16 или 17",
      paragraphs: [
        "Я работаю с людьми с 16 лет. Пока вам нет 18, кто-то из родителей или опекунов должен знать о наших встречах и письменно на них согласиться — достаточно короткого письма. Этот же взрослый становится контактом для экстренной связи и чаще всего оплачивает сессии.",
        "То, что вы говорите на сессии, остаётся между нами. Родителям я наши разговоры не пересказываю, а если кто-то из них мне напишет, вы об этом узнаете. Исключение то же, что и у взрослых: серьёзная угроза вашей жизни или чьей-то безопасности.",
        "Если вы родитель и пишете за сына или дочь: на ваши вопросы я с радостью отвечу в письме до встречи. Саму сессию я провожу с подростком наедине, и важно, чтобы желание прийти было хотя бы отчасти его собственным.",
      ],
    },
    {
      id: "begin",
      heading: "Как начать",
      paragraphs: [
        [
          "Напишите на ",
          { text: CONTACT_EMAIL, link: "email" },
          " или поздоровайтесь в ",
          { text: "Telegram", link: "telegram" },
          ". Нескольких строк достаточно.",
        ],
      ],
    },
  ],
};

/** The section order, which both languages share and the guard asserts on. */
export const SECTION_IDS = [
  "cost",
  "before",
  "session",
  "afterwards",
  "confidentiality",
  "under-18",
  "begin",
] as const;
