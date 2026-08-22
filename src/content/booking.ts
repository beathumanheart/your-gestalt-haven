/**
 * ============================================================
 * BOOKING SECTION CONTENT
 * ============================================================
 */

import { SOCIAL_URLS } from "@/config/social";

export interface BookingContent {
  label: string;
  title1: string;
  title2: string;
  subtitle: string;
  // Steps
  stepSession: string;
  stepDateTime: string;
  stepDetails: string;
  // Session type
  selectSession: string;
  minutes: string;
  // Date & Time
  selectDate: string;
  selectTime: string;
  noSlots: string;
  timezone: string;
  availableLabel: string;
  unavailableLabel: string;
  // Form
  yourName: string;
  yourEmail: string;
  yourEmail2: string;
  email2Hint: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  notesLabel: string;
  notesPlaceholder: string;
  bookButton: string;
  booking: string;
  // Confirmation
  confirmTitle: string;
  confirmSubtitle: string;
  confirmDate: string;
  confirmTime: string;
  confirmDuration: string;
  confirmTimezone: string;
  confirmEmail: string;
  confirmMeetLink: string;
  copyMeetLink: string;
  copiedMeetLink: string;
  bookAnother: string;
  cancelBooking: string;
  cancelledSuccess: string;
  // Email warning (confirmation screen when email failed to send)
  emailWarning: string;
  // Errors
  errorGeneral: string;
  errorNetwork: string;
  errorServer: string;
  errorNameRequired: string;
  errorEmailRequired: string;
  errorEmailInvalid: string;
  // Footer note
  confidential: string;
  telegramLabel: string;
  telegramUrl: string;
  emailLabel: string;
  emailUrl: string;
  // Navigation
  back: string;
  next: string;
  optional: string;
  /** Sticky action bar: prompt shown before anything is chosen. */
  barChooseSession: string;
  barChooseDateTime: string;
  barFillDetails: string;
  barAgreeTerms: string;
  /** Step 3 primary action. The success state uses the same verb. */
  bookSession: string;
  sessionBooked: string;
  // Terms (task 7)
  termsHeading: string;
  termsFee: string;
  termsCancellation: string;
  termsPayment: string;
  termsConfidentiality: string;
  termsCheckboxLabel: string;
  termsLinkText: string;
  termsRequiredError: string;
  termsVersionLabel: string;
  termsModalClose: string;
  // Availability enforcement (client-facing)
  horizonNote: string;      // contains [date] placeholder
  minNoticeTooltip: string; // contains [N] placeholder
  closedDateTooltip: string;
}

export const bookingEN: BookingContent = {
  label: "Book a Session",
  title1: "Ready to",
  title2: "Begin?",
  subtitle: "The first step is often the hardest. I'm here to make it as easy as possible.",
  stepSession: "Session",
  stepDateTime: "Date & Time",
  stepDetails: "Details",
  selectSession: "Choose your session type",
  minutes: "min",
  selectDate: "Pick a date",
  selectTime: "Choose a time",
  noSlots: "No available times on this date. Please try another day.",
  timezone: "Timezone",
  availableLabel: "Available",
  unavailableLabel: "Unavailable",
  yourName: "Your name",
  yourEmail: "Your email",
  yourEmail2: "Second email",
  email2Hint: "Send confirmation to another address too",
  namePlaceholder: "Preferred name",
  emailPlaceholder: "email@example.com",
  notesLabel: "Your enquiry",
  notesPlaceholder: "Anything you'd like to share before our session...",
  bookButton: "Confirm Booking",
  booking: "Booking...",
  confirmTitle: "You're all set!",
  confirmSubtitle: "A confirmation email has been sent to your inbox.",
  confirmDate: "Date",
  confirmTime: "Time",
  confirmDuration: "Duration",
  confirmTimezone: "Timezone",
  confirmEmail: "Confirmation sent to",
  confirmMeetLink: "Join Video Session",
  copyMeetLink: "Copy meeting link",
  copiedMeetLink: "✓ Copied!",
  bookAnother: "Book another session",
  cancelBooking: "Cancel booking",
  cancelledSuccess: "Booking cancelled successfully.",
  emailWarning: "We had trouble sending your confirmation email, but your booking is saved. Please save the meeting link below — it's your way in.",
  errorGeneral: "Something went wrong. Please try again or reach out directly.",
  errorNetwork: "We couldn't reach our booking system. Please check your connection and try again.",
  errorServer: "Our booking system is having trouble. Please try again in a moment, or reach out via Telegram.",
  errorNameRequired: "Name is required",
  errorEmailRequired: "Email is required",
  errorEmailInvalid: "Please enter a valid email",
  confidential: "If you prefer, just reach out directly on ",
  telegramLabel: "Telegram",
  telegramUrl: SOCIAL_URLS.telegram,
  emailLabel: "be@humanheart.life",
  emailUrl: "mailto:be@humanheart.life",
  back: "Back",
  next: "Next",
  barChooseSession: "Choose a session type",
  barChooseDateTime: "Choose a date and time",
  barFillDetails: "Add your name and email",
  barAgreeTerms: "Agree to the terms to book",
  bookSession: "Book session",
  sessionBooked: "Session booked",
  termsHeading: "Before you book",
  termsFee: "Sessions are on a sliding scale from €40 to €80 — you choose what fits.",
  termsCancellation: "Cancel or reschedule free of charge up to 24 hours before your session.",
  termsPayment:
    "Payment is due after each session — by bank transfer, Wise, Revolut, or cryptocurrency.",
  termsConfidentiality: "Everything you bring stays between us, except where the law requires otherwise.",
  termsCheckboxLabel: "I've read and agree to the",
  termsLinkText: "terms of service",
  termsRequiredError: "Please read and agree to the terms before booking.",
  termsVersionLabel: "Version",
  termsModalClose: "Close",
  optional: "optional",
  horizonNote: "Bookings available up to [date]. For later dates, please contact directly.",
  minNoticeTooltip: "Please book at least [N] hours in advance.",
  closedDateTooltip: "Unavailable on this date.",
};

