import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";

const SITE_URL = "https://humanheart.life";

interface PageMetaProps {
  titleEn?: string;
  titleRu?: string;
  descriptionEn?: string;
  descriptionRu?: string;
}

const defaults = {
  titleEn: "Genia | Psychotherapist",
  titleRu: "Женя | Психотерапевт",
  descriptionEn:
    "A warm, compassionate space for therapy. I offer short-term and long-term Gestalt psychotherapy for grief, relationships, and life's existential questions.",
  descriptionRu:
    "Тёплое пространство для терапии. Краткосрочная и долгосрочная гештальт-психотерапия — горе, отношения, экзистенциальные вопросы.",
};

const PageMeta = ({
  titleEn = defaults.titleEn,
  titleRu = defaults.titleRu,
  descriptionEn = defaults.descriptionEn,
  descriptionRu = defaults.descriptionRu,
}: PageMetaProps) => {
  const { language } = useLanguage();
  const isRu = language === "ru";

  const title       = isRu ? titleRu : titleEn;
  const description = isRu ? descriptionRu : descriptionEn;
  const ogImage     = `${SITE_URL}/og-image-${language}.png`;
  const ogImageAlt  = isRu ? "Женя — гештальт-психотерапевт" : "Genia — Gestalt psychotherapist";
  const locale      = isRu ? "ru_RU" : "en_US";
  const altLocale   = isRu ? "en_US" : "ru_RU";

  return (
    <Helmet>
      <html lang={language} />
      <title>{title}</title>
      <meta name="description" content={description} />

      <meta property="og:title"            content={title} />
      <meta property="og:description"      content={description} />
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
