import heroImage from "@/assets/hero-therapy.jpg";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { heroEN, heroRU } from "@/content/hero";
import { navigationEN, navigationRU } from "@/content/navigation";
import { trackBookNowClick } from "@/hooks/useBookingAnalytics";


const Hero = () => {
  const { language, langPath } = useLanguage();
  const navigate = useNavigate();
  const c = language === "ru" ? heroRU : heroEN;
  const nav = language === "ru" ? navigationRU : navigationEN;

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        {/* The LCP element: a full-viewport background behind the fold-level
            copy. It is what the largest-contentful-paint measurement actually
            lands on, so it is fetched at high priority and never lazily. */}
        <img
          src={heroImage}
          alt="Warm, inviting therapy space with soft natural light"
          width={1920}
          height={1080}
          // Lowercase, via spread: React 18.3 does not map the camelCase
          // `fetchPriority` prop and warns in the console on every render,
          // even though it still reaches the DOM. @types/react does type the
          // camelCase form, so the spread is what satisfies both.
          {...{ fetchpriority: "high" }}
          decoding="async"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container-narrow text-center px-6 pt-20">
        <div className="opacity-0 animate-fade-up">
          <p className="font-body text-sm md:text-base uppercase tracking-[0.3em] text-primary mb-6">
            {c.tagline}
          </p>
        </div>
        
        <h1 className="opacity-0 animate-fade-up delay-100 font-display text-4xl md:text-6xl lg:text-7xl font-light text-foreground leading-tight mb-8">
          {c.title1} <br />
          <span className="italic font-normal text-primary">{c.title2}</span>
        </h1>
        
        <p className="opacity-0 animate-fade-up delay-200 font-body text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
          {c.subtitle}
        </p>
        
        <div className="opacity-0 animate-fade-up delay-300">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-center items-stretch sm:items-center mx-auto max-w-xs sm:max-w-none">
            <button
              onClick={() => navigate(langPath("/#about"))}
              className="order-2 sm:order-1 px-8 py-4 rounded-full font-medium border border-border text-foreground hover:bg-secondary transition-all duration-300"
            >
              {c.learnMore}
            </button>
            <button
              onClick={() => { trackBookNowClick("hero"); navigate(langPath("/#contact")); }}
              className="order-1 sm:order-2 btn-primary"
            >
              {nav.bookSession}
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hidden md:block absolute bottom-10 left-1/2 -translate-x-1/2 opacity-0 animate-fade-in delay-500">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <div className="w-px h-12 bg-border animate-pulse-soft" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
