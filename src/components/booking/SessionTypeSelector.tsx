import { useEffect, useRef, useState } from "react";
import { Clock, ChevronDown, Link, Check } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import type { Language } from "@/contexts/LanguageContext";
import { sessionPricing } from "@/lib/pricing";

export interface SessionType {
  id: string;
  name: string;
  name_ru?: string | null;
  slug?: string;
  description?: string | null;
  description_ru?: string | null;
  duration_minutes: number;
  price?: number | null;
  show_price?: boolean;
  pricing_type?: string;
  min_price?: number | null;
  max_price?: number | null;
  currency?: string;
  show_second_email?: boolean;
}

interface Props {
  sessionTypes: SessionType[];
  loading: boolean;
  selected?: string;
  expandedId?: string;
  t: BookingContent;
  language: Language;
  onSelect: (st: SessionType, index: number) => void;
  getShareUrl?: (id: string) => string;
}

/** A description is worth collapsing only if it would take more than a couple of lines. */
function isLongDescription(text: string): boolean {
  return text.split("\n").filter(Boolean).length > 1 || text.length > 100;
}

const SessionTypeSelector = ({
  sessionTypes,
  loading,
  selected,
  expandedId,
  t,
  language,
  onSelect,
  getShareUrl,
}: Props) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Only one description is open at a time, so opening one collapses the others
  // and the list's total height stays roughly constant. Held here rather than
  // inside each card precisely so the cards can see each other.
  const [openId, setOpenId] = useState<string | null>(expandedId ?? null);
  useEffect(() => {
    if (expandedId) setOpenId(expandedId);
  }, [expandedId]);

  // Roving tabindex: the radiogroup is one tab stop, arrows move within it.
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusIndex = (index: number) => {
    const target = sessionTypes[(index + sessionTypes.length) % sessionTypes.length];
    if (!target) return;
    const el = cardRefs.current[target.id];
    el?.focus();
    onSelect(target, sessionTypes.indexOf(target));
  };

  const getName = (st: SessionType) => (language === "ru" && st.name_ru ? st.name_ru : st.name);
  const getDescription = (st: SessionType) =>
    language === "ru" && st.description_ru ? st.description_ru : st.description;

  const handleCopyLink = async (id: string) => {
    if (!getShareUrl) return;
    try {
      await navigator.clipboard.writeText(getShareUrl(id));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback: do nothing silently
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <p className="font-body text-muted-foreground">{t.selectSession}</p>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (sessionTypes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="font-body text-muted-foreground">No session types available.</p>
      </div>
    );
  }

  const moreLabel = language === "ru" ? "Подробнее" : "More";
  const lessLabel = language === "ru" ? "Свернуть" : "Less";
  const copyLabel = language === "ru" ? "Скопировать ссылку" : "Copy link";

  // The first card carries the tab stop when nothing is selected yet.
  const tabStopId = selected ?? sessionTypes[0]?.id;

  return (
    <div className="space-y-4">
      <p id="session-type-label" className="font-body text-muted-foreground mb-6">
        {t.selectSession}
      </p>
      <div className="grid gap-3" role="radiogroup" aria-labelledby="session-type-label">
        {sessionTypes.map((st, index) => {
          const description = getDescription(st);
          const expandable = !!description && isLongDescription(description);
          const isOpen = openId === st.id;
          const isSelected = selected === st.id;

          return (
            <div
              key={st.id}
              ref={(el) => { cardRefs.current[st.id] = el; }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={st.id === tabStopId ? 0 : -1}
              onClick={() => onSelect(st, index)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  onSelect(st, index);
                } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
                  e.preventDefault();
                  focusIndex(index + 1);
                } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
                  e.preventDefault();
                  focusIndex(index - 1);
                }
              }}
              className={`w-full text-left p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border hover:border-primary/40 hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-center gap-2">
                  <h3 className="font-display text-lg font-medium text-foreground">{getName(st)}</h3>
                  {getShareUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(st.id);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                      title={copyLabel}
                      aria-label={copyLabel}
                      className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-primary transition-colors"
                    >
                      {copiedId === st.id ? (
                        <Check className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Link className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-4">
                  <span className="flex items-center gap-1 font-body text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {st.duration_minutes} {t.minutes}
                  </span>
                  {(() => {
                    // Shared with the JSON-LD offer so the two cannot disagree.
                    const pricing = sessionPricing(st);
                    if (pricing.kind === "range") {
                      const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: pricing.currency, maximumFractionDigits: 0 });
                      return (
                        <span className="font-body text-sm font-medium text-primary">
                          {fmt.format(pricing.min)}
                          {" – "}
                          {fmt.format(pricing.max)}
                          <span className="text-xs text-muted-foreground ml-1">(sliding scale)</span>
                        </span>
                      );
                    }
                    if (pricing.kind === "fixed") {
                      return (
                        <span className="font-body text-sm font-medium text-foreground">
                          {new Intl.NumberFormat(undefined, { style: "currency", currency: pricing.currency }).format(pricing.price)}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {description && !expandable && (
                <p className="font-body text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                  {description}
                </p>
              )}

              {description && expandable && (
                <div className="mt-2">
                  <div
                    id={`session-desc-${st.id}`}
                    className={`font-body text-sm text-muted-foreground whitespace-pre-wrap transition-all duration-300 overflow-hidden ${
                      isOpen ? "" : "line-clamp-2"
                    }`}
                  >
                    {description}
                  </div>
                  {/* Expanding is deliberately separate from selecting: people need
                      to read two descriptions before choosing between them. */}
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`session-desc-${st.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenId(isOpen ? null : st.id);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 mt-1 font-body text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    <ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                    {isOpen ? lessLabel : moreLabel}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionTypeSelector;
