import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export function useAvailableDates(month: Date) {
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAvailability() {
      setLoading(true);

      // Get all active availability rules (which days of week have slots)
      const { data: rules } = await supabase
        .from("availability_rules")
        .select("day_of_week")
        .eq("is_active", true);

      const activeDaysOfWeek = new Set((rules || []).map((r) => r.day_of_week));

      // Get overrides for this month
      const year = month.getFullYear();
      const m = month.getMonth();
      const firstDay = format(new Date(year, m, 1), "yyyy-MM-dd");
      const lastDay = format(new Date(year, m + 1, 0), "yyyy-MM-dd");

      const { data: overrides } = await supabase
        .from("availability_overrides")
        .select("override_date, is_available")
        .gte("override_date", firstDay)
        .lte("override_date", lastDay);

      const overrideMap = new Map(
        (overrides || []).map((o) => [o.override_date, o.is_available])
      );

      // Build set of available date strings
      const available = new Set<string>();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const daysInMonth = new Date(year, m + 1, 0).getDate();

      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, m, d);
        if (date < today) continue;

        const dateStr = format(date, "yyyy-MM-dd");

        if (overrideMap.has(dateStr)) {
          if (overrideMap.get(dateStr)) available.add(dateStr);
        } else if (activeDaysOfWeek.has(date.getDay())) {
          available.add(dateStr);
        }
      }

      setAvailableDays(available);
      setLoading(false);
    }

    fetchAvailability();
  }, [month.getFullYear(), month.getMonth()]);

  return { availableDays, loading };
}
