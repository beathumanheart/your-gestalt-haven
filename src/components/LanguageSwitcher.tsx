import { useLanguage } from "@/contexts/LanguageContext";

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const targetLang = language === "en" ? "ru" : "en";

  const toggleLanguage = () => {
    setLanguage(targetLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-accent/10 transition-all text-sm font-body text-muted-foreground hover:text-foreground"
      aria-label={`Switch to ${targetLang === "ru" ? "Russian" : "English"}`}
    >
      <svg 
        viewBox="0 0 20 20" 
        className="w-4 h-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="8" className="stroke-current" strokeWidth="1.5" />
        <ellipse cx="10" cy="10" rx="4" ry="8" className="stroke-current" strokeWidth="1.5" />
        <path d="M2 10h16" className="stroke-current" strokeWidth="1.5" />
      </svg>
      <span className="font-medium">{targetLang.toUpperCase()}</span>
    </button>
  );
};

export default LanguageSwitcher;
