import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAvailableDates } from "@/hooks/useAvailableDates";
import { useAvailableSlots } from "@/hooks/useAvailability";
import { format } from "date-fns";
import { Clock, Globe } from "lucide-react";
import type { BookingContent } from "@/content/booking";

interface Props {
  selectedDate?: Date;
  selectedTime?: string;
  durationMinutes: number;
  t: BookingContent;
  onSelectDate: (date: Date) => void;
  onSelectTime: (slot: string) => void;
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
      .find((p) => p.type === "timeZoneName")?.value || "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") || tz;
    return `${city}, ${offset}`;
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
  const { availableDays, horizonDate } = useAvailableDates(displayMonth);
  const { slots, loading: loadingSlots, minimumNoticeHours } = useAvailableSlots(
    selectedDate,
    durationMinutes
  );

  const timezone = useMemo(() => getUserTimezone(), []);

  const isDateAvailable = (date: Date) =>
    availableDays.has(format(date, "yyyy-MM-dd"));

  const isBeyondHorizon = (date: Date) =>
    horizonDate !== null && date > horizonDate;

  const availableModifier = useMemo(
    () => (date: Date) => isDateAvailable(date) && date >= today && !isBeyondHorizon(date),
    [availableDays, horizonDate]
  );

  const unavailableModifier = useMemo(
    () => (date: Date) => !isDateAvailable(date) && date >= today && !isBeyondHorizon(date),
    [availableDays, horizonDate]
  );

  const beyondHorizonModifier = useMemo(
    () => (date: Date) => date >= today && isBeyondHorizon(date),
    [horizonDate]
  );

  const availableSlots = slots.filter((s) => !s.disabled);
  const noticeSlots = slots.filter((s) => s.disabled && s.disabledReason === "min_notice");

  return (
    <div className="space-y-4">
      {/* Timezone display */}
      <div className="flex items-center gap-2 text-xs font-body text-muted-foreground">
        <Globe className="w-3.5 h-3.5" />
        <span>
          {t.timezone}: {formatTimezone(timezone)}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
        {/* Calendar */}
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
            disabled={(date) =>
              date < today || !isDateAvailable(date) || isBeyondHorizon(date)
            }
            modifiers={{
              available: availableModifier,
              unavailable: unavailableModifier,
              beyondHorizon: beyondHorizonModifier,
            }}
            modifiersClassNames={{
              available:
                "!bg-primary/15 !text-foreground font-semibold hover:!bg-primary/25 border border-primary/40 rounded-lg",
              unavailable: "!text-muted-foreground/40",
              beyondHorizon: "!text-muted-foreground/20",
            }}
            className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
          />
          {horizonDate && (
            <p className="font-body text-xs text-muted-foreground mt-2 max-w-[280px]">
              {t.horizonNote.replace("[date]", format(horizonDate, "MMM d, yyyy"))}
            </p>
          )}
        </div>

        {/* Time slots */}
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
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {/* Available slots */}
                {availableSlots.map((slot) => (
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

                {/* Notice-filtered slots (disabled with tooltip) */}
                {noticeSlots.map((slot) => (
                  <Tooltip key={`disabled-${slot.start}`}>
                    <TooltipTrigger asChild>
                      <button
                        disabled
                        className="py-2.5 px-3 rounded-lg border border-border font-body text-sm text-muted-foreground/40 bg-muted/30 cursor-not-allowed"
                      >
                        {slot.start}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs max-w-[180px] text-center">
                      {t.minNoticeTooltip.replace("[N]", String(minimumNoticeHours))}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateTimeSelector;
