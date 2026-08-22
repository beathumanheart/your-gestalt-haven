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

/** JSON-LD for a bookable session-type page */
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
