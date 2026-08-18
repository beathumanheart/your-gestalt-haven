import type { OfferAgreementContent, Section } from "@/content/offerAgreement";
import { withGestaltTooltip } from "@/components/GestaltTooltip";

const SectionBlock = ({ section }: { section: Section }) => (
  <section>
    <h2 className="font-display text-xl text-foreground mb-4">{section.heading}</h2>
    {section.paragraphs?.map((p, i) => (
      <p key={i}>{withGestaltTooltip(p)}</p>
    ))}
    {section.bullets && (
      <ul className="list-disc pl-6 space-y-2">
        {section.bullets.map((b, i) => (
          <li key={i}>{withGestaltTooltip(b)}</li>
        ))}
      </ul>
    )}
  </section>
);

/**
 * The agreement text itself, shared by the standalone page and the modal shown
 * inside the booking flow — so a client reading it mid-booking sees exactly the
 * same wording as the linked page, not a summary of it.
 */
const OfferAgreementBody = ({ content }: { content: OfferAgreementContent }) => (
  <div className="prose prose-neutral max-w-none font-body text-muted-foreground space-y-6">
    {content.sections.map((section, i) => (
      <SectionBlock key={i} section={section} />
    ))}
  </div>
);

export default OfferAgreementBody;
