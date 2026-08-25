import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Instagram, Youtube } from "lucide-react";
import { navigationEN, navigationRU } from "@/content/navigation";

// lucide has no Substack glyph — inline the mark (design handoff SVG).
const SubstackIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M4 3h16v2.5H4zM4 7.6h16v2.5H4zM4 12.2 12 17l8-4.8V21l-8-4.8L4 21z" />
  </svg>
);

const Footer = () => {
  const { language, langPath } = useLanguage();
  const c = language === "ru" ? navigationRU : navigationEN;

  const socials = [
    { name: "Substack", href: c.social.substack, icon: <SubstackIcon /> },
    { name: "Instagram", href: c.social.instagram, icon: <Instagram className="w-4 h-4" /> },
    { name: "YouTube", href: c.social.youtube, icon: <Youtube className="w-4 h-4" /> },
  ];

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
              to={langPath("/#about")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.footerAbout}
            </Link>
            <Link
              to={langPath("/#services")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.footerServices}
            </Link>
            <Link
              to={langPath("/#contact")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.footerContact}
            </Link>
            <Link
              to={langPath("/offer-agreement")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.footerOfferAgreement}
            </Link>
            <Link
              to={langPath("/take")}
              className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {c.footerTakeWithYou}
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

        {/* Social links */}
        <div className="mt-7 pt-6 border-t border-border flex flex-wrap items-center justify-center gap-3">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.name}
              aria-label={s.name}
              className="flex items-center justify-center w-[38px] h-[38px] rounded-full border border-border text-muted-foreground hover:text-terracotta hover:border-terracotta/45 hover:bg-terracotta/10 hover:-translate-y-0.5 transition-all duration-200"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
