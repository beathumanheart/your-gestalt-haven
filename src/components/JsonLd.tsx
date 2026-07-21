import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { SITE_URL } from "@/components/PageMeta";

const CANONICAL_ID = `${SITE_URL}/#genia`;

interface ServiceJsonLdProps {
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  /** Path to the bookable page, e.g. "/en/book/gestalt-individual" */
  urlPath: string;
}

/** JSON-LD for a bookable session-type page */
export const ServiceJsonLd = ({ nameEn, nameRu, descriptionEn, descriptionRu, urlPath }: ServiceJsonLdProps) => {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const data = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: isRu ? nameRu : nameEn,
    description: isRu ? descriptionRu : descriptionEn,
    url: `${SITE_URL}${urlPath}`,
    inLanguage: language,
    provider: { "@id": CANONICAL_ID },
    areaServed: isRu ? "Весь мир (онлайн)" : "Worldwide (online)",
    serviceType: isRu ? "Консультирование" : "Counselling",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "EUR",
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
};
