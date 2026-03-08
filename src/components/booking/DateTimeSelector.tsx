import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAvailableDates } from "@/hooks/useAvailableDates";
import { useAvailableSlots } from "@/hooks/useAvailability";
import { format } from "date-fns";
import { Clock } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import TimezoneSelector from "./TimezoneSelector";

interface Props {
  selectedDate?: Date;
  selectedTime?: string;
  durationMinutes: number;
  timezone: string;
  t: BookingContent;
  onSelectDate: (date: Date) => void;
  onSelectTime: (slot: string) => void;
  onTimezoneChange: (tz: string) => void;
}

export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function formatTimezone(tz: string): string {
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

const DateTimeSelector = ({
  selectedDate,
  selectedTime,
  durationMinutes,
  t,
  onSelectDate,
  onSelectTime,
}: Props) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [displayMonth, setDisplayMonth] = useState(new Date());
  const { availableDays } = useAvailableDates(displayMonth);
  const { slots, loading: loadingSlots } = useAvailableSlots(selectedDate, durationMinutes);

  const timezone = useMemo(() => getUserTimezone(), []);

  const isDateAvailable = (date: Date) =>
    availableDays.has(format(date, "yyyy-MM-dd"));

  const availableModifier = useMemo(
    () => (date: Date) => isDateAvailable(date) && date >= today,
    [availableDays]
  );

  const unavailableModifier = useMemo(
    () => (date: Date) => !isDateAvailable(date) && date >= today,
    [availableDays]
  );

  return (
    <div className="space-y-4">
      {/* Timezone display */}
      <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
        <Globe className="w-3.5 h-3.5" />
        <span>{t.timezone}: {formatTimezone(timezone)}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Calendar — fixed width, no shrink */}
        <div className="flex-shrink-0 w-full sm:w-auto">
          <p className="font-body text-sm text-muted-foreground mb-3">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : t.selectDate}
          </p>
          <div className="flex items-center gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary/40 inline-block" />
              {t.availableLabel}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
              <span className="w-3 h-3 rounded-full bg-muted inline-block" />
              {t.unavailableLabel}
            </span>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => d && onSelectDate(d)}
            onMonthChange={setDisplayMonth}
            disabled={(date) => date < today || !isDateAvailable(date)}
            modifiers={{
              available: availableModifier,
              unavailable: unavailableModifier,
            }}
            modifiersClassNames={{
              available:
                "!bg-primary/15 !text-foreground font-semibold hover:!bg-primary/25 border border-primary/40 rounded-lg",
              unavailable: "!text-muted-foreground/40",
            }}
            className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
          />
        </div>

        {/* Time slots — fills remaining space, scrollable */}
        <div className="flex-1 min-w-0">
          <p className="font-body text-sm text-muted-foreground mb-3">{t.selectTime}</p>

          {!selectedDate && (
            <div className="flex items-center justify-center h-48 text-muted-foreground/60 font-body text-sm">
              ← {t.selectDate}
            </div>
          )}

          {selectedDate && loadingSlots && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-11 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          )}

          {selectedDate && !loadingSlots && slots.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Clock className="w-8 h-8 text-muted-foreground mb-3" />
              <p className="font-body text-sm text-muted-foreground">{t.noSlots}</p>
            </div>
          )}

          {selectedDate && !loadingSlots && slots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.start}
                  onClick={() => onSelectTime(slot.start)}
                  className={`py-2.5 px-3 rounded-lg border font-body text-sm font-medium transition-all duration-200 ${
                    selectedTime === slot.start
                      ? "bg-primary text-primary-foreground border-primary font-bold shadow-md"
                      : "border-primary/40 bg-primary/15 text-foreground hover:bg-primary/25"
                  }`}
                >
                  {slot.start}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateTimeSelector;
