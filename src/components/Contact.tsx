import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { bookingEN, bookingRU } from "@/content/booking";
import { contactSectionEN, contactSectionRU } from "@/content/contactSection";
import { useSessionTypes } from "@/hooks/useAvailability";
import { sessionPricing } from "@/lib/pricing";
import BookingWidget from "./booking/BookingWidget";
import GetInTouch from "./contact/GetInTouch";
import { BOOKING_ENABLED } from "@/config/booking";

/**
 * The homepage #contact section.
 *
 * With `BOOKING_ENABLED` off the wizard is replaced by the same information
 * without the machinery: the three session types as rows, each linking to its
 * own page, then the invitation to write. The anchor stays `#contact` — every
 * CTA on the site points at it, and the fragment is not what changed.
 */
const Contact = () => {
  const { language } = useLanguage();
  const t = language === "ru" ? bookingRU : bookingEN;
  const c = language === "ru" ? contactSectionRU : contactSectionEN;
  const { sessionTypes } = useSessionTypes();

  return (
    <section id="contact" className="section-padding">
      <div className="container-narrow">
        <div className="text-center mb-12">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-4">
            {BOOKING_ENABLED ? t.label : c.label}
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6">
            {t.title1} <span className="italic">{t.title2}</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </div>

        {BOOKING_ENABLED ? (
          <>
            <BookingWidget />
            <div className="mt-8">
              <GetInTouch compact />
            </div>
          </>
        ) : (
          <>
            {/* The three offerings as rows rather than a picker: the same
                facts, nothing that takes a booking. Each row is a door into
                the page that describes the work. */}
            {sessionTypes.length > 0 && (
              <ul className="mb-8 border-t border-border">
                {sessionTypes.map((st) => {
                  const name = language === "ru" && st.name_ru ? st.name_ru : st.name;
                  const blurb =
                    language === "ru" && st.description_ru ? st.description_ru : st.description;
                  /* This row's own range, from the derivation that also
                     builds its AggregateOffer — so the figure here and the
                     figure in the markup cannot disagree. The practice-wide
                     scale stays where it is, in <Services />; a second copy
                     of that panel here would be the same numbers twice. */
                  const pricing = sessionPricing(st);
                  const money = (value: number) =>
                    new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: pricing.kind === "hidden" ? "EUR" : pricing.currency,
                      maximumFractionDigits: 0,
                    }).format(value);

                  return (
                    <li key={st.id} className="border-b border-border">
                      <Link
                        to={`/${language}/book/${st.slug ?? st.id}`}
                        className="group block py-5 sm:py-6"
                      >
                        <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap">
                          <h3 className="font-display text-xl sm:text-[22px] text-foreground group-hover:text-primary transition-colors">
                            {name}
                          </h3>
                          <span className="flex items-center gap-1.5 font-body text-[13px] text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {st.duration_minutes} {c.minutes}
                          </span>
                          {pricing.kind === "range" && (
                            <span className="font-body text-[13px] text-muted-foreground">
                              {money(pricing.min)}–{money(pricing.max)}
                            </span>
                          )}
                          {pricing.kind === "fixed" && (
                            <span className="font-body text-[13px] text-muted-foreground">
                              {money(pricing.price)}
                            </span>
                          )}
                          <span className="ml-auto flex items-center gap-1.5 font-body text-sm text-primary">
                            {c.readMore}
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                        {blurb && (
                          /* One line: the full description is on the page
                             this links to, and repeating it here would make
                             the homepage the service page. */
                          <p className="font-body text-sm text-muted-foreground leading-relaxed mt-1.5 line-clamp-1 max-w-[70ch]">
                            {blurb}
                          </p>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-8">
              <GetInTouch />
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Contact;
