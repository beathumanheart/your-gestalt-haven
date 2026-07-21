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
        "Настоящий договор-оферта определяет условия оказания услуг психологического консультирования в гештальт-подходе. Оплата сессии означает принятие настоящих условий.",
      ],
    },
    {
      heading: "2. Права и обязанности консультанта",
      bullets: [
        "Соблюдение этических стандартов, опубликованных Европейской ассоциацией гештальт-терапии (EAGT)",
        "Сохранение конфиденциальности всей информации, полученной в ходе работы",
        "Регулярное прохождение личной терапии и супервизии",
        "Обеспечение безопасного пространства для работы",
        "Право прекратить работу при нарушении границ или этических норм",
        "Направление к другому специалисту при необходимости",
      ],
    },
    {
      heading: "3. Права и обязанности клиента",
      bullets: [
        "Право на конфиденциальность и уважительное отношение",
        "Право прекратить работу в любой момент",
        "Право задавать вопросы о методах работы",
        "Обязанность предупреждать об отмене сессии за 24 часа",
        "Обязанность сообщить консультанту о назначенных медикаментах и наблюдении у психиатра",
        "Обязанность до первой сессии сообщить своё местонахождение и контакт для экстренной связи",
        "Своевременная оплата сессий",
      ],
    },
    {
      heading: "4. Ограничения и риски",
      bullets: [
        "Консультирование не заменяет психиатрическое или медицинское лечение при клинических диагнозах",
        "Эта работа не включает постановку диагноза, лечение, назначение медикаментов, а также выдачу медицинских заключений или справок",
        "Результаты индивидуальны и не могут быть гарантированы",
        "В ходе работы возможно временное усиление переживаний — это часть процесса",
        "Консультант не даёт советов и не принимает решений за клиента",
        "При суицидальных мыслях или острых состояниях обратитесь в экстренные службы по месту вашего нахождения",
      ],
    },
    {
      heading: "5. Конфиденциальность",
      paragraphs: [
        "Вся информация, которой вы делитесь в ходе работы, конфиденциальна. Я работаю в соответствии с этическими стандартами, опубликованными Европейской ассоциацией гештальт-терапии (EAGT).",
        "Конфиденциальность может быть ограничена только при серьёзной угрозе жизни или безопасности клиента или другого человека, а также если раскрытие информации требуется применимым законодательством.",
        "Обезличенные материалы могут обсуждаться в профессиональной супервизии, которая сама связана обязательством конфиденциальности.",
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
        "Сессии проходят онлайн или, по предварительной договорённости, очно. Продолжительность — 50 минут. Рекомендуются еженедельные сессии в одно и то же время.",
      ],
    },
  ],
};
