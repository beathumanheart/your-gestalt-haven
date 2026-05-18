import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import { SITE_URL } from "@/components/PageMeta";

// TODO: add sameAs URLs when social accounts exist (Instagram, TikTok, YouTube, etc.)
// e.g. sameAs: ["https://instagram.com/humanheart.life"]
const SAME_AS: string[] = [];

const CANONICAL_ID = `${SITE_URL}/#genia`;

interface ServiceJsonLdProps {
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  /** Path to the bookable page, e.g. "/en/book/gestalt-individual" */
  urlPath: string;
}

/** JSON-LD for homepage: Person + ProfessionalService */
export const HomepageJsonLd = () => {
  const { language } = useLanguage();
  const isRu = language === "ru";
  const url = `${SITE_URL}/${language}`;

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": CANONICAL_ID,
    name: isRu ? "Женя" : "Genia",
    jobTitle: isRu ? "Гештальт-психотерапевт" : "Gestalt psychotherapist",
    url,
    image: `${SITE_URL}/og-image-${language}.png`,
    inLanguage: language,
    sameAs: SAME_AS,
    knowsAbout: isRu
      ? ["гештальт-терапия", "горе", "экзистенциальная терапия", "терапия отношений"]
      : ["Gestalt therapy", "grief counselling", "existential therapy", "relationship therapy"],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${SITE_URL}/#service`,
    name: isRu ? "Human Heart Beat — гештальт-психотерапия" : "Human Heart Beat — Gestalt Psychotherapy",
    description: isRu
      ? "Тёплое пространство для индивидуальной гештальт-психотерапии. Работа с горем, отношениями и экзистенциальными вопросами."
      : "A warm, compassionate space for individual Gestalt psychotherapy. Working with grief, relationships, and life's existential questions.",
    url,
    inLanguage: language,
    provider: { "@id": CANONICAL_ID },
    areaServed: isRu ? "Весь мир (онлайн)" : "Worldwide (online)",
    serviceType: isRu ? "Психотерапия" : "Psychotherapy",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      priceCurrency: "EUR",
    },
    sameAs: SAME_AS,
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(person)}</script>
      <script type="application/ld+json">{JSON.stringify(service)}</script>
    </Helmet>
  );
};

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
    serviceType: isRu ? "Психотерапия" : "Psychotherapy",
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
