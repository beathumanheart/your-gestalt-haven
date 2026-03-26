import { useState, useMemo } from "react";
import { format, addMinutes, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, User, Mail, ChevronLeft } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import type { BookingData, ConfirmedBooking } from "./BookingWidget";
import { getUserTimezone, formatTimezone } from "./DateTimeSelector";
import { trackBookingCompleted } from "@/hooks/useBookingAnalytics";

interface Props {
  booking: BookingData;
  t: BookingContent;
  onBooked: (result: ConfirmedBooking) => void;
  onChange: (fields: Partial<BookingData>) => void;
  onBack: () => void;
}

const BookingForm = ({ booking, t, onBooked, onChange, onBack }: Props) => {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const timezone = useMemo(() => getUserTimezone(), []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!booking.clientName?.trim()) errs.clientName = t.errorNameRequired;
    if (!booking.clientEmail?.trim()) errs.clientEmail = t.errorEmailRequired;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.clientEmail.trim()))
      errs.clientEmail = t.errorEmailInvalid;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setGeneralError("");

    try {
      const dateStr = format(booking.date, "yyyy-MM-dd");
      const startTime = `${dateStr}T${booking.timeSlot}:00`;
      const endDate = addMinutes(
        parse(`${dateStr} ${booking.timeSlot}`, "yyyy-MM-dd HH:mm", new Date()),
        booking.durationMinutes
      );
      const endTime = format(endDate, "yyyy-MM-dd'T'HH:mm:ss");

      const { data: result, error } = await supabase.functions.invoke("process-booking", {
        body: {
          sessionTypeId: booking.sessionTypeId,
          clientName: booking.clientName.trim(),
          clientEmail: booking.clientEmail.trim().toLowerCase(),
          clientEmail2: booking.clientEmail2?.trim().toLowerCase() || null,
          startTime,
          endTime,
          notes: booking.notes?.trim() || null,
          timezone,
        },
      });

      if (error) throw error;
      if (result?.error) {
        setGeneralError(result.error.includes("no longer available") ? "This time slot is no longer available. Please go back and choose another." : result.error);
        return;
      }

      trackBookingCompleted({
        service_name: booking.sessionTypeName,
        booking_date: format(booking.date, "yyyy-MM-dd"),
        booking_time: booking.timeSlot,
        is_new_client: true,
      });
      onBooked({
        ...result?.booking,
        google_meet_link: result?.meetLink || null,
        sessionTypeName: booking.sessionTypeName,
        durationMinutes: booking.durationMinutes,
      });
    } catch (err) {
      console.error("Booking error:", err);
      setGeneralError(t.errorGeneral);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-muted/50 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-body">
          <User className="w-4 h-4 text-primary shrink-0" />
          <span className="text-foreground font-medium">{booking.sessionTypeName}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-body text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {format(booking.date, "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {booking.timeSlot} · {booking.durationMinutes} min
            <span className="text-muted-foreground/70 text-xs">{formatTimezone(timezone)}</span>
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">{t.yourName}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={booking.clientName || ""}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder={t.namePlaceholder}
              className="pl-9 text-sm sm:text-base h-11 sm:h-12 font-body"
              maxLength={100}
              data-ph-no-capture
            />
          </div>
          {errors.clientName && <p className="text-destructive text-xs mt-1">{errors.clientName}</p>}
        </div>

        <div>
          <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">{t.yourEmail}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={booking.clientEmail || ""}
              onChange={(e) => onChange({ clientEmail: e.target.value })}
              placeholder={t.emailPlaceholder}
              className="pl-9 text-sm sm:text-base h-11 sm:h-12 font-body"
              maxLength={255}
              data-ph-no-capture
            />
          </div>
          {errors.clientEmail && <p className="text-destructive text-xs mt-1">{errors.clientEmail}</p>}
        </div>

        {booking.showSecondEmail && (
          <div>
            <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">
              {t.yourEmail2} <span className="text-muted-foreground font-normal">({t.optional})</span>
            </label>
            <p className="font-body text-xs text-muted-foreground mb-1.5">{t.email2Hint}</p>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={booking.clientEmail2 || ""}
                onChange={(e) => onChange({ clientEmail2: e.target.value })}
                placeholder={t.emailPlaceholder}
                className="pl-9 text-sm sm:text-base h-11 sm:h-12 font-body"
                maxLength={255}
                data-ph-no-capture
              />
            </div>
          </div>
        )}

        <div>
          <label className="font-body text-sm sm:text-base text-foreground mb-1.5 block font-medium">{t.notesLabel} <span className="text-muted-foreground font-normal">({t.optional})</span></label>
          <textarea
            value={booking.notes || ""}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder={t.notesPlaceholder}
            maxLength={1000}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm sm:text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-body resize-none"
          />
        </div>

        {generalError && (
          <p className="text-destructive text-sm font-body">{generalError}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 font-body text-sm text-muted-foreground hover:text-foreground transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            {t.back}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 btn-primary text-sm sm:text-base py-3 disabled:opacity-60"
          >
            {submitting ? t.booking : t.bookButton}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
