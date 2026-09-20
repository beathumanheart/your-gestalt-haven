/**
 * ============================================================
 * THE PER-SESSION SERVICE NODE — ONE BUILDER, TWO EMITTERS
 * ============================================================
 * The schema.org `Service` for a bookable session, carrying the offer that
 * `pricingToOffer` derives from the row.
 *
 * It is emitted twice, from here, and that is deliberate:
 *
 *   at build time   scripts/static-site/render.ts writes it into the page, so
 *                   a crawler that does not execute JavaScript can read it
 *   at runtime      <ServiceJsonLd> replaces that node on mount, so a reader
 *                   and a rendering crawler get live data rather than a
 *                   snapshot frozen at the last deploy
 *
 * The runtime emitter *replaces* rather than appends, keyed on
 * SERVICE_NODE_ATTR. Two AggregateOffers for one Service with different
 * prices is a contradiction a search engine cannot resolve — worse than one
 * stale offer — so there must never be two.
 *
 * Relative imports only: render.ts pulls this into the build and esbuild
 * resolves it without Vite's "@/" alias, the same constraint identity.ts and
 * pageMetadata.ts carry.
 * ============================================================
 */

import { SITE_URL } from "./identity";
import { sessionPricing, pricingToOffer, type PricedSession } from "../lib/pricing";

/** Marks the one script tag that carries this node, for either emitter. */
export const SERVICE_NODE_ATTR = "data-service-node";

/** Finds it in a document, and is also the selector the build output must match. */
export const SERVICE_NODE_SELECTOR = `script[type="application/ld+json"][${SERVICE_NODE_ATTR}]`;

const PERSON_ID = `${SITE_URL}/#genia`;

export interface ServiceNodeInput {
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  /** Path to the bookable page, e.g. "/en/book/individual-therapy". */
  urlPath: string;
  /** The session_types row, for pricing and duration. */
  session?: (PricedSession & { duration_minutes?: number | null }) | null;
}

/**
 * Builds the node for one language.
 *
 * `offers` comes from the same derivation the visible price uses, so the
 * markup cannot contradict the page — including honouring `show_price`, which
 * means a session that publishes no price publishes no offer either.
 */
export const buildServiceNode = (
  input: ServiceNodeInput,
  lang: "en" | "ru",
): Record<string, unknown> => {
  const isRu = lang === "ru";
  const offers = input.session
    ? pricingToOffer(sessionPricing(input.session), input.session.duration_minutes)
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isRu ? input.nameRu : input.nameEn,
    description: isRu ? input.descriptionRu : input.descriptionEn,
    url: `${SITE_URL}${input.urlPath}`,
    // No `inLanguage`: it is not in Service's domain (it belongs to
    // CreativeWork and friends), so it would be an unknown field. The page
    // language is carried by <html lang> and the hreflang alternates.
    provider: { "@id": PERSON_ID },
    areaServed: isRu ? "Весь мир (онлайн)" : "Worldwide (online)",
    serviceType: isRu ? "Консультирование" : "Counselling",
    ...(offers ? { offers } : {}),
  };
};

/** The build-time form: one script tag, marked, ready to be replaced at runtime. */
export const renderServiceNodeTag = (node: Record<string, unknown>): string =>
  `<script type="application/ld+json" ${SERVICE_NODE_ATTR}="build">${JSON.stringify(
    node,
    null,
    2,
  )}</script>`;
