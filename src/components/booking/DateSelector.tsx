import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { BookingContent } from "@/content/booking";

interface Props {
  selected?: Date;
  t: BookingContent;
  onSelect: (date: Date) => void;
}

const DateSelector = ({ selected, t, onSelect }: Props) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground mb-6">{t.selectDate}</p>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => d && onSelect(d)}
          disabled={(date) => date < today}
          className={cn("p-3 pointer-events-auto rounded-xl border border-border")}
        />
      </div>
    </div>
  );
};

export default DateSelector;
