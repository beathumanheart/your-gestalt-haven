import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type HiddenOffer = Database["public"]["Tables"]["hidden_offers"]["Row"];
export type HiddenOfferInsert = Database["public"]["Tables"]["hidden_offers"]["Insert"];
export type HiddenOfferUpdate = Database["public"]["Tables"]["hidden_offers"]["Update"];

const QUERY_KEY = ["hidden_offers"] as const;

export function useHiddenOffers() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<HiddenOffer[]> => {
      const { data, error } = await supabase
        .from("hidden_offers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as HiddenOffer[];
    },
  });
}

export function useOfferBookingCounts() {
  return useQuery({
    queryKey: ["offer_booking_counts"],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("bookings")
        .select("hidden_offer_id")
        .not("hidden_offer_id", "is", null)
        .neq("status", "cancelled");
      if (error) throw error;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) {
        if (row.hidden_offer_id) {
          counts[row.hidden_offer_id] = (counts[row.hidden_offer_id] ?? 0) + 1;
        }
      }
      return counts;
    },
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (offer: HiddenOfferInsert): Promise<HiddenOffer> => {
      const { data, error } = await supabase
        .from("hidden_offers")
        .insert(offer)
        .select("*")
        .single();
      if (error) throw error;
      return data as HiddenOffer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...update }: HiddenOfferUpdate & { id: string }): Promise<HiddenOffer> => {
      const { data, error } = await supabase
        .from("hidden_offers")
        .update(update)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data as HiddenOffer;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
