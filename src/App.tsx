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
  useSearchParams,
} from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Index from "./pages/Index";
import BookSession from "./pages/BookSession";
import OfferAgreement from "./pages/OfferAgreement";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminResetPassword from "./pages/AdminResetPassword";
import BookingCancelled from "./pages/BookingCancelled";
import BookOffer from "./pages/BookOffer";
import AdminOffers from "./pages/AdminOffers";
import SessionJoin from "./pages/SessionJoin";
import SessionCancel from "./pages/SessionCancel";
import Feelings from "./pages/Feelings";
import FeelingsLegacyRedirect from "./pages/FeelingsLegacyRedirect";
import TakeIndex from "./pages/TakeIndex";
import TakeItemSoon from "./pages/TakeItemSoon";
import TakeBoundary from "./components/TakeBoundary";

const queryClient = new QueryClient();

const LangLayout = ({ children }: { children: React.ReactNode }) => {
  const { lang } = useParams();

  useEffect(() => {
    if (lang === "ru" || lang === "en") {
      localStorage.setItem("lang", lang);
    }
  }, [lang]);

  return <LanguageProvider>{children}</LanguageProvider>;
};

/** /take/<slug> with no language prefix defaults to English. */
const RootTakeRedirect = () => {
  const { slug } = useParams();
  return <Navigate to={`/en/take/${slug}`} replace />;
};

// Redirect legacy ?session=<id> URLs to the dedicated book page
const SessionParamRedirect = ({ children }: { children: React.ReactNode }) => {
  const [searchParams] = useSearchParams();
  const { lang } = useParams();
  const sessionId = searchParams.get("session");
  if (sessionId) {
    const langPrefix = lang === "ru" ? "ru" : "en";
    return <Navigate to={`/${langPrefix}/book/${sessionId}`} replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TakeBoundary />
        <Routes>
          {/* Root "/" serves English directly (default language) */}
          <Route
            path="/"
            element={
              <LangLayout>
                <SessionParamRedirect>
                  <Index />
                </SessionParamRedirect>
              </LangLayout>
            }
          />

          {/* Short session links — kept language-free so the URL in an email
              and .ics stays under 60 characters. These pages resolve the
              visitor's language from localStorage instead of the path. */}
          <Route path="/s/:slug" element={<SessionJoin />} />
          <Route path="/c/:slug" element={<SessionCancel />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/offers" element={<AdminOffers />} />

          {/* Language-prefixed routes */}
          <Route
            path="/:lang"
            element={
              <LangLayout>
                <SessionParamRedirect>
                  <Index />
                </SessionParamRedirect>
              </LangLayout>
            }
          />
          <Route
            path="/:lang/book/:sessionId"
            element={
              <LangLayout>
                <BookSession />
              </LangLayout>
            }
          />
          <Route
            path="/:lang/book/offer/:slug"
            element={
              <LangLayout>
                <BookOffer />
              </LangLayout>
            }
          />
          <Route
            path="/:lang/booking-cancelled"
            element={
              <LangLayout>
                <BookingCancelled />
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

          {/* Free material. Slugs stay English and lowercase in both
              languages; only the display names are translated. */}
          <Route
            path="/:lang/take"
            element={
              <LangLayout>
                <TakeIndex />
              </LangLayout>
            }
          />
          <Route
            path="/:lang/take/feelings-map"
            element={
              <LangLayout>
                <Feelings />
              </LangLayout>
            }
          />
          <Route
            path="/:lang/take/:slug"
            element={
              <LangLayout>
                <TakeItemSoon />
              </LangLayout>
            }
          />

          {/* The map's old address. Still linked from elsewhere, so it keeps
              working — it just does not stay here. */}
          <Route
            path="/:lang/feeling"
            element={
              <LangLayout>
                <FeelingsLegacyRedirect />
              </LangLayout>
            }
          />

          {/* Root-level offer-agreement defaults to English */}
          <Route
            path="/offer-agreement"
            element={<Navigate to="/en/offer-agreement" replace />}
          />

          {/* Root-level feeling defaults to English */}
          <Route path="/feeling" element={<Navigate to="/en/feeling" replace />} />

          {/* Root-level take defaults to English */}
          <Route path="/take" element={<Navigate to="/en/take" replace />} />
          <Route path="/take/:slug" element={<RootTakeRedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
