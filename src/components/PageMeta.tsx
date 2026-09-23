import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  HOME_TEXT,
  OG_IMAGE_ALT,
  OG_LOCALE,
  SITE_URL,
  swapLang,
} from "@/config/pageMetadata";

// Re-exported because several components import it from here.
export { SITE_URL };

interface PageMetaProps {
  titleEn?: string;
  titleRu?: string;
  descriptionEn?: string;
  descriptionRu?: string;
  /** Path segment of the canonical URL, e.g. "/en" or "/en/book/gestalt-individual".
   *  When provided: renders <link rel="canonical">, og:url, and hreflang alternates.
   *  The language prefix (/en or /ru) must be the first segment. */
  canonicalPath?: string;
  /** Adds <meta name="robots" content="noindex,nofollow"> */
  noIndex?: boolean;
  /**
   * Languages this page exists in. Absent means both.
   *
   * A page in one language claims no alternate in the other and points
   * x-default at itself — the same head the build writes for it, so the
   * runtime and the generated file cannot disagree.
   */
  langs?: readonly ("en" | "ru")[];
}

/**
 * Every string this component can render also has to be written into the
 * static files the build generates, so they all live in one module — see
 * the note at the top of src/config/pageMetadata.ts.
 */
const defaults = HOME_TEXT;

const PageMeta = ({
  titleEn = defaults.titleEn,
  titleRu = defaults.titleRu,
  descriptionEn = defaults.descriptionEn,
  descriptionRu = defaults.descriptionRu,
  canonicalPath,
  noIndex = false,
  langs,
}: PageMetaProps) => {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const title       = isRu ? titleRu : titleEn;
  const description = isRu ? descriptionRu : descriptionEn;
  const ogImage     = `${SITE_URL}/og-image-${language}.jpg`;
  const ogImageAlt  = OG_IMAGE_ALT[language];
  const locale      = OG_LOCALE[language];
  const altLocale   = OG_LOCALE[isRu ? "en" : "ru"];

  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;
  const lang = language as "en" | "ru";
  const singleLanguage = langs?.length === 1;
  const altPath      = canonicalPath && !singleLanguage ? swapLang(canonicalPath, lang) : undefined;
  const altUrl       = altPath ? `${SITE_URL}${altPath}` : undefined;
  // x-default points to English (primary language)
  const xDefaultUrl  = canonicalPath
    ? `${SITE_URL}${lang === "en" || singleLanguage ? canonicalPath : (altPath ?? canonicalPath)}`
    : undefined;

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {/* `hrefLang`, not `hreflang`: Helmet copies props to attributes verbatim,
          so either spelling lands as the case-insensitive `hreflang` in the DOM,
          but only this one matches React's JSX types. */}
      {canonicalUrl && <link rel="alternate" hrefLang={language} href={canonicalUrl} />}
      {altUrl       && <link rel="alternate" hrefLang={lang === "en" ? "ru" : "en"} href={altUrl} />}
      {xDefaultUrl  && <link rel="alternate" hrefLang="x-default" href={xDefaultUrl} />}

      <meta property="og:title"            content={title} />
      <meta property="og:description"      content={description} />
      {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
      <meta property="og:image"            content={ogImage} />
      <meta property="og:image:width"      content="1200" />
      <meta property="og:image:height"     content="630" />
      <meta property="og:image:alt"        content={ogImageAlt} />
      <meta property="og:locale"           content={locale} />
      {!singleLanguage && <meta property="og:locale:alternate" content={altLocale} />}

      <meta name="twitter:title"      content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"      content={ogImage} />
      <meta name="twitter:image:alt"  content={ogImageAlt} />
    </Helmet>
  );
};

export default PageMeta;
