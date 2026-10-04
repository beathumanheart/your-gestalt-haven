import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronRight, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWidget from "@/components/booking/BookingWidget";
import GetInTouch from "@/components/contact/GetInTouch";
import SolidarityScale from "@/components/SolidarityScale";
import { supabase } from "@/integrations/supabase/client";
import type { SessionType } from "@/components/booking/SessionTypeSelector";
import PageMeta from "@/components/PageMeta";
import { bookingRouteText } from "@/config/pageMetadata";
import { ServiceJsonLd } from "@/components/JsonLd";
import { BOOKING_ENABLED } from "@/config/booking";
import { servicePageEN, servicePageRU } from "@/content/servicePage";

/**
 * A service page for one session type — the same route, component and URL as
 * the old booking page.
 *
 * The six `/:lang/book/:slug` paths keep their paths deliberately. They are
 * six of the URLs in the sitemap, on a domain Google only began indexing
 * recently, and this is a static host with no server-side redirects: renaming
 * them to `/sessions/` would mean either six 404s or six redirect stubs. A URL
 * is an identifier, not a promise.
 *
 * With `BOOKING_ENABLED` off the page ends with an invitation to write. With
 * it on, the picker returns above that invitation and the invitation drops to
 * a secondary line. Both states render, and both are tested — a flag only ever
 * exercised in one state rots, and turning booking back on would become a
 * rebuild rather than a config change.
 */
const BookSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { language, langPath } = useLanguage();
  const c = language === "ru" ? servicePageRU : servicePageEN;
  const [session, setSession] = useState<SessionType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!sessionId) { setNotFound(true); setLoading(false); return; }
    // Try slug first, then fall back to UUID for backward compatibility
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
    const query = supabase
      .from("session_types")
      .select("*")
      .eq("is_active", true);

    if (isUuid) {
      query.eq("id", sessionId);
    } else {
      query.eq("slug", sessionId);
    }

    query.single().then(({ data, error }) => {
      if (error || !data) setNotFound(true);
      else setSession(data as unknown as SessionType);
      setLoading(false);
    });
  }, [sessionId]);

  const name = session
    ? (language === "ru" && session.name_ru) ? session.name_ru : session.name
    : "";
  const description = session
    ? (language === "ru" && session.description_ru) ? session.description_ru : session.description
    : null;

  // Same builder the build step uses to write this page's static file, so the
  // head a crawler is served and the head React renders cannot disagree.
  const meta = bookingRouteText(session);

  return (
    <main className="min-h-screen bg-background">
      <PageMeta
        {...meta}
        canonicalPath={session ? `/${language}/book/${session.slug ?? sessionId}` : undefined}
      />
      {session && (
        <ServiceJsonLd
          nameEn={session.name}
          nameRu={session.name_ru || session.name}
          descriptionEn={session.description || ""}
          descriptionRu={session.description_ru || session.description || ""}
          urlPath={`/${language}/book/${session.slug ?? sessionId}`}
          session={session}
        />
      )}
      <Header />
      <div className="pt-28 pb-16 section-padding">
        <div className="container-narrow">
          {/* Breadcrumb, not a back-link: this page is one of a set, and
              saying so is more use than an arrow pointing home. */}
          <nav aria-label={c.breadcrumbLabel} className="mb-10">
            <ol className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
              <li>
                <Link
                  to={langPath("/#services")}
                  className="hover:text-foreground transition-colors"
                >
                  {c.breadcrumbServices}
                </Link>
              </li>
              {session && (
                <>
                  <li aria-hidden="true">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </li>
                  <li className="text-foreground" aria-current="page">
                    {name}
                  </li>
                </>
              )}
            </ol>
          </nav>

          {loading && (
            <div className="space-y-4 mb-12">
              <div className="h-10 w-2/3 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            </div>
          )}

          {notFound && !loading && (
            <p className="font-body text-muted-foreground text-center py-20">
              {c.notFound}
            </p>
          )}

          {session && (
            <>
              <header className="mb-10">
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4">
                  {name}
                </h1>
                <p className="flex items-center gap-1.5 font-body text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {session.duration_minutes} {c.minutes}
                </p>
              </header>

              {/* The session's own description, as prose in a text column
                  rather than a card blurb — this is the page's reading
                  matter, not a label on a tile. */}
              {description && (
                <div className="mb-12 max-w-[62ch]">
                  <p className="font-body text-[17px] text-foreground/85 whitespace-pre-wrap leading-[1.8]">
                    {description}
                  </p>
                </div>
              )}

              {/* The scale, and the terms it sits under. Neither is gated:
                  with the calendar off this is where the price is stated. */}
              <SolidarityScale />
              <p
                data-testid="terms-line"
                className="font-body text-[13.5px] text-muted-foreground mt-3.5 mb-12"
              >
                {c.termsLead}{" "}
                <Link
                  to={langPath("/offer-agreement")}
                  className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
                >
                  {c.termsLinkText}
                </Link>
                {c.termsTail}
              </p>

              {BOOKING_ENABLED ? (
                <>
                  <BookingWidget initialSessionId={session.id} />
                  {/* Secondary: the picker is the way in, this is the
                      alternative for someone who would rather write. */}
                  <div className="mt-8">
                    <GetInTouch compact />
                  </div>
                </>
              ) : (
                <GetInTouch />
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default BookSession;
