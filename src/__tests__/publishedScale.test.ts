/**
 * The advertised scale has one source.
 *
 * The homepage slider hardcoded €40–€100 while the database published nothing,
 * so a reader saw a scale no structured data could confirm and nothing kept
 * the two in step. Both now derive from the session_types rows, through the
 * same functions that build the booking pages' AggregateOffer.
 */

import { describe, expect, it } from "vitest";
import { publishedScale, scaleBand, sessionPricing, pricingToOffer } from "@/lib/pricing";

const solidarity = (min: number, max: number, currency = "EUR") => ({
  show_price: true,
  pricing_type: "solidarity",
  min_price: min,
  max_price: max,
  currency,
});

describe("publishedScale", () => {
  it("publishes nothing while the rows publish nothing", () => {
    // Today's production rows: show_price false, price null.
    const rows = [
      { show_price: false, pricing_type: "fixed", price: null, currency: "EUR" },
      { show_price: false, pricing_type: "fixed", price: null, currency: "EUR" },
    ];
    expect(publishedScale(rows)).toBeUndefined();
  });

  it("respects show_price, so a withheld price cannot leak into the slider", () => {
    expect(publishedScale([{ ...solidarity(40, 100), show_price: false }])).toBeUndefined();
  });

  it("reads the scale the rows publish", () => {
    expect(publishedScale([solidarity(40, 100)])).toEqual({
      min: 40,
      max: 100,
      currency: "EUR",
    });
  });

  it("takes the widest bounds across offerings, since one scale is drawn", () => {
    expect(publishedScale([solidarity(50, 90), solidarity(40, 100)])).toEqual({
      min: 40,
      max: 100,
      currency: "EUR",
    });
  });

  it("publishes nothing rather than a scale in an unstated currency", () => {
    expect(publishedScale([solidarity(40, 100, "EUR"), solidarity(40, 100, "USD")])).toBeUndefined();
  });

  it("ignores fixed-price rows, which are not a scale", () => {
    const fixed = { show_price: true, pricing_type: "fixed", price: 60, currency: "EUR" };
    expect(publishedScale([fixed])).toBeUndefined();
  });
});

describe("scaleBand", () => {
  it("reproduces the boundaries the hardcoded 40-100 slider had", () => {
    // The copy in src/content/services.ts describes three bands; it stays
    // accurate only if the thirds land where they used to (60 and 80).
    for (const rate of [40, 45, 50, 55, 59]) expect(scaleBand(rate, 40, 100)).toBe(0);
    for (const rate of [60, 65, 70, 75, 80]) expect(scaleBand(rate, 40, 100)).toBe(1);
    for (const rate of [85, 90, 95, 100]) expect(scaleBand(rate, 40, 100)).toBe(2);
  });

  it("moves with the scale instead of being a third place a price is written", () => {
    expect(scaleBand(100, 100, 400)).toBe(0);
    expect(scaleBand(250, 100, 400)).toBe(1);
    expect(scaleBand(400, 100, 400)).toBe(2);
  });
});

describe("the slider and the markup agree", () => {
  it("draws the same bounds the AggregateOffer would publish", () => {
    // The point of the change: one row, one derivation, two consumers.
    const rows = [solidarity(40, 100)];
    const scale = publishedScale(rows)!;
    const offer = pricingToOffer(sessionPricing(rows[0]), 50) as Record<string, string>;

    expect(offer["@type"]).toBe("AggregateOffer");
    expect(offer.lowPrice).toBe(String(scale.min));
    expect(offer.highPrice).toBe(String(scale.max));
    expect(offer.priceCurrency).toBe(scale.currency);
  });

  it("emits neither when the price is withheld", () => {
    const row = { ...solidarity(40, 100), show_price: false };
    expect(publishedScale([row])).toBeUndefined();
    expect(pricingToOffer(sessionPricing(row), 50)).toBeUndefined();
  });
});
