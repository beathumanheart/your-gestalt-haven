import { Suspense, lazy, useEffect } from "react";
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
import TakeBoundary from "./components/TakeBoundary";

/**
 * The homepage is the only route loaded eagerly.
 *
 * It is what "/" and "/:lang" serve, so it is needed on the first paint of
 * almost every visit, and splitting it would only add a round trip.
 * Everything else is behind a dynamic import, because it all used to ship in
 * one chunk: a prospective client downloaded the admin dashboard, the offers
 * editor, the availability manager and the 143 KB feelings-map dataset before
 * they could read the front page.
 */
import Index from "./pages/Index";

// Free material. The feelings map is the largest single route in the app —
// its dataset alone is 143 KB of source.
const Feelings = lazy(() => import("./pages/Feelings"));
const TakeIndex = lazy(() => import("./pages/TakeIndex"));
const TakeItemSoon = lazy(() => import("./pages/TakeItemSoon"));
const TakeAutomaticYes = lazy(() => import("./pages/TakeAutomaticYes"));
const Privacy = lazy(() => import("./pages/Privacy"));
const FeelingsLegacyRedirect = lazy(() => import("./pages/FeelingsLegacyRedirect"));

// Booking. Reached by a deliberate click; a visitor who never books never
// needs the widget or the availability queries behind it.
const BookSession = lazy(() => import("./pages/BookSession"));
const BookOffer = lazy(() => import("./pages/BookOffer"));
const BookingCancelled = lazy(() => import("./pages/BookingCancelled"));
const OfferAgreement = lazy(() => import("./pages/OfferAgreement"));

// Short session links: one visitor, once, from an email.
const SessionJoin = lazy(() => import("./pages/SessionJoin"));
const SessionCancel = lazy(() => import("./pages/SessionCancel"));

// Admin. One person, and never a client.
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminResetPassword = lazy(() => import("./pages/AdminResetPassword"));
const AdminOffers = lazy(() => import("./pages/AdminOffers"));

const NotFound = lazy(() => import("./pages/NotFound"));

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
        {/* One boundary around every route rather than one per route: the
            homepage is not lazy, so it never suspends, and a route resolving
            its chunk is the only thing this can be waiting for. The fallback
            is deliberately empty — a spinner that shows for 120 ms reads as a
            flicker, and the route markup replaces it either way. */}
        <Suspense fallback={null}>
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
              path="/:lang/privacy"
              element={
                <LangLayout>
                  <Privacy />
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
            {/* Before /:lang/take/:slug, which would otherwise match this
                slug and render the "not written yet" placeholder. */}
            <Route
              path="/:lang/take/automatic-yes"
              element={
                <LangLayout>
                  <TakeAutomaticYes />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
