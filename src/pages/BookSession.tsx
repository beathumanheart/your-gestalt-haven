import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BookingWidget from "@/components/booking/BookingWidget";
import { supabase } from "@/integrations/supabase/client";
import type { SessionType } from "@/components/booking/SessionTypeSelector";

const BookSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { language, langPath } = useLanguage();
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

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: session?.currency || "EUR",
      maximumFractionDigits: 0,
    }).format(value);

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
            {language === "ru" ? "На главную" : "Back to home"}
          </Link>

          {loading && (
            <div className="space-y-4 mb-12">
              <div className="h-10 w-2/3 rounded-lg bg-muted animate-pulse" />
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded bg-muted animate-pulse" />
            </div>
          )}

          {notFound && !loading && (
            <p className="font-body text-muted-foreground text-center py-20">
              {language === "ru" ? "Сессия не найдена." : "Session not found."}
            </p>
          )}

          {session && (
            <>
              <div className="mb-10">
                <p className="font-body text-sm uppercase tracking-[0.2em] text-primary mb-3">
                  {language === "ru" ? "Бронирование" : "Book a session"}
                </p>
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground mb-4">
                  {name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-5">
                  <span className="flex items-center gap-1.5 font-body text-sm">
                    <Clock className="w-4 h-4" />
                    {session.duration_minutes}{" "}
                    {language === "ru" ? "минут" : "minutes"}
                  </span>
                  {session.show_price &&
                    session.pricing_type === "solidarity" &&
                    session.min_price != null &&
                    session.max_price != null && (
                      <span className="font-body text-sm font-medium text-primary">
                        {formatPrice(session.min_price)} – {formatPrice(session.max_price)}
                        <span className="text-xs text-muted-foreground ml-1">
                          ({language === "ru" ? "солидарная шкала" : "sliding scale"})
                        </span>
                      </span>
                    )}
                  {session.show_price &&
                    session.pricing_type !== "solidarity" &&
                    session.price != null && (
                      <span className="font-body text-sm font-medium text-foreground">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: session.currency || "EUR",
                        }).format(session.price)}
                      </span>
                    )}
                </div>
                {description && (
                  <p className="font-body text-muted-foreground max-w-2xl whitespace-pre-wrap leading-relaxed">
                    {description}
                  </p>
                )}
              </div>

              <BookingWidget initialSessionId={sessionId} />
            </>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
};

export default BookSession;
