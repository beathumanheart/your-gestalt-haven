export interface BookingsAdminContent {
  // Tabs
  upcomingTab: string;
  archiveTab: string;

  // Filter bar
  searchPlaceholder: string;
  timeRangeLabel: string;
  statusLabel: string;
  sortLabel: string;
  clearFilters: string;

  // Time range options
  rangeUpcoming90: string;
  rangeToday: string;
  rangeThisWeek: string;
  rangeThisMonth: string;
  rangeAllUpcoming: string;
  rangeCustom: string;
  customFrom: string;
  customTo: string;

  // Status options
  statusAll: string;
  statusConfirmed: string;
  statusCompleted: string;
  statusCancelled: string;

  // Sort options
  sortSoonest: string;
  sortLatest: string;
  sortNewestBooked: string;
  sortOldestBooked: string;

  // Proximity group headers
  groupToday: string;
  groupThisWeek: string;
  groupThisMonth: string;
  groupLater: string;

  // Empty states
  emptyUpcoming: string;
  emptyArchive: string;
  emptyFiltered: string;

  // Actions
  markCompleted: string;
  cancelBooking: string;
  deleteBooking: string;
  deleteConfirm: string;

  // Toast messages
  cancelledSuccess: string;
  cancelledError: string;
  deletedSuccess: string;
  deletedError: string;
  completedSuccess: string;
  completedError: string;

  // Misc
  minLabel: string;
  bookedOn: string;
}

export const bookingsAdminEN: BookingsAdminContent = {
  upcomingTab: "Upcoming",
  archiveTab: "Archive",

  searchPlaceholder: "Search by name, email, or notes…",
  timeRangeLabel: "Period",
  statusLabel: "Status",
  sortLabel: "Sort",
  clearFilters: "Clear filters",

  rangeUpcoming90: "Next 90 days",
  rangeToday: "Today",
  rangeThisWeek: "This week",
  rangeThisMonth: "This month",
  rangeAllUpcoming: "All upcoming",
  rangeCustom: "Custom range",
  customFrom: "From",
  customTo: "To",

  statusAll: "All statuses",
  statusConfirmed: "Confirmed",
  statusCompleted: "Completed",
  statusCancelled: "Cancelled",

  sortSoonest: "Soonest first",
  sortLatest: "Latest first",
  sortNewestBooked: "Newest booked",
  sortOldestBooked: "Oldest booked",

  groupToday: "Today",
  groupThisWeek: "This week",
  groupThisMonth: "This month",
  groupLater: "Later",

  emptyUpcoming: "No upcoming bookings",
  emptyArchive: "No past bookings",
  emptyFiltered: "No bookings match your filters",

  markCompleted: "Mark completed",
  cancelBooking: "Cancel",
  deleteBooking: "Delete permanently",
  deleteConfirm: "Permanently delete this cancelled booking?",

  cancelledSuccess: "Booking cancelled and notification sent",
  cancelledError: "Failed to cancel booking",
  deletedSuccess: "Booking deleted",
  deletedError: "Failed to delete booking",
  completedSuccess: "Booking marked as completed",
  completedError: "Failed to update booking",

  minLabel: "min",
  bookedOn: "Booked",
};

export const bookingsAdminRU: BookingsAdminContent = {
  upcomingTab: "Предстоящие",
  archiveTab: "Архив",

  searchPlaceholder: "Поиск по имени, email или заметкам…",
  timeRangeLabel: "Период",
  statusLabel: "Статус",
  sortLabel: "Сортировка",
  clearFilters: "Сбросить фильтры",

  rangeUpcoming90: "Ближайшие 90 дней",
  rangeToday: "Сегодня",
  rangeThisWeek: "Эта неделя",
  rangeThisMonth: "Этот месяц",
  rangeAllUpcoming: "Все предстоящие",
  rangeCustom: "Произвольный период",
  customFrom: "С",
  customTo: "По",

  statusAll: "Все статусы",
  statusConfirmed: "Подтверждено",
  statusCompleted: "Завершено",
  statusCancelled: "Отменено",

  sortSoonest: "Ближайшие первыми",
  sortLatest: "Поздние первыми",
  sortNewestBooked: "Недавно забронированные",
  sortOldestBooked: "Давно забронированные",

  groupToday: "Сегодня",
  groupThisWeek: "На этой неделе",
  groupThisMonth: "В этом месяце",
  groupLater: "Позже",

  emptyUpcoming: "Нет предстоящих записей",
  emptyArchive: "Нет прошедших записей",
  emptyFiltered: "По вашим фильтрам ничего не найдено",

  markCompleted: "Отметить завершённой",
  cancelBooking: "Отменить",
  deleteBooking: "Удалить навсегда",
  deleteConfirm: "Безвозвратно удалить эту отменённую запись?",

  cancelledSuccess: "Запись отменена, уведомление отправлено",
  cancelledError: "Не удалось отменить запись",
  deletedSuccess: "Запись удалена",
  deletedError: "Не удалось удалить запись",
  completedSuccess: "Запись отмечена как завершённая",
  completedError: "Не удалось обновить запись",

  minLabel: "мин",
  bookedOn: "Забронировано",
};
