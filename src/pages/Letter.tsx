import { Navigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { LETTER_TEXT } from "@/config/pageMetadata";
import { letterEN } from "@/content/letter";
import LetterSignupForm from "@/components/letter/LetterSignupForm";

/**
 * The monthly letter, at its own address.
 *
 * It exists so the letter is something a person can be sent a link to, read
 * about, and decide on — rather than only a form that appears in a dialog.
 * The modal points here; this page never points back at the modal.
 *
 * English only, like the worksheet and the privacy notice: there is one Brevo
 * list and one confirmation template, both in English. /ru/letter redirects
 * here rather than offering a Russian form for an English letter.
 *
 * ?letter=confirmed is where Brevo returns someone after they click the link
 * in the confirmation email — see redirectionUrl in the take-signup function.
 * The page then says so instead of showing the form again, which otherwise
 * reads as though the confirmation had not worked.
 */
const Letter = () => {
  const { language } = useLanguage();
  const [params] = useSearchParams();
  const c = letterEN;

  if (language === "ru") {
    return <Navigate to="/en/letter" replace />;
  }

  const confirmed = params.get("letter") === "confirmed";

  const rows = [
    { term: "What it is", text: c.what },
    { term: "How often", text: c.when },
    { term: "Leaving", text: c.leave },
  ];

  return (
    <>
      <PageMeta {...LETTER_TEXT} canonicalPath="/en/letter" langs={["en"] as const} />
      <Header />
      <main className="min-h-screen bg-background pt-24 md:pt-28">
        <div className="container-narrow max-w-2xl py-12 md:py-16">
          <p className="font-body text-xs uppercase tracking-[0.14em] text-terracotta mb-3">
            {c.kicker}
          </p>
          <h1 className="font-display text-3xl md:text-4xl font-light text-foreground mb-3">
            {c.title}
          </h1>
          <p className="font-body text-lg text-foreground leading-relaxed mb-10">{c.lead}</p>

          {confirmed ? (
            <div className="card-organic p-6 md:p-8" role="status">
              <h2 className="font-display text-2xl font-light text-foreground mb-2">
                {c.confirmedTitle}
              </h2>
              <p className="font-body text-muted-foreground">{c.confirmedBody}</p>
            </div>
          ) : (
            <>
              <dl className="mb-10">
                {rows.map((row) => (
                  <div className="mb-5" key={row.term}>
                    <dt className="font-body text-sm font-medium text-foreground mb-1">
                      {row.term}
                    </dt>
                    <dd className="font-body text-muted-foreground leading-relaxed">
                      {row.text}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="card-organic p-6 md:p-8">
                {/* `letter-page` rather than `letter-footer`: the two surfaces
                    are told apart in Brevo, so it is possible to see whether
                    the page or the dialog is what people actually use. */}
                <LetterSignupForm source="letter-page" />
              </div>
            </>
          )}

          <p className="font-body text-sm text-muted-foreground mt-10">{c.byline}</p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Letter;
