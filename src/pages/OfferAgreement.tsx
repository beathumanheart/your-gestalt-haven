import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  offerAgreementEN,
  offerAgreementRU,
  type OfferAgreementContent,
  type Section,
} from "@/content/offerAgreement";
import Footer from "@/components/Footer";

const SectionBlock = ({ section }: { section: Section }) => (
  <section>
    <h2 className="font-display text-xl text-foreground mb-4">{section.heading}</h2>
    {section.paragraphs?.map((p, i) => (
      <p key={i}>{p}</p>
    ))}
    {section.bullets && (
      <ul className="list-disc pl-6 space-y-2">
        {section.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    )}
  </section>
);

const OfferAgreement = () => {
  const { language, langPath } = useLanguage();
  const content: OfferAgreementContent =
    language === "ru" ? offerAgreementRU : offerAgreementEN;

  return (
    <>
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

          <div className="prose prose-neutral max-w-none font-body text-muted-foreground space-y-6">
            {content.sections.map((section, i) => (
              <SectionBlock key={i} section={section} />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default OfferAgreement;
