import { useState } from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { useLanguage } from "@/contexts/LanguageContext";

const definitions = {
  en: "Gestalt therapy is a humanistic approach focused on present-moment awareness, personal responsibility, and the relationship between therapist and client.",
  ru: "Гештальт-терапия — гуманистический подход, основанный на осознанности в настоящем моменте, личной ответственности и отношениях между терапевтом и клиентом.",
};

interface GestaltTooltipProps {
  children: React.ReactNode;
}

/**
 * The panel is portalled rather than absolutely positioned next to the word.
 * Inside the offer-agreement dialog the scroll container (`overflow-y-auto`,
 * which forces `overflow-x` to match) was clipping it, and on a narrow screen a
 * fixed-width panel centred on a word near the edge ran off the page. Radix
 * places it against the viewport instead, flipping and shifting to stay inside.
 *
 * The panel itself is hidden from assistive tech and the definition repeated
 * inline as `sr-only`: portalled content sits outside the dialog's subtree, so
 * its exposure to a screen reader depends on the dialog's aria-hidden shim
 * rather than on anything here.
 */
const GestaltTooltip = ({ children }: GestaltTooltipProps) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Anchor asChild>
        <span
          className="underline decoration-dotted decoration-primary/50 underline-offset-4 cursor-help"
          onClick={() => setOpen(!open)}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          {children}
        </span>
      </PopoverPrimitive.Anchor>
      <span className="sr-only"> ({definitions[language]}) </span>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          sideOffset={8}
          collisionPadding={16}
          aria-hidden="true"
          // Opening on hover must not pull focus out of whatever the reader is doing.
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="z-50 w-[260px] sm:w-[300px] max-w-[calc(100vw-2rem)] p-3 rounded-xl bg-card border border-border shadow-elevated text-xs sm:text-sm font-body text-muted-foreground leading-relaxed animate-fade-in"
        >
          <PopoverPrimitive.Arrow
            width={12}
            height={6}
            className="fill-card stroke-border"
          />
          {definitions[language]}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
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
