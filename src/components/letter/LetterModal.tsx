import { useCallback, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { letterEN } from "@/content/letter";
import LetterSignupForm from "./LetterSignupForm";

/**
 * The monthly letter, in a small dialog opened from the footer.
 *
 * ⚠️ It never opens by itself. No timer, no scroll depth, no exit intent, no
 * "first visit". It opens when the reader clicks the footer item and at no
 * other time. This is a practice site: a page that demands an address before
 * giving anything sets exactly the wrong tone, and a change that would raise
 * conversion by opening this automatically is still not wanted.
 * letterModal.test.tsx pins that, and was made to fail before being trusted.
 *
 * No font link here. The modal renders on every page, and the Fraunces load on
 * /take/automatic-yes is page-scoped so that it stays one page's cost.
 */

const STYLES = `
.lm-scrim {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(33, 24, 17, 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: lm-fade 150ms ease-out;
}
.lm-card {
  background: #FAF8F5; border-radius: 20px; padding: 28px;
  width: 100%; max-width: 420px; position: relative;
  box-shadow: 0 24px 60px -24px rgba(33,24,17,.5);
  animation: lm-rise 200ms ease-out;
  max-height: calc(100vh - 40px); overflow-y: auto;
}
.lm-close {
  position: absolute; top: 6px; right: 6px;
  width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;
  background: none; border: 0; cursor: pointer; color: #8A8075; border-radius: 999px;
}
.lm-close:hover { color: #464039; }
.lm-kicker {
  font: 600 12px/1.3 Lora, Georgia, serif; letter-spacing: .08em;
  text-transform: uppercase; color: #C2603A; margin: 0 0 6px;
}
.lm-title { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; line-height: 1.2; color: #464039; margin: 0 0 10px; font-weight: 400; }
.lm-lead { font: 16px/1.6 Lora, Georgia, serif; color: #5c554e; margin: 0 0 18px; }
.lm-more { display: inline-block; margin-top: 14px; font-size: 14px; color: #437059; font-weight: 600; text-decoration: none; }
.lm-more:hover { text-decoration: underline; }

@keyframes lm-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes lm-rise { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
@media (prefers-reduced-motion: reduce) {
  .lm-scrim, .lm-card { animation: none; }
}
`;

interface LetterModalProps {
  open: boolean;
  onClose: () => void;
}

const LetterModal = ({ open, onClose }: LetterModalProps) => {
  const { langPath } = useLanguage();
  const c = letterEN;
  const closeRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !cardRef.current) return;

      // Trap: a dialog the keyboard can walk out of is a dialog only a mouse
      // can really close.
      const focusable = cardRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    closeRef.current?.focus();
    document.addEventListener("keydown", handleKey);

    // Restored in the cleanup, so it comes back however the modal closed —
    // Escape included, which is the path that leaves a page stuck if the
    // restore lives only in the button's handler.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, handleKey]);

  if (!open) return null;

  return (
    <div
      className="lm-scrim"
      onMouseDown={(event) => {
        // mousedown on the scrim itself, not a click that began inside the
        // card and drifted out while selecting text.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="lm-card" ref={cardRef} role="dialog" aria-modal="true" aria-labelledby="lm-title">
        <button type="button" className="lm-close" onClick={onClose} aria-label={c.modalClose} ref={closeRef}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <p className="lm-kicker">{c.kicker}</p>
        <h2 className="lm-title" id="lm-title">
          {c.title}
        </h2>
        <p className="lm-lead">{c.lead}</p>

        {/* Shares the submit path with the worksheet through useSignup.
            `letter-footer` is how Brevo tells the two surfaces apart. */}
        <LetterSignupForm source="letter-footer" />

        <Link className="lm-more" to={langPath("/letter")} onClick={onClose}>
          {c.moreLink} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
};

export default LetterModal;
