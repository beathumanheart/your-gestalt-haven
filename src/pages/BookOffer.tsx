import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, Info } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWidget from "@/components/booking/BookingWidget";
import { supabase } from "@/integrations/supabase/client";
import { offersEN, offersRU } from "@/content/offers";
import PageMeta from "@/components/PageMeta";
import type { HiddenOffer } from "@/hooks/useHiddenOffers";

const ALLOWED_MARKDOWN = ["p", "h1", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "code"] as const;

// Markdown in the DB uses single \n for paragraph breaks; standard MD needs \n\n.
// Normalize so each isolated newline becomes a blank line, creating <p> elements.
const normalizeMd = (text: string) => text.replace(/(?<!\n)\n(?!\n)/g, "\n\n");

const PROSE = "prose prose-sm font-body text-muted-foreground max-w-none " +
  "prose-headings:font-display prose-headings:font-light prose-headings:text-foreground " +
  "prose-a:text-primary prose-a:no-underline hover:prose-a:underline " +
  "prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded";

const BookOffer = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, langPath } = useLanguage();
  const t = language === "ru" ? offersRU : offersEN;

  const [offer, setOffer] = useState<HiddenOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);

  useEffect(() => {
    if (!slug) { setAvailable(false); setLoading(false); return; }
    supabase
      .from("hidden_offers")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setAvailable(false);
        else setOffer(data as HiddenOffer);
        setLoading(false);
      });
  }, [slug]);

  // ── Bilingual content resolution ──────────────────────────────────────────
  const hasEn = !!(offer?.title_en && offer?.description_en && offer?.conditions_en);
  const hasRu = !!(offer?.title_ru && offer?.description_ru && offer?.conditions_ru);

  let renderLang: "en" | "ru" = "en";
  if (offer) {
    if (language === "en" && hasEn) renderLang = "en";
    else if (language === "ru" && hasRu) renderLang = "ru";
    else if (hasEn && hasRu) renderLang = language as "en" | "ru";
    else if (hasEn) renderLang = "en";
    else renderLang = "ru";
  }

  const showLanguageNotice = !!offer && renderLang !== language;

  const offerTitle      = renderLang === "en" ? offer?.title_en       : offer?.title_ru;
  const offerDesc       = renderLang === "en" ? offer?.description_en : offer?.description_ru;
  const offerConditions = renderLang === "en" ? offer?.conditions_en  : offer?.conditions_ru;

  const formatPrice = (cents: number) =>
    cents === 0
      ? t.free
      : new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);

  return (
    <main className="min-h-screen bg-background">
      {offerTitle && (
        <PageMeta
          titleEn={offer?.title_en ?? offerTitle}
          titleRu={offer?.title_ru ?? offerTitle}
        />
      )}
      <Header hideSwitcher={!hasEn || !hasRu} />
      <div className="pt-28 pb-16 section-padding">
        <div className="container-narrow">
          <Link
            to={langPath("/")}
            className="inline-flex items-center gap-2 font-body text-sm text-muted-foreground hover:text-foreground transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToHome}
          </Link>

          {/* Loading skeleton */}
          {loading && (
            <div className="space-y-4 mb-12">
              <div className="h-10 w-2/3 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            </div>
          )}

          {/* Offer no longer available */}
          {!loading && !available && (
            <div className="py-20 text-center space-y-4">
              <h1 className="font-display text-3xl md:text-4xl font-light text-foreground">
                {t.offerUnavailableTitle}
              </h1>
              <p className="font-body text-muted-foreground max-w-md mx-auto">
                {t.offerUnavailableMessage}
              </p>
              <Link
                to={langPath("/")}
                className="inline-flex items-center gap-2 font-body text-sm text-primary hover:text-primary/80 transition-colors mt-4"
              >
                {t.contactUs}
              </Link>
            </div>
          )}

          {/* Offer content */}
          {!loading && offer && offerTitle && offerDesc && offerConditions && (
            <>
              {/* Language-mismatch notice — shown in URL language, above the offer title */}
              {showLanguageNotice && (
                <div className="flex items-start gap-3 bg-muted/60 border border-border/60 rounded-xl px-5 py-4 mb-8">
                  <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {t.languageNotice}
                  </p>
                </div>
              )}

              {/* Bilingual toggle — only when both languages are available */}
              {hasEn && hasRu && (
                <div className="flex justify-end mb-6">
                  <Link
                    to={`/${language === "en" ? "ru" : "en"}/book/offer/${slug}`}
                    className="btn-lang-switcher"
                  >
                    <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="8" className="stroke-current" strokeWidth="1.5" />
                      <ellipse cx="10" cy="10" rx="4" ry="8" className="stroke-current" strokeWidth="1.5" />
                      <path d="M2 10h16" className="stroke-current" strokeWidth="1.5" />
                    </svg>
                    <span className="font-medium">{language === "en" ? "RU" : "EN"}</span>
                  </Link>
                </div>
              )}

              {/* Header */}
              <div className="mb-8">
                <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-3">
                  {t.bookASession}
                </p>
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4">
                  {offerTitle}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-5">
                  <span className="flex items-center gap-1.5 font-body text-sm">
                    <Clock className="w-4 h-4" />
                    {offer.duration_minutes} {language === "ru" ? "минут" : "minutes"}
                  </span>
                  <span className="font-body text-sm font-medium text-primary">
                    {formatPrice(offer.price_cents)}
                  </span>
                </div>
                <div className={PROSE}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={[...ALLOWED_MARKDOWN]}>{normalizeMd(offerDesc)}</ReactMarkdown>
                </div>
              </div>

              {/* Conditions gate */}
              <div className="card-organic p-6 mb-8 space-y-4">
                <h2 className="font-display text-xl font-light text-foreground">
                  {t.conditionsHeading}
                </h2>
                <div className={PROSE}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} allowedElements={[...ALLOWED_MARKDOWN]}>{normalizeMd(offerConditions)}</ReactMarkdown>
                </div>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <Checkbox
                    checked={conditionsAccepted}
                    onCheckedChange={(checked) => setConditionsAccepted(!!checked)}
                    className="mt-0.5 shrink-0"
                  />
                  <span className="font-body text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                    {t.conditionsCheckbox}
                  </span>
                </label>
              </div>

              {/* Booking widget */}
              {conditionsAccepted ? (
                <BookingWidget offer={offer} offerDisplayTitle={offerTitle} />
              ) : (
                <div className="card-organic p-8 flex items-center justify-center min-h-[200px]">
                  <p className="font-body text-sm text-muted-foreground text-center">
                    {t.calendarGateHint}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default BookOffer;
