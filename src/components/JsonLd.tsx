import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { SITE_URL } from "@/components/PageMeta";
import { sessionPricing, pricingToOffer, type PricedSession } from "@/lib/pricing";

const CANONICAL_ID = `${SITE_URL}/#genia`;

interface ServiceJsonLdProps {
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  /** Path to the bookable page, e.g. "/en/book/gestalt-individual" */
  urlPath: string;
  /** The session_types row, for pricing and duration. */
  session?: PricedSession & { duration_minutes?: number | null };
}

/**
 * JSON-LD for a bookable session-type page.
 *
 * Written through Helmet, so it lands in <head> after mount — which means it
 * is *not* in the prerendered HTML (only #root is captured) and a crawler
 * that does not execute JavaScript never sees it. That gap is issue #68.
 *
 * ⚠️ When #68 is implemented, do not delete this component. Emitting the node
 * at build time and removing this would trade crawler freshness for human
 * staleness: after #67 the build-time node is frozen until the next deploy,
 * and this is what keeps the figure live for everyone who renders the page.
 *
 * The shape to build instead: emit the node at build time with a stable
 * marker, and have this component *replace* the marked node on mount rather
 * than append to it. Crawlers get the snapshot, humans and rendering crawlers
 * get live data, and there is never a duplicate — two AggregateOffers for one
 * Service with different prices is a contradiction a search engine cannot
 * resolve, which is worse than one stale offer.
 */
export const ServiceJsonLd = ({ nameEn, nameRu, descriptionEn, descriptionRu, urlPath, session }: ServiceJsonLdProps) => {
  const { language } = useLanguage();
  const isRu = language === "ru";

  // Same derivation the visible price uses, so markup cannot contradict
  // the page — including honouring show_price.
  const offers = session ? pricingToOffer(sessionPricing(session), session.duration_minutes) : undefined;

  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isRu ? nameRu : nameEn,
    description: isRu ? descriptionRu : descriptionEn,
    url: `${SITE_URL}${urlPath}`,
    // No `inLanguage`: it is not in Service's domain (it belongs to
    // CreativeWork and friends), so it was silently an unknown field
    // here. The page language is already carried by <html lang> and the
    // hreflang alternates in PageMeta.
    provider: { "@id": CANONICAL_ID },
    areaServed: isRu ? "Весь мир (онлайн)" : "Worldwide (online)",
    serviceType: isRu ? "Консультирование" : "Counselling",
    ...(offers ? { offers } : {}),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
};
