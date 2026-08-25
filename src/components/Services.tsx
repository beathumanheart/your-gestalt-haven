import { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Users, Flame, Clock, Video, CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { servicesEN, servicesRU } from "@/content/services";

const TOPIC_ICONS = [Heart, Users, Flame, Clock];

const Services = () => {
  const { language, langPath } = useLanguage();
  const c = language === "ru" ? servicesRU : servicesEN;

  const [rate, setRate] = useState(50);
  const band = rate < 60 ? 0 : rate <= 80 ? 1 : 2;
  const { label: bandLabel, note: bandNote } = c.bands[band];

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
          <p className="font-body text-muted-foreground max-w-xl mx-auto leading-relaxed mt-3">
            {c.takePre}
            <Link to={langPath("/take/feelings-map")} className="text-primary underline underline-offset-2 hover:text-foreground transition-colors">
              {c.takeLink}
            </Link>
            {c.takePost}
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

        {/* Solidarity pricing — compact slider block (2 col → stacked < md) */}
        <div className="p-6 sm:px-8 sm:py-[26px] rounded-[20px] bg-secondary/50 border border-border grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-8 md:gap-9 md:items-center">
          {/* Intro */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <CreditCard className="w-[17px] h-[17px] text-primary" />
              <p className="font-body text-[13px] uppercase tracking-[0.2em] text-primary">
                {c.pricingLabel}
              </p>
            </div>
            <p className="font-body text-[14.5px] text-muted-foreground leading-relaxed">
              {c.pricingIntro}
            </p>
          </div>

          {/* Slider */}
          <div>
            <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-1 mb-0.5">
              <span className="font-display text-[34px] leading-none text-foreground">€{rate}</span>
              <span className="font-body text-[13px] text-muted-foreground">{c.perUnit}</span>
              <span className="ml-auto font-body text-[13px] text-primary text-right">{bandLabel}</span>
            </div>
            <input
              type="range"
              min={40}
              max={100}
              step={5}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              aria-label={c.pricingLabel}
              className="solidarity-slider w-full block my-1.5"
            />
            <div className="flex justify-between font-body text-[12.5px] text-muted-foreground">
              <span>€40</span>
              <span>€100</span>
            </div>
            <p className="font-body text-[13.5px] text-muted-foreground leading-relaxed mt-2.5 min-h-[44px]">
              {bandNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
