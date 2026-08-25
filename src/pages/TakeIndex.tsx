import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageMeta from "@/components/PageMeta";
import { takeEN, takeRU, type TakeItem } from "@/content/take";

/* The map page needs width for the wheel. This one is a list of four cards and
   reads badly at that measure, so it gets its own narrower container. */
const STYLES = `
.tk-root { max-width: 980px; margin: 0 auto; padding: clamp(26px,4vw,60px) clamp(18px,4vw,40px) 80px; }
.tk-intro { max-width: 60ch; }
.tk-grid { display: grid; grid-template-columns: minmax(0,1fr); gap: 20px; align-items: stretch; margin: clamp(28px,4vw,40px) 0 0; }
/* Fixed two-up, not auto-fit: four cards must never spread into one row. */
@media (min-width: 700px) { .tk-grid { grid-template-columns: repeat(2, minmax(0,1fr)); } }
.tk-card { display: flex; flex-direction: column; height: 100%; padding: 24px 28px; border-radius: 16px; background: #FAF8F5; border: 1px solid #E7E1DA; text-decoration: none; color: inherit; }
.tk-card-title { font-family: Fraunces,'Cormorant Garamond',Georgia,serif; font-weight: 400; font-size: 19px; line-height: 1.16; margin: 10px 0 0; color: #464039; }
@media (min-width: 700px) { .tk-card-title { font-size: 22px; } }
/* Only a live card is a link, so only a live card reacts to the pointer. The
   status badge is what mutes the others — not a dimmed card. */
a.tk-card { transition: border-color .3s ease, transform .3s ease, box-shadow .3s ease; }
a.tk-card:hover { border-color: #437059; transform: translateY(-2px); box-shadow: 0 10px 26px rgba(70,64,57,.09); }
div.tk-card { cursor: default; }
@media (prefers-reduced-motion: reduce) { a.tk-card { transition: none; } a.tk-card:hover { transform: none; } }
`;

const BADGE: Record<string, { bg: string; fg: string }> = {
  live: { bg: "#E0EBE6", fg: "#3c5c4c" },
  prep: { bg: "#F3EFE8", fg: "#8A8075" },
  later: { bg: "#F3EFE8", fg: "#8A8075" },
};

const TakeIndex = () => {
  const { language, langPath } = useLanguage();
  const t = language === "ru" ? takeRU : takeEN;

  const card = (item: TakeItem) => {
    const badge = BADGE[item.status];
    const inner = (
      <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase", color: "#C2603A" }}>
            {item.kind}
          </span>
          <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600, letterSpacing: ".04em", background: badge.bg, color: badge.fg }}>
            {t.statuses[item.status]}
          </span>
        </div>
        <h2 className="tk-card-title">{item.title}</h2>
        <p style={{ margin: "9px 0 0", fontSize: 14.5, lineHeight: 1.7, color: "#5c554e" }}>
          {item.description}
        </p>
      </>
    );

    return item.status === "live" ? (
      <Link key={item.slug} className="tk-card" to={langPath(`/take/${item.slug}`)}>
        {inner}
      </Link>
    ) : (
      <div key={item.slug} className="tk-card">
        {inner}
      </div>
    );
  };

  return (
    <>
      <PageMeta
        titleEn="Take with you — free material | Human Heart Beat"
        titleRu="С собой — бесплатные материалы | Human Heart Beat"
        descriptionEn="Free material, here if it is useful to you. No session, no account, nothing to sign up for."
        descriptionRu="Бесплатные материалы. Что-то может пригодиться, что-то нет. Ни сессии, ни регистрации не нужно."
        canonicalPath={`/${language}/take`}
      />
      {/* Fraunces is the card face and is used nowhere else on the site, so it
          loads here rather than in the global font import. */}
      <Helmet>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap"
        />
      </Helmet>
      <Header />
      {/* pt clears the fixed header */}
      <main className="min-h-screen bg-background pt-24 md:pt-28">
        <div className="tk-root">
          <style dangerouslySetInnerHTML={{ __html: STYLES }} />
          <h1
            style={{
              fontFamily: "'Cormorant Garamond',Georgia,serif",
              fontWeight: 300,
              fontSize: "clamp(30px,6vw,52px)",
              lineHeight: 1.06,
              margin: 0,
              color: "#464039",
            }}
          >
            {t.title}
          </h1>
          <p className="tk-intro" style={{ margin: "18px 0 0", fontSize: 16, lineHeight: 1.75, color: "#5c554e" }}>
            {t.intro}
          </p>
          <div className="tk-grid">{t.items.map(card)}</div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TakeIndex;
