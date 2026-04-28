import { useState, useMemo } from "react";
import { format, addMonths, subMonths } from "date-fns";
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
  onAddOverride?: (dateStr: string) => void;
}

// ─── Cell styling ─────────────────────────────────────────────────────────────

const cellClass: Record<DayKind, string> = {
  open: "bg-primary/15 border border-primary/40 text-foreground hover:bg-primary/25 cursor-pointer",
  closed: "text-muted-foreground/50 hover:bg-muted/50 cursor-pointer",
  "open-override": "bg-primary/30 border-2 border-primary text-foreground font-semibold hover:bg-primary/40 cursor-pointer",
  "closed-override": "bg-destructive/10 border border-destructive/40 text-destructive hover:bg-destructive/20 cursor-pointer",
  past: "text-muted-foreground/30 cursor-default",
  "beyond-horizon": "text-muted-foreground/20 cursor-default",
};

// ─── Tooltip content builder ──────────────────────────────────────────────────

function buildTooltip(
  kind: DayKind,
  date: Date,
  rules: ScheduleRule[],
  override?: DateOverride
): string {
  const dow = date.getDay();

  switch (kind) {
    case "past":
      return t.calendarTooltipPast;
    case "beyond-horizon":
      return t.calendarTooltipBeyond;
    case "closed":
      return t.calendarTooltipClosed;
    case "open": {
      const dayRules = rules.filter((r) => r.is_active && r.day_of_week === dow);
      const windows = dayRules.map((r) => `${r.start_time.slice(0, 5)}–${r.end_time.slice(0, 5)}`).join(", ");
      return `${t.calendarTooltipOpen}${windows ? ` · ${windows}` : ""}`;
    }
    case "open-override": {
      const time =
        override?.start_time && override.end_time
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

// ─── Legend ───────────────────────────────────────────────────────────────────

const LEGEND: { kind: DayKind; label: string; swatch: string }[] = [
  { kind: "open", label: t.calendarLegendOpen, swatch: "bg-primary/15 border border-primary/40" },
  { kind: "open-override", label: t.calendarLegendOpenOverride, swatch: "bg-primary/30 border-2 border-primary" },
  { kind: "closed-override", label: t.calendarLegendClosedOverride, swatch: "bg-destructive/10 border border-destructive/40" },
  { kind: "closed", label: t.calendarLegendClosed, swatch: "bg-muted" },
  { kind: "past", label: t.calendarLegendPast, swatch: "bg-muted/40" },
  { kind: "beyond-horizon", label: t.calendarLegendBeyond, swatch: "bg-muted/20" },
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Component ────────────────────────────────────────────────────────────────

const ScheduleCalendar = ({ rules, overrides, horizonDays, onAddOverride }: Props) => {
  const [displayMonth, setDisplayMonth] = useState(() => new Date());

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

  const handleDayClick = (date: Date) => {
    if (!onAddOverride) return;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d < today || d > horizonDate) return;
    onAddOverride(format(date, "yyyy-MM-dd"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-foreground">{t.calendarTitle}</h2>
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

      <TooltipProvider delayDuration={150}>
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-muted/50">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="py-2 text-center font-body text-xs text-muted-foreground font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="divide-y divide-border">
            {grid.map((row, ri) => (
              <div key={ri} className="grid grid-cols-7 divide-x divide-border">
                {row.map((date, ci) => {
                  if (!date) {
                    return <div key={ci} className="h-11 bg-muted/20" />;
                  }

                  const state = classifyDay(date, activeDaysOfWeek, overrides, today, horizonDate);
                  const tooltipText = buildTooltip(state.kind, date, rules, state.override);
                  const isClickable =
                    onAddOverride &&
                    state.kind !== "past" &&
                    state.kind !== "beyond-horizon";

                  return (
                    <Tooltip key={ci}>
                      <TooltipTrigger asChild>
                        <div
                          onClick={() => isClickable && handleDayClick(date)}
                          className={`h-11 flex items-center justify-center font-body text-sm rounded-none transition-colors ${cellClass[state.kind]}`}
                        >
                          {format(date, "d")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-[220px] text-center">
                        <p className="font-medium">{format(date, "EEE, MMM d")}</p>
                        <p>{tooltipText}</p>
                        {isClickable && (
                          <p className="text-muted-foreground mt-0.5">{t.calendarClickHint}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </TooltipProvider>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {LEGEND.map(({ kind, label, swatch }) => (
          <span key={kind} className="flex items-center gap-1.5 font-body text-xs text-muted-foreground">
            <span className={`w-3 h-3 rounded-sm inline-block ${swatch}`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ScheduleCalendar;
