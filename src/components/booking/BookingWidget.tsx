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

const STEPS = ["session", "datetime", "details"] as const;
type Step = typeof STEPS[number];

const BookingWidget = ({
  initialSessionId,
  offer,
}: { initialSessionId?: string; offer?: HiddenOffer } = {}) => {
  const { language, langPath } = useLanguage();
  const t = language === "ru" ? bookingRU : bookingEN;
  const { sessionTypes, loading: loadingTypes } = useSessionTypes();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>("session");
  const [booking, setBooking] = useState<Partial<BookingData>>({});
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const autoSelectedRef = useRef(false);

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
      sessionTypeName: offer.title,
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

  const canNext = () => {
    switch (step) {
      case "session": return !!booking.sessionTypeId || !!booking.hiddenOfferId;
      case "datetime": return !!booking.date && !!booking.timeSlot;
      default: return false;
    }
  };

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

  return (
    <div className="card-organic overflow-hidden">
      {/* Step indicator */}
      <div className="flex items-center justify-between px-4 md:px-8 pt-6 pb-4">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
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
      <div className="p-4 md:p-8 min-h-[400px]">
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
          />
        )}

        {step === "details" && (
          <BookingForm
            booking={booking as BookingData}
            t={t}
            onBooked={(result) => setConfirmed(result)}
            onChange={(fields) => setBooking({ ...booking, ...fields })}
            onBack={goBack}
          />
        )}
      </div>

      {/* Navigation */}
      {step !== "details" && (
        <>
          <div className="border-t border-border" />
          <div className="flex items-center justify-between px-4 md:px-8 py-4">
            <button
              onClick={goBack}
              disabled={stepIndex === 0}
              className="flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              {t.back}
            </button>
            <button
              onClick={goNext}
              disabled={!canNext()}
              className="flex items-center gap-1 btn-primary text-sm py-2.5 px-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0"
            >
              {t.next}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BookingWidget;
