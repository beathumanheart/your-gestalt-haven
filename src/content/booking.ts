/**
 * ============================================================
 * BOOKING SECTION CONTENT
 * ============================================================
 */

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
  bookAnother: string;
  cancelBooking: string;
  cancelledSuccess: string;
  // Errors
  errorGeneral: string;
  errorNameRequired: string;
  errorEmailRequired: string;
  errorEmailInvalid: string;
  // Footer note
  confidential: string;
  telegramLabel: string;
  telegramUrl: string;
  signalLabel: string;
  signalUrl: string;
  orText: string;
  // Navigation
  back: string;
  next: string;
  optional: string;
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
  bookAnother: "Book another session",
  cancelBooking: "Cancel booking",
  cancelledSuccess: "Booking cancelled successfully.",
  errorGeneral: "Something went wrong. Please try again.",
  errorNameRequired: "Name is required",
  errorEmailRequired: "Email is required",
  errorEmailInvalid: "Please enter a valid email",
  confidential: "If you prefer, just reach out directly on ",
  telegramLabel: "Telegram",
  telegramUrl: "https://t.me/humanheartbeat",
  signalLabel: "Signal",
  signalUrl: "https://signal.me/#eu/54EL7BMiWPJCsLFzC0PY4J6uP4Ds7eu4cL243diq7MXIk1-L8oJGyIcY05eV_gCN",
  orText: " or ",
  back: "Back",
  next: "Next",
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
  bookAnother: "Записаться ещё раз",
  cancelBooking: "Отменить запись",
  cancelledSuccess: "Запись успешно отменена.",
  errorGeneral: "Что-то пошло не так. Попробуйте ещё раз.",
  errorNameRequired: "Имя обязательно",
  errorEmailRequired: "Email обязателен",
  errorEmailInvalid: "Введите корректный email",
  confidential: "Если хотите — просто напишите в ",
  telegramLabel: "Telegram",
  telegramUrl: "https://t.me/humanheartbeat",
  signalLabel: "Signal",
  signalUrl: "https://signal.me/#eu/54EL7BMiWPJCsLFzC0PY4J6uP4Ds7eu4cL243diq7MXIk1-L8oJGyIcY05eV_gCN",
  orText: " или ",
  back: "Назад",
  next: "Далее",
};
