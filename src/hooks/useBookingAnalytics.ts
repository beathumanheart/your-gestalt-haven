import posthog from "posthog-js";

export const FUNNEL_STEPS = {
  HOMEPAGE_VIEWED: "booking_funnel_homepage_viewed",
  SERVICES_VIEWED: "booking_funnel_services_viewed",
  BOOK_NOW_CLICKED: "booking_funnel_book_now_clicked",
  SERVICE_SELECTED: "booking_funnel_service_selected",
  DATETIME_VIEWED: "booking_funnel_datetime_viewed",
  DATETIME_SELECTED: "booking_funnel_datetime_selected",
  CONFIRMATION_VIEWED: "booking_funnel_confirmation_viewed",
  BOOKING_COMPLETED: "booking_funnel_booking_completed",
} as const;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  try {
    posthog.capture(name, properties);
  } catch {
    // PostHog not initialized — safe to swallow in non-analytics environments
  }
}

export function trackHomepageView() {
  trackEvent(FUNNEL_STEPS.HOMEPAGE_VIEWED, {
    referrer: typeof document !== "undefined" ? document.referrer : "",
  });
}

export function trackServicesView(navigation_source: "nav" | "book_now_button" | "direct") {
  trackEvent(FUNNEL_STEPS.SERVICES_VIEWED, { navigation_source });
}

export function trackBookNowClick(button_location: string) {
  trackEvent(FUNNEL_STEPS.BOOK_NOW_CLICKED, { button_location });
}

export function trackServiceSelected(service_name: string, service_index: number) {
  trackEvent(FUNNEL_STEPS.SERVICE_SELECTED, { service_name, service_index });
}

export function trackDateTimeView(selected_service: string) {
  trackEvent(FUNNEL_STEPS.DATETIME_VIEWED, { selected_service });
}

export function trackDateTimeSelected(
  selected_service: string,
  selected_date: string,
  selected_time: string
) {
  const date = new Date(selected_date);
  trackEvent(FUNNEL_STEPS.DATETIME_SELECTED, {
    selected_service,
    selected_date,
    selected_time,
    day_of_week: DAY_NAMES[date.getDay()],
  });
}

export function trackConfirmationView(selected_service: string) {
  trackEvent(FUNNEL_STEPS.CONFIRMATION_VIEWED, { selected_service });
}

export function trackBookingCompleted(params: {
  service_name: string;
  booking_date: string;
  booking_time: string;
  is_new_client: boolean;
}) {
  const date = new Date(params.booking_date);
  trackEvent(FUNNEL_STEPS.BOOKING_COMPLETED, {
    service_name: params.service_name,
    booking_date: params.booking_date,
    booking_time: params.booking_time,
    is_new_client: params.is_new_client,
    day_of_week: DAY_NAMES[date.getDay()],
  });
}

export function useBookingAnalytics() {
  return {
    trackHomepageView,
    trackServicesView,
    trackBookNowClick,
    trackServiceSelected,
    trackDateTimeView,
    trackDateTimeSelected,
    trackConfirmationView,
    trackBookingCompleted,
    trackEvent,
    FUNNEL_STEPS,
  };
}
