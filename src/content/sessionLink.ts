/** Copy for the short session links: /s/<slug> (join) and /c/<slug> (cancel). */

export const sessionLinkEN = {
  // Join
  checking: "Checking your session…",
  openingTitle: "Opening your session",
  openingText: "Taking you to the video room. If nothing happens, use the button below.",
  openManually: "Open the video room",
  earlyTitle: "Not quite yet",
  earlyText: (time: string, tz: string) =>
    `Your session with Genia starts at ${time} (${tz}).`,
  earlySub: "This page will let you in 15 minutes before.",
  earlyCountdown: (countdown: string) => `Opens in ${countdown}`,
  expiredTitle: "This session has ended",
  expiredText: "The join link for this session is no longer active.",
  cancelledTitle: "This session was cancelled",
  cancelledText: "This booking has been cancelled, so the video room is closed.",
  notFoundTitle: "Link not found",
  notFoundText:
    "We couldn't find a session for this link. It may have been mistyped, or truncated by an email client.",
  errorTitle: "Something went wrong",
  errorText: "We couldn't check your session just now. Please try again.",
  retry: "Try again",
  bookAnother: "Book a session",
  backHome: "Back to home",

  // Cancel
  cancelTitle: "Cancel this booking?",
  cancelIntro: "You're about to cancel:",
  cancelConfirm: "Yes, cancel my booking",
  cancelKeep: "No, keep my booking",
  cancelling: "Cancelling…",
  cancelledDoneTitle: "Booking cancelled",
  cancelledDoneText:
    "Your session has been cancelled and removed from your calendar. A confirmation is on its way.",
  alreadyCancelledTitle: "Already cancelled",
  alreadyCancelledText: "This booking has already been cancelled.",
  cancelPastTitle: "This session has already passed",
  cancelPastText: "There's nothing left to cancel for this booking.",
  cancelErrorTitle: "Couldn't cancel",
  cancelErrorText: "Something went wrong cancelling this booking. Please try again, or reply to your confirmation email.",
  tooManyTitle: "Too many attempts",
  tooManyText: "Please wait a few minutes and try again.",
};

export const sessionLinkRU: typeof sessionLinkEN = {
  // Join
  checking: "Проверяем вашу сессию…",
  openingTitle: "Открываем сессию",
  openingText: "Переходим в видеокомнату. Если ничего не произошло, нажмите кнопку ниже.",
  openManually: "Открыть видеокомнату",
  earlyTitle: "Ещё рано",
  earlyText: (time: string, tz: string) =>
    `Ваша сессия с Genia начнётся в ${time} (${tz}).`,
  earlySub: "Эта страница впустит вас за 15 минут до начала.",
  earlyCountdown: (countdown: string) => `Откроется через ${countdown}`,
  expiredTitle: "Сессия завершена",
  expiredText: "Ссылка на эту сессию больше не активна.",
  cancelledTitle: "Сессия отменена",
  cancelledText: "Эта запись была отменена, видеокомната закрыта.",
  notFoundTitle: "Ссылка не найдена",
  notFoundText:
    "Мы не нашли сессию по этой ссылке. Возможно, она была введена с ошибкой или обрезана почтовым клиентом.",
  errorTitle: "Что-то пошло не так",
  errorText: "Не удалось проверить вашу сессию. Пожалуйста, попробуйте ещё раз.",
  retry: "Попробовать снова",
  bookAnother: "Записаться на сессию",
  backHome: "На главную",

  // Cancel
  cancelTitle: "Отменить запись?",
  cancelIntro: "Вы собираетесь отменить:",
  cancelConfirm: "Да, отменить запись",
  cancelKeep: "Нет, оставить запись",
  cancelling: "Отменяем…",
  cancelledDoneTitle: "Запись отменена",
  cancelledDoneText:
    "Ваша сессия отменена и удалена из календаря. Подтверждение придёт на почту.",
  alreadyCancelledTitle: "Уже отменено",
  alreadyCancelledText: "Эта запись уже была отменена.",
  cancelPastTitle: "Сессия уже прошла",
  cancelPastText: "Отменять больше нечего.",
  cancelErrorTitle: "Не удалось отменить",
  cancelErrorText:
    "Что-то пошло не так при отмене. Попробуйте ещё раз или ответьте на письмо с подтверждением.",
  tooManyTitle: "Слишком много попыток",
  tooManyText: "Пожалуйста, подождите несколько минут и попробуйте снова.",
};
