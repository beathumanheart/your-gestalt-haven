import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  offerAgreementEN,
  offerAgreementRU,
  TERMS_VERSION,
  type OfferAgreementContent,
} from "@/content/offerAgreement";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import OfferAgreementBody from "@/components/OfferAgreementBody";

const OfferAgreement = () => {
  const { language, langPath } = useLanguage();
  const content: OfferAgreementContent =
    language === "ru" ? offerAgreementRU : offerAgreementEN;

  return (
    <>
      <PageMeta
        titleEn="Offer Agreement | Human Heart Beat"
        titleRu="Договор оферты | Human Heart Beat"
        descriptionEn="Terms and conditions for therapy sessions at Human Heart Beat — Gestalt counselling with Genia."
        descriptionRu="Условия оказания терапевтических услуг на Human Heart Beat — гештальт-консультирование с Женей."
        canonicalPath={`/${language}/offer-agreement`}
      />
      <main className="min-h-screen bg-background py-20 px-6">
        <div className="container-narrow max-w-3xl">
          <Link
            to={langPath("/")}
            className="inline-flex items-center gap-2 text-primary hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {content.backLink}
          </Link>

          <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-8">
            {content.pageTitle}
          </h1>

          <p className="font-body text-xs text-muted-foreground mb-8">
            {language === "ru" ? "Редакция" : "Version"} {TERMS_VERSION}
          </p>

          <OfferAgreementBody content={content} />
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OfferAgreement;
