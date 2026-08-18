import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { bookingEN, bookingRU } from "@/content/booking";
import { useSessionTypes } from "@/hooks/useAvailability";
import { supabase } from "@/integrations/supabase/client";
import SessionTypeSelector from "./SessionTypeSelector";
import DateTimeSelector from "./DateTimeSelector";
import BookingForm from "./BookingForm";
import BookingConfirmation from "./BookingConfirmation";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import {
  trackServicesView,
  trackServiceSelected,
  trackDateTimeView,
  trackDateTimeSelected,
  trackConfirmationView,
} from "@/hooks/useBookingAnalytics";
import type { SessionType } from "./SessionTypeSelector";
import type { HiddenOffer } from "@/hooks/useHiddenOffers";

export interface BookingData {
  sessionTypeId?: string;
  sessionTypeName: string;
  durationMinutes: number;
  showSecondEmail: boolean;
  date: Date;
  timeSlot: string; // HH:mm
  clientName: string;
  clientEmail: string;
  clientEmail2: string;
  notes: string;
  /** Terms consent. Lives here so navigating back to step 3 keeps the user's
   *  own tick, while a fresh booking always starts unticked. */
  termsAccepted?: boolean;
  // offer-mode fields
  hiddenOfferId?: string;
  offerSlug?: string;
}

export interface ConfirmedBooking {
  id: string;
  start_time: string;
  end_time: string;
  client_email: string;
  google_meet_link?: string | null;
  sessionTypeName: string;
  durationMinutes: number;
  emailSent?: boolean;
}

/** The step-3 form lives in BookingForm; the sticky bar submits it by id. */
const DETAILS_FORM_ID = "booking-details-form";

const STEPS = ["session", "datetime", "details"] as const;
type Step = typeof STEPS[number];

