import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import { HelmetProvider } from "react-helmet-async";
import { isTakePath, siteConfig, takeConfig } from "./config/analytics";
import App from "./App.tsx";
import "./index.css";

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
if (!posthogKey) {
  // In production this means the secret was missing from the CI build env.
  // Check: repo Settings → Secrets → POSTHOG_KEY_PRODUCTION, and that
  // deploy-production.yml (not static.yml / deploy.yml) is the active workflow.
  const msg = "[PostHog] VITE_PUBLIC_POSTHOG_KEY is not set — analytics will not fire.";
  if (import.meta.env.PROD) {
    console.error(msg);
  } else {
    console.warn(msg);
  }
}

/* The free material under /take/* counts page opens and nothing else, and
   writes nothing to the device. Which configuration applies is decided here,
   from the entry path; TakeBoundary keeps a client-side navigation from
   crossing between the two inside one page load. */
posthog.init(
  posthogKey,
  isTakePath(window.location.pathname) ? takeConfig : siteConfig,
);

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </HelmetProvider>
);
