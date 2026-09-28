import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Puts a route change at the top of the new page.
 *
 * React Router does not reset scroll on navigation and the browser keeps the
 * previous offset, so following a link from the foot of a long page landed the
 * reader part-way down the next one — near its footer, which reads as a broken
 * page rather than a new one. Every route-to-route link had this, and always
 * had: the footer's "Offer Agreement" as much as the letter.
 *
 * Lazy routes hid it. The Suspense fallback is `null`, so a cold chunk leaves
 * the document with no height for a moment and the browser clamps scroll to 0
 * by accident. The bug therefore appeared on the *second* visit to a route and
 * not the first, which is worth knowing before concluding it is fixed —
 * e2e/scroll-restoration.spec.ts warms each route before measuring for exactly
 * this reason.
 *
 * Three things it deliberately does not do:
 *
 * - **It does not touch POP.** Back and forward are the browser restoring
 *   where the reader was, and overriding that is worse than the bug being
 *   fixed. (Chromium happens to restore after this effect runs, so the
 *   exemption is belt and braces there — but not every engine does, and a
 *   jump-then-restore flicker is not worth the risk.)
 * - **It does not take over an in-page anchor.** When only the hash changes
 *   and the route does not, the reader is moving within the page they are on;
 *   Index.tsx has scrolled those smoothly since long before this component,
 *   and stealing the job would silently make every homepage anchor jump.
 * - **It does not scroll smoothly.** A page change is not movement within a
 *   page: an animated jump on every navigation is noise, and it fights
 *   prefers-reduced-motion.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();
  const previousPathname = useRef<string | null>(null);

  useEffect(() => {
    const cameFrom = previousPathname.current;
    previousPathname.current = pathname;

    if (navigationType === "POP") return;

    // Same route, different hash: an in-page anchor, not a navigation.
    if (cameFrom === pathname) return;

    if (!hash) {
      window.scrollTo(0, 0);
      return;
    }

    /*
     * A hash carried across a route change — langPath("/#contact"), which the
     * header's booking button uses from every sub-page. It names an element,
     * so sending it to the top would be wrong.
     */
    const id = hash.slice(1);
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView();
      return;
    }

    /*
     * Routes are lazy, so on the first visit to a hashed URL the element does
     * not exist yet when this runs. One frame is enough for the chunk's markup
     * to be committed; a polling loop would keep fighting the reader if the id
     * never appears at all.
     */
    const frame = requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView();
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash, navigationType]);

  return null;
};

export default ScrollToTop;
