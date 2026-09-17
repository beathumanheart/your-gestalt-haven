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

/**
 * The solidarity scale the site advertises, derived from the rows that
 * publish one.
 *
 * The homepage slider used to hardcode €40–€100 while the database published
 * nothing, so a reader saw a scale that no structured data could confirm and
 * nothing kept the two in step. Both now come from here: the slider draws
 * these bounds, and `pricingToOffer` turns the same row into the
 * AggregateOffer, so a price cannot be changed in one place only.
 *
 * Returns undefined when no row publishes a range — including when
 * `show_price` is false, because `sessionPricing` already resolves that. A
 * missing scale means the slider does not render, which is the honest outcome:
 * there is no published price to show.
 *
 * Bounds are the widest across offerings, since one scale is drawn for the
 * whole practice. Mixed currencies publish nothing rather than a scale in an
 * unstated unit.
 */
export const publishedScale = (
  rows: readonly PricedSession[],
): { min: number; max: number; currency: string } | undefined => {
  const ranges = rows
    .map(sessionPricing)
    .filter((p): p is Extract<SessionPricing, { kind: "range" }> => p.kind === "range");

  if (ranges.length === 0) return undefined;

  const { currency } = ranges[0];
  if (ranges.some((r) => r.currency !== currency)) return undefined;

  return {
    min: Math.min(...ranges.map((r) => r.min)),
    max: Math.max(...ranges.map((r) => r.max)),
    currency,
  };
};

/**
 * Which of the three pricing bands a chosen rate falls in.
 *
 * Thirds of the published range rather than fixed figures, so the bands move
 * with the scale instead of being a third place a price is written down. On a
 * 40–100 scale this gives the same boundaries the hardcoded version had (60
 * and 80), which is what keeps the copy in src/content/services.ts accurate.
 */
export const scaleBand = (rate: number, min: number, max: number): 0 | 1 | 2 => {
  const third = (max - min) / 3;
  if (rate < min + third) return 0;
  if (rate <= min + 2 * third) return 1;
  return 2;
};
