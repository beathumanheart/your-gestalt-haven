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
  stepDate: string;
  stepTime: string;
  stepDetails: string;
  // Session type
  selectSession: string;
  minutes: string;
  // Date
  selectDate: string;
  // Time
  selectTime: string;
  noSlots: string;
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
  confirmEmail: string;
  confirmMeetLink: string;
  bookAnother: string;
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
}

export const bookingEN: BookingContent = {
  label: "Book a Session",
  title1: "Ready to",
  title2: "Begin?",
  subtitle: "The first step is often the hardest. I'm here to make it as easy as possible.",
  stepSession: "Session",
  stepDate: "Date",
  stepTime: "Time",
  stepDetails: "Details",
  selectSession: "Choose your session type",
  minutes: "min",
  selectDate: "Pick a date",
  selectTime: "Choose a time",
  noSlots: "No available times on this date. Please try another day.",
  yourName: "Your name",
  yourEmail: "Your email",
  namePlaceholder: "Full name",
  emailPlaceholder: "email@example.com",
  notesLabel: "Notes (optional)",
  notesPlaceholder: "Anything you'd like to share before our session...",
  bookButton: "Confirm Booking",
  booking: "Booking...",
  confirmTitle: "You're all set!",
  confirmSubtitle: "A confirmation email has been sent to your inbox.",
  confirmDate: "Date",
  confirmTime: "Time",
  confirmDuration: "Duration",
  confirmEmail: "Confirmation sent to",
  confirmMeetLink: "Join via Google Meet",
  bookAnother: "Book another session",
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
  stepDate: "Дата",
  stepTime: "Время",
  stepDetails: "Данные",
  selectSession: "Выберите тип сессии",
  minutes: "мин",
  selectDate: "Выберите дату",
  selectTime: "Выберите время",
  noSlots: "Нет свободных слотов на эту дату. Попробуйте другой день.",
  yourName: "Ваше имя",
  yourEmail: "Ваш email",
  namePlaceholder: "Полное имя",
  emailPlaceholder: "email@example.com",
  notesLabel: "Заметки (необязательно)",
  notesPlaceholder: "Что-нибудь, чем хотите поделиться до сессии...",
  bookButton: "Подтвердить запись",
  booking: "Запись...",
  confirmTitle: "Готово!",
  confirmSubtitle: "Подтверждение отправлено на вашу почту.",
  confirmDate: "Дата",
  confirmTime: "Время",
  confirmDuration: "Длительность",
  confirmEmail: "Подтверждение отправлено на",
  confirmMeetLink: "Подключиться через Google Meet",
  bookAnother: "Записаться ещё раз",
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
