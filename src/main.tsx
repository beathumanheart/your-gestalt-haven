import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
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

console.log('PostHog key debug:', JSON.stringify(posthogKey), 'length:', posthogKey?.length);
posthog.init(posthogKey, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
  autocapture: true,
  capture_performance: true,
  capture_pageleave: true,
  session_recording: {
    maskAllInputs: true,
  },
});

createRoot(document.getElementById("root")!).render(
  <PostHogProvider client={posthog}>
    <App />
  </PostHogProvider>
);
