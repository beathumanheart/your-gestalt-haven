import { Navigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { PRIVACY_TEXT } from "@/config/pageMetadata";
import { privacyEN } from "@/content/privacy";

/**
 * The privacy notice. English only, like the worksheet that links to it.
 *
 * Deliberately plain: no card, no panel, one column of text. Someone reading
 * this wants to find one answer quickly, not be designed at.
 */
const Privacy = () => {
  const { language } = useLanguage();
  const c = privacyEN;

  if (language === "ru") {
    return <Navigate to="/en/privacy" replace />;
  }

  return (
    <>
      <PageMeta {...PRIVACY_TEXT} canonicalPath="/en/privacy" langs={["en"] as const} />
      <Header />
      <main className="min-h-screen bg-background pt-24 md:pt-28">
        <div className="container-narrow max-w-3xl py-12 md:py-16">
          <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-2">
            {c.title}
          </h1>
          <p className="font-body text-sm text-muted-foreground mb-10">{c.updated}</p>

          {c.intro.map((para) => (
            <p className="font-body text-foreground leading-relaxed mb-4" key={para}>
              {para}
            </p>
          ))}

          {c.sections.map((section) => (
            <section className="mt-10" id={section.id} key={section.id}>
              <h2 className="font-display text-2xl font-light text-foreground mb-3">
                {section.title}
              </h2>

              {section.rows && (
                <dl className="mb-4">
                  {section.rows.map((row) => (
                    <div className="flex gap-2 mb-1.5" key={row.term}>
                      <dt className="font-body font-medium text-foreground whitespace-nowrap">
                        {row.term}
                      </dt>
                      <dd className="font-body text-muted-foreground">{row.text}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {section.paras?.map((para) => (
                <p className="font-body text-foreground leading-relaxed mb-4" key={para}>
                  {para}
                </p>
              ))}
            </section>
          ))}

          {c.closing.map((para) => (
            <p className="font-body text-sm text-muted-foreground leading-relaxed mt-10" key={para}>
              {para}
            </p>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Privacy;
