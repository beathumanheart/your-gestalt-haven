import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import {
  CalendarDays,
  Mail,
  User,
  XCircle,
  CheckCircle,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { bookingsAdminEN as t } from "@/content/bookingsAdmin";
import {
  filterByTimeRange,
  filterByStatus,
  filterBySearch,
  sortBookings,
  groupByProximity,
  isUpcoming,
  isPast,
} from "@/lib/bookingsFilter";
import type { BookingRow, TimeRange, SortOption } from "@/lib/bookingsFilter";

// ─── Sub-components ───────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
  completed: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  confirmed: t.statusConfirmed,
  cancelled: t.statusCancelled,
  completed: t.statusCompleted,
};

interface BookingCardProps {
  booking: BookingRow;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

function BookingCard({ booking: b, onUpdateStatus, onDelete }: BookingCardProps) {
  const start = parseISO(b.start_time);
  return (
    <div className="card-organic p-4 md:p-5">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-body ${statusColors[b.status] ?? ""}`}>
              {statusLabels[b.status] ?? b.status}
            </span>
            {b.session_types?.name && (
              <span className="font-body text-xs text-muted-foreground">
                {b.session_types.name}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-body text-sm">
            <span className="flex items-center gap-1 text-foreground">
              <User className="w-3.5 h-3.5 shrink-0" />
              {b.client_name}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Mail className="w-3.5 h-3.5 shrink-0" />
              {b.client_email}
            </span>
          </div>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {t.bookedOn} {format(parseISO(b.created_at), "MMM d, yyyy")}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right font-body text-sm">
            <div className="text-foreground font-medium">{format(start, "MMM d, yyyy")}</div>
            <div className="text-muted-foreground">
              {format(start, "HH:mm")}
              {b.session_types?.duration_minutes
                ? ` · ${b.session_types.duration_minutes}${t.minLabel}`
                : ""}
            </div>
          </div>

          <div className="flex gap-1">
            {b.status === "confirmed" && (
              <>
                <button
                  onClick={() => onUpdateStatus(b.id, "completed")}
                  className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                  title={t.markCompleted}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateStatus(b.id, "cancelled")}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title={t.cancelBooking}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </>
            )}
            {b.status === "cancelled" && (
              <button
                onClick={() => onDelete(b.id)}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                title={t.deleteBooking}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {b.notes && (
        <p className="font-body text-xs text-muted-foreground mt-2 border-t border-border pt-2">
          {b.notes}
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const BookingsList = () => {
  const [allBookings, setAllBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab
  const [tab, setTab] = useState<"upcoming" | "archive">("upcoming");

  // Filters
  const [timeRange, setTimeRange] = useState<TimeRange>("upcoming-90");
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("soonest");

  // Custom date range
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("bookings")
      .select("id, start_time, end_time, client_name, client_email, status, notes, created_at, session_types(name, duration_minutes)")
      .order("start_time", { ascending: true });
    setAllBookings((data as BookingRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBookings(); }, []);

  const updateStatus = async (id: string, status: string) => {
    if (status === "cancelled") {
      try {
        const { data: result, error } = await supabase.functions.invoke("process-booking", {
          body: { action: "cancel", bookingId: id, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        });
        if (error) throw error;
        if (!result?.success) throw new Error(result?.error || "Cancel failed");
        toast.success(t.cancelledSuccess);
      } catch (err) {
        console.error("Admin cancel error:", err);
        toast.error(t.cancelledError);
        return;
      }
    } else {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
      if (error) {
        toast.error(t.completedError);
        return;
      }
      toast.success(t.completedSuccess);
    }
    fetchBookings();
  };

  const deleteBooking = async (id: string) => {
    if (!window.confirm(t.deleteConfirm)) return;
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) {
      toast.error(t.deletedError);
    } else {
      toast.success(t.deletedSuccess);
      fetchBookings();
    }
  };

  const now = useMemo(() => new Date(), []);

  // Split upcoming / archive
  const upcomingBookings = useMemo(() => allBookings.filter((b) => isUpcoming(b, now)), [allBookings, now]);
  const archiveBookings = useMemo(() => allBookings.filter((b) => isPast(b, now)), [allBookings, now]);

  const baseBookings = tab === "upcoming" ? upcomingBookings : archiveBookings;

  const customStartDate = useMemo(() => (customFrom ? new Date(customFrom) : undefined), [customFrom]);
  const customEndDate = useMemo(() => (customTo ? new Date(customTo) : undefined), [customTo]);

  const filtered = useMemo(() => {
    let result = baseBookings;
    if (tab === "upcoming") {
      result = filterByTimeRange(result, timeRange, now, customStartDate, customEndDate);
    }
    result = filterByStatus(result, selectedStatuses);
    result = filterBySearch(result, search);
    return sortBookings(result, sort);
  }, [baseBookings, tab, timeRange, now, customStartDate, customEndDate, selectedStatuses, search, sort]);

  const groups = useMemo(
    () => (tab === "upcoming" ? groupByProximity(filtered, now) : null),
    [filtered, tab, now]
  );

  const hasActiveFilters =
    timeRange !== "upcoming-90" ||
    selectedStatuses.size > 0 ||
    search.trim() !== "" ||
    sort !== "soonest";

  const clearFilters = () => {
    setTimeRange("upcoming-90");
    setSelectedStatuses(new Set());
    setSearch("");
    setSort("soonest");
    setCustomFrom("");
    setCustomTo("");
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        {(["upcoming", "archive"] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-1.5 rounded-md text-sm font-body font-medium transition-colors ${
              tab === tabKey
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabKey === "upcoming" ? t.upcomingTab : t.archiveTab}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({tabKey === "upcoming" ? upcomingBookings.length : archiveBookings.length})
            </span>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-end">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-8 h-9 font-body text-sm"
          />
        </div>

        {/* Time range (upcoming only) */}
        {tab === "upcoming" && (
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="h-9 w-[160px] font-body text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming-90">{t.rangeUpcoming90}</SelectItem>
              <SelectItem value="today">{t.rangeToday}</SelectItem>
              <SelectItem value="this-week">{t.rangeThisWeek}</SelectItem>
              <SelectItem value="this-month">{t.rangeThisMonth}</SelectItem>
              <SelectItem value="all-upcoming">{t.rangeAllUpcoming}</SelectItem>
              <SelectItem value="custom">{t.rangeCustom}</SelectItem>
            </SelectContent>
          </Select>
        )}

        {/* Custom date inputs */}
        {tab === "upcoming" && timeRange === "custom" && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="font-body text-xs text-muted-foreground">{t.customFrom}</span>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 w-[140px] font-body text-sm"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-body text-xs text-muted-foreground">{t.customTo}</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 w-[140px] font-body text-sm"
              />
            </div>
          </>
        )}

        {/* Status toggle chips */}
        <div className="flex gap-1">
          {(["confirmed", "completed", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-body font-medium border transition-colors ${
                selectedStatuses.has(s)
                  ? s === "confirmed"
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : s === "cancelled"
                    ? "bg-destructive/15 border-destructive/40 text-destructive"
                    : "bg-muted border-border text-foreground"
                  : "bg-background border-border text-muted-foreground hover:border-foreground/30"
              }`}
            >
              {statusLabels[s]}
            </button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="h-9 w-[170px] font-body text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="soonest">{t.sortSoonest}</SelectItem>
            <SelectItem value="latest">{t.sortLatest}</SelectItem>
            <SelectItem value="newest-booked">{t.sortNewestBooked}</SelectItem>
            <SelectItem value="oldest-booked">{t.sortOldestBooked}</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-body text-muted-foreground hover:text-foreground border border-border hover:border-foreground/30 transition-colors h-9"
          >
            <X className="w-3 h-3" />
            {t.clearFilters}
          </button>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 && (
        <EmptyState
          icon={<CalendarDays className="w-10 h-10 text-muted-foreground" />}
          message={
            hasActiveFilters || search.trim()
              ? t.emptyFiltered
              : tab === "upcoming"
              ? t.emptyUpcoming
              : t.emptyArchive
          }
        />
      )}

      {filtered.length > 0 && tab === "upcoming" && groups && (
        <GroupedList groups={groups} onUpdateStatus={updateStatus} onDelete={deleteBooking} />
      )}

      {filtered.length > 0 && tab === "archive" && (
        <div className="space-y-3">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} onUpdateStatus={updateStatus} onDelete={deleteBooking} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── GroupedList ──────────────────────────────────────────────────────────────

const groupLabels: Record<string, string> = {
  today: t.groupToday,
  "this-week": t.groupThisWeek,
  "this-month": t.groupThisMonth,
  later: t.groupLater,
};

interface GroupedListProps {
  groups: Map<string, BookingRow[]>;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

function GroupedList({ groups, onUpdateStatus, onDelete }: GroupedListProps) {
  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([key, bookings]) => {
        if (bookings.length === 0) return null;
        return (
          <div key={key}>
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {groupLabels[key] ?? key}
            </h3>
            <div className="space-y-3">
              {bookings.map((b) => (
                <BookingCard key={b.id} booking={b} onUpdateStatus={onUpdateStatus} onDelete={onDelete} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">{icon}</div>
      <p className="font-body text-muted-foreground">{message}</p>
    </div>
  );
}

export default BookingsList;
