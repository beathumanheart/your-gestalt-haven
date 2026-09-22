import type { AutomaticYesContent } from "@/content/automaticYes";

/**
 * The PDF sign-up, with the letter as a separate unticked box.
 *
 * Milestone 1 never renders this — `SIGNUP_ENABLED` is false — because the
 * Brevo list and template do not exist yet and the small print links to a
 * privacy notice that is not published. Milestone 2 wires the submit to the
 * `take-signup` function; until then this is deliberately inert markup, kept
 * here so the page's shape is not rebuilt later.
 */

const SignupCard = ({ c }: { c: AutomaticYesContent }) => (
  <form className="signup" noValidate aria-labelledby="signup-top-t">
    <h2 id="signup-top-t">{c.signup.title}</h2>
    <p>{c.signup.text}</p>

    <div className="fld">
      <label className="lbl" htmlFor="st-email">
        {c.signup.label}
      </label>
      <input type="email" id="st-email" name="email" autoComplete="email" placeholder={c.signup.placeholder} required />
    </div>

    {/* Unticked, and separate from the PDF: the PDF goes either way. */}
    <label className="consent">
      <input type="checkbox" name="letter" value="yes" />
      <span>{c.signup.consent}</span>
    </label>

    {/* Off-screen honeypot; a real reader never fills it. */}
    <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="sr-only" />

    <button className="btn full" type="submit">
      {c.signup.button}
    </button>

    <div className="small">
      {c.signup.small} <a href="/en/privacy">{c.signup.privacy}</a>
    </div>
    <div className="msg" role="status" aria-live="polite" />
  </form>
);

export default SignupCard;
