import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { navigationEN, navigationRU } from "@/content/navigation";


const Footer = () => {
  const { language, langPath } = useLanguage();
  const c = language === "ru" ? navigationRU : navigationEN;

  return (
    <footer className="py-12 px-6 bg-cream-dark border-t border-border">
      <div className="container-narrow">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <Link to={langPath("/")} className="font-display text-2xl text-foreground hover:text-primary transition-colors mb-2 block">
              Human Heart Beat
            </Link>
            <p className="font-body text-sm text-muted-foreground">
              {language === "ru" ? "Терапия с Женей" : "Therapy with Genia"}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <Link
              to={langPath("/")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.footerAbout}
            </Link>
            <Link
              to={langPath("/")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setTimeout(() => document.getElementById("services")?.scrollIntoView({ behavior: "smooth" }), 100)}
            >
              {c.footerServices}
            </Link>
            <Link
              to={langPath("/")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setTimeout(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), 100)}
            >
              {c.footerContact}
            </Link>
            <Link
              to={langPath("/offer-agreement")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.footerOfferAgreement}
            </Link>
          </div>
          
          <div className="text-center md:text-right">
            <a 
              href={`mailto:${c.footerEmail}`} 
              className="font-body text-sm text-primary hover:text-foreground transition-colors"
            >
              {c.footerEmail}
            </a>
            <p className="font-body text-xs text-muted-foreground mt-2">
              © {new Date().getFullYear()} Human Heart Beat. {c.footerRights}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
