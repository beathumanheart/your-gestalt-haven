import { useLanguage } from "@/contexts/LanguageContext";
import {
  CONTACT_EMAIL,
  getInTouchEN,
  getInTouchRU,
  type ContactChannel,
} from "@/content/contact";
import CopyableEmail from "./CopyableEmail";

/**
 * The invitation to write, which is what stands where the calendar used to.
 *
 * Used on each service page and in the homepage #contact section — one
 * component, so the two cannot drift. With `BOOKING_ENABLED` on it drops to a
 * secondary line beneath the picker (`compact`), because then it is the
 * alternative rather than the way in.
 *
 * ## No buttons
 *
 * The contact links are links, styled as links. A large green "Contact me"
 * button would read as a conversion funnel, and turning the first contact
 * back into a funnel is exactly what taking the calendar down was meant to
 * stop. The visual weight here is deliberately low.
 *
 * ## Channel order
 *
 * Email first in English, Telegram first in Russian — read from
 * `content.channels` rather than branched on here, so the ordering lives with
 * the copy it belongs to and shows up in the DOM rather than only in the
 * styling. A reader using a screen reader gets the same order as everyone
 * else.
 */
const GetInTouch = ({ compact = false }: { compact?: boolean } = {}) => {
  const { language } = useLanguage();
  const c = language === "ru" ? getInTouchRU : getInTouchEN;

  const channels: Record<ContactChannel, JSX.Element> = {
    email: (
      <CopyableEmail
        key="email"
        address={CONTACT_EMAIL}
        copyLabel={c.copyLabel}
        copiedLabel={c.copiedLabel}
        copyFailedLabel={c.copyFailedLabel}
      />
    ),
    telegram: (
      <p key="telegram" className="font-body text-[15px] text-foreground/85 leading-relaxed">
        <a
          href={c.telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-[5px] decoration-border hover:decoration-primary transition-colors"
        >
          {c.telegramLabel}
        </a>
        {c.telegramNote}
      </p>
    ),
  };

  return (
    <section
      data-testid="get-in-touch"
      aria-labelledby="get-in-touch-heading"
      className={`rounded-2xl bg-secondary/50 border border-border ${
        compact ? "p-5 sm:p-6" : "p-6 sm:p-8"
      }`}
    >
      <h2
        id="get-in-touch-heading"
        className={`font-display font-light text-foreground ${
          compact ? "text-xl mb-2.5" : "text-2xl sm:text-[28px] mb-3.5"
        }`}
      >
        {c.heading}
      </h2>

      <p className="font-body text-[15px] text-foreground/85 leading-[1.75] max-w-prose">
        {c.invitation}
      </p>

      {/* Present, not shouted: it is a caveat about mail delivery, not a warning. */}
      <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-prose mt-3">
        {c.replyTime}
      </p>

      <div className="mt-6 space-y-3.5">{c.channels.map((channel) => channels[channel])}</div>
    </section>
  );
};

export default GetInTouch;
