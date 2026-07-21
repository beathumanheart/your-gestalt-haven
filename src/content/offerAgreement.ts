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
        "This offer agreement defines the terms of counselling services provided in the Gestalt tradition. Payment for a session constitutes acceptance of these terms.",
      ],
    },
    {
      heading: "2. Counsellor Rights and Responsibilities",
      bullets: [
        "Adherence to the ethical standards published by the European Association for Gestalt Therapy (EAGT)",
        "Maintaining confidentiality of all information obtained during the work",
        "Regular personal therapy and supervision",
        "Providing a safe space for the work",
        "Right to terminate work if boundaries or ethical standards are violated",
        "Referral to another specialist when necessary",
      ],
    },
    {
      heading: "3. Client Rights and Responsibilities",
      bullets: [
        "Right to confidentiality and to be treated with respect",
        "Right to end the work at any time",
        "Right to ask questions about methods of work",
        "Obligation to notify of session cancellation 24 hours in advance",
        "Obligation to inform the counsellor of any prescribed medication or ongoing psychiatric care",
        "Obligation to provide current location and an emergency contact before the first session",
        "Timely payment for sessions",
      ],
    },
    {
      heading: "4. Limitations and Risks",
      bullets: [
        "Counselling is not a substitute for psychiatric or medical treatment for clinical diagnoses",
        "This work does not include diagnosis, medical treatment, prescription of medication, or the issuing of clinical reports or certificates",
        "Outcomes are individual and cannot be guaranteed",
        "Temporary intensification of feelings may occur during the work — this is part of the process",
        "The counsellor does not give advice or make decisions for the client",
        "In case of suicidal thoughts or acute conditions, contact emergency services in your location",
      ],
    },
    {
      heading: "5. Confidentiality",
      paragraphs: [
        "All information shared in our work is confidential. I work to the ethical standards published by the European Association for Gestalt Therapy (EAGT).",
        "Confidentiality may be set aside only where there is a serious risk to the life or safety of the client or another person, or where disclosure is required by law applicable at the time.",
        "Anonymised material may be discussed in professional supervision, which is itself bound by confidentiality.",
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
        "Sessions are held online, or occasionally in person by prior agreement. Duration — 50 minutes. Weekly sessions at the same time are recommended.",
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
