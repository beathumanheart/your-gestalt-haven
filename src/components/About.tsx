import portraitImage from "@/assets/portrait.jpeg";
import { useLanguage } from "@/contexts/LanguageContext";
import { aboutEN, aboutRU } from "@/content/about";

const About = () => {
  const { language } = useLanguage();
  const c = language === "ru" ? aboutRU : aboutEN;

  return (
    <section id="about" className="section-padding bg-secondary/30">
      <div className="container-narrow">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Text Content */}
          <div className="order-2 md:order-1">
            <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-4">
              {c.label}
            </p>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-8 leading-tight">
              {c.title1} <br />
              <span className="italic">{c.title2}</span>
            </h2>
            <div className="space-y-5 font-body text-muted-foreground leading-relaxed">
              {c.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <p className="text-primary font-medium">{c.highlightParagraph}</p>
            </div>
          </div>

          {/* Portrait Image */}
          <div className="order-1 md:order-2 flex justify-center">
            <div className="relative">
              <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-sage-light p-3 shadow-elevated">
                <div className="w-full h-full rounded-full bg-terracotta-light p-2 animate-float">
                  <div className="w-full h-full rounded-full bg-cream shadow-card overflow-hidden">
                    <img 
                      src={portraitImage} 
                      alt={language === "ru" ? "Женя, психолог-консультант" : "Genia, Gestalt counsellor"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Floating decorative dots */}
              <div className="absolute -top-4 -right-4 w-4 h-4 rounded-full bg-terracotta/60" />
              <div className="absolute -bottom-6 -left-2 w-6 h-6 rounded-full bg-primary/40" />
              <div className="absolute top-1/2 -right-8 w-3 h-3 rounded-full bg-accent/50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
