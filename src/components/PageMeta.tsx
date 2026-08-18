import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";

export const SITE_URL = "https://humanheart.life";

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
}

const defaults = {
  titleEn: "Genia | Counselling & Accompaniment",
  titleRu: "Genia | Психолог-консультант",
  descriptionEn:
    "A warm, compassionate space for therapy. I offer short-term and long-term Gestalt counselling for grief, relationships, and life's existential questions.",
  descriptionRu:
    "Тёплое пространство для терапии. Краткосрочное и долгосрочное гештальт-консультирование — горе, отношения, экзистенциальные вопросы.",
};

/** Given "/en/book/foo", returns "/ru/book/foo" and vice-versa. */
const swapLang = (path: string, from: "en" | "ru"): string => {
  const to = from === "en" ? "ru" : "en";
  if (path.startsWith(`/${from}/`)) return `/${to}/${path.slice(from.length + 2)}`;
  if (path === `/${from}`) return `/${to}`;
  return path;
};

const PageMeta = ({
  titleEn = defaults.titleEn,
  titleRu = defaults.titleRu,
  descriptionEn = defaults.descriptionEn,
  descriptionRu = defaults.descriptionRu,
  canonicalPath,
  noIndex = false,
}: PageMetaProps) => {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const title       = isRu ? titleRu : titleEn;
  const description = isRu ? descriptionRu : descriptionEn;
  const ogImage     = `${SITE_URL}/og-image-${language}.png`;
  const ogImageAlt  = isRu ? "Женя — психолог-консультант" : "Genia — Gestalt counsellor";
  const locale      = isRu ? "ru_RU" : "en_US";
  const altLocale   = isRu ? "en_US" : "ru_RU";

  const canonicalUrl = canonicalPath ? `${SITE_URL}${canonicalPath}` : undefined;
  const lang = language as "en" | "ru";
  const altPath      = canonicalPath ? swapLang(canonicalPath, lang) : undefined;
  const altUrl       = altPath ? `${SITE_URL}${altPath}` : undefined;
  // x-default points to English (primary language)
  const xDefaultUrl  = canonicalPath
    ? `${SITE_URL}${lang === "en" ? canonicalPath : (altPath ?? canonicalPath)}`
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
      <meta property="og:locale:alternate" content={altLocale} />

      <meta name="twitter:title"      content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"      content={ogImage} />
      <meta name="twitter:image:alt"  content={ogImageAlt} />
    </Helmet>
  );
};

export default PageMeta;
