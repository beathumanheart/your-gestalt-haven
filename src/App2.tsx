import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import OfferAgreement from "./pages/OfferAgreement";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

/** Wraps children with LanguageProvider that reads :lang from the URL. */
const LangLayout = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Default redirect to /en */}
          <Route path="/" element={<Navigate to="/en" replace />} />

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

          {/* Legacy route redirect */}
          <Route path="/offer-agreement" element={<Navigate to="/en/offer-agreement" replace />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
