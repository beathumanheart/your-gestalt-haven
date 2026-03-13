import { useState } from "react";
import { Clock, ChevronDown } from "lucide-react";
import type { BookingContent } from "@/content/booking";
import type { Language } from "@/contexts/LanguageContext";

interface Props {
  sessionTypes: any[];
  loading: boolean;
  selected?: string;
  t: BookingContent;
  language: Language;
  onSelect: (st: any) => void;
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

const SessionTypeSelector = ({ sessionTypes, loading, selected, t, language, onSelect }: Props) => {
  const getName = (st: any) => (language === "ru" && st.name_ru) ? st.name_ru : st.name;
  const getDescription = (st: any) => (language === "ru" && st.description_ru) ? st.description_ru : st.description;
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
        {sessionTypes.map((st) => (
          <button
            key={st.id}
            onClick={() => onSelect(st)}
            className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-300 ${
              selected === st.id
                ? "border-primary bg-primary/5 shadow-soft"
                : "border-border hover:border-primary/40 hover:bg-muted/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-display text-lg font-medium text-foreground">{getName(st)}</h3>
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