export const bookingRU: BookingContent = {
  label: "Запись",
  title1: "Готовы",
  title2: "начать?",
  subtitle: "Первый шаг — часто самый сложный. Я сделаю всё, чтобы это было проще.",
  stepSession: "Сессия",
  stepDateTime: "Дата и время",
  stepDetails: "Данные",
  selectSession: "Выберите тип сессии",
  minutes: "мин",
  selectDate: "Выберите дату",
  selectTime: "Выберите время",
  noSlots: "Нет свободных слотов на эту дату. Попробуйте другой день.",
  timezone: "Часовой пояс",
  availableLabel: "Доступно",
  unavailableLabel: "Недоступно",
  yourName: "Ваше имя",
  yourEmail: "Ваш email",
  yourEmail2: "Второй email",
  email2Hint: "Отправить подтверждение ещё на один адрес",
  namePlaceholder: "Предпочитаемое имя",
  emailPlaceholder: "email@example.com",
  notesLabel: "Ваш запрос",
  notesPlaceholder: "Что-нибудь, чем хотите поделиться до сессии...",
  bookButton: "Подтвердить запись",
  booking: "Запись...",
  confirmTitle: "Готово!",
  confirmSubtitle: "Подтверждение отправлено на вашу почту.",
  confirmDate: "Дата",
  confirmTime: "Время",
  confirmDuration: "Длительность",
  confirmTimezone: "Часовой пояс",
  confirmEmail: "Подтверждение отправлено на",
  confirmMeetLink: "Присоединиться к видеосессии",
  copyMeetLink: "Скопировать ссылку на встречу",
  copiedMeetLink: "✓ Скопировано!",
  bookAnother: "Записаться ещё раз",
  cancelBooking: "Отменить запись",
  cancelledSuccess: "Запись успешно отменена.",
  emailWarning: "Не удалось отправить письмо с подтверждением, но ваша запись сохранена. Сохраните ссылку на встречу — она откроет вам доступ к сессии.",
  errorGeneral: "Что-то пошло не так. Попробуйте ещё раз или напишите нам напрямую.",
  errorNetwork: "Не удалось подключиться к системе записи. Проверьте интернет-соединение и попробуйте ещё раз.",
  errorServer: "В системе записи возникли проблемы. Попробуйте через минуту или свяжитесь через Telegram.",
  errorNameRequired: "Имя обязательно",
  errorEmailRequired: "Email обязателен",
  errorEmailInvalid: "Введите корректный email",
  confidential: "Если хотите — просто напишите в ",
  telegramLabel: "Telegram",
  telegramUrl: SOCIAL_URLS.telegram,
  emailLabel: "be@humanheart.life",
  emailUrl: "mailto:be@humanheart.life",
  back: "Назад",
  next: "Далее",
  barChooseSession: "Выберите тип сессии",
  barChooseDateTime: "Выберите дату и время",
  barFillDetails: "Укажите имя и почту",
  barAgreeTerms: "Примите условия, чтобы записаться",
  bookSession: "Записаться",
  sessionBooked: "Вы записаны",
  termsHeading: "Перед записью",
  termsFee: "Стоимость сессии — по свободной шкале от 40 до 80 €, вы выбираете сумму сами.",
  termsCancellation: "Отменить или перенести сессию можно бесплатно не позднее чем за 24 часа.",
  termsPayment:
    "Оплата — после каждой сессии: банковским переводом, Wise, Revolut или криптовалютой.",
  termsConfidentiality: "Всё, что вы приносите на сессию, остаётся между нами — кроме случаев, прямо предусмотренных законом.",
  termsCheckboxLabel: "Я прочитал(а) и принимаю",
  termsLinkText: "условия оказания услуг",
  termsRequiredError: "Пожалуйста, прочитайте и примите условия, чтобы записаться.",
  termsVersionLabel: "Редакция",
  termsModalClose: "Закрыть",
  optional: "необязательно",
  horizonNote: "Запись доступна до [date]. Для более поздних дат свяжитесь напрямую.",
  minNoticeTooltip: "Пожалуйста, записывайтесь минимум за [N] часов.",
  closedDateTooltip: "Дата недоступна.",
};
