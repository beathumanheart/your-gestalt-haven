import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FUNNEL_STEPS,
  trackEvent,
  trackHomepageView,
  trackServicesView,
  trackBookNowClick,
  trackServiceSelected,
  trackDateTimeView,
  trackDateTimeSelected,
  trackConfirmationView,
  trackBookingCompleted,
} from "../useBookingAnalytics";

// Mock posthog-js
vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
  },
}));

import posthog from "posthog-js";

describe("FUNNEL_STEPS constants", () => {
  it("has the correct event names", () => {
    expect(FUNNEL_STEPS.HOMEPAGE_VIEWED).toBe("booking_funnel_homepage_viewed");
    expect(FUNNEL_STEPS.SERVICES_VIEWED).toBe("booking_funnel_services_viewed");
    expect(FUNNEL_STEPS.BOOK_NOW_CLICKED).toBe("booking_funnel_book_now_clicked");
    expect(FUNNEL_STEPS.SERVICE_SELECTED).toBe("booking_funnel_service_selected");
    expect(FUNNEL_STEPS.DATETIME_VIEWED).toBe("booking_funnel_datetime_viewed");
    expect(FUNNEL_STEPS.DATETIME_SELECTED).toBe("booking_funnel_datetime_selected");
    expect(FUNNEL_STEPS.CONFIRMATION_VIEWED).toBe("booking_funnel_confirmation_viewed");
    expect(FUNNEL_STEPS.BOOKING_COMPLETED).toBe("booking_funnel_booking_completed");
  });
});

describe("trackEvent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls posthog.capture with name and properties", () => {
    trackEvent("test_event", { foo: "bar" });
    expect(posthog.capture).toHaveBeenCalledWith("test_event", { foo: "bar" });
  });

  it("calls posthog.capture with name and no properties", () => {
    trackEvent("test_event");
    expect(posthog.capture).toHaveBeenCalledWith("test_event", undefined);
  });

  it("does not throw when posthog.capture throws", () => {
    vi.mocked(posthog.capture).mockImplementationOnce(() => { throw new Error("posthog error"); });
    expect(() => trackEvent("test_event")).not.toThrow();
  });
});

describe("trackHomepageView", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures the correct event with referrer", () => {
    trackHomepageView();
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.HOMEPAGE_VIEWED,
      expect.objectContaining({ referrer: expect.any(String) })
    );
  });
});

describe("trackServicesView", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures with navigation_source", () => {
    trackServicesView("nav");
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.SERVICES_VIEWED,
      { navigation_source: "nav" }
    );
  });

  it("accepts all valid sources", () => {
    const sources = ["nav", "book_now_button", "direct"] as const;
    sources.forEach((source) => {
      vi.clearAllMocks();
      trackServicesView(source);
      expect(posthog.capture).toHaveBeenCalledWith(
        FUNNEL_STEPS.SERVICES_VIEWED,
        { navigation_source: source }
      );
    });
  });
});

describe("trackBookNowClick", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures with button_location", () => {
    trackBookNowClick("header_desktop");
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.BOOK_NOW_CLICKED,
      { button_location: "header_desktop" }
    );
  });
});

describe("trackServiceSelected", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures with service_name and service_index", () => {
    trackServiceSelected("Individual Session", 0);
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.SERVICE_SELECTED,
      { service_name: "Individual Session", service_index: 0 }
    );
  });
});

describe("trackDateTimeView", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures with selected_service", () => {
    trackDateTimeView("Individual Session");
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.DATETIME_VIEWED,
      { selected_service: "Individual Session" }
    );
  });
});

describe("trackDateTimeSelected", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures with correct properties including day_of_week", () => {
    // Monday = day 1 → "Monday"
    trackDateTimeSelected("Individual Session", "2026-03-23", "10:00");
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.DATETIME_SELECTED,
      {
        selected_service: "Individual Session",
        selected_date: "2026-03-23",
        selected_time: "10:00",
        day_of_week: "Monday",
      }
    );
  });

  it("computes day_of_week correctly for Sunday", () => {
    trackDateTimeSelected("Session", "2026-03-22", "09:00");
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.DATETIME_SELECTED,
      expect.objectContaining({ day_of_week: "Sunday" })
    );
  });

  it("computes day_of_week correctly for Wednesday", () => {
    trackDateTimeSelected("Session", "2026-03-25", "14:00");
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.DATETIME_SELECTED,
      expect.objectContaining({ day_of_week: "Wednesday" })
    );
  });
});

describe("trackConfirmationView", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures with selected_service", () => {
    trackConfirmationView("Individual Session");
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.CONFIRMATION_VIEWED,
      { selected_service: "Individual Session" }
    );
  });
});

describe("trackBookingCompleted", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("captures with all required properties and day_of_week", () => {
    trackBookingCompleted({
      service_name: "Individual Session",
      booking_date: "2026-03-23",
      booking_time: "10:00",
      is_new_client: true,
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.BOOKING_COMPLETED,
      {
        service_name: "Individual Session",
        booking_date: "2026-03-23",
        booking_time: "10:00",
        is_new_client: true,
        day_of_week: "Monday",
      }
    );
  });

  it("correctly marks returning client", () => {
    trackBookingCompleted({
      service_name: "Session",
      booking_date: "2026-03-25",
      booking_time: "15:00",
      is_new_client: false,
    });
    expect(posthog.capture).toHaveBeenCalledWith(
      FUNNEL_STEPS.BOOKING_COMPLETED,
      expect.objectContaining({ is_new_client: false })
    );
  });
});
