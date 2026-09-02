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

/**
 * Institutions that *awarded a completed* qualification. URLs verified
 * to resolve.
 *
 * The International Institute of Gestalt is deliberately absent: that
 * training is ongoing, and `alumniOf` asserts completed study just as
 * surely as `hasCredential` would. It stays prose on the page, where
 * "(ongoing)" can qualify it.
 */
export const ALUMNI_OF = [
  { "@type": "CollegeOrUniversity", name: "KU Leuven", url: "https://www.kuleuven.be/" },
  { "@type": "CollegeOrUniversity", name: "University of Tartu", url: "https://ut.ee/" },
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
    // The page names the city, not an institution, so none is asserted.
    educationalLevel: "Diploma",
  },
  {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "degree",
    name: "MSc in Bioethics",
    educationalLevel: "Master's degree",
    recognizedBy: { "@type": "CollegeOrUniversity", name: "KU Leuven", url: "https://www.kuleuven.be/" },
  },
  {
    "@type": "EducationalOccupationalCredential",
    credentialCategory: "degree",
    name: "MA in Philosophy",
    educationalLevel: "Master's degree",
    recognizedBy: { "@type": "CollegeOrUniversity", name: "University of Tartu", url: "https://ut.ee/" },
  },
] as const;

/**
 * The site-wide Person node, injected into index.html at build time.
 *
 * The prose here is English. One static HTML file serves both /en and
 * /ru, so it cannot be per-language without build-time prerendering —
 * see the note in index.html. `jobTitle` is "Gestalt Counsellor" by
 * deliberate choice; it is not a loose synonym for "therapist" and
 * should not be broadened.
 */
export const staticPersonNode = () => ({
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Genia",
  jobTitle: "Gestalt Counsellor",
  url: `${SITE_URL}/en`,
  image: `${SITE_URL}/og-image-en.png`,
  knowsAbout: ["Gestalt therapy", "grief counselling", "existential therapy", "relationship therapy"],
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
export const staticServiceNode = () => ({
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": SERVICE_ID,
  name: "Human Heart — Gestalt Counselling",
  description:
    "A warm, compassionate space for individual Gestalt counselling. Working with grief, relationships, and life's existential questions.",
  url: `${SITE_URL}/en`,
  areaServed: "Worldwide (online)",
  knowsLanguage: ["en", "ru"],
});
