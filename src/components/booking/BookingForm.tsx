import { useState, useMemo } from "react";
import { format, addMinutes, parse } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { CalendarDays, Clock, User, Mail, Globe, ChevronLeft } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import type { BookingData } from "./BookingWidget";
import { getUserTimezone, formatTimezone } from "./DateTimeSelector";

interface Props {
  booking: BookingData;
  t: BookingContent;
  onBooked: (result: any) => void;
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
          startTime,
          endTime,
          notes: booking.notes?.trim() || null,
          timezone,
        },
      });

      if (error) throw error;

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
          <User className="w-4 h-4 text-primary" />
          <span className="text-foreground font-medium">{booking.sessionTypeName}</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-body text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-4 h-4" />
            {format(booking.date, "MMM d, yyyy")}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {booking.timeSlot} · {booking.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            {formatTimezone(timezone)}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-body text-sm text-foreground mb-1.5 block">{t.yourName}</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={booking.clientName || ""}
              onChange={(e) => onChange({ clientName: e.target.value })}
              placeholder={t.namePlaceholder}
              className="pl-9"
              maxLength={100}
            />
          </div>
          {errors.clientName && <p className="text-destructive text-xs mt-1">{errors.clientName}</p>}
        </div>

        <div>
          <label className="font-body text-sm text-foreground mb-1.5 block">{t.yourEmail}</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="email"
              value={booking.clientEmail || ""}
              onChange={(e) => onChange({ clientEmail: e.target.value })}
              placeholder={t.emailPlaceholder}
              className="pl-9"
              maxLength={255}
            />
          </div>
          {errors.clientEmail && <p className="text-destructive text-xs mt-1">{errors.clientEmail}</p>}
        </div>

        <div>
          <label className="font-body text-sm text-foreground mb-1.5 block">{t.notesLabel}</label>
          <textarea
            value={booking.notes || ""}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder={t.notesPlaceholder}
            maxLength={1000}
            rows={3}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-body resize-none"
          />
        </div>

        {generalError && (
          <p className="text-destructive text-sm font-body">{generalError}</p>
        )}

        <div className="flex items-center gap-3">
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
            className="flex-1 btn-primary text-sm py-3 disabled:opacity-60"
          >
            {submitting ? t.booking : t.bookButton}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
