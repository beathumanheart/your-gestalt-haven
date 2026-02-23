import { createContext, useContext, ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";

export type Language = "en" | "ru";

const VALID_LANGS: Language[] = ["en", "ru"];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** Returns the path with the current language prefix. */
  langPath: (path: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();

  // If no lang param or invalid lang, default to English (root "/" = English)
  const language: Language = lang && VALID_LANGS.includes(lang as Language)
    ? (lang as Language)
    : "en";

  const setLanguage = (newLang: Language) => {
    const currentPath = window.location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/(en|ru)/, "");
    // English at root "/" is also valid, but we use /en for explicit prefix
    navigate(`/${newLang}${pathWithoutLang || ""}`);
  };

  // For root English, links can omit prefix; for Russian, always prefix
  const langPath = (path: string) => {
    if (language === "en") return `/en${path}`;
    return `/${language}${path}`;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, langPath }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
