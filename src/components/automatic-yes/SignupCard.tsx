import { useState } from "react";
import type { AutomaticYesContent } from "@/content/automaticYes";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSignup } from "./useSignup";

/**
 * The PDF sign-up, with the letter as a separate unticked box.
 *
 * The PDF is sent either way; ticking the letter adds Brevo's double opt-in,
 * so an address only reaches the list after the reader confirms from their
 * inbox. Nothing here is pre-ticked.
 */

const SignupCard = ({ c }: { c: AutomaticYesContent }) => {
  const { langPath } = useLanguage();
  const { state, message, submit } = useSignup(c, "automatic-yes");
  const [email, setEmail] = useState("");
  const [letter, setLetter] = useState(false);
  const [company, setCompany] = useState("");

  const sending = state === "sending";
  const done = state === "done";

  return (
    <form
      className="signup"
      noValidate
      aria-labelledby="signup-top-t"
      onSubmit={(event) => {
        event.preventDefault();
        if (sending || done) return;
        void submit({ email, pdf: true, letter, company });
      }}
    >
      <h2 id="signup-top-t">{c.signup.title}</h2>
      <p>{c.signup.text}</p>

      <div className="fld">
        <label className="lbl" htmlFor="st-email">
          {c.signup.label}
        </label>
        <input
          type="email"
          id="st-email"
          name="email"
          autoComplete="email"
          placeholder={c.signup.placeholder}
          required
          disabled={sending || done}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <label className="consent">
        <input
          type="checkbox"
          name="letter"
          checked={letter}
          disabled={sending || done}
          onChange={(event) => setLetter(event.target.checked)}
        />
        <span>{c.signup.consent}</span>
      </label>

      {/* Off-screen: a person never sees it, so anything in it is a bot. */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="sr-only"
        value={company}
        onChange={(event) => setCompany(event.target.value)}
      />

      <button className="btn full" type="submit" disabled={sending || done}>
        {sending ? c.signup.sending : c.signup.button}
      </button>

      <div className="small">
        {c.signup.small} <a href={langPath("/privacy")}>{c.signup.privacy}</a>
      </div>
      <div className="msg" role="status" aria-live="polite">
        {message}
      </div>
    </form>
  );
};

export default SignupCard;
