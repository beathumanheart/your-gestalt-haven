import { useState } from "react";
import { Clock, ChevronDown, Link, Check } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import type { Language } from "@/contexts/LanguageContext";

export interface SessionType {
  id: string;
  name: string;
  name_ru?: string | null;
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
  t: BookingContent;
  language: Language;
  onSelect: (st: SessionType, index: number) => void;
  getShareUrl?: (id: string) => string;
}

const DescriptionBlock = ({ text, language }: { text: string; language: Language }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n").filter(Boolean);
  const isLong = lines.length > 1 || text.length > 100;
  const moreLabel = language === "ru" ? "Подробнее" : "More";
  const lessLabel = language === "ru" ? "Свернуть" : "Less";

  if (!isLong) {
    return (
      <p className="font-body text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{text}</p>
    );
  }

  return (
    <div className="mt-2">
      <div
        className={`font-body text-sm text-muted-foreground whitespace-pre-wrap transition-all duration-300 overflow-hidden ${
          expanded ? "" : "line-clamp-2"
        }`}
      >
        {text}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded(!expanded);
        }}
        className="flex items-center gap-1 mt-1 font-body text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
        {expanded ? lessLabel : moreLabel}
      </button>
    </div>
  );
};

const SessionTypeSelector = ({ sessionTypes, loading, selected, t, language, onSelect, getShareUrl }: Props) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const getName = (st: SessionType) => (language === "ru" && st.name_ru) ? st.name_ru : st.name;
  const getDescription = (st: SessionType) => (language === "ru" && st.description_ru) ? st.description_ru : st.description;

  const handleCopyLink = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
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

  return (
    <div className="space-y-4">
      <p className="font-body text-muted-foreground mb-6">{t.selectSession}</p>
      <div className="grid gap-3">
        {sessionTypes.map((st, index) => (
          <button
            key={st.id}
            onClick={() => onSelect(st, index)}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
              selected === st.id
                ? "border-primary bg-primary/5 shadow-soft"
                : "border-border hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 flex items-center gap-2">
                <h3 className="font-display text-lg font-medium text-foreground">{getName(st)}</h3>
                {getShareUrl && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => handleCopyLink(e, st.id)}
                    onKeyDown={(e) => e.key === "Enter" && handleCopyLink(e as unknown as React.MouseEvent, st.id)}
                    title={language === "ru" ? "Скопировать ссылку" : "Copy link"}
                    className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {copiedId === st.id
                      ? <Check className="w-3.5 h-3.5 text-primary" />
                      : <Link className="w-3.5 h-3.5" />
                    }
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 ml-4">
                <span className="flex items-center gap-1 font-body text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {st.duration_minutes} {t.minutes}
                </span>
                {st.show_price && st.pricing_type === 'solidarity' && st.min_price != null && st.max_price != null && (
                  <span className="font-body text-sm font-medium text-primary">
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: st.currency || 'USD', maximumFractionDigits: 0 }).format(st.min_price)}
                    {' – '}
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: st.currency || 'USD', maximumFractionDigits: 0 }).format(st.max_price)}
                    <span className="text-xs text-muted-foreground ml-1">(sliding scale)</span>
                  </span>
                )}
                {st.show_price && st.pricing_type !== 'solidarity' && st.price != null && (
                  <span className="font-body text-sm font-medium text-foreground">
                    {new Intl.NumberFormat(undefined, { style: 'currency', currency: st.currency || 'USD' }).format(st.price)}
                  </span>
                )}
              </div>
            </div>
            {getDescription(st) && <DescriptionBlock text={getDescription(st)} language={language} />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SessionTypeSelector;
