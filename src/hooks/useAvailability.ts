import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { findOverrideForDate, computeSlots } from "@/lib/availability";
import type { DateOverride, ComputedSlot } from "@/lib/availability";
import type { SessionType } from "@/components/booking/SessionTypeSelector";

export type { ComputedSlot };

const DEFAULT_HORIZON_DAYS = 180;
const DEFAULT_NOTICE_HOURS = 24;

export function useSessionTypes() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("session_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setSessionTypes((data as unknown as SessionType[]) || []);
        setLoading(false);
      });
  }, []);

  return { sessionTypes, loading };
}

export function useAvailableSlots(date: Date | undefined, durationMinutes: number) {
  const [slots, setSlots] = useState<ComputedSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [minimumNoticeHours, setMinimumNoticeHours] = useState(DEFAULT_NOTICE_HOURS);

  const fetchSlots = useCallback(async () => {
    if (!date) return;
    setLoading(true);

    const dateStr = format(date, "yyyy-MM-dd");
    const dayOfWeek = date.getDay();
    const now = new Date();

    // Fetch settings, date overrides covering this date, and booked slots in parallel
    const [settingsResult, overridesResult, bookingsResult] = await Promise.all([
      supabase
        .from("settings")
        .select("key, value")
        .in("key", ["booking_horizon_days", "minimum_notice_hours"]),
      supabase
        .from("availability_overrides")
        .select("*")
        .lte("override_date", dateStr)
        .gte("end_date", dateStr)
        .is("deleted_at", null),
      supabase.rpc("get_booked_slots", { target_date: dateStr }),
    ]);

    // Parse settings
    const settingsMap = new Map(
      (settingsResult.data || []).map((s) => [s.key, s.value])
    );
    const horizonDays =
      typeof settingsMap.get("booking_horizon_days") === "number"
        ? (settingsMap.get("booking_horizon_days") as number)
        : DEFAULT_HORIZON_DAYS;
    const noticeHours =
      typeof settingsMap.get("minimum_notice_hours") === "number"
        ? (settingsMap.get("minimum_notice_hours") as number)
        : DEFAULT_NOTICE_HOURS;

    setMinimumNoticeHours(noticeHours);

    // Horizon check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizonEnd = new Date(today);
    horizonEnd.setDate(today.getDate() + horizonDays);
    horizonEnd.setHours(23, 59, 59, 999);

    if (date < today || date > horizonEnd) {
      console.log(
        JSON.stringify({
          event: "slots_filtered",
          date: dateStr,
          appliedRules: { horizon: horizonDays, minimumNotice: noticeHours, override: null },
          slotsBeforeFiltering: 0,
          slotsAfterFiltering: 0,
          reason: date < today ? "past_date" : "beyond_horizon",
        })
      );
      setSlots([]);
      setLoading(false);
      return;
    }

    // Resolve override for this date
    const overrides = (overridesResult.data || []).map((o) => ({
      ...o,
      deleted_at: o.deleted_at ?? null,
      buffer_minutes: o.buffer_minutes ?? 0,
      end_date: o.end_date ?? o.override_date,
    })) as DateOverride[];

    const override = findOverrideForDate(dateStr, overrides);

    // Closed override → no slots
    if (override && !override.is_available) {
      console.log(
        JSON.stringify({
          event: "slots_filtered",
          date: dateStr,
          appliedRules: { horizon: horizonDays, minimumNotice: noticeHours, override: "closed" },
          slotsBeforeFiltering: null,
          slotsAfterFiltering: 0,
        })
      );
      setSlots([]);
      setLoading(false);
      return;
    }

    let windows: { start: string; end: string; buffer_minutes: number }[] = [];

    if (override && override.is_available && override.start_time && override.end_time) {
      // Open override: use override's time window
      windows = [
        {
          start: override.start_time,
          end: override.end_time,
          buffer_minutes: override.buffer_minutes,
        },
      ];
    } else {
      // Weekly schedule
      const { data: rules } = await supabase
        .from("availability_rules")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true);

      windows = (rules || []).map((r) => ({
        start: r.start_time,
        end: r.end_time,
        buffer_minutes: r.buffer_minutes || 0,
      }));
    }

    const bookedSlots = (bookingsResult.data || []).map(
      (b: { start_time: string; end_time: string }) => ({
        start: parseISO(b.start_time),
        end: parseISO(b.end_time),
      })
    );

    const computed = computeSlots(
      date,
      windows,
      bookedSlots,
      durationMinutes,
      noticeHours,
      now
    );

    console.log(
      JSON.stringify({
        event: "slots_filtered",
        date: dateStr,
        appliedRules: {
          horizon: horizonDays,
          minimumNotice: noticeHours,
          override: override ? (override.is_available ? "open" : "closed") : null,
        },
        slotsBeforeFiltering: computed.length + computed.filter((s) => s.disabled).length,
        slotsAfterFiltering: computed.filter((s) => !s.disabled).length,
        disabledByNotice: computed.filter((s) => s.disabled).length,
      })
    );

    setSlots(computed);
    setLoading(false);
  }, [date, durationMinutes]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return { slots, loading, minimumNoticeHours };
}
