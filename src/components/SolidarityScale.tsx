import { useState } from "react";
import { CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { servicesEN, servicesRU } from "@/content/services";
import type { ServicesContent } from "@/content/services";
import { useSessionTypes } from "@/hooks/useAvailability";
import { publishedScale, scaleBand } from "@/lib/pricing";

/**
 * The solidarity slider, drawn from the scale the database publishes.
 *
 * Its own component so the chosen rate can start at the bottom of the scale
 * without the bounds having to be known before the fetch resolves — mounting
 * it is what fixes the starting value.
 */
const SolidaritySlider = ({
  c,
  min,
  max,
  currency,
}: {
  c: ServicesContent;
  min: number;
  max: number;
  currency: string;
}) => {
  // The low end of the scale, not the middle: the first number a reader sees
  // should be the one that asks least of them.
  const [rate, setRate] = useState(min);
  const { label: bandLabel, note: bandNote } = c.bands[scaleBand(rate, min, max)];

  const money = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div>
      <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-1 mb-0.5">
        <span className="font-display text-[34px] leading-none text-foreground">{money(rate)}</span>
        <span className="font-body text-[13px] text-muted-foreground">{c.perUnit}</span>
        <span className="ml-auto font-body text-[13px] text-primary text-right">{bandLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={5}
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        aria-label={c.pricingLabel}
        className="solidarity-slider w-full block my-1.5"
      />
      <div className="flex justify-between font-body text-[12.5px] text-muted-foreground">
        <span>{money(min)}</span>
        <span>{money(max)}</span>
      </div>
      <p className="font-body text-[13.5px] text-muted-foreground leading-relaxed mt-2.5 min-h-[44px]">
        {bandNote}
      </p>
    </div>
  );
};

/**
 * The published pricing scale, as one panel.
 *
 * Lifted out of `Services.tsx` so the service pages can show the same scale
 * rather than a second rendering of the same numbers. The markup is carried
 * over unchanged — the homepage block must look exactly as it did, and
 * `bookingFlag.test.tsx` holds it to that.
 *
 * ⚠️ **This is not a booking feature and must never be gated by
 * `BOOKING_ENABLED`.** It is the pricing display. With the calendar off it is
 * *more* load-bearing, not less: it and the AggregateOffer derived from the
 * same rows are the only places the site states what a session costs. The
 * guard in `bookingFlag.test.tsx` exists precisely because gating this looks
 * like tidying up and is in fact the regression.
 *
 * The scale comes from the same rows the service pages price from, and the
 * same derivation that builds their AggregateOffer — see src/lib/pricing.ts.
 * It used to be €40–€100 written in the markup, which nothing kept in step
 * with the database and which structured data could not confirm.
 *
 * No scale published means no block: a reader sees nothing rather than a
 * figure the markup would contradict.
 */
const SolidarityScale = () => {
  const { language } = useLanguage();
  const c = language === "ru" ? servicesRU : servicesEN;
  const { sessionTypes } = useSessionTypes();
  const scale = publishedScale(sessionTypes);

  if (!scale) return null;

  return (
    <div
      data-testid="solidarity-scale"
      className="p-6 sm:px-8 sm:py-[26px] rounded-[20px] bg-secondary/50 border border-border grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-8 md:gap-9 md:items-center"
    >
      {/* Intro */}
      <div>
        <div className="flex items-center gap-2 mb-2.5">
          <CreditCard className="w-[17px] h-[17px] text-primary" />
          <p className="font-body text-[13px] uppercase tracking-[0.2em] text-primary">
            {c.pricingLabel}
          </p>
        </div>
        <p className="font-body text-[14.5px] text-muted-foreground leading-relaxed">
          {c.pricingIntro}
        </p>
      </div>

      <SolidaritySlider c={c} min={scale.min} max={scale.max} currency={scale.currency} />
    </div>
  );
};

export default SolidarityScale;
