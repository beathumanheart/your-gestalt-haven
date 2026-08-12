import type { Language } from "@/contexts/LanguageContext";

/**
 * The short-link pages (/s/<slug>, /c/<slug>) sit outside the /:lang routes —
 * the link has to stay under 60 characters and survive being pasted anywhere —
 * so they read the language the visitor last chose rather than a route param.
 */
export function resolveLanguage(): Language {
  try {
    return localStorage.getItem("lang") === "ru" ? "ru" : "en";
  } catch {
    return "en";
  }
}

/** The browser's live timezone, falling back to whatever was stored at booking. */
export function viewerTimezone(fallback?: string | null): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || fallback || "UTC";
  } catch {
    return fallback || "UTC";
  }
}

export function formatSessionTime(
  iso: string,
  timeZone: string,
  language: Language
): { time: string; date: string; tzLabel: string } {
  const d = new Date(iso);
  const locale = language === "ru" ? "ru-RU" : "en-GB";
  const city = timeZone.split("/").pop()?.replace(/_/g, " ") || timeZone;

  let tzLabel = city;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(d);
    let offset = parts.find((p) => p.type === "timeZoneName")?.value || "";
    if (offset === "GMT") offset = "GMT+0";
    tzLabel = offset ? `${city}, ${offset}` : city;
  } catch {
    /* keep the city name */
  }

  return {
    time: d.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }),
    date: d.toLocaleDateString(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone,
    }),
    tzLabel,
  };
}

/** "1h 04m" / "12m 30s" — coarse above an hour, precise near the end. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  if (minutes > 0) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  return `${seconds}s`;
}

/**
 * supabase-js turns a non-2xx into a thrown FunctionsHttpError. Depending on
 * version the body is either on `context` (a Response) or serialised into
 * `message`, so try both rather than depending on one shape.
 */
export async function parseFunctionError(
  err: unknown
): Promise<{ state?: string; code?: string }> {
  if (!err || typeof err !== "object") return {};

  const context = (err as { context?: unknown }).context;
  if (context && typeof (context as Response).json === "function") {
    try {
      const body = await (context as Response).clone().json();
      return { state: body?.state, code: body?.error?.code };
    } catch {
      /* fall through to the message */
    }
  }

  try {
    const body = JSON.parse((err as { message?: string }).message ?? "");
    return { state: body?.state, code: body?.error?.code };
  } catch {
    return {};
  }
}
