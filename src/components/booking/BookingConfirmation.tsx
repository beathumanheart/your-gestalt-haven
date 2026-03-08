import { useMemo } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Clock, Mail, Video, CheckCircle, Globe } from "lucide-react";
import type { BookingContent } from "@/content/booking";

interface Props {
  booking: any;
  t: BookingContent;
  onReset: () => void;
}

function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

function formatTimezone(tz: string): string {
  try {
    const offset = new Intl.DateTimeFormat("en", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    return `${tz.replace(/_/g, " ")} (${offset || ""})`;
  } catch {
    return tz;
  }
}

const BookingConfirmation = ({ booking, t, onReset }: Props) => {
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
            {format(startDate, "HH:mm")}
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
          <Globe className="w-4 h-4 text-primary shrink-0" />
          <span className="text-muted-foreground">{t.confirmTimezone}:</span>
          <span className="text-foreground font-medium ml-auto text-xs">
            {formatTimezone(timezone)}
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

      <button onClick={onReset} className="font-body text-sm text-primary hover:underline underline-offset-2">
        {t.bookAnother}
      </button>
    </div>
  );
};

export default BookingConfirmation;