const BookingWidget = ({
  initialSessionId,
  offer,
  offerDisplayTitle,
}: { initialSessionId?: string; offer?: HiddenOffer; offerDisplayTitle?: string } = {}) => {
  const { language, langPath } = useLanguage();
  const t = language === "ru" ? bookingRU : bookingEN;
  const { sessionTypes, loading: loadingTypes } = useSessionTypes();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>("session");
  const [booking, setBooking] = useState<Partial<BookingData>>({});
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autoSelectedRef = useRef(false);
  const stepperRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);

  const stepIndex = STEPS.indexOf(step);
  const stepLabels = [t.stepSession, t.stepDateTime, t.stepDetails];

  // Track step views
  useEffect(() => {
    if (step === "session") {
      trackServicesView("direct");
    } else if (step === "datetime" && booking.sessionTypeName) {
      trackDateTimeView(booking.sessionTypeName);
    }
  }, [step]);

  // Track confirmation view
  useEffect(() => {
    if (confirmed?.sessionTypeName) {
      trackConfirmationView(confirmed.sessionTypeName);
    }
  }, [confirmed]);

  // Auto-select session type from prop or ?session= query param and skip to datetime
  useEffect(() => {
    if (autoSelectedRef.current || loadingTypes || sessionTypes.length === 0) return;
    const sessionId = initialSessionId || searchParams.get("session");
    if (!sessionId) return;
    const st = sessionTypes.find((s) => s.id === sessionId);
    if (!st) return;
    autoSelectedRef.current = true;
    const name = (language === "ru" && st.name_ru) ? st.name_ru : st.name;
    setBooking({
      sessionTypeId: st.id,
      sessionTypeName: name,
      durationMinutes: st.duration_minutes,
      showSecondEmail: st.show_second_email ?? false,
    });
    // Skip step 1 when session is pre-selected via URL param or prop
    if (sessionId) {
      setStep("datetime");
    }
  }, [sessionTypes, loadingTypes, searchParams, initialSessionId, language]);

  // Offer mode: pre-populate booking from hidden offer and jump straight to datetime.
  // Runs once when the offer prop is provided; does not depend on sessionTypes.
  useEffect(() => {
    if (!offer) return;
    autoSelectedRef.current = true;
    setBooking({
      hiddenOfferId: offer.id,
      offerSlug: offer.slug,
      sessionTypeName: offerDisplayTitle || offer.slug,
      durationMinutes: offer.duration_minutes,
      showSecondEmail: false,
    });
    setStep("datetime");
  }, [offer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const getShareUrl = (sessionId: string) => {
    const st = sessionTypes.find((s) => s.id === sessionId);
    const slug = st?.slug || sessionId;
    return window.location.origin + langPath(`/book/${slug}`);
  };

  const emailLooksValid = (email?: string) =>
    !!email?.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  /** Whether the current step's primary action is available. */
  const canNext = () => {
    switch (step) {
      case "session": return !!booking.sessionTypeId || !!booking.hiddenOfferId;
      case "datetime": return !!booking.date && !!booking.timeSlot;
      case "details":
        return (
          !!booking.clientName?.trim() &&
          emailLooksValid(booking.clientEmail) &&
          !!booking.termsAccepted
        );
      default: return false;
    }
  };

  /**
   * The bar's left-hand text. When the action is unavailable it names what is
   * missing rather than leaving a disabled button unexplained.
   */
  const barSummary = (): string => {
    const name = booking.sessionTypeName;
    const withDuration = name && booking.durationMinutes
      ? `${name} · ${booking.durationMinutes} ${t.minutes}`
      : name;

    switch (step) {
      case "session":
        return withDuration || t.barChooseSession;
      case "datetime":
        if (!booking.date || !booking.timeSlot) return t.barChooseDateTime;
        return `${name} · ${format(booking.date, "d MMM")} ${booking.timeSlot}`;
      case "details":
        if (!booking.clientName?.trim() || !emailLooksValid(booking.clientEmail)) {
          return t.barFillDetails;
        }
        if (!booking.termsAccepted) return t.barAgreeTerms;
        return withDuration || "";
      default:
        return "";
    }
  };

  // Bring the stepper back into view after a step change, so the user starts
  // the next step at its top rather than wherever they happened to be scrolled.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    stepperRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [step]);

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (step === "session" && booking.sessionTypeName) {
      const stIndex = sessionTypes.findIndex((s) => s.id === booking.sessionTypeId);
      trackServiceSelected(booking.sessionTypeName, stIndex);
    }
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const goBack = () => {
    const idx = STEPS.indexOf(step);
    if (idx > 0) setStep(STEPS[idx - 1]);
  };

  const handleCancel = async () => {
    if (!confirmed?.id) return;
    setCancelling(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("process-booking", {
        body: {
          action: "cancel",
          bookingId: confirmed.id,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      if (error) throw error;
      if (!result?.success) throw new Error(result?.error || "Cancel failed");
      toast.success(t.cancelledSuccess);
      setConfirmed(null);
      setBooking({});
      setStep("session");
    } catch (err) {
      console.error("Cancel error:", err);
      toast.error(t.errorGeneral);
    } finally {
      setCancelling(false);
    }
  };

  if (confirmed) {
    return <BookingConfirmation booking={confirmed} t={t} onReset={() => {
      setConfirmed(null);
      setBooking({});
      setStep("session");
    }} onCancel={handleCancel} />;
  }

  // Deliberately no overflow-hidden on this card: it would become the sticky
  // bar's containing block and stop it sticking to the viewport. The bar
  // rounds its own bottom corners instead.
  return (
    <div className="card-organic">
      {/* Step indicator */}
      <div ref={stepperRef} className="flex items-center justify-between px-4 md:px-8 pt-6 pb-4 scroll-mt-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              aria-current={i === stepIndex ? "step" : undefined}
              onClick={() => i < stepIndex ? setStep(s) : undefined}
              className={`flex items-center gap-2 text-sm font-body transition-colors ${
                i <= stepIndex
                  ? "text-foreground"
                  : "text-muted-foreground"
              } ${i < stepIndex ? "cursor-pointer hover:text-primary" : ""}`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-all ${
                i < stepIndex
                  ? "bg-primary text-primary-foreground border-primary"
                  : i === stepIndex
                  ? "border-primary text-primary bg-primary/10"
                  : "border-border text-muted-foreground"
              }`}>
                {i < stepIndex ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="hidden sm:inline">{stepLabels[i]}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 md:mx-4 transition-colors ${
                i < stepIndex ? "bg-primary" : "bg-border"
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-border" />

      {/* Step content */}
      {/* pb leaves the last card readable above the sticky bar rather than under it */}
      <div className="p-4 md:p-8 pb-24 md:pb-24 min-h-[400px]">
        {step === "session" && (
          <SessionTypeSelector
            sessionTypes={sessionTypes}
            loading={loadingTypes}
            selected={booking.sessionTypeId}
            expandedId={initialSessionId || searchParams.get("session") || undefined}
            t={t}
            language={language}
            getShareUrl={getShareUrl}
            onSelect={(st: SessionType, _index: number) => {
              const name = (language === "ru" && st.name_ru) ? st.name_ru : st.name;
              setBooking({
                ...booking,
                sessionTypeId: st.id,
                sessionTypeName: name,
                durationMinutes: st.duration_minutes,
                showSecondEmail: st.show_second_email ?? false,
              });
            }}
          />
        )}

        {step === "datetime" && (
          <DateTimeSelector
            selectedDate={booking.date}
            selectedTime={booking.timeSlot}
            durationMinutes={booking.durationMinutes || 30}
            t={t}
            onSelectDate={(d) => setBooking({ ...booking, date: d, timeSlot: undefined })}
            onSelectTime={(slot) => {
              if (booking.date && booking.sessionTypeName) {
                trackDateTimeSelected(
                  booking.sessionTypeName,
                  booking.date.toISOString(),
                  slot
                );
              }
              setBooking({ ...booking, timeSlot: slot });
            }}
            overrideLeadMinutes={offer?.min_lead_time_minutes ?? undefined}
          />
        )}

        {step === "details" && (
          <BookingForm
            formId={DETAILS_FORM_ID}
            booking={booking as BookingData}
            t={t}
            language={language}
            onBooked={(result) => setConfirmed(result)}
            onChange={(fields) => setBooking({ ...booking, ...fields })}
            onSubmittingChange={setSubmitting}
          />
        )}
      </div>

      {/* Sticky action bar — present on every step, including step 1 with a
          disabled action, so it never appears under the user's finger. */}
      <div
        data-testid="action-bar"
        className="sticky bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur-sm px-4 md:px-8 py-3 rounded-b-2xl"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <p
            className="font-body text-xs sm:text-sm text-muted-foreground min-w-0 truncate"
            data-testid="bar-summary"
          >
            {barSummary()}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {t.back}
              </button>
            )}

            {step === "details" ? (
              <button
                type="submit"
                form={DETAILS_FORM_ID}
                disabled={!canNext() || submitting}
                aria-disabled={!canNext() || submitting}
                className="btn-primary text-sm py-2.5 px-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                {submitting ? t.booking : t.bookSession}
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext()}
                aria-disabled={!canNext()}
                className="flex items-center gap-1 btn-primary text-sm py-2.5 px-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                {t.next}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default BookingWidget;
