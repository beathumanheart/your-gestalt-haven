import type { AutomaticYesContent } from "@/content/automaticYes";

/**
 * The monthly letter on its own, for a reader who has finished the worksheet
 * and did not want the PDF by email.
 *
 * Not rendered in Milestone 1 — see SignupCard for why.
 */

const LetterForm = ({ c }: { c: AutomaticYesContent }) => (
  <section className="letter" aria-labelledby="ay-letter-t">
    <div className="kicker">{c.letter.kicker}</div>
    <h2 id="ay-letter-t">{c.letter.title}</h2>
    <p>{c.letter.text}</p>

    <form noValidate>
      <div className="fld">
        <label className="lbl" htmlFor="lt-email">
          {c.signup.label}
        </label>
        <input type="email" id="lt-email" name="email" autoComplete="email" placeholder={c.signup.placeholder} required />
      </div>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />
      <button className="btn" type="submit">
        {c.letter.button}
      </button>
      <div className="small">
        {c.letter.small} <a href="/en/privacy">{c.signup.privacy}</a>
      </div>
      <div className="msg" role="status" aria-live="polite" />
    </form>
  </section>
);

export default LetterForm;
