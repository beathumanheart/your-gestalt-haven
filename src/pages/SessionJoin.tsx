import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Clock, Loader2, Video, XCircle } from "lucide-react";

import SessionLinkLayout from "@/components/SessionLinkLayout";
import { sessionLinkEN, sessionLinkRU } from "@/content/sessionLink";
import { supabase } from "@/integrations/supabase/client";
import {
  formatCountdown,
  formatSessionTime,
  parseFunctionError,
  resolveLanguage,
  viewerTimezone,
} from "@/lib/sessionLink";

type ViewState =
  | "loading"
  | "open"
  | "early"
  | "expired"
  | "cancelled"
  | "not_found"
  | "rate_limited"
  | "error";

interface JoinResponse {
  state?: string;
  joinUrl?: string;
  startsAtIso?: string;
  timezone?: string;
  msUntilOpen?: number;
}

const SessionJoin = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const language = resolveLanguage();
  const t = language === "ru" ? sessionLinkRU : sessionLinkEN;

  const [view, setView] = useState<ViewState>("loading");
  const [joinUrl, setJoinUrl] = useState<string | null>(null);
  const [startsAtIso, setStartsAtIso] = useState<string | null>(null);
  const [timezone, setTimezone] = useState<string>(() => viewerTimezone());
  const [remainingMs, setRemainingMs] = useState<number>(0);

  const redirected = useRef(false);

  const check = useCallback(async () => {
    setView("loading");
    try {
      const { data, error } = await supabase.functions.invoke<JoinResponse>(
        "process-booking",
        { body: { action: "join", slug } }
      );
      if (error) throw error;

      const state = data?.state;
      if (state === "open" && data?.joinUrl) {
        setJoinUrl(data.joinUrl);
        setView("open");
        if (!redirected.current) {
          redirected.current = true;
          window.location.replace(data.joinUrl);
        }
        return;
      }

      if (data?.startsAtIso) setStartsAtIso(data.startsAtIso);
      if (data?.timezone) setTimezone(viewerTimezone(data.timezone));
      setRemainingMs(data?.msUntilOpen ?? 0);

      if (state === "early" || state === "expired" || state === "cancelled") {
        setView(state);
      } else {
        setView("not_found");
      }
    } catch (err) {
      const { state, code } = await parseFunctionError(err);
      if (state === "not_found") setView("not_found");
      else if (code === "RATE_LIMITED") setView("rate_limited");
      else setView("error");
    }
  }, [slug]);

  useEffect(() => {
    void check();
  }, [check]);

  // Tick down while waiting, and re-check the moment the window opens so a
  // client who arrived early is let straight in without touching anything.
  useEffect(() => {
    if (view !== "early" || !startsAtIso) return;

    const opensAt = new Date(startsAtIso).getTime() - 15 * 60 * 1000;
    const tick = () => {
      const left = opensAt - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= 0) void check();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [view, startsAtIso, check]);

  const homeLinks = (
    <div className="flex flex-col gap-3 pt-4">
      <a href={`/${language}/`} className="btn-primary py-3 text-sm">
        {t.bookAnother}
      </a>
    </div>
  );

  switch (view) {
    case "loading":
      return (
        <SessionLinkLayout
          icon={<Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />}
          title={t.checking}
        >
          <span className="sr-only">{t.checking}</span>
        </SessionLinkLayout>
      );

    case "open":
      return (
        <SessionLinkLayout
          icon={<Video className="w-16 h-16 text-primary mx-auto" />}
          title={t.openingTitle}
        >
          <p className="font-body text-muted-foreground">{t.openingText}</p>
          {joinUrl && (
            <div className="flex flex-col gap-3 pt-4">
              <a href={joinUrl} className="btn-primary py-3 text-sm">
                {t.openManually}
              </a>
            </div>
          )}
        </SessionLinkLayout>
      );

    case "early": {
      const when = startsAtIso
        ? formatSessionTime(startsAtIso, timezone, language)
        : null;
      return (
        <SessionLinkLayout
          icon={<Clock className="w-16 h-16 text-primary mx-auto" />}
          title={t.earlyTitle}
        >
          {when && (
            <p className="font-body text-foreground">
              {t.earlyText(when.time, when.tzLabel)}
            </p>
          )}
          {when && <p className="font-body text-sm text-muted-foreground">{when.date}</p>}
          <p className="font-body text-muted-foreground">{t.earlySub}</p>
          <p className="font-body text-sm text-muted-foreground" aria-live="polite">
            {t.earlyCountdown(formatCountdown(remainingMs))}
          </p>
        </SessionLinkLayout>
      );
    }

    case "expired":
      return (
        <SessionLinkLayout
          icon={<Clock className="w-16 h-16 text-muted-foreground mx-auto" />}
          title={t.expiredTitle}
        >
          <p className="font-body text-muted-foreground">{t.expiredText}</p>
          {homeLinks}
        </SessionLinkLayout>
      );

    case "cancelled":
      return (
        <SessionLinkLayout
          icon={<XCircle className="w-16 h-16 text-destructive mx-auto" />}
          title={t.cancelledTitle}
        >
          <p className="font-body text-muted-foreground">{t.cancelledText}</p>
          {homeLinks}
        </SessionLinkLayout>
      );

    case "rate_limited":
      return (
        <SessionLinkLayout
          icon={<Clock className="w-16 h-16 text-muted-foreground mx-auto" />}
          title={t.tooManyTitle}
        >
          <p className="font-body text-muted-foreground">{t.tooManyText}</p>
        </SessionLinkLayout>
      );

    case "not_found":
      return (
        <SessionLinkLayout
          icon={<XCircle className="w-16 h-16 text-muted-foreground mx-auto" />}
          title={t.notFoundTitle}
        >
          <p className="font-body text-muted-foreground">{t.notFoundText}</p>
          {homeLinks}
        </SessionLinkLayout>
      );

    default:
      return (
        <SessionLinkLayout
          icon={<XCircle className="w-16 h-16 text-destructive mx-auto" />}
          title={t.errorTitle}
        >
          <p className="font-body text-muted-foreground">{t.errorText}</p>
          <div className="flex flex-col gap-3 pt-4">
            <button onClick={() => void check()} className="btn-primary py-3 text-sm">
              {t.retry}
            </button>
          </div>
        </SessionLinkLayout>
      );
  }
};

export default SessionJoin;
