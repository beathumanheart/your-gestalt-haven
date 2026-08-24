import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import FeelingsMap from "@/components/FeelingsMap";

const Feelings = () => {
  const { language } = useLanguage();

  return (
    <>
      <PageMeta
        titleEn="What is going on with me — a map of feelings | Human Heart Beat"
        titleRu="Что со мной происходит — карта чувств | Human Heart Beat"
        descriptionEn="A free interactive map of feelings in six rings: land in the present, find the felt sense, name the feeling, tell it from the one underneath, and reach the need it points at."
        descriptionRu="Бесплатная интерактивная карта чувств из шести колец: заземлиться в настоящем, найти телесное ощущение, назвать чувство, отличить его от того, что под ним, и дойти до потребности."
        canonicalPath={`/${language}/feeling`}
      />
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
