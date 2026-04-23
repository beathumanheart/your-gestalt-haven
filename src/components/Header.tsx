import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { navigationEN, navigationRU } from "@/content/navigation";
import { trackBookNowClick } from "@/hooks/useBookingAnalytics";

const Header = () => {
  const { language, langPath } = useLanguage();
  const c = language === "ru" ? navigationRU : navigationEN;
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Check if we're on the homepage
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navigateToSection = (id: string) => {
    setMobileOpen(false);
    navigate(langPath(`/#${id}`));
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-soft py-4"
            : "bg-transparent py-6"
        }`}
      >
        <nav className="container-narrow flex items-center justify-between px-6">
          <button
            onClick={() => navigateToSection("hero")}
            className="flex items-center gap-2 font-display text-xl md:text-2xl font-medium text-foreground hover:text-primary transition-colors"
          >
            <svg 
              viewBox="0 0 40 40" 
              className="w-8 h-8 md:w-10 md:h-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M20 35L17.5 32.75C9 25.1 4 20.6 4 15C4 10.5 7.5 7 12 7C14.6 7 17.1 8.2 19 10.1L20 11.1L21 10.1C22.9 8.2 25.4 7 28 7C32.5 7 36 10.5 36 15C36 20.6 31 25.1 22.5 32.75L20 35Z" 
                className="fill-terracotta"
              />
              <path 
                d="M8 20H14L16 16L20 24L24 18L26 20H32" 
                className="stroke-cream" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
            <span className="hidden sm:inline">Human Heart Beat</span>
          </button>

          <div className="hidden md:flex items-center gap-8">
            {c.navItems.map((item) => (
              <button
                key={item.sectionId}
                onClick={() => navigateToSection(item.sectionId)}
                className="font-body text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => { trackBookNowClick("header_desktop"); navigateToSection("contact"); }}
              className="hidden md:block btn-primary text-sm py-2.5 px-6"
            >
              {c.bookSession}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-foreground"
              aria-label="Toggle menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile menu - portaled to body root so it's above everything */}
      {mobileOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center md:hidden animate-fade-in">
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-6 right-6 p-2 text-foreground"
            aria-label="Close menu"
          >
            <X className="w-7 h-7" />
          </button>
          <div className="flex flex-col items-center justify-center gap-8">
            {c.navItems.map((item) => (
              <button
                key={item.sectionId}
                onClick={() => navigateToSection(item.sectionId)}
                className="font-display text-2xl text-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => { trackBookNowClick("header_mobile"); navigateToSection("contact"); }}
              className="btn-primary text-base py-3 px-8 mt-4"
            >
              {c.bookSession}
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Header;
