import { Helmet } from "react-helmet-async";
import { Navigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { AUTOMATIC_YES_TEXT } from "@/config/pageMetadata";
import AutomaticYes from "@/components/automatic-yes/AutomaticYes";

/**
 * The worksheet page. English only.
 *
 * A reader who arrives at the Russian address lands on the English page rather
 * than a "not written yet" placeholder — the worksheet exists, it is just not
 * translated, and the Russian shelf does not list it. The build generates the
 * route for `en` alone, so /ru/take/automatic-yes has no file of its own and
 * this redirect is what the SPA fallback resolves to.
 */
const TakeAutomaticYes = () => {
  const { language } = useLanguage();

  if (language === "ru") {
    return <Navigate to="/en/take/automatic-yes" replace />;
  }

  return (
    <>
      <PageMeta {...AUTOMATIC_YES_TEXT} canonicalPath="/en/take/automatic-yes" langs={["en"]} />
      {/* The global import carries Cormorant italic at 300/400 only, and this
          page sets quotes in 500. Fraunces is used nowhere else on the site. */}
      <Helmet>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,500&family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,300..700,0..100,0..1;1,9..144,300..700,0..100,0..1&display=swap"
        />
      </Helmet>
      <Header />
      {/* pt clears the fixed header */}
      <main className="min-h-screen bg-background pt-24 md:pt-28">
        <AutomaticYes />
      </main>
      <Footer />
    </>
  );
};

export default TakeAutomaticYes;
