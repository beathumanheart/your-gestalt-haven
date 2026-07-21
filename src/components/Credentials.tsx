import { GraduationCap, Award, Shield, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { credentialsEN, credentialsRU } from "@/content/credentials";
import { withGestaltTooltip } from "./GestaltTooltip";

const Credentials = () => {
  const { language } = useLanguage();
  const c = language === "ru" ? credentialsRU : credentialsEN;

  const credentialGroups = [
    { icon: GraduationCap, ...c.education },
    { icon: Shield, ...c.ethics },
    { icon: Sparkles, ...c.clinical },
  ];

  return (
    <section id="credentials" className="section-padding bg-primary/5">
      <div className="container-narrow">
        {/* Quote first */}
        <div className="text-center mb-16">
          <div className="inline-block p-10 md:p-12 rounded-3xl bg-gradient-card border border-border">
            <Award className="w-8 h-8 text-terracotta mx-auto mb-6" />
            <blockquote className="font-display text-xl md:text-2xl text-foreground italic max-w-2xl leading-relaxed">
              {c.quote}
            </blockquote>
          </div>
        </div>

        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-4">
            {c.label}
          </p>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-6">
            {c.title1} <span className="italic">{c.title2}</span>
          </h2>
          <p className="font-body text-muted-foreground max-w-2xl mx-auto">
            {c.subtitle}
          </p>
        </div>

        {/* Credentials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {credentialGroups.map((credential) => (
            <div
              key={credential.title}
              className="text-center p-8 rounded-3xl bg-background shadow-soft hover:shadow-card transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-sage-light mx-auto mb-6 flex items-center justify-center">
                <credential.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl text-foreground mb-4">
                {credential.title}
              </h3>
              <ul className="space-y-3">
                {credential.items.map((item, index) => (
                  <li
                    key={index}
                    className="font-body text-sm text-muted-foreground leading-relaxed"
                  >
                    {item.link ? (
                      (() => {
                        const linkText = item.linkText ?? item.text;
                        const idx = item.text.indexOf(linkText);
                        const anchor = (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-primary/50 underline-offset-4 hover:text-foreground transition-colors"
                          >
                            {withGestaltTooltip(linkText)}
                          </a>
                        );
                        if (idx === -1) return anchor;
                        return (
                          <>
                            {item.text.slice(0, idx)}
                            {anchor}
                            {item.text.slice(idx + linkText.length)}
                          </>
                        );
                      })()
                    ) : (
                      withGestaltTooltip(item.text)
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Credentials;
