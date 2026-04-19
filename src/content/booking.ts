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
  signalLabel: string;
  signalUrl: string;
  sessionLabel: string;
  sessionId: string;
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
  bookAnother: "Book another session",
  cancelBooking: "Cancel booking",
  cancelledSuccess: "Booking cancelled successfully.",
  emailWarning: "We had trouble sending your confirmation email, but your booking is saved. Please copy the meeting link below — it's your way in.",
  errorGeneral: "Something went wrong. Please try again or reach out directly.",
  errorNetwork: "We couldn't reach our booking system. Please check your connection and try again.",
  errorServer: "Our booking system is having trouble. Please try again in a moment, or reach out via Telegram or Signal.",
  errorNameRequired: "Name is required",
  errorEmailRequired: "Email is required",
  errorEmailInvalid: "Please enter a valid email",
  confidential: "If you prefer, just reach out directly on ",
  telegramLabel: "Telegram",
  telegramUrl: "https://t.me/humanheartbeat",
  signalLabel: "Signal",
  signalUrl: "https://signal.me/#eu/54EL7BMiWPJCsLFzC0PY4J6uP4Ds7eu4cL243diq7MXIk1-L8oJGyIcY05eV_gCN",
  sessionLabel: "Session",
  sessionId: "05e95070d5641f3eaefb760ff151e043e5cc27df1bed974b575d98c32e1cc56c2e",
  orText: ", ",
  back: "Back",
  next: "Next",
  optional: "optional",
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
  bookAnother: "Записаться ещё раз",
  cancelBooking: "Отменить запись",
  cancelledSuccess: "Запись успешно отменена.",
  emailWarning: "Не удалось отправить письмо с подтверждением, но ваша запись сохранена. Скопируйте ссылку на встречу — она откроет вам доступ к сессии.",
  errorGeneral: "Что-то пошло не так. Попробуйте ещё раз или напишите нам напрямую.",
  errorNetwork: "Не удалось подключиться к системе записи. Проверьте интернет-соединение и попробуйте ещё раз.",
  errorServer: "В системе записи возникли проблемы. Попробуйте через минуту или свяжитесь через Telegram или Signal.",
  errorNameRequired: "Имя обязательно",
  errorEmailRequired: "Email обязателен",
  errorEmailInvalid: "Введите корректный email",
  confidential: "Если хотите — просто напишите в ",
  telegramLabel: "Telegram",
  telegramUrl: "https://t.me/humanheartbeat",
  signalLabel: "Signal",
  signalUrl: "https://signal.me/#eu/54EL7BMiWPJCsLFzC0PY4J6uP4Ds7eu4cL243diq7MXIk1-L8oJGyIcY05eV_gCN",
  sessionLabel: "Session",
  sessionId: "05e95070d5641f3eaefb760ff151e043e5cc27df1bed974b575d98c32e1cc56c2e",
  orText: ", ",
  back: "Назад",
  next: "Далее",
  optional: "необязательно",
};
