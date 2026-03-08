import { useState, useMemo, useRef, useEffect } from "react";
import { Globe, ChevronDown, Search } from "lucide-react";
import { formatTimezone } from "./DateTimeSelector";

interface Props {
  value: string;
  onChange: (tz: string) => void;
}

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Brussels",
  "Europe/Vienna",
  "Europe/Warsaw",
  "Europe/Moscow",
  "Europe/Istanbul",
  "Europe/Kiev",
  "Europe/Helsinki",
  "Europe/Athens",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Africa/Lagos",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Hong_Kong",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Perth",
  "Pacific/Auckland",
];

function getAllTimezones(): string[] {
  try {
    return (Intl as any).supportedValuesOf("timeZone") as string[];
  } catch {
    return COMMON_TIMEZONES;
  }
}

const TimezoneSelector = ({ value, onChange }: Props) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allTimezones = useMemo(() => getAllTimezones(), []);

  const filtered = useMemo(() => {
    if (!search.trim()) return COMMON_TIMEZONES;
    const q = search.toLowerCase();
    return allTimezones.filter(
      (tz) =>
        tz.toLowerCase().includes(q) ||
        formatTimezone(tz).toLowerCase().includes(q)
    );
  }, [search, allTimezones]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs font-body text-muted-foreground hover:text-foreground transition-colors rounded-lg border border-border px-3 py-2 w-full sm:w-auto"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate">{formatTimezone(value)}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezone..."
              className="flex-1 text-xs font-body bg-transparent outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-3">No results</p>
            )}
            {filtered.map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => {
                  onChange(tz);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 text-xs font-body transition-colors hover:bg-accent ${
                  tz === value ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
              >
                {formatTimezone(tz)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimezoneSelector;
