import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const definitions = {
  en: "Gestalt therapy is a humanistic approach focused on present-moment awareness, personal responsibility, and the relationship between therapist and client.",
  ru: "Гештальт-терапия — гуманистический подход, основанный на осознанности в настоящем моменте, личной ответственности и отношениях между терапевтом и клиентом.",
};

interface GestaltTooltipProps {
  children: React.ReactNode;
}

const GestaltTooltip = ({ children }: GestaltTooltipProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline">
      <span
        className="underline decoration-dotted decoration-primary/50 underline-offset-4 cursor-help"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </span>
      {open && (
        <span className="absolute z-50 left-1/2 -translate-x-1/2 top-full mt-2 w-[260px] sm:w-[300px] p-3 rounded-xl bg-card border border-border shadow-elevated text-xs sm:text-sm font-body text-muted-foreground leading-relaxed animate-fade-in">
          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-card border-l border-t border-border" />
          {definitions[language]}
        </span>
      )}
    </span>
  );
};

const GESTALT_REGEX = /(gestalt|гештальт\S*)/i;

/** Wraps the first Gestalt/гештальт occurrence in `text` with a GestaltTooltip. */
export const withGestaltTooltip = (text: string) => {
  const match = text.match(GESTALT_REGEX);
  if (!match) return text;
  const idx = match.index!;
  return (
    <>
      {text.slice(0, idx)}
      <GestaltTooltip>{match[0]}</GestaltTooltip>
      {text.slice(idx + match[0].length)}
    </>
  );
};

export default GestaltTooltip;
