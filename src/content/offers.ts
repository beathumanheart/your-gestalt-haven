export interface OffersContent {
  conditionsHeading: string;
  conditionsCheckbox: string;
  calendarGateHint: string;
  free: string;
  bookASession: string;
  backToHome: string;
  offerUnavailableTitle: string;
  offerUnavailableMessage: string;
  contactUs: string;
}

export const offersEN: OffersContent = {
  conditionsHeading: "Conditions for this offer",
  conditionsCheckbox: "I have read and agree to these conditions",
  calendarGateHint: "Please read and accept the conditions above to continue.",
  free: "Free",
  bookASession: "Book a session",
  backToHome: "Back to home",
  offerUnavailableTitle: "This offer is no longer available",
  offerUnavailableMessage:
    "The link you followed may have expired or been withdrawn. Please get in touch directly if you have any questions.",
  contactUs: "Contact us",
};

export const offersRU: OffersContent = {
  conditionsHeading: "Условия этого предложения",
  conditionsCheckbox: "Я прочитал(а) и согласен(а) с этими условиями",
  calendarGateHint: "Пожалуйста, прочитайте и примите условия выше, чтобы продолжить.",
  free: "Бесплатно",
  bookASession: "Записаться",
  backToHome: "На главную",
  offerUnavailableTitle: "Это предложение больше недоступно",
  offerUnavailableMessage:
    "Ссылка, по которой вы перешли, возможно, устарела или была отозвана. Пожалуйста, свяжитесь напрямую, если у вас есть вопросы.",
  contactUs: "Написать",
};
