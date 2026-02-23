/**
 * ============================================================
 * OFFER AGREEMENT CONTENT
 * ============================================================
 * Edit this file to update all text on the Offer Agreement page.
 * Structure: each section has a heading + either paragraphs or bullet points.
 * Both EN and RU translations are side by side for easy editing.
 * ============================================================
 */

export interface Section {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface OfferAgreementContent {
  backLink: string;
  pageTitle: string;
  sections: Section[];
}

export const offerAgreementEN: OfferAgreementContent = {
  backLink: "Back to Home",
  pageTitle: "Offer Agreement",
  sections: [
    {
      heading: "1. General Provisions",
      paragraphs: [
        "This offer agreement defines the terms of psychotherapy services provided in the Gestalt therapy format. Payment for a session constitutes acceptance of these terms.",
      ],
    },
    {
      heading: "2. Therapist Rights and Responsibilities",
      bullets: [
        "Adherence to ethical standards of the European Association for Gestalt Therapy (EAGT)",
        "Maintaining confidentiality of all information obtained during therapy",
        "Regular personal therapy and supervision",
        "Providing a safe space for therapeutic work",
        "Right to terminate work if boundaries or ethical standards are violated",
        "Referral to another specialist when necessary",
      ],
    },
    {
      heading: "3. Client Rights and Responsibilities",
      bullets: [
        "Right to confidentiality and respectful treatment",
        "Right to terminate therapy at any time",
        "Right to ask questions about methods of work",
        "Obligation to notify of session cancellation 24 hours in advance",
        "Obligation to disclose prescribed medications and psychiatric care",
        "Timely payment for sessions",
      ],
    },
    {
      heading: "4. Limitations and Risks",
      bullets: [
        "Psychotherapy is not a substitute for psychiatric treatment for clinical diagnoses",
        "Therapy outcomes are individual and cannot be guaranteed",
        "Temporary intensification of experiences may occur during therapy — this is part of the process",
        "The therapist does not give advice or make decisions for the client",
        "In case of suicidal thoughts or acute conditions, contact emergency services",
      ],
    },
    {
      heading: "5. Confidentiality",
      paragraphs: [
        "All information obtained during therapy is strictly confidential. Exceptions are cases provided by law: threat to the life of the client or third parties.",
      ],
    },
    {
      heading: "6. Payment and Cancellation",
      bullets: [
        "Session cost: starting from €40 (solidarity pricing)",
        "Payment is made 24 hours before or after the session",
        "Cancellations with less than 24 hours notice are charged in full",
        "Missed sessions without notice are charged in full",
      ],
    },
    {
      heading: "7. Session Format",
      paragraphs: [
        "Sessions are conducted online via Google Meet, duration — 50 minutes. Weekly sessions at the same time are recommended.",
      ],
    },
  ],
};

export const offerAgreementRU: OfferAgreementContent = {
  backLink: "На главную",
  pageTitle: "Договор оферты",
  sections: [
    {
      heading: "1. Общие положения",
      paragraphs: [
        "Настоящий договор-оферта определяет условия предоставления психотерапевтических услуг в формате гештальт-терапии. Оплата сессии означает принятие условий данного договора.",
      ],
    },
    {
      heading: "2. Права и обязанности терапевта",
      bullets: [
        "Соблюдение этических стандартов Европейской гештальт-ассоциации (EAGT)",
        "Сохранение конфиденциальности всей информации, полученной в процессе терапии",
        "Регулярное прохождение личной терапии и супервизии",
        "Предоставление безопасного пространства для терапевтической работы",
        "Право прекратить работу при нарушении границ или этических норм",
        "Направление к другому специалисту при необходимости",
      ],
    },
    {
      heading: "3. Права и обязанности клиента",
      bullets: [
        "Право на конфиденциальность и уважительное отношение",
        "Право прекратить терапию в любой момент",
        "Право задавать вопросы о методах работы",
        "Обязанность предупреждать об отмене сессии за 24 часа",
        "Обязанность сообщать о назначенных медикаментах и наблюдении у психиатра",
        "Своевременная оплата сессий",
      ],
    },
    {
      heading: "4. Ограничения и риски",
      bullets: [
        "Психотерапия не является заменой психиатрического лечения при клинических диагнозах",
        "Результаты терапии индивидуальны и не могут быть гарантированы",
        "В процессе терапии возможно временное усиление переживаний — это часть процесса",
        "Терапевт не даёт советов и не принимает решения за клиента",
        "При суицидальных мыслях или острых состояниях необходимо обращаться в экстренные службы",
      ],
    },
    {
      heading: "5. Конфиденциальность",
      paragraphs: [
        "Вся информация, полученная в ходе терапии, является строго конфиденциальной. Исключения составляют случаи, предусмотренные законодательством: угроза жизни клиента или третьих лиц.",
      ],
    },
    {
      heading: "6. Оплата и отмена",
      bullets: [
        "Стоимость сессии: от €40 (солидарное ценообразование)",
        "Оплата производится за 24 часа до или после сессии",
        "При отмене менее чем за 24 часа сессия оплачивается полностью",
        "Пропущенная без предупреждения сессия оплачивается полностью",
      ],
    },
    {
      heading: "7. Формат работы",
      paragraphs: [
        "Сессии проводятся онлайн через Google Meet, длительность — 50 минут. Рекомендуется еженедельный формат в одно и то же время.",
      ],
    },
  ],
};
