import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Clock, Mail, Video, CheckCircle, XCircle } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import { getUserTimezone, formatTimezone } from "./DateTimeSelector";

interface Props {
  booking: any;
  t: BookingContent;
  onReset: () => void;
  onCancel: () => void;
}

const BookingConfirmation = ({ booking, t, onReset, onCancel }: Props) => {
  const startDate = parseISO(booking.start_time);
  const timezone = useMemo(() => getUserTimezone(), []);

  return (
    <div className="card-organic p-6 md:p-10 text-center">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-primary" />
      </div>

      <h3 className="font-display text-2xl md:text-3xl font-light text-foreground mb-2">
        {t.confirmTitle}
      </h3>
      <p className="font-body text-muted-foreground mb-8">{t.confirmSubtitle}</p>

      <div className="bg-muted/50 rounded-xl p-5 space-y-3 max-w-sm mx-auto text-left mb-8">
        <div className="flex items-center gap-3 font-body text-sm">
          <CalendarDays className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">{t.confirmDate}:</span>
          <span className="text-foreground font-medium ml-auto">
            {format(startDate, "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-3 font-body text-sm">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">{t.confirmTime}:</span>
          <span className="text-foreground font-medium ml-auto">
            {format(startDate, "HH:mm")} <span className="text-muted-foreground font-normal text-xs">({formatTimezone(timezone)})</span>
          </span>
        </div>
        <div className="flex items-center gap-3 font-body text-sm">
          <Clock className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">{t.confirmDuration}:</span>
          <span className="text-foreground font-medium ml-auto">
            {booking.durationMinutes} min
          </span>
        </div>
        <div className="flex items-center gap-3 font-body text-sm">
          <Mail className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">{t.confirmEmail}:</span>
          <span className="text-foreground font-medium ml-auto truncate max-w-[160px]">
            {booking.client_email}
          </span>
        </div>
        {booking.google_meet_link && (
          <a
            href={booking.google_meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 font-body text-sm text-primary hover:underline pt-2 border-t border-border mt-2"
          >
            <Video className="w-4 h-4 shrink-0" />
            {t.confirmMeetLink} →
          </a>
        )}
      </div>

      <div className="flex items-center justify-center gap-6">
        <button onClick={onReset} className="font-body text-sm text-primary hover:underline underline-offset-2">
          {t.bookAnother}
        </button>
        <button onClick={onCancel} className="font-body text-sm text-destructive hover:underline underline-offset-2 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          {t.cancelBooking}
        </button>
      </div>
    </div>
  );
};

export default BookingConfirmation;
