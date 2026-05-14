export interface HiddenOffer {
  id: string;
  slug: string;
  name: string;
  title: string;
  description: string;
  conditions: string;
  notification_email: string | null;
  price_cents: number;
  duration_minutes: number;
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type HiddenOfferInsert = Omit<HiddenOffer, "id" | "created_at" | "updated_at">;
export type HiddenOfferUpdate = Partial<HiddenOfferInsert>;
