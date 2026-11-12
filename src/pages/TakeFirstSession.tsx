import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { FIRST_SESSION_TEXT } from "@/config/pageMetadata";
import FirstSession from "@/components/first-session/FirstSession";

/**
 * /:lang/take/first-session — the same frame as Feelings.tsx.
 *
 * Bilingual, unlike the worksheet: no `langs` is passed, so <PageMeta> claims
 * the other language as this page's alternate and the build writes a file for
 * each. The canonical carries the language the way every other bilingual page
 * does, from the route rather than from a constant.
 *
 * Nothing after the article but the footer. In particular no <GetInTouch /> —
 * the last section already says how to write, and two contact blocks in a row
 * would read as pressure on a page whose whole point is that it only answers
 * questions.
 */
const TakeFirstSession = () => {
  const { language } = useLanguage();

  return (
    <>
      <PageMeta {...FIRST_SESSION_TEXT} canonicalPath={`/${language}/take/first-session`} />
      <Header />
      {/* pt clears the fixed header */}
      <main className="min-h-screen bg-background pt-24 md:pt-28">
        <FirstSession />
      </main>
      <Footer />
    </>
  );
};

export default TakeFirstSession;
