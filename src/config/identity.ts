/**
 * ============================================================
 * IDENTITY FACTS FOR STRUCTURED DATA
 * ============================================================
 * Language-neutral facts about the practitioner, expressed as
 * schema.org nodes. These are the claims a crawler can check against
 * a third party — degrees, awarding institutions — as opposed to
 * `sameAs`, which is only ever self-asserted.
 *
 * Everything here mirrors src/content/credentials.ts. If a credential
 * is added or removed there, mirror it here; do not add anything that
 * is not already stated on the page.
 * ============================================================
 */

// Relative, not the "@/" alias: vite.config.ts imports this module to inject
// the static nodes at build time, and esbuild resolves it without Vite aliases.
import { SAME_AS } from "./social";

export const SITE_URL = "https://humanheart.life";
export const PERSON_ID = `${SITE_URL}/#genia`;
export const SERVICE_ID = `${SITE_URL}/#service`;

/** The languages the identity nodes are emitted in. */
export type IdentityLang = "en" | "ru";

/**
 * The practitioner's job title, per language.
 *
 * ⚠️ The EN and RU titles are deliberately NOT translations of each other.
 *
 * EN says "Gestalt Counsellor" because the two nearest-sounding Belgian
 * professional titles are protected in law and reserved to practitioners on
 * the federal register. An English page read in Belgium must not imply
 * either. (Those titles are not spelled out here on purpose: the guard in
 * src/__tests__/bannedTerminology.test.ts bans them as substrings across the
 * whole repo, comments included, so writing them would fail the build.)
 *
 * RU says «гештальт-терапевт» because that is the ordinary, unregulated
 * descriptor in Russian-language practice, where «консультант» would
 * understate the work.
 *
 * Do not harmonise them. A future translation pass that "fixes" one to match
 * the other reintroduces a regulatory claim on the EN side.
 */
const JOB_TITLE: Record<IdentityLang, string> = {
  en: "Gestalt Counsellor",
  ru: "гештальт-терапевт",
};

/**
 * Subject-matter tags, per language.
 *
 * The RU side is built from the vocabulary already reviewed and shipping in
 * the RU metadata and the offer agreement («горе», «отношения»,
 * «экзистенциальные вопросы», «гештальт-терапия») rather than translated
 * afresh here — the draft RU in src/content/services.ts is explicitly not a
 * source for anything user-visible yet.
 */
const KNOWS_ABOUT: Record<IdentityLang, readonly string[]> = {
  en: ["Gestalt therapy", "grief counselling", "existential therapy", "relationship therapy"],
  ru: ["гештальт-терапия", "работа с горем", "экзистенциальная терапия", "терапия отношений"],
};

/** The practice's own prose, per language. Mirrors JOB_TITLE's terminology. */
const SERVICE_NAME: Record<IdentityLang, string> = {
  // "Human Heart" is the brand and stays; only the descriptor after it is
  // language-specific, for the same reason JOB_TITLE is.
  en: "Human Heart — Gestalt Counselling",
  ru: "Human Heart — гештальт-терапия",
};

const SERVICE_DESCRIPTION: Record<IdentityLang, string> = {
  en:
    "A warm, compassionate space for individual Gestalt counselling. " +
    "Working with grief, relationships, and life's existential questions.",
  ru:
    "Тёплое пространство для индивидуальной гештальт-терапии. " +
    "Работа с горем, отношениями и экзистенциальными вопросами.",
};

/** Matches the phrasing the per-session nodes in JsonLd.tsx already emit. */
const AREA_SERVED: Record<IdentityLang, string> = {
  en: "Worldwide (online)",
  ru: "Весь мир (онлайн)",
};

/**
 * ── Institutions ─────────────────────────────────────────────────────────
 *
 * Defined once each and referenced from both `alumniOf` and the
 * `recognizedBy` of the credential they awarded, so an institution cannot
 * be described one way in one place and another way in the other.
 *
 * An institution's `name` is its own official name. That is not a
 * translation decision, so it does not vary by page language: "KU Leuven"
 * and "University of Tartu" appear on the Russian pages exactly as on the
 * English ones, and by the same rule a Russian institution keeps its
 * Russian name on the English page. Exonyms are avoided — «Лёвенский
 * католический университет» describes the institution rather than naming
 * it.
 *
 * Identity is carried by `url` and `sameAs` instead of by the name, which
 * is both language-neutral and checkable by a third party. That is the
 * point: a crawler can resolve these, and cannot resolve a translation.
 */

const KU_LEUVEN = {
  "@type": "CollegeOrUniversity",
  name: "KU Leuven",
  url: "https://www.kuleuven.be/",
  // Q833670 is the Dutch-language university as it exists since the 1968
  // split, which is the body that awarded the degree. Q644789 is the
  // pre-1968 institution and Q2901923 the umbrella association; neither is
  // this one, and both are easy to pick by mistake.
  sameAs: "https://www.wikidata.org/wiki/Q833670",
} as const;

const UNIVERSITY_OF_TARTU = {
  "@type": "CollegeOrUniversity",
  name: "University of Tartu",
  url: "https://ut.ee/",
  sameAs: "https://www.wikidata.org/wiki/Q204181",
} as const;

