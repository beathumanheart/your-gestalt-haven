import { Link, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import NotFound from "@/pages/NotFound";
import { takeEN, takeRU, takeItemBySlug } from "@/content/take";

/**
 * The route exists so the slug is settled and linkable; the page content is
 * not written yet. Kept out of the index: nothing here for a crawler to rank.
 */
const TakeItemSoon = () => {
  const { language, langPath } = useLanguage();
  const { slug } = useParams();
  const t = language === "ru" ? takeRU : takeEN;
  const item = slug ? takeItemBySlug(t, slug) : undefined;

  if (!item) return <NotFound />;

  return (
    <>
      <PageMeta
        titleEn={`${takeEN.items.find((i) => i.slug === item.slug)?.title} | Human Heart`}
        titleRu={`${takeRU.items.find((i) => i.slug === item.slug)?.title} | Human Heart`}
        descriptionEn={takeEN.items.find((i) => i.slug === item.slug)?.description}
        descriptionRu={takeRU.items.find((i) => i.slug === item.slug)?.description}
        noIndex
      />
      <Header />
      <main className="min-h-screen bg-background pt-24 md:pt-28">
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "clamp(26px,4vw,60px) clamp(18px,4vw,40px) 80px" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase", color: "#C2603A" }}>
            {item.kind} · {t.statuses[item.status]}
          </div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontWeight: 300,
              fontSize: "clamp(28px,5.5vw,46px)",
              lineHeight: 1.08,
              margin: "12px 0 0",
              color: "#464039",
            }}
          >
            {item.title}
          </h1>
          <p style={{ margin: "18px 0 0", maxWidth: "60ch", fontSize: 16, lineHeight: 1.75, color: "#5c554e" }}>
            {t.soonBody}
          </p>
          <p style={{ margin: "22px 0 0" }}>
            <Link to={langPath("/take")} style={{ fontSize: 14.5, fontWeight: 600, color: "#437059" }}>
              {t.back}
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TakeItemSoon;
