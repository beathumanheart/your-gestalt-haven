import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, isBefore, isAfter, parseISO, startOfDay } from "date-fns";

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export function useSessionTypes() {
  const [sessionTypes, setSessionTypes] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("session_types")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        setSessionTypes(data || []);
        setLoading(false);
      });
  }, []);

  return { sessionTypes, loading };
}

export function useAvailableSlots(date: Date | undefined, durationMinutes: number) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!date) return;
    setLoading(true);

    const dayOfWeek = date.getDay(); // 0=Sun
    const dateStr = format(date, "yyyy-MM-dd");

    // Check for override on this date
    const { data: overrides } = await supabase
      .from("availability_overrides")
      .select("*")
      .eq("override_date", dateStr);

    const override = overrides?.[0];

    // If explicitly marked unavailable
    if (override && !override.is_available) {
      setSlots([]);
      setLoading(false);
      return;
    }

    let windows: { start: string; end: string; buffer_minutes: number }[] = [];

    if (override && override.is_available && override.start_time && override.end_time) {
      // Use override times
      windows = [{ start: override.start_time, end: override.end_time, buffer_minutes: override.buffer_minutes || 0 }];
    } else {
      // Use regular availability rules
      const { data: rules } = await supabase
        .from("availability_rules")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .eq("is_active", true);

      windows = (rules || []).map((r) => ({ start: r.start_time, end: r.end_time, buffer_minutes: r.buffer_minutes || 0 }));
    }

    // Fetch existing bookings for this date using security definer function
    const { data: bookings } = await supabase
      .rpc("get_booked_slots", { target_date: dateStr });

    const bookedSlots = (bookings || []).map((b: { start_time: string; end_time: string }) => ({
      start: parseISO(b.start_time),
      end: parseISO(b.end_time),
    }));

    // Generate time slots
    const now = new Date();
    const available: TimeSlot[] = [];

    for (const window of windows) {
      const [startH, startM] = window.start.split(":").map(Number);
      const [endH, endM] = window.end.split(":").map(Number);

      let cursor = new Date(date);
      cursor.setHours(startH, startM, 0, 0);

      const windowEnd = new Date(date);
      windowEnd.setHours(endH, endM, 0, 0);

      while (isBefore(addMinutes(cursor, durationMinutes), windowEnd) || 
             addMinutes(cursor, durationMinutes).getTime() === windowEnd.getTime()) {
        const slotEnd = addMinutes(cursor, durationMinutes);

        // Skip past slots
        if (isBefore(cursor, now) && format(date, "yyyy-MM-dd") === format(now, "yyyy-MM-dd")) {
          cursor = addMinutes(cursor, 30);
          continue;
        }

        // Check overlap with booked slots (including buffer time)
        const overlaps = bookedSlots.some(
          (b) => isBefore(cursor, addMinutes(b.end, window.buffer_minutes)) && isAfter(slotEnd, b.start)
        );

        if (!overlaps) {
          available.push({
            start: format(cursor, "HH:mm"),
            end: format(slotEnd, "HH:mm"),
          });
        }

        cursor = addMinutes(cursor, 30); // 30-min intervals
      }
    }

    setSlots(available);
    setLoading(false);
  }, [date, durationMinutes]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  return { slots, loading };
}