/**
 * The Saint Petersburg institute that awarded the counselling diploma.
 *
 * `name` is deliberately absent, and a node carrying a url and no name
 * asserts less than a node carrying a wrong one. The site's own tagline is
 * not the institution's name, and the legal form printed on the diploma is
 * not to hand; Genia will supply the official name if it is wanted.
 *
 * `@type` is the general EducationalOrganization rather than
 * CollegeOrUniversity: this is a continuing-professional-development
 * provider, not a university.
 *
 * No `sameAs` — there is no Wikidata or Wikipedia entry to point at.
 */
const SPB_COUNSELLING_INSTITUTE = {
  "@type": "EducationalOrganization",
  url: "https://education-psy.ru/",
} as const;

/**
 * Institutions that *awarded a completed* qualification.
 *
 * All three diplomas and degrees here are finished, so all three
 * institutions belong. The Saint Petersburg one was previously absent only
 * because no institution was identified at all — the page names the city —
 * and a url now identifies it without naming it.
 *
 * The International Institute of Gestalt is still deliberately absent:
 * that training is ongoing, and `alumniOf` asserts completed study just as
 * surely as `hasCredential` would. It stays prose on the page, where
 * "(ongoing)" can qualify it. Its url lives in src/content/credentials.ts,
 * next to that qualifier.
 */
export const ALUMNI_OF = [
  KU_LEUVEN,
  UNIVERSITY_OF_TARTU,
  SPB_COUNSELLING_INSTITUTE,
] as const;

/**
 * Formally awarded qualifications only, mirroring the Education group
 * in credentials.ts.
 *
 * Two things on that page are deliberately NOT encoded here, because
 * structured data cannot carry the qualifier the sentence carries:
 *
 * - EAGT ethical standards — voluntary alignment, not membership and
 *   not a credential. `memberOf` would flatten a distinction that is
 *   maintained on purpose for the Belgian regulatory context.
 * - Training at the International Institute of Gestalt — in progress.
 *   A credential node asserts completion.
 *
 * The rule: if the markup would claim more than the sentence does,
 * leave it in the sentence.
 */
export const CREDENTIALS = [
  {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "diploma",
    name: "Diploma in Psychological Counselling",
    educationalLevel: "Diploma",
    recognizedBy: SPB_COUNSELLING_INSTITUTE,
  },
  {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "degree",
    name: "MSc in Bioethics",
    educationalLevel: "Master's degree",
    recognizedBy: KU_LEUVEN,
  },
  {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "degree",
    name: "MA in Philosophy",
    educationalLevel: "Master's degree",
    recognizedBy: UNIVERSITY_OF_TARTU,
  },
] as const;

/**
 * The site-wide Person node, written into every generated page's head.
 *
 * `@id` is the same string in both languages on purpose: it is the stable
 * identity of one person, and emitting two ids would assert two people.
 * Only the prose varies — see JOB_TITLE for the one divergence that is a
 * legal matter rather than a translation.
 *
 * `url` and `image` stay on the English homepage in both languages, because
 * they name the person's primary page, not the page the node appears on.
 *
 * Institution and qualification names do not vary by language — an
 * institution's name is its own official name, and identity is carried by
 * `url` and `sameAs`. See the institutions block above.
 */
export const staticPersonNode = (lang: IdentityLang = "en") => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Genia",
  jobTitle: JOB_TITLE[lang],
  url: `${SITE_URL}/en`,
  image: `${SITE_URL}/og-image-en.png`,
  knowsAbout: KNOWS_ABOUT[lang],
  knowsLanguage: ["en", "ru"],
  sameAs: SAME_AS,
  alumniOf: ALUMNI_OF,
  hasCredential: CREDENTIALS,
  // The graph is joined from this side on purpose: ProfessionalService is a
  // LocalBusiness, not a Service, so it has no `provider`. See below.
  worksFor: { "@id": SERVICE_ID },
});

/**
 * The site-wide practice node.
 *
 * No `offers`: the figure here used to be a hardcoded "from 40 EUR"
 * that no process kept in step with session_types. Prices are emitted
 * per session on the booking pages, from the row the page renders, so
 * they cannot drift. A site-wide aggregate would have to be either
 * hardcoded again or fetched at build time, which would make the
 * markup depend on database reachability.
 *
 * No `provider` or `serviceType` either, though both were here before:
 * ProfessionalService descends from LocalBusiness (an Organization and
 * a Place), not from Service, so neither property applies to it. The
 * schema.org validator flags both as UNKNOWN_FIELD. The link to the
 * practitioner is expressed as Person.worksFor instead, and the kind of
 * work is already stated in `name` and `description`.
 */
export const staticServiceNode = (lang: IdentityLang = "en") => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": SERVICE_ID,
  name: SERVICE_NAME[lang],
  description: SERVICE_DESCRIPTION[lang],
  url: `${SITE_URL}/en`,
  areaServed: AREA_SERVED[lang],
  knowsLanguage: ["en", "ru"],
});
