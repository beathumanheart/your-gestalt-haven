import { useState } from "react";
import type { AutomaticYesContent } from "@/content/automaticYes";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSignup } from "./useSignup";

/**
 * The monthly letter on its own, for a reader who has finished the worksheet
 * and did not want the PDF by email. Letter only, so no PDF is sent.
 */

const LetterForm = ({ c }: { c: AutomaticYesContent }) => {
  const { langPath } = useLanguage();
  const { state, message, submit } = useSignup(c, "automatic-yes");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");

  const sending = state === "sending";
  const done = state === "done";

  return (
    <section className="letter" aria-labelledby="ay-letter-t">
      <div className="kicker">{c.letter.kicker}</div>
      <h2 id="ay-letter-t">{c.letter.title}</h2>
      <p>{c.letter.text}</p>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (sending || done) return;
          void submit({ email, pdf: false, letter: true, company });
        }}
      >
        <div className="fld">
          <label className="lbl" htmlFor="lt-email">
            {c.signup.label}
          </label>
          <input
            type="email"
            id="lt-email"
            name="email"
            autoComplete="email"
            placeholder={c.signup.placeholder}
            required
            disabled={sending || done}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

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

        <button className="btn" type="submit" disabled={sending || done}>
          {sending ? c.signup.sending : c.letter.button}
        </button>

        <div className="small">
          {c.letter.small} <a href={langPath("/privacy")}>{c.signup.privacy}</a>
        </div>
        <div className="msg" role="status" aria-live="polite">
          {message}
        </div>
      </form>
    </section>
  );
};

export default LetterForm;
