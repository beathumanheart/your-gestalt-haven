import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { contactEN, contactRU } from "@/content/contact";

const Contact = () => {
  const { language } = useLanguage();
  const c = language === "ru" ? contactRU : contactEN;

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        'script[src="https://assets.calendly.com/assets/external/widget.js"]'
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <section id="contact" className="section-padding">
      <div className="container-narrow">
        {/* Section Header */}
        <div className="text-center mb-12">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-4">
            {c.label}
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6">
            {c.title1} <span className="italic">{c.title2}</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            {c.subtitle}
          </p>
        </div>

        {/* Calendly Widget */}
        <div className="card-organic p-4 md:p-8">
          <div
            className="calendly-inline-widget"
            data-url={c.calendlyUrl}
            style={{ minWidth: "320px", height: "700px" }}
          />
        </div>

        <p className="font-body text-sm text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
          {c.confidential}
          <a href={c.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">{c.telegramLabel}</a>
          {c.orText}
          <a href={c.signalUrl} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">{c.signalLabel}</a>
        </p>
      </div>
    </section>
  );
};

export default Contact;
