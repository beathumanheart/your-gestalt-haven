import type { PostHogConfig } from "posthog-js";

/**
 * Two PostHog configurations, chosen once per page load by path.
 *
 * The free material under /take/* counts page opens and nothing else. That is
 * only true if `persistence: "memory"` holds — nothing is written to the
 * device, so those routes need no consent banner. A single posthog-js instance
 * has a single persistence mode, so the two configurations cannot coexist in
 * one page load; `TakeBoundary` turns a client-side navigation across the
 * /take/ boundary into a real page load so the right one always applies.
 */

/** True for /take, /take/..., /en/take/..., /ru/take/... */
export const isTakePath = (pathname: string): boolean =>
  /^\/(?:en\/|ru\/)?take(?:\/|$)/.test(pathname);

/**
 * Every flag is written out. posthog-js ships a `defaults` option that switches
 * capture behaviours on by date, so an unset flag is not a safe assumption
 * about what this page does.
 *
 * `capture_pageview: "history_change"` (posthog-js >= 1.235; installed 1.374.2)
 * fires the initial $pageview and one more per History API path change, so each
 * /take/* route entry is counted exactly once. Plain `true` would fire only on
 * the initial load and leave every /take/* page indistinguishable in the data.
 */
export const takeConfig: Partial<PostHogConfig> = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
  persistence: "memory",
  autocapture: false,
  capture_pageview: "history_change",
  capture_pageleave: false,
  disable_session_recording: true,
  disable_surveys: true,
  rageclick: false,
  capture_performance: false,
  capture_dead_clicks: false,
  person_profiles: "never",
  /* Not in the brief, but the brief's own reasoning requires it: without this,
     PostHog fetches project-level remote config at load and switches
     behaviours back on from the server — measured here pulling in
     dead-clicks-autocapture.js despite capture_dead_clicks: false. Disabling
     it makes the block above authoritative and drops the extra request.
     /take/* uses no feature flags and no surveys, so nothing is lost. */
  advanced_disable_flags: true,
};

/**
 * The marketing site's configuration.
 *
 * Unlike takeConfig, this does not write out every flag, so PostHog's
 * project-level remote config governs whatever is left unset — that is what
 * pulls in dead-clicks-autocapture.js here. Anything that must not depend on
 * a setting in the PostHog UI has to be stated below.
 */
export const siteConfig: Partial<PostHogConfig> = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com",
  autocapture: true,
  capture_performance: true,
  capture_pageleave: true,
  cross_subdomain_cookie: false,
  /* The site runs no surveys, and leaving this unset had posthog-js fetch
     surveys.js on every page load — 102 KB measured, for a feature nothing
     uses. */
  disable_surveys: true,
  /* Only takes effect if session replay is running at all, which is a project
     setting rather than a code one: no recorder.js is fetched today, on the
     production key. If replay is ever switched on in the PostHog UI it starts
     without a deploy, and this flag is then the only thing masking the
     enquiry textarea on the booking form. */
  session_recording: {
    maskAllInputs: true,
  },
};
