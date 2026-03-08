import { useLanguage } from "@/contexts/LanguageContext";
import { bookingEN, bookingRU } from "@/content/booking";
import BookingWidget from "./booking/BookingWidget";

const Contact = () => {
  const { language } = useLanguage();
  const t = language === "ru" ? bookingRU : bookingEN;

  return (
    <section id="contact" className="section-padding">
      <div className="container-narrow">
        {/* Section Header */}
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

        {/* Custom Booking Widget */}
        <BookingWidget />

        <p className="font-body text-sm text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
          {t.confidential}
          <a href={t.telegramUrl} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">{t.telegramLabel}</a>
          {t.orText}
          <a href={t.signalUrl} target="_blank" rel="noopener noreferrer" className="text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">{t.signalLabel}</a>
          {" or "}
          <span className="text-foreground font-medium">{t.sessionLabel}</span>
          <span className="text-muted-foreground text-xs ml-1 break-all">({t.sessionUrl})</span>
        </p>
      </div>
    </section>
  );
};

export default Contact;
