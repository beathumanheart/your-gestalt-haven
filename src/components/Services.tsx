import { Clock, Calendar, Heart, Users, Video, CreditCard } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { servicesEN, servicesRU } from "@/content/services";


const Services = () => {
  const { language } = useLanguage();
  const c = language === "ru" ? servicesRU : servicesEN;

  const services = [
    { icon: Calendar, ...c.longTerm },
    { icon: Clock, ...c.shortTerm },
  ];

  const slidingScale = [
    { ...c.slidingTiers[0], color: "bg-sage-light" },
    { ...c.slidingTiers[1], color: "bg-primary/20" },
    { ...c.slidingTiers[2], color: "bg-terracotta/20" },
  ];

  const sessionDetails = [
    { icon: Video, ...c.online },
    { icon: Clock, ...c.duration },
  ];

  const areaIcons = [Heart, Users, Clock];

  return (
    <section id="services" className="section-padding">
      <div className="container-narrow">
        {/* Section Header */}
        <div className="text-center mb-16">
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

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {services.map((service) => (
            <div
              key={service.title}
              className="card-organic p-8 md:p-10 hover:shadow-elevated transition-all duration-500 group"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-sage-light flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                  <service.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="font-display text-2xl text-foreground">
                    {service.title}
                  </h3>
                  <p className="font-body text-sm text-primary">
                    {service.subtitle}
                  </p>
                </div>
              </div>
              
              <p className="font-body text-muted-foreground leading-relaxed mb-6">
                {service.description}
              </p>
              
              <ul className="space-y-3">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                    <span className="font-body text-sm text-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Session Details */}
        <div className="mb-8 p-8 md:p-10 rounded-3xl bg-gradient-card border border-border">
          <h3 className="font-display text-2xl text-foreground text-center mb-8">
            {c.sessionDetailsTitle}
          </h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-md mx-auto">
            {sessionDetails.map((detail) => (
              <div key={detail.label} className="text-center">
                <div className="w-12 h-12 rounded-xl bg-sage-light mx-auto mb-4 flex items-center justify-center">
                  <detail.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-display text-lg text-foreground">{detail.label}</p>
                <p className="font-body text-sm text-muted-foreground">{detail.description}</p>
              </div>
            ))}
          </div>
          <p className="font-body text-sm text-muted-foreground text-center mt-6">
            {c.paymentNote}
          </p>
        </div>

        {/* Sliding Scale Pricing */}
        <div className="mb-16 p-8 md:p-10 rounded-3xl bg-secondary/50 border border-border">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <p className="font-body text-sm uppercase tracking-[0.2em] text-primary">
                {c.slidingTitle}
              </p>
            </div>
            <p className="font-display text-3xl md:text-4xl text-foreground mb-4">
              {c.price}
            </p>
            <p className="font-body text-muted-foreground max-w-xl mx-auto leading-relaxed">
              {c.slidingDesc}
            </p>
          </div>
          
          {/* Price Tiers */}
          <div className="grid md:grid-cols-3 gap-4 mb-10">
            {slidingScale.map((tier) => (
              <div 
                key={tier.range} 
                className={`p-6 rounded-2xl ${tier.color} text-center transition-all duration-300 hover:scale-[1.02]`}
              >
                <p className="font-display text-xl text-foreground mb-2">{tier.range}</p>
                <p className="font-body text-sm text-muted-foreground">{tier.description}</p>
              </div>
            ))}
          </div>

          {/* Guidelines */}
          <div className="border-t border-border pt-8">
            <p className="font-display text-lg text-foreground text-center mb-6">
              {c.slidingHow}
            </p>
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="p-5 rounded-xl bg-terracotta/10 border border-terracotta/20">
                <p className="font-display text-sm text-terracotta mb-3">
                  {c.slidingHigher}
                </p>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {c.slidingHigherList}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-sage-light border border-primary/20">
                <p className="font-display text-sm text-primary mb-3">
                  {c.slidingLower}
                </p>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  {c.slidingLowerList}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Areas of Focus */}
        <div className="text-center">
          <p className="font-body text-sm text-muted-foreground mb-6">
            {c.areasLabel}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {c.areas.map((area, i) => {
              const Icon = areaIcons[i] || Heart;
              return (
                <div
                  key={area.label}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-secondary border border-border"
                >
                  <Icon className="w-4 h-4 text-primary" />
                  <span className="font-body text-sm text-foreground">
                    {area.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
