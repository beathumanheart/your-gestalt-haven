import { useAvailableSlots } from "@/hooks/useAvailability";
import { Clock } from "lucide-react";
import type { BookingContent } from "@/content/booking";

interface Props {
  date: Date;
  durationMinutes: number;
  selected?: string;
  t: BookingContent;
  onSelect: (slot: string) => void;
}

const TimeSlotSelector = ({ date, durationMinutes, selected, t, onSelect }: Props) => {
  const { slots, loading } = useAvailableSlots(date, durationMinutes);

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="font-body text-muted-foreground">{t.selectTime}</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
        <p className="font-body text-muted-foreground">{t.noSlots}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground mb-6">{t.selectTime}</p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {slots.map((slot) => (
          <button
            key={slot.start}
            onClick={() => onSelect(slot.start)}
            className={`py-3 px-4 rounded-lg border-2 font-body text-sm font-medium transition-all duration-200 ${
              selected === slot.start
                ? "border-primary bg-primary/10 text-foreground shadow-soft"
                : "border-border text-foreground hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            {slot.start}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotSelector;
