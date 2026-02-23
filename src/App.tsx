import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import OfferAgreement from "./pages/OfferAgreement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/**
 * Wraps children with LanguageProvider that reads :lang from the URL.
 * Also stores language choice.
 */
const LangLayout = ({ children }: { children: React.ReactNode }) => {
  const { lang } = useParams();

  useEffect(() => {
    if (lang === "ru" || lang === "en") {
      localStorage.setItem("lang", lang);
    }
  }, [lang]);

  return <LanguageProvider>{children}</LanguageProvider>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Root "/" serves English directly (default language) */}
          <Route
            path="/"
            element={
              <LangLayout>
                <Index />
              </LangLayout>
            }
          />

          {/* Language-prefixed routes */}
          <Route
            path="/:lang"
            element={
              <LangLayout>
                <Index />
              </LangLayout>
            }
          />
          <Route
            path="/:lang/offer-agreement"
            element={
              <LangLayout>
                <OfferAgreement />
              </LangLayout>
            }
          />

          {/* Root-level offer-agreement defaults to English */}
          <Route
            path="/offer-agreement"
            element={<Navigate to="/en/offer-agreement" replace />}
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
