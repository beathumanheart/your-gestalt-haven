/**
 * ============================================================
 * SESSION PRICING — ONE DERIVATION, TWO CONSUMERS
 * ============================================================
 * The rules for whether a price is shown, and which of price /
 * min_price / max_price applies, live here so the visible price and
 * the schema.org markup can never disagree.
 *
 * `show_price: false` means the practitioner has chosen not to publish
 * a figure. That choice must hold in markup too — structured data is
 * published output, not an internal detail — so this returns `hidden`
 * and callers emit nothing.
 * ============================================================
 */

/** The pricing fields of a session_types row, as the UI consumes them. */
export interface PricedSession {
  show_price?: boolean;
  pricing_type?: string;
  price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  currency?: string | null;
}

export type SessionPricing =
  | { kind: "hidden" }
  | { kind: "fixed"; price: number; currency: string }
  | { kind: "range"; min: number; max: number; currency: string };

/** Matches the historic UI fallback: rows predate the currency column. */
export const DEFAULT_CURRENCY = "USD";

/**
 * Which price, if any, this session publishes.
 *
 * Mirrors the original inline conditions in SessionTypeSelector: a
 * solidarity session needs both bounds to render a range, and a fixed
 * session needs a price. Anything else publishes nothing.
 */
export const sessionPricing = (st: PricedSession): SessionPricing => {
  if (!st.show_price) return { kind: "hidden" };

  const currency = st.currency || DEFAULT_CURRENCY;

  if (st.pricing_type === "solidarity") {
    return st.min_price != null && st.max_price != null
      ? { kind: "range", min: st.min_price, max: st.max_price, currency }
      : { kind: "hidden" };
  }

  return st.price != null ? { kind: "fixed", price: st.price, currency } : { kind: "hidden" };
};

/**
 * The schema.org offer for a session, or undefined when nothing is
 * published. A priceless Offer says almost nothing, so we omit the
 * property rather than emit an empty one.
 *
 * Session length rides on the offer rather than on the Service. That is
 * not a stylistic choice: `additionalProperty` is in the domain of
 * Offer but not of Service (checked against schema.org's own
 * definitions), so on a Service it would simply be an unknown field.
 * The side effect is that a session with a hidden price publishes no
 * duration either — acceptable, since the alternative is invalid markup.
 */
export const pricingToOffer = (
  pricing: SessionPricing,
  durationMinutes?: number | null,
): Record<string, unknown> | undefined => {
  const availability = "https://schema.org/InStock";

  const duration =
    durationMinutes != null
      ? {
          additionalProperty: {
            "@type": "PropertyValue",
            name: "Session duration",
            value: durationMinutes,
            unitCode: "MIN", // UN/CEFACT code for minute
          },
        }
      : {};

  switch (pricing.kind) {
    case "fixed":
      return {
        "@type": "Offer",
        price: String(pricing.price),
        priceCurrency: pricing.currency,
        availability,
        ...duration,
      };
    case "range":
      return {
        "@type": "AggregateOffer",
        lowPrice: String(pricing.min),
        highPrice: String(pricing.max),
        priceCurrency: pricing.currency,
        availability,
        ...duration,
      };
    case "hidden":
      return undefined;
  }
};
