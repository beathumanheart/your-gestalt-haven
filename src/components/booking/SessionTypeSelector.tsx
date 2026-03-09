import { Clock } from "lucide-react";
import type { BookingContent } from "@/content/booking";

interface Props {
  sessionTypes: any[];
  loading: boolean;
  selected?: string;
  t: BookingContent;
  onSelect: (st: any) => void;
}

const SessionTypeSelector = ({ sessionTypes, loading, selected, t, onSelect }: Props) => {
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
                <h3 className="font-display text-lg font-medium text-foreground">{st.name}</h3>
                {st.description && (
                  <p className="font-body text-sm text-muted-foreground mt-1">{st.description}</p>
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
          </button>
        ))}
      </div>
    </div>
  );
};

export default SessionTypeSelector;
