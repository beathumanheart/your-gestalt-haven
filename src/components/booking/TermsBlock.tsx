import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import OfferAgreementBody from "@/components/OfferAgreementBody";
import {
  offerAgreementEN,
  offerAgreementRU,
  TERMS_VERSION,
} from "@/content/offerAgreement";
import type { BookingContent } from "@/content/booking";
import type { Language } from "@/contexts/LanguageContext";

/**
 * The four facts most people will never open the full agreement to find.
 * Deliberately not an excerpt of the document — these are the terms that
 * shape the working relationship, stated plainly and unavoidably.
 */
const TermsBlock = ({ t, language }: { t: BookingContent; language: Language }) => (
  <div className="bg-muted/50 rounded-xl p-4 space-y-2" data-testid="terms-block">
    <p className="font-body text-sm font-medium text-foreground">{t.termsHeading}</p>
    <ul className="space-y-1.5">
      {[t.termsFee, t.termsCancellation, t.termsPayment, t.termsConfidentiality].map(
        (line, i) => (
          <li key={i} className="font-body text-xs sm:text-sm text-muted-foreground flex gap-2">
            <span aria-hidden="true" className="text-primary shrink-0">
              ·
            </span>
            <span>{line}</span>
          </li>
        )
      )}
    </ul>
  </div>
);

/**
 * Opens the agreement in a modal rather than navigating. This is an SPA — a
 * route change would discard everything typed into the form, and a client who
 * has to re-enter their details after reading the terms is a client who
 * abandons the booking.
 *
 * Radix handles the focus trap, Escape, and returning focus to the trigger;
 * `onClosed` moves it on to the checkbox, which is what the reader came back for.
 */
const TermsLink = ({
  t,
  language,
  onClosed,
}: {
  t: BookingContent;
  language: Language;
  onClosed?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const content = language === "ru" ? offerAgreementRU : offerAgreementEN;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onClosed?.();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className="font-body text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          {t.termsLinkText}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-light">
            {content.pageTitle}
          </DialogTitle>
        </DialogHeader>
        <p className="font-body text-xs text-muted-foreground">
          {t.termsVersionLabel} {TERMS_VERSION}
        </p>
        <OfferAgreementBody content={content} />
      </DialogContent>
    </Dialog>
  );
};

TermsBlock.Link = TermsLink;

export default TermsBlock;
