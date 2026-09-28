import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { Mail, Youtube } from "lucide-react";
import { navigationEN, navigationRU } from "@/content/navigation";
import { letterEN } from "@/content/letter";
import LetterModal from "@/components/letter/LetterModal";

const Footer = () => {
  const { language, langPath } = useLanguage();
  const c = language === "ru" ? navigationRU : navigationEN;
  const [letterOpen, setLetterOpen] = useState(false);

  const socials = [
    { name: "YouTube", href: c.social.youtube, icon: <Youtube className="w-4 h-4" /> },
  ];

  /* Same circle as the social icons, so the row reads as one row. */
  const ICON_BUTTON =
    "flex items-center justify-center w-[38px] h-[38px] rounded-full border border-border " +
    "text-muted-foreground hover:text-terracotta hover:border-terracotta/45 " +
    "hover:bg-terracotta/10 hover:-translate-y-0.5 transition-all duration-200";

  return (
    <footer className="py-12 px-6 bg-cream-dark border-t border-border">
      <div className="container-narrow">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <Link to={langPath("/")} className="font-display text-2xl text-foreground hover:text-primary transition-colors mb-2 block">
              Human Heart
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
              © {new Date().getFullYear()} Human Heart. {c.footerRights}
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
              className={ICON_BUTTON}
            >
              {s.icon}
            </a>
          ))}

          {/* An icon in the same row rather than a worded item in the links
              above: the letter is one more place to find Genia, and the words
              for it belong on its own page, not in the footer.

              `title` and `aria-label` carry the name, so an icon is still
              readable to a screen reader and on hover — see
              letterModal.test.tsx, which addresses it by name.

              English-only. There is no Russian list and no Russian
              confirmation template, so a Russian reader is given the English
              page rather than a form that would subscribe them to a letter
              they did not ask for. */}
          {language === "en" ? (
            <button
              type="button"
              onClick={() => setLetterOpen(true)}
              title={letterEN.footerLink}
              aria-label={letterEN.footerLink}
              className={ICON_BUTTON}
            >
              <Mail className="w-4 h-4" />
            </button>
          ) : (
            <Link
              to="/en/letter"
              title={letterEN.footerLink}
              aria-label={letterEN.footerLink}
              className={ICON_BUTTON}
            >
              <Mail className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Opened by the click above and by nothing else — see LetterModal. */}
      <LetterModal open={letterOpen} onClose={() => setLetterOpen(false)} />
    </footer>
  );
};

export default Footer;
