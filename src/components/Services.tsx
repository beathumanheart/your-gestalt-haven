import { Heart, Users, Flame, Clock, Video } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { servicesEN, servicesRU } from "@/content/services";
import SolidarityScale from "./SolidarityScale";

const TOPIC_ICONS = [Heart, Users, Flame, Clock];

const Services = () => {
  const { language } = useLanguage();
  const c = language === "ru" ? servicesRU : servicesEN;

  return (
    <section id="services" className="section-padding">
      <div className="container-narrow">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl md:text-5xl font-light text-foreground mb-4">
            {c.title1} <span className="italic">{c.title2}</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {c.subtitle}
          </p>
        </div>

        {/* What we might work on — 2×2 topic cards (→ 1 col < sm) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {c.topics.map((topic, i) => {
            const Icon = TOPIC_ICONS[i] ?? Heart;
            return (
              <div key={topic.title} className="rounded-2xl bg-background border border-border p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <Icon className="w-[17px] h-[17px] shrink-0 text-terracotta" />
                  <h3 className="font-display text-xl text-foreground">{topic.title}</h3>
                </div>
                <p className="font-body text-sm text-muted-foreground leading-[1.75]">
                  {topic.subtopics.join(" · ")}
                </p>
              </div>
            );
          })}
        </div>

        {/* Short-term / Long-term — one bordered row (→ stacked < sm) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 py-[22px] mb-6 border-y border-border">
          {[c.shortTerm, c.longTerm].map((t) => (
            <div key={t.term} className="flex items-baseline gap-3">
              <h3 className="font-display text-[19px] text-foreground whitespace-nowrap">{t.term}</h3>
              <p className="font-body text-[14.5px] text-muted-foreground leading-relaxed">{t.line}</p>
            </div>
          ))}
        </div>

        {/* Practical-info pill (wraps gracefully) */}
        <div className="mb-3.5 px-6 sm:px-[30px] py-[18px] rounded-full bg-secondary/50 border border-border flex items-center justify-center flex-wrap gap-x-7 gap-y-2.5 font-body text-sm">
          <span className="flex items-center gap-2 text-foreground">
            <Video className="w-4 h-4 text-primary" />
            {c.pillOnline}
          </span>
          <span className="w-px h-4 bg-border" aria-hidden="true" />
          <span className="flex items-center gap-2 text-foreground">
            <Clock className="w-4 h-4 text-primary" />
            {c.pillDuration}
          </span>
          <span className="w-px h-4 bg-border" aria-hidden="true" />
          <span className="text-muted-foreground">{c.pillPayment}</span>
        </div>
        <p className="font-body text-[13.5px] text-muted-foreground text-center mb-14">
          {c.paymentMethods}
        </p>

        {/* Solidarity pricing — the published scale. Lives in its own
            component because the service pages show the same one; it renders
            nothing when the database publishes no scale. */}
        <SolidarityScale />
      </div>
    </section>
  );
};

export default Services;
