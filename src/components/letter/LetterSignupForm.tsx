import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { letterEN } from "@/content/letter";
import { signupMessages } from "@/content/signupMessages";
import { useSignup } from "@/components/automatic-yes/useSignup";
import type { SignupSource } from "@/config/signup";

/**
 * The letter sign-up, for the modal and for /en/letter.
 *
 * It shares the submit path with the worksheet's LetterForm through
 * `useSignup` — one request shape, one set of state transitions, one set of
 * messages — but not that component's markup. LetterForm renders a
 * `<section class="letter">` with its own heading, and its classes are defined
 * inside the worksheet page's scoped stylesheet; rendering it here would give
 * a heading duplicating the one above it and no styling at all.
 *
 * The field and message strings come from src/content/signupMessages.ts, and
 * deliberately not from the worksheet's content module: the footer is in the
 * entry chunk, so importing that module here put 23 KB of worksheet prose into
 * every page load. e2e/bundle-splitting.spec.ts pins that it stays out.
 *
 * Styles are scoped and carried here rather than by each host, so the field
 * and button cannot drift between the modal and the page.
 */

const STYLES = `
.ls-form { display: grid; gap: 10px; }
.ls-label {
  font: 600 12px/1.3 Lora, Georgia, serif; letter-spacing: .06em;
  text-transform: uppercase; color: #8A8075;
}
.ls-input {
  width: 100%; box-sizing: border-box;
  padding: 12px 14px; border: 1px solid #DED6CB; border-radius: 12px;
  background: #fff; color: #464039; font: 16px/1.4 Lora, Georgia, serif;
}
.ls-input:focus-visible { outline: 2px solid #437059; outline-offset: 1px; border-color: #437059; }
.ls-input:disabled { opacity: .6; }
.ls-button {
  padding: 12px 18px; border: 0; border-radius: 999px; cursor: pointer;
  background: #437059; color: #FAF8F5;
  font: 600 15px/1.2 Lora, Georgia, serif;
}
.ls-button:hover:not(:disabled) { background: #375c49; }
.ls-button:disabled { opacity: .6; cursor: default; }
/* Off-screen rather than display:none — a hidden input is not submitted by
   some browsers, and the point is that a bot fills it in. */
.ls-pot { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.ls-fine { font: 13px/1.5 Lora, Georgia, serif; color: #8A8075; margin: 2px 0 0; }
.ls-fine a { color: #437059; }
.ls-error { font: 14px/1.5 Lora, Georgia, serif; color: #A2432A; margin: 0; }
.ls-done { font: 16px/1.6 Lora, Georgia, serif; color: #437059; margin: 0; }
`;

interface Props {
  source: SignupSource;
  /** The page states the same thing in its own rows, so it turns this off. */
  showPrivacyNote?: boolean;
}

const LetterSignupForm = ({ source, showPrivacyNote = true }: Props) => {
  const { langPath } = useLanguage();
  const c = letterEN;
  const { state, message, submit } = useSignup(
    {
      // No PDF from either of these surfaces, so the two PDF sentences are
      // never reached — the server refuses a PDF request from them outright.
      done: signupMessages.error,
      done_with_letter: signupMessages.error,
      letter_done: signupMessages.letterPending,
      invalid: signupMessages.invalid,
      error: signupMessages.error,
      rate_limited: signupMessages.rate_limited,
    },
    source,
  );
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const sending = state === "sending";

  // On success the form is replaced in place: the reader stays where they are
  // and reads what happens next, rather than the surface closing under them.
  if (state === "done") {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: STYLES }} />
        <p className="ls-done" role="status" aria-live="polite">
          {message}
        </p>
      </>
    );
  }

  return (
    <form
      className="ls-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (sending) return;
        void submit({ email, pdf: false, letter: true, company });
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <label className="ls-label" htmlFor={`ls-email-${source}`}>
        {signupMessages.label}
      </label>
      <input
        id={`ls-email-${source}`}
        type="email"
        name="email"
        autoComplete="email"
        placeholder={signupMessages.placeholder}
        required
        disabled={sending}
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        /* Both markers. data-ph-no-capture stops autocapture sending the
           value; ph-no-capture stops session replay recording it. Neither
           substitutes for the other — see analyticsPrivacy.test.tsx. */
        data-ph-no-capture
        className="ls-input ph-no-capture"
      />

      {/* A person never sees it, so anything in it came from a bot. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="ls-pot"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
      />

      <button className="ls-button" type="submit" disabled={sending}>
        {sending ? signupMessages.sending : signupMessages.subscribe}
      </button>

      {showPrivacyNote && (
        <p className="ls-fine">
          {c.confirmNote} <Link to={langPath("/privacy")}>{c.privacy}</Link>
        </p>
      )}

      {/* Rendered only when there is something to say, so it cannot sit in the
          DOM invisible — which is what "I clicked and nothing happened" looked
          like the last time a message element was always present. */}
      {state === "error" && (
        <p className="ls-error" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
};

export default LetterSignupForm;
