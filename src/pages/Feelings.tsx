import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { FEELINGS_MAP_TEXT } from "@/config/pageMetadata";
import FeelingsMap from "@/components/FeelingsMap";

const Feelings = () => {
  const { language } = useLanguage();

  return (
    <>
      <PageMeta {...FEELINGS_MAP_TEXT} canonicalPath={`/${language}/take/feelings-map`} />
      <Header />
      {/* pt clears the fixed header */}
      <main className="min-h-screen bg-background pt-24 md:pt-28">
        <FeelingsMap />
      </main>
      <Footer />
    </>
  );
};

export default Feelings;
