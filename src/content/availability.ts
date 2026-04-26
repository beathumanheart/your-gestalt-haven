/**
 * ============================================================
 * AVAILABILITY SECTION CONTENT
 * Admin: Booking rules, Date overrides
 * Client-facing: horizon note, notice tooltip, closed tooltip
 * ============================================================
 */

export interface AvailabilityContent {
  // Booking Rules section
  bookingRules: string;
  horizonLabel: string;
  horizonUnit_days: string;
  horizonUnit_weeks: string;
  horizonUnit_months: string;
  noticeLabel: string;
  noticeUnit_hours: string;
  noticeUnit_days: string;
  saved: string;
  saving: string;
  saveFailed: string;

  // Date Overrides section
  dateOverrides: string;
  dateOverridesSubtitle: string;
  addOverride: string;
  overrideType: string;
  overrideClosedLabel: string;
  overrideOpenLabel: string;
  badgeClosed: string;
  badgeOpen: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  noteLabel: string;
  cancel: string;
  save: string;
  delete: string;

  // Validation errors
  errPastDate: string;
  errEndBeforeStart: string;
  errMissingTimes: string;
  errEndTimeBeforeStart: string;

  // Overlap warning (non-blocking)
  warnOverlapBody: string;

  // Conflict dialog (confirmed bookings exist in range)
  conflictTitle: string;
  conflictBody: string; // prepend count, append this string
  conflictContinue: string;
  conflictCancel: string;

  // Client-facing enforcement
  horizonNote: string;   // contains [date] placeholder
  minNoticeTooltip: string; // contains [N] placeholder
  closedDateTooltip: string;
}

export const availabilityEN: AvailabilityContent = {
  bookingRules: "Booking rules",
  horizonLabel: "Clients can book up to",
  horizonUnit_days: "days",
  horizonUnit_weeks: "weeks",
  horizonUnit_months: "months",
  noticeLabel: "Minimum notice before session",
  noticeUnit_hours: "hours",
  noticeUnit_days: "days",
  saved: "✓ Saved",
  saving: "Saving...",
  saveFailed: "Failed to save",

  dateOverrides: "Date overrides",
  dateOverridesSubtitle: "Block off vacations, holidays, or add one-off sessions",
  addOverride: "+ Add date override",
  overrideType: "Override type",
  overrideClosedLabel: "Closed (unavailable)",
  overrideOpenLabel: "Open (one-off availability)",
  badgeClosed: "Closed",
  badgeOpen: "Open",
  startDate: "Start date",
  endDate: "End date",
  startTime: "Start time",
  endTime: "End time",
  noteLabel: "Note (optional)",
  cancel: "Cancel",
  save: "Save",
  delete: "Delete",

  errPastDate: "Cannot create overrides for past dates",
  errEndBeforeStart: "End date must be on or after start date",
  errMissingTimes: "Start time and end time are required for open overrides",
  errEndTimeBeforeStart: "End time must be after start time",

  warnOverlapBody:
    "This overlaps an existing closed period. Consider editing the existing one instead.",

  conflictTitle: "⚠️ Conflicting bookings",
  conflictBody:
    "existing confirmed booking(s) fall within this closed period. These bookings will NOT be auto-cancelled — you'll need to contact those clients and reschedule manually.",
  conflictContinue: "Continue and save override",
  conflictCancel: "Cancel",

  horizonNote:
    "Bookings available up to [date]. For later dates, please contact directly.",
  minNoticeTooltip: "Please book at least [N] hours in advance.",
  closedDateTooltip: "Unavailable on this date.",
};

export const availabilityRU: AvailabilityContent = {
  bookingRules: "Правила записи",
  horizonLabel: "Клиенты могут записаться до",
  horizonUnit_days: "дней",
  horizonUnit_weeks: "недель",
  horizonUnit_months: "месяцев",
  noticeLabel: "Минимальное предупреждение до сессии",
  noticeUnit_hours: "часов",
  noticeUnit_days: "дней",
  saved: "✓ Сохранено",
  saving: "Сохранение...",
  saveFailed: "Не удалось сохранить",

  dateOverrides: "Исключения по датам",
  dateOverridesSubtitle:
    "Закройте дни для отпуска, праздников или добавьте разовые сессии",
  addOverride: "+ Добавить исключение",
  overrideType: "Тип исключения",
  overrideClosedLabel: "Закрыто (недоступно)",
  overrideOpenLabel: "Открыто (разовая доступность)",
  badgeClosed: "Закрыто",
  badgeOpen: "Открыто",
  startDate: "Дата начала",
  endDate: "Дата окончания",
  startTime: "Время начала",
  endTime: "Время окончания",
  noteLabel: "Примечание (необязательно)",
  cancel: "Отмена",
  save: "Сохранить",
  delete: "Удалить",

  errPastDate: "Нельзя создавать исключения для прошедших дат",
  errEndBeforeStart: "Дата окончания должна быть не раньше даты начала",
  errMissingTimes: "Для открытых исключений необходимо указать время начала и окончания",
  errEndTimeBeforeStart: "Время окончания должно быть позже времени начала",

  warnOverlapBody:
    "Это исключение пересекается с существующим закрытым периодом. Рассмотрите возможность редактирования существующего.",

  conflictTitle: "⚠️ Конфликт с записями",
  conflictBody:
    "подтверждённых записей попадают в этот закрытый период. Они НЕ будут автоматически отменены — вам нужно связаться с клиентами и перенести сессии вручную.",
  conflictContinue: "Продолжить и сохранить",
  conflictCancel: "Отмена",

  horizonNote:
    "Запись доступна до [date]. Для более поздних дат свяжитесь напрямую.",
  minNoticeTooltip: "Пожалуйста, записывайтесь минимум за [N] часов.",
  closedDateTooltip: "Дата недоступна.",
};
