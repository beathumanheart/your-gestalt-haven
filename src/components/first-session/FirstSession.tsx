import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { SOCIAL_URLS } from "@/config/social";
import { CONTACT_EMAIL } from "@/content/contact";
import {
  firstSessionEN,
  firstSessionRU,
  type Inline,
  type LinkKey,
  type Paragraph,
} from "@/content/firstSession";

/**
 * "The first session" — a page to read.
 *
 * No cards, no panels, no icons, and deliberately nothing interactive: there
 * is no form, no input, nothing stored and no analytics of its own. On
 * /take/* PostHog counts page opens and nothing else, and this page does not
 * change that. `firstSession.test.tsx` pins all of it, because a page like
 * this is an easy place to later add "just a small sign-up".
 *
 * Styles are a scoped <style> block rather than Tailwind classes, following
 * TakeIndex and AutomaticYes — the shelf pages carry their own typography and
 * read as documents rather than as app screens. Site type only: Cormorant
 * Garamond for headings, Lora for body. **No Fraunces link here** — that face
 * is the shelf-card face and its load stays scoped to the pages that use it.
 */

/* `.tk-root` is defined per-page (TakeIndex has its own copy), so this block
   carries the one this page needs rather than depending on another route's
   styles having loaded. The measure is narrower than the shelf's: 720px for a
   column of prose, against 980px for a grid of cards. */
const STYLES = `
.fs-root { max-width: 980px; margin: 0 auto; padding: clamp(26px,4vw,60px) clamp(18px,4vw,40px) 80px; }
.fs-col { max-width: 720px; }
.fs-crumb { font-family: Lora,Georgia,serif; font-size: 14.5px; line-height: 1.6; margin: 0 0 22px; color: #5c554e; }
.fs-crumb a { font-weight: 600; color: #437059; text-decoration: underline; text-underline-offset: 3px; }
.fs-crumb span { color: #8A8075; }
.fs-kicker { font-family: Lora,Georgia,serif; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #C2603A; margin: 0 0 10px; }
.fs-title { font-family: 'Cormorant Garamond',Georgia,serif; font-weight: 300; font-size: clamp(28px,5vw,34px); line-height: 1.12; margin: 0; color: #464039; }
.fs-h2 { font-family: 'Cormorant Garamond',Georgia,serif; font-weight: 400; font-size: clamp(20px,3.6vw,22px); line-height: 1.2; margin: 44px 0 0; color: #464039; }
.fs-p { font-family: Lora,Georgia,serif; font-size: 17px; line-height: 1.7; margin: 14px 0 0; color: #5c554e; }
.fs-col a { color: #437059; text-decoration: underline; text-underline-offset: 3px; }
.fs-col a:hover { text-decoration-color: #437059; }
.fs-col a:focus-visible, .fs-crumb a:focus-visible { outline: 2px solid #437059; outline-offset: 2px; border-radius: 2px; }
`;

const FirstSession = () => {
  const { language, langPath } = useLanguage();
  const c = language === "ru" ? firstSessionRU : firstSessionEN;

  /**
   * Where each link key points.
   *
   * Built per render because `offer` is language-dependent: the Russian
   * article has to link to the Russian agreement. None of these three is ever
   * written out as a literal — the Telegram handle has changed once already,
   * and `getInTouch.test.tsx` scans every component and content file for the
   * bare profile URL. (That guard reads comments as well as code, which is
   * why this one describes the pattern instead of quoting it.)
   */
  const href = (key: LinkKey): string =>
    ({
      offer: langPath("/offer-agreement"),
      email: `mailto:${CONTACT_EMAIL}`,
      telegram: SOCIAL_URLS.telegram,
    })[key];

  /** One inline run: plain text, an internal Link, or an external anchor. */
  const renderInline = (part: Inline, i: number) => {
    if (typeof part === "string") return part;

    // The agreement is a route, so it goes through Link — an <a> would reload
    // the whole SPA to reach a page that is already bundled.
    if (part.link === "offer") {
      return (
        <Link key={i} to={href("offer")}>
          {part.text}
        </Link>
      );
    }

    // mailto: and Telegram both leave the app. Only the latter opens a tab,
    // and only the latter needs the noopener pair.
    const external = part.link === "telegram";
    return (
      <a
        key={i}
        href={href(part.link)}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {part.text}
      </a>
    );
  };

  const renderParagraph = (p: Paragraph, i: number) => (
    <p key={i} className="fs-p">
      {typeof p === "string" ? p : p.map(renderInline)}
    </p>
  );

  return (
    <div className="fs-root">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <div className="fs-col">
        <nav className="fs-crumb" aria-label="Breadcrumb">
          <Link to={langPath("/take")}>{c.crumb}</Link> <span>· {c.crumbHere}</span>
        </nav>

        {/* Kicker then title, and nothing between the title and the first
            section: no subtitle and no lead paragraph. An earlier draft had a
            lead and it was removed deliberately. */}
        <p className="fs-kicker">{c.kicker}</p>
        <h1 className="fs-title">{c.title}</h1>

        {c.sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2 className="fs-h2">{section.heading}</h2>
            {section.paragraphs.map(renderParagraph)}
          </section>
        ))}
      </div>
    </div>
  );
};

export default FirstSession;
