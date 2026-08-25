import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isTakePath } from "@/config/analytics";

/**
 * Turns a client-side navigation across the /take/ boundary into a real page
 * load.
 *
 * PostHog is configured once, at init, from the entry path: the free material
 * runs with `persistence: "memory"` and no autocapture, the marketing site runs
 * with the configuration it has always had. Persistence cannot be switched
 * after init — cookies written on the marketing site would already be on the
 * device — so an in-app route change from `/` to `/take/feelings-map` would
 * quietly break the claim that those routes write nothing. A hard navigation
 * re-inits with the correct configuration in both directions.
 *
 * The cost is one full load when crossing the boundary, which happens at most
 * a couple of times in a visit.
 */
const TakeBoundary = () => {
  const { pathname } = useLocation();
  const bootedInTake = useRef(isTakePath(window.location.pathname));

  useEffect(() => {
    if (isTakePath(pathname) === bootedInTake.current) return;
    window.location.assign(pathname + window.location.search);
  }, [pathname]);

  return null;
};

export default TakeBoundary;
