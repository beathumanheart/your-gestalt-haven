import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { buildAvailableDates, findOverrideForDate } from "@/lib/availability";
import type { DateOverride } from "@/lib/availability";

const DEFAULT_HORIZON_DAYS = 180;
const DEFAULT_LEAD_TIME_MINUTES = 1200; // 20 hours

export function useAvailableDates(month: Date, overrideLeadMinutes?: number) {
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [horizonDate, setHorizonDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract primitives so the effect dep array contains stable values, not a
  // Date object reference that may change identity without changing month/year.
  const year = month.getFullYear();
  const m = month.getMonth();

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);

      const firstDay = format(new Date(year, m, 1), "yyyy-MM-dd");
      const lastDay = format(new Date(year, m + 1, 0), "yyyy-MM-dd");

      const [rulesResult, overridesResult, settingsResult] = await Promise.all([
        supabase
          .from("availability_rules")
          .select("day_of_week, end_time")  // end_time needed for lead-time date filtering
          .eq("is_active", true),
        supabase
          .from("availability_overrides")
          .select("*")
          // Any override that overlaps with this month
          .lte("override_date", lastDay)
          .gte("end_date", firstDay)
          .is("deleted_at", null),
        supabase
          .from("settings")
          .select("key, value")
          .in("key", ["booking_horizon_days", "booking_min_lead_time_minutes"]),
      ]);

      const activeDaysOfWeek = new Set(
        (rulesResult.data || []).map((r) => r.day_of_week as number)
      );

      const overrides = (overridesResult.data || []).map((o) => ({
        ...o,
        deleted_at: o.deleted_at ?? null,
        buffer_minutes: o.buffer_minutes ?? 0,
        end_date: o.end_date ?? o.override_date,
      })) as DateOverride[];

      const horizonSetting = (settingsResult.data || []).find(
        (s) => s.key === "booking_horizon_days"
      );
      const horizonDays =
        typeof horizonSetting?.value === "number"
          ? horizonSetting.value
          : DEFAULT_HORIZON_DAYS;

      const leadSetting = (settingsResult.data || []).find(
        (s) => s.key === "booking_min_lead_time_minutes"
      );
      const globalLeadMinutes =
        typeof leadSetting?.value === "number"
          ? leadSetting.value
          : DEFAULT_LEAD_TIME_MINUTES;

      const leadMinutes = overrideLeadMinutes !== undefined ? overrideLeadMinutes : globalLeadMinutes;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { availableDays: days, horizonDate: hDate } = buildAvailableDates(
        year,
        m,
        activeDaysOfWeek,
        overrides,
        today,
        horizonDays
      );

      // Filter: exclude dates where the latest possible slot start falls within the
      // lead time window. We use window end_time - 30 min as the latest slot start.
      // For open overrides the override's end_time is used; otherwise use rules.
      const cutoffMs = Date.now() + leadMinutes * 60 * 1000;
      const leadFiltered = new Set<string>();

      for (const dateStr of days) {
        const dateObj = new Date(dateStr + "T00:00:00");
        const dayOfWeek = dateObj.getDay();

        const override = findOverrideForDate(dateStr, overrides);
        let latestWindowEndMs = 0;

        if (override && override.is_available && override.end_time) {
          const [h, min] = override.end_time.split(":").map(Number);
          latestWindowEndMs = (h * 60 + min) * 60 * 1000;
        } else if (!override) {
          for (const rule of (rulesResult.data || [])) {
            if ((rule.day_of_week as number) !== dayOfWeek) continue;
            const [h, min] = (rule.end_time as string).split(":").map(Number);
            latestWindowEndMs = Math.max(latestWindowEndMs, (h * 60 + min) * 60 * 1000);
          }
        }

        if (latestWindowEndMs === 0) continue;

        // Latest possible slot start = window end - 30 min (minimum slot interval)
        const latestSlotStartMs = dateObj.getTime() + latestWindowEndMs - 30 * 60 * 1000;
        if (latestSlotStartMs >= cutoffMs) {
          leadFiltered.add(dateStr);
        }
      }

      setAvailableDays(leadFiltered);
      setHorizonDate(hDate);
      setLoading(false);
    }

    fetchAvailability();
  }, [year, m, overrideLeadMinutes]);

  return { availableDays, horizonDate, loading };
}
