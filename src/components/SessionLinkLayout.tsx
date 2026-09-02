import { ReactNode } from "react";
import { Helmet } from "react-helmet-async";

import { resolveLanguage } from "@/lib/sessionLink";

interface SessionLinkLayoutProps {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
}

/**
 * Shared chrome for the short-link pages (/s/<slug>, /c/<slug>).
 *
 * These routes sit outside the /:lang tree so the URL stays short, which means
 * no LanguageProvider — the head tags are rendered directly from the language
 * the visitor last chose. Always noindex: these URLs are capability tokens.
 */
const SessionLinkLayout = ({ icon, title, children }: SessionLinkLayoutProps) => {
  const language = resolveLanguage();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <Helmet>
        <html lang={language} />
        <title>
          {language === "ru"
            ? "Ваша сессия | Human Heart"
            : "Your Session | Human Heart"}
        </title>
        {/* Belt and braces. robots.txt disallows /s/ and /c/ outright, which is
            the directive that survives a crawler not running JS; this tag only
            helps for one that does. */}
        <meta name="robots" content="noindex,nofollow,noarchive" />
        {/* The URL path is a capability token and this page redirects to a
            third party. Modern browsers already default to
            strict-origin-when-cross-origin, so the path is not sent — say so
            explicitly for anything older. */}
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <div className="max-w-md w-full text-center space-y-6">
        {icon}
        <h1 className="font-display text-3xl font-light text-foreground">{title}</h1>
        {children}
      </div>
    </div>
  );
};

export default SessionLinkLayout;
