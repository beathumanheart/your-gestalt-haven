import { useState, useMemo } from "react";
import { format, addMonths, subMonths, isWithinInterval, getYear, getMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { availabilityEN as t } from "@/content/availability";
import { classifyDay, buildMonthGrid } from "@/lib/scheduleCalendar";
import type { DayKind } from "@/lib/scheduleCalendar";
import type { DateOverride } from "@/lib/availability";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleRule {
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

interface MonthGridProps {
  year: number;
  month: number;
  rules: ScheduleRule[];
  overrides: DateOverride[];
  today: Date;
  horizonDate: Date;
  activeDaysOfWeek: Set<number>;
  rangeStart: Date | null;
  previewInterval: { start: Date; end: Date } | null;
  isActionable: (date: Date) => boolean;
  onDayClick: (date: Date) => void;
  onDayHover: (date: Date | null) => void;
}

// ─── Cell base styling ────────────────────────────────────────────────────────

const cellBase: Record<DayKind, string> = {
  open: "bg-primary/15 border border-primary/40 text-foreground",
  closed: "text-muted-foreground/50",
  "open-override": "bg-primary/30 border-2 border-primary text-foreground font-semibold",
  "closed-override": "bg-destructive/10 border border-destructive/40 text-destructive",
  past: "text-muted-foreground/30",
  "beyond-horizon": "text-muted-foreground/20",
};

// ─── Legend items ─────────────────────────────────────────────────────────────

const LEGEND: { kind: DayKind; label: string; swatch: string }[] = [
  { kind: "open",            label: t.calendarLegendOpen,           swatch: "bg-primary/15 border border-primary/40" },
  { kind: "open-override",   label: t.calendarLegendOpenOverride,   swatch: "bg-primary/30 border-2 border-primary" },
  { kind: "closed-override", label: t.calendarLegendClosedOverride, swatch: "bg-destructive/10 border border-destructive/40" },
  { kind: "closed",          label: t.calendarLegendClosed,         swatch: "bg-muted" },
  { kind: "past",            label: t.calendarLegendPast,           swatch: "bg-muted/40" },
  { kind: "beyond-horizon",  label: t.calendarLegendBeyond,         swatch: "bg-muted/20" },
];

const WEEK_DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Header label ─────────────────────────────────────────────────────────────

/**
 * Builds the navigation header label for one or two visible months.
 * Single month: "May 2026"
 * Two months, same year: "May – June 2026"
 * Two months, cross-year: "December 2026 – January 2027"
 */
export function buildHeaderLabel(first: Date, second: Date | null): string {
  if (!second) return format(first, "MMMM yyyy");
  const y1 = getYear(first);
  const y2 = getYear(second);
  if (y1 === y2) {
    return t.calendarHeaderSameYear
      .replace("[m1]", format(first, "MMMM"))
      .replace("[m2]", format(second, "MMMM"))
      .replace("[y]", String(y1));
  }
  return t.calendarHeaderCrossYear
    .replace("[m1]", format(first, "MMMM"))
    .replace("[y1]", String(y1))
    .replace("[m2]", format(second, "MMMM"))
    .replace("[y2]", String(y2));
}

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

// ─── MonthGrid sub-component ──────────────────────────────────────────────────

function MonthGrid({
  year,
  month,
  rules,
  overrides,
  today,
  horizonDate,
  activeDaysOfWeek,
  rangeStart,
  previewInterval,
  isActionable,
  onDayClick,
  onDayHover,
}: MonthGridProps) {
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  return (
    <div className="rounded-xl border border-border overflow-hidden min-w-0 flex-1">
      {/* Month name above each grid */}
      <div className="py-2 text-center font-body text-xs font-semibold text-muted-foreground bg-muted/30 border-b border-border">
        {format(new Date(year, month, 1), "MMMM yyyy")}
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 bg-muted/50">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="py-1.5 text-center font-body text-xs text-muted-foreground font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Day rows */}
      <div className="divide-y divide-border">
        {grid.map((row, ri) => (
          <div key={ri} className="grid grid-cols-7 divide-x divide-border">
            {row.map((date, ci) => {
              if (!date) return <div key={ci} className="h-10" />;

              const state = classifyDay(date, activeDaysOfWeek, overrides, today, horizonDate);
              const clickable = isActionable(date);
              const tooltipText = buildTooltip(state.kind, date, rules, state.override);

              const dateStr = format(date, "yyyy-MM-dd");
              const isStart = rangeStart != null && format(rangeStart, "yyyy-MM-dd") === dateStr;
              const inPreview = previewInterval != null && isWithinInterval(date, previewInterval);

              return (
                <Tooltip key={ci}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => onDayClick(date)}
                      onMouseEnter={() => clickable && onDayHover(date)}
                      onMouseLeave={() => onDayHover(null)}
                      className={[
                        "h-10 flex items-center justify-center font-body text-sm transition-colors select-none",
                        cellBase[state.kind],
                        clickable ? "cursor-pointer" : "cursor-default",
                        isStart ? "!bg-primary !text-primary-foreground font-bold" : "",
                        inPreview && !isStart ? "!bg-primary/25 !text-foreground" : "",
                        clickable && !inPreview && !isStart ? "hover:brightness-95" : "",
                      ].filter(Boolean).join(" ")}
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
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const ScheduleCalendar = ({ rules, overrides, horizonDays, onAddOverride }: Props) => {
  const [displayMonth, setDisplayMonth] = useState(() => new Date());
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const secondMonth = addMonths(displayMonth, 1);

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

  const previewInterval = useMemo(() => {
    if (!rangeStart || !hoverDate) return null;
    const a = rangeStart <= hoverDate ? rangeStart : hoverDate;
    const b = rangeStart <= hoverDate ? hoverDate : rangeStart;
    return { start: a, end: b };
  }, [rangeStart, hoverDate]);

  const isActionable = (date: Date): boolean => {
    if (!onAddOverride) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= today && d <= horizonDate;
  };

  const handleDayClick = (date: Date) => {
    if (!isActionable(date)) return;
    if (!rangeStart) {
      setRangeStart(date);
    } else {
      const start = rangeStart <= date ? rangeStart : date;
      const end   = rangeStart <= date ? date : rangeStart;
      onAddOverride!(format(start, "yyyy-MM-dd"), format(end, "yyyy-MM-dd"));
      setRangeStart(null);
      setHoverDate(null);
    }
  };

  const cancelRange = () => {
    setRangeStart(null);
    setHoverDate(null);
  };

  // Header label — desktop shows both months, mobile shows just the first
  const desktopLabel = buildHeaderLabel(displayMonth, secondMonth);
  const mobileLabel  = buildHeaderLabel(displayMonth, null);

  const sharedGridProps = {
    rules,
    overrides,
    today,
    horizonDate,
    activeDaysOfWeek,
    rangeStart,
    previewInterval,
    isActionable,
    onDayClick: handleDayClick,
    onDayHover: setHoverDate,
  };

  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="font-display text-xl text-foreground shrink-0">{t.calendarTitle}</h2>
          {rangeStart && (
            <span className="flex items-center gap-2 text-xs font-body text-primary bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
              {t.calendarRangeStart}: {format(rangeStart, "MMM d")} — {t.calendarRangePickEnd}
              <button
                onClick={cancelRange}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cancel selection"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setDisplayMonth((m) => subMonths(m, 1))}
            className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors"
            aria-label={t.calendarPrev}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {/* Desktop: "May – June 2026" */}
          <span className="hidden lg:block font-body text-sm font-medium text-center min-w-[200px]">
            {desktopLabel}
          </span>
          {/* Mobile/tablet: "May 2026" */}
          <span className="lg:hidden font-body text-sm font-medium text-center min-w-[120px]">
            {mobileLabel}
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

      {/* ── Calendar grids ── */}
      <TooltipProvider delayDuration={150}>
        {/* Desktop: two months side by side, max ~1100px */}
        {/* Tablet/mobile: single month, max-w-lg */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 lg:max-w-[1100px] max-w-lg">
          {/* Left / only month */}
          <MonthGrid
            year={getYear(displayMonth)}
            month={getMonth(displayMonth)}
            {...sharedGridProps}
          />

          {/* Right month — hidden below lg */}
          <div className="hidden lg:block flex-1 min-w-0">
            <MonthGrid
              year={getYear(secondMonth)}
              month={getMonth(secondMonth)}
              {...sharedGridProps}
            />
          </div>
        </div>
      </TooltipProvider>

      {/* ── Shared legend ── */}
      <div className="flex flex-wrap gap-x-3 gap-y-1.5 lg:max-w-[1100px] max-w-lg">
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
