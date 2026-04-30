import { useState, useMemo } from "react";
import { format, addMonths, subMonths, isWithinInterval } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { availabilityEN as t } from "@/content/availability";
import { classifyDay, buildMonthGrid } from "@/lib/scheduleCalendar";
import type { DayKind } from "@/lib/scheduleCalendar";
import type { DateOverride } from "@/lib/availability";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduleRule {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Props {
  rules: ScheduleRule[];
  overrides: DateOverride[];
  horizonDays: number;
  onAddOverride?: (startStr: string, endStr: string) => void;
}

// ─── Cell base styling (state-based) ─────────────────────────────────────────

const cellBase: Record<DayKind, string> = {
  open: "bg-primary/15 border border-primary/40 text-foreground",
  closed: "text-muted-foreground/50",
  "open-override": "bg-primary/30 border-2 border-primary text-foreground font-semibold",
  "closed-override": "bg-destructive/10 border border-destructive/40 text-destructive",
  past: "text-muted-foreground/30",
  "beyond-horizon": "text-muted-foreground/20",
};

// ─── Legend ───────────────────────────────────────────────────────────────────

const LEGEND: { kind: DayKind; label: string; swatch: string }[] = [
  { kind: "open",           label: t.calendarLegendOpen,          swatch: "bg-primary/15 border border-primary/40" },
  { kind: "open-override",  label: t.calendarLegendOpenOverride,  swatch: "bg-primary/30 border-2 border-primary" },
  { kind: "closed-override",label: t.calendarLegendClosedOverride,swatch: "bg-destructive/10 border border-destructive/40" },
  { kind: "closed",         label: t.calendarLegendClosed,        swatch: "bg-muted" },
  { kind: "past",           label: t.calendarLegendPast,          swatch: "bg-muted/40" },
  { kind: "beyond-horizon", label: t.calendarLegendBeyond,        swatch: "bg-muted/20" },
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Tooltip content builder ──────────────────────────────────────────────────

function buildTooltip(kind: DayKind, date: Date, rules: ScheduleRule[], override?: DateOverride): string {
  const dow = date.getDay();
  switch (kind) {
    case "past":           return t.calendarTooltipPast;
    case "beyond-horizon": return t.calendarTooltipBeyond;
    case "closed":         return t.calendarTooltipClosed;
    case "open": {
      const windows = rules
        .filter((r) => r.is_active && r.day_of_week === dow)
        .map((r) => `${r.start_time.slice(0, 5)}–${r.end_time.slice(0, 5)}`)
        .join(", ");
      return `${t.calendarTooltipOpen}${windows ? ` · ${windows}` : ""}`;
    }
    case "open-override": {
      const time = override?.start_time && override.end_time
        ? ` · ${override.start_time.slice(0, 5)}–${override.end_time.slice(0, 5)}`
        : "";
      const note = override?.reason ? ` · ${override.reason}` : "";
      return `${t.calendarTooltipOpenOverride}${time}${note}`;
    }
    case "closed-override": {
      const note = override?.reason ? ` · ${override.reason}` : "";
      return `${t.calendarTooltipClosedOverride}${note}`;
    }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

const ScheduleCalendar = ({ rules, overrides, horizonDays, onAddOverride }: Props) => {
  const [displayMonth, setDisplayMonth] = useState(() => new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const year = displayMonth.getFullYear();
  const month = displayMonth.getMonth();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const horizonDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(today.getDate() + horizonDays);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [today, horizonDays]);

  const activeDaysOfWeek = useMemo(
    () => new Set(rules.filter((r) => r.is_active).map((r) => r.day_of_week)),
    [rules]
  );

  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  // Range preview: the highlighted interval while user is picking an end date
  const previewInterval = useMemo(() => {
    if (!rangeStart || !hoverDate) return null;
    const a = rangeStart <= hoverDate ? rangeStart : hoverDate;
    const b = rangeStart <= hoverDate ? hoverDate : rangeStart;
    return { start: a, end: b };
  }, [rangeStart, hoverDate]);

  const isActionable = (date: Date): boolean => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= today && d <= horizonDate;
  };

  const handleDayClick = (date: Date) => {
    if (!onAddOverride || !isActionable(date)) return;

    if (!rangeStart) {
      // First click — set range start
      setRangeStart(date);
    } else {
      // Second click — commit range
      const start = rangeStart <= date ? rangeStart : date;
      const end   = rangeStart <= date ? date : rangeStart;
      onAddOverride(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
      setRangeStart(null);
      setHoverDate(null);
    }
  };

  const cancelRange = () => {
    setRangeStart(null);
    setHoverDate(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl text-foreground">{t.calendarTitle}</h2>
          {rangeStart && (
            <span className="flex items-center gap-2 text-xs font-body text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {t.calendarRangeStart}: {format(rangeStart, "MMM d")} — {t.calendarRangePickEnd}
              <button onClick={cancelRange} className="ml-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Cancel">✕</button>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDisplayMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label={t.calendarPrev}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-body text-sm font-medium w-32 text-center">
            {format(displayMonth, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setDisplayMonth((m) => addMonths(m, 1))}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label={t.calendarNext}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar grid — max-w-lg keeps cells compact on wide screens */}
      <TooltipProvider delayDuration={150}>
        <div className="max-w-lg">
          <div className="rounded-xl border border-border overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-muted/50">
              {WEEK_DAYS.map((d) => (
                <div key={d} className="py-2 text-center font-body text-xs text-muted-foreground font-medium">
                  {d}
                </div>
              ))}
            </div>

            {/* Day rows */}
            <div className="divide-y divide-border">
              {grid.map((row, ri) => (
                <div key={ri} className="grid grid-cols-7 divide-x divide-border">
                  {row.map((date, ci) => {
                    if (!date) {
                      // Fix: truly blank padding cells, no background fill
                      return <div key={ci} className="h-10" />;
                    }

                    const state = classifyDay(date, activeDaysOfWeek, overrides, today, horizonDate);
                    const clickable = !!onAddOverride && isActionable(date);
                    const tooltipText = buildTooltip(state.kind, date, rules, state.override);

                    const inPreview = previewInterval
                      ? isWithinInterval(date, previewInterval)
                      : false;
                    const isRangeStart = rangeStart && format(date, "yyyy-MM-dd") === format(rangeStart, "yyyy-MM-dd");

                    return (
                      <Tooltip key={ci}>
                        <TooltipTrigger asChild>
                          <div
                            onClick={() => handleDayClick(date)}
                            onMouseEnter={() => clickable && setHoverDate(date)}
                            onMouseLeave={() => setHoverDate(null)}
                            className={[
                              "h-10 flex items-center justify-center font-body text-sm transition-colors",
                              cellBase[state.kind],
                              clickable ? "cursor-pointer" : "cursor-default",
                              // Range preview highlight
                              inPreview && !isRangeStart
                                ? "!bg-primary/25 !text-foreground"
                                : "",
                              isRangeStart
                                ? "!bg-primary !text-primary-foreground font-bold"
                                : "",
                              clickable && !inPreview && !isRangeStart
                                ? "hover:brightness-95"
                                : "",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            {format(date, "d")}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs max-w-[220px] text-center">
                          <p className="font-medium">{format(date, "EEE, MMM d")}</p>
                          <p>{tooltipText}</p>
                          {clickable && (
                            <p className="text-muted-foreground mt-0.5">
                              {rangeStart ? t.calendarRangePickEnd : t.calendarClickHint}
                            </p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </TooltipProvider>

      {/* Legend — w-fit + flex-wrap keeps items tight, no stretching */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 max-w-lg">
        {LEGEND.map(({ kind, label, swatch }) => (
          <span key={kind} className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
            <span className={`w-3 h-3 rounded-sm shrink-0 inline-block ${swatch}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
