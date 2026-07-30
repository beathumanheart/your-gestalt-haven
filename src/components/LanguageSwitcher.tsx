import { useLanguage, type Language } from "@/contexts/LanguageContext";

const LANGS: { code: Language; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
];

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 p-1 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm font-body text-[13px]"
    >
      {LANGS.map(({ code, label }) => {
        const active = language === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLanguage(code)}
            aria-pressed={active}
            aria-label={code === "ru" ? "Русский" : "English"}
            className={
              active
                ? "px-3 py-[5px] rounded-full bg-background text-foreground font-medium shadow-[0_1px_3px_hsl(var(--foreground)/0.08)]"
                : "px-3 py-[5px] rounded-full text-muted-foreground hover:bg-secondary/60 hover:text-foreground transition-colors cursor-pointer"
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
