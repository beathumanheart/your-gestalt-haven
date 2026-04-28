import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { buildAvailableDates } from "@/lib/availability";
import type { DateOverride } from "@/lib/availability";

const DEFAULT_HORIZON_DAYS = 180;

export function useAvailableDates(month: Date) {
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
          .select("day_of_week")
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
          .in("key", ["booking_horizon_days"]),
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

      setAvailableDays(days);
      setHorizonDate(hDate);
      setLoading(false);
    }

    fetchAvailability();
  }, [year, m]);

  return { availableDays, horizonDate, loading };
}
