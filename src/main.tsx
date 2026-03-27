import { createRoot } from "react-dom/client";
import posthog from "posthog-js";
import { PostHogProvider } from "@posthog/react";
import App from "./App.tsx";
import "./index.css";

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_KEY, {
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
