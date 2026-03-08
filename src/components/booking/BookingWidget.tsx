import { useState } from "react";
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

export interface BookingData {
  sessionTypeId: string;
  sessionTypeName: string;
  durationMinutes: number;
  date: Date;
  timeSlot: string; // HH:mm
  timezone: string;
  clientName: string;
  clientEmail: string;
  notes: string;
}

const STEPS = ["session", "datetime", "details"] as const;
type Step = typeof STEPS[number];

const BookingWidget = () => {
  const { language } = useLanguage();
  const t = language === "ru" ? bookingRU : bookingEN;
  const { sessionTypes, loading: loadingTypes } = useSessionTypes();

  const [step, setStep] = useState<Step>("session");
  const initialTz = useMemo(() => getUserTimezone(), []);
  const [booking, setBooking] = useState<Partial<BookingData>>({ timezone: initialTz });
  const [confirmed, setConfirmed] = useState<any>(null);
  const [cancelling, setCancelling] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const stepLabels = [t.stepSession, t.stepDateTime, t.stepDetails];

  const canNext = () => {
    switch (step) {
      case "session": return !!booking.sessionTypeId;
      case "datetime": return !!booking.date && !!booking.timeSlot;
      default: return false;
    }
  };

  const goNext = () => {
    const idx = STEPS.indexOf(step);
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
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", confirmed.id);
      if (error) throw error;
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
            t={t}
            onSelect={(st) => setBooking({
              ...booking,
              sessionTypeId: st.id,
              sessionTypeName: st.name,
              durationMinutes: st.duration_minutes,
            })}
          />
        )}

        {step === "datetime" && (
          <DateTimeSelector
            selectedDate={booking.date}
            selectedTime={booking.timeSlot}
            durationMinutes={booking.durationMinutes || 30}
            timezone={booking.timezone || initialTz}
            t={t}
            onSelectDate={(d) => setBooking({ ...booking, date: d, timeSlot: undefined })}
            onSelectTime={(slot) => setBooking({ ...booking, timeSlot: slot })}
            onTimezoneChange={(tz) => setBooking({ ...booking, timezone: tz, timeSlot: undefined })}
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
