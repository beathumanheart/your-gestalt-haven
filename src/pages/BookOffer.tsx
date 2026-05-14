import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWidget from "@/components/booking/BookingWidget";
import { supabase } from "@/integrations/supabase/client";
import { offersEN, offersRU } from "@/content/offers";
import type { HiddenOffer } from "@/hooks/useHiddenOffers";

const ALLOWED_MARKDOWN = ["p", "h1", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "code"] as const;

const BookOffer = () => {
  const { slug } = useParams<{ slug: string }>();
  const { language, langPath } = useLanguage();
  const navigate = useNavigate();
  const t = language === "ru" ? offersRU : offersEN;

  const [offer, setOffer] = useState<HiddenOffer | null>(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [conditionsAccepted, setConditionsAccepted] = useState(false);

  useEffect(() => {
    if (!slug) {
      setAvailable(false);
      setLoading(false);
      return;
    }
    supabase
      .from("hidden_offers")
      .select("*")
      .eq("slug", slug)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setAvailable(false);
        } else {
          setOffer(data as HiddenOffer);
        }
        setLoading(false);
      });
  }, [slug]);

  // Redirect to the offer's own language URL if it doesn't match the current one.
  // Keep loading state until redirect completes to avoid a flash of wrong-language content.
  useEffect(() => {
    if (!offer) return;
    if (offer.language !== language) {
      navigate(`/${offer.language}/book/offer/${slug}`, { replace: true });
    }
  }, [offer, language, slug, navigate]);

  const shouldRedirect = offer !== null && offer.language !== language;

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return t.free;
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(priceCents / 100);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
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
          {(loading || shouldRedirect) && (
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
          {!loading && !shouldRedirect && offer && (
            <>
              {/* Header */}
              <div className="mb-8">
                <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-3">
                  {t.bookASession}
                </p>
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4">
                  {offer.title}
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
                <div className="prose prose-sm font-body text-muted-foreground max-w-2xl
                  prose-headings:font-display prose-headings:font-light prose-headings:text-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown
                    allowedElements={[...ALLOWED_MARKDOWN]}
                  >
                    {offer.description}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Conditions gate */}
              <div className="card-organic p-6 mb-8 space-y-4">
                <h2 className="font-display text-xl font-light text-foreground">
                  {t.conditionsHeading}
                </h2>
                <div className="prose prose-sm font-body text-muted-foreground
                  prose-headings:font-display prose-headings:font-light prose-headings:text-foreground
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-foreground prose-code:text-foreground prose-code:bg-muted prose-code:px-1 prose-code:rounded">
                  <ReactMarkdown
                    allowedElements={[...ALLOWED_MARKDOWN]}
                  >
                    {offer.conditions}
                  </ReactMarkdown>
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

              {/* Booking widget — shown and enabled only after conditions accepted */}
              {conditionsAccepted ? (
                <BookingWidget offer={offer} />
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
