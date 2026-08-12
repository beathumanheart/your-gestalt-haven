import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react";

import SessionLinkLayout from "@/components/SessionLinkLayout";
import { sessionLinkEN, sessionLinkRU } from "@/content/sessionLink";
import { supabase } from "@/integrations/supabase/client";
import {
  formatSessionTime,
  parseFunctionError,
  resolveLanguage,
  viewerTimezone,
} from "@/lib/sessionLink";

type ViewState =
  | "loading"
  | "confirm"
  | "cancelling"
  | "done"
  | "already_cancelled"
  | "not_found"
  | "rate_limited"
  | "error";

interface CancelDetails {
  sessionName?: string;
  startsAtIso?: string;
  timezone?: string;
  status?: string;
}

const SessionCancel = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const language = resolveLanguage();
  const t = language === "ru" ? sessionLinkRU : sessionLinkEN;

  const [view, setView] = useState<ViewState>("loading");
  const [details, setDetails] = useState<CancelDetails>({});

  const load = useCallback(async () => {
    setView("loading");
    try {
      const { data, error } = await supabase.functions.invoke<CancelDetails>(
        "process-booking",
        { body: { action: "cancel_details", slug } }
      );
      if (error) throw error;
      setDetails(data ?? {});
      setView(data?.status === "cancelled" ? "already_cancelled" : "confirm");
    } catch (err) {
      const { code } = await parseFunctionError(err);
      if (code === "NOT_FOUND") setView("not_found");
      else if (code === "RATE_LIMITED") setView("rate_limited");
      else setView("error");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  // Cancelling is a POST behind an explicit click: mail clients and link
  // scanners prefetch GET URLs, which would silently cancel bookings.
  const confirmCancel = async () => {
    setView("cancelling");
    try {
      const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string }>(
        "process-booking",
        { body: { action: "cancel_by_slug", slug } }
      );
      if (error) throw error;
      if (data?.success) setView("done");
      else if (data?.error === "Already cancelled") setView("already_cancelled");
      else setView("error");
    } catch (err) {
      const { code } = await parseFunctionError(err);
      if (code === "RATE_LIMITED") setView("rate_limited");
      else setView("error");
    }
  };

  const homeLink = (
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

    case "confirm": {
      const when = details.startsAtIso
        ? formatSessionTime(
            details.startsAtIso,
            viewerTimezone(details.timezone),
            language
          )
        : null;
      return (
        <SessionLinkLayout
          icon={<AlertTriangle className="w-16 h-16 text-destructive mx-auto" />}
          title={t.cancelTitle}
        >
          <p className="font-body text-muted-foreground">{t.cancelIntro}</p>
          <div className="card-organic p-5 text-left space-y-1">
            <p className="font-body text-foreground font-medium">
              {details.sessionName}
            </p>
            {when && (
              <p className="font-body text-sm text-muted-foreground">
                {when.date} · {when.time} ({when.tzLabel})
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={confirmCancel}
              className="font-body text-sm text-destructive underline underline-offset-4 py-2"
            >
              {t.cancelConfirm}
            </button>
            <a href={`/${language}/`} className="btn-primary py-3 text-sm">
              {t.cancelKeep}
            </a>
          </div>
        </SessionLinkLayout>
      );
    }

    case "cancelling":
      return (
        <SessionLinkLayout
          icon={<Loader2 className="w-10 h-10 text-primary mx-auto animate-spin" />}
          title={t.cancelling}
        >
          <span className="sr-only">{t.cancelling}</span>
        </SessionLinkLayout>
      );

    case "done":
      return (
        <SessionLinkLayout
          icon={<CheckCircle className="w-16 h-16 text-primary mx-auto" />}
          title={t.cancelledDoneTitle}
        >
          <p className="font-body text-muted-foreground">{t.cancelledDoneText}</p>
          {homeLink}
        </SessionLinkLayout>
      );

    case "already_cancelled":
      return (
        <SessionLinkLayout
          icon={<CheckCircle className="w-16 h-16 text-muted-foreground mx-auto" />}
          title={t.alreadyCancelledTitle}
        >
          <p className="font-body text-muted-foreground">{t.alreadyCancelledText}</p>
          {homeLink}
        </SessionLinkLayout>
      );

    case "not_found":
      return (
        <SessionLinkLayout
          icon={<XCircle className="w-16 h-16 text-muted-foreground mx-auto" />}
          title={t.notFoundTitle}
        >
          <p className="font-body text-muted-foreground">{t.notFoundText}</p>
          {homeLink}
        </SessionLinkLayout>
      );

    case "rate_limited":
      return (
        <SessionLinkLayout
          icon={<XCircle className="w-16 h-16 text-muted-foreground mx-auto" />}
          title={t.tooManyTitle}
        >
          <p className="font-body text-muted-foreground">{t.tooManyText}</p>
        </SessionLinkLayout>
      );

    default:
      return (
        <SessionLinkLayout
          icon={<XCircle className="w-16 h-16 text-destructive mx-auto" />}
          title={t.cancelErrorTitle}
        >
          <p className="font-body text-muted-foreground">{t.cancelErrorText}</p>
          <div className="flex flex-col gap-3 pt-4">
            <button onClick={() => void load()} className="btn-primary py-3 text-sm">
              {t.retry}
            </button>
          </div>
        </SessionLinkLayout>
      );
  }
};

export default SessionCancel;
