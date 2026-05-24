import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { bookingEN, bookingRU } from "@/content/booking";
import BookingWidget from "./booking/BookingWidget";
import { Copy, Check } from "lucide-react";

const Contact = () => {
  const { language } = useLanguage();
  const t = language === "ru" ? bookingRU : bookingEN;
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(t.emailLabel);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <section id="contact" className="section-padding">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-4">
            {t.label}
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6">
            {t.title1} <span className="italic">{t.title2}</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        <BookingWidget />

        <p className="font-body text-sm text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
          {t.confidential}
          <a href={t.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">{t.telegramLabel}</a>
          {language === "ru" ? " или " : " or "}
          <button
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-1 text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors cursor-pointer"
            title={copied ? (language === "ru" ? "Скопировано!" : "Copied!") : (language === "ru" ? "Нажмите, чтобы скопировать email" : "Click to copy email")}
          >
            {t.emailLabel}
            {copied ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
          </button>
        </p>
      </div>
    </section>
  );
};

export default Contact;
