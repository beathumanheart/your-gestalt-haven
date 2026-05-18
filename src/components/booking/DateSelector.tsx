import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useAvailableDates } from "@/hooks/useAvailableDates";
import { format } from "date-fns";
import type { BookingContent } from "@/content/booking";

interface Props {
  selected?: Date;
  t: BookingContent;
  onSelect: (date: Date) => void;
  overrideLeadMinutes?: number;
}

const DateSelector = ({ selected, t, onSelect, overrideLeadMinutes }: Props) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [displayMonth, setDisplayMonth] = useState(new Date());
  const { availableDays } = useAvailableDates(displayMonth, overrideLeadMinutes);

  const isDateAvailable = (date: Date) => {
    return availableDays.has(format(date, "yyyy-MM-dd"));
  };

  // Create modifiers for available dates
  const availableModifier = useMemo(() => {
    return (date: Date) => isDateAvailable(date) && date >= today;
  }, [availableDays]);

  const unavailableModifier = useMemo(() => {
    return (date: Date) => !isDateAvailable(date) && date >= today;
  }, [availableDays]);

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground mb-2">{t.selectDate}</p>
      <div className="flex items-center gap-4 mb-4">
        <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-primary/20 border border-primary/40 inline-block" />
          Available
        </span>
        <span className="flex items-center gap-1.5 text-xs font-body text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-muted inline-block" />
          Unavailable
        </span>
      </div>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && onSelect(d)}
          onMonthChange={setDisplayMonth}
          disabled={(date) => date < today || !isDateAvailable(date)}
          modifiers={{
            available: availableModifier,
            unavailable: unavailableModifier,
          }}
          modifiersClassNames={{
            available: "!bg-primary/15 !text-foreground font-semibold hover:!bg-primary/25 border border-primary/40 rounded-lg",
            unavailable: "!text-muted-foreground/40",
          }}
          className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
        />
      </div>
    </div>
  );
};

export default DateSelector;
