/**
 * ============================================================
 * THE ROUTE LIST — WHAT GETS A FILE AND A SITEMAP ENTRY
 * ============================================================
 * Pure: route shapes in, route list out. No Supabase client, no filesystem,
 * no Vite.
 *
 * Separate from plugin.ts for the same reason render.ts is: so the unit tests
 * can assemble the list from fixture rows. plugin.ts imports
 * @supabase/supabase-js to *fetch* the rows, and that import alone fails under
 * jsdom ("new TextEncoder().encode(\"\") instanceof Uint8Array" is incorrectly
 * false), so a guard that reached through the plugin could not run at all.
 *
 * `staticSite.test.ts` asserts on the six /book/:slug routes here — their
 * count, their priority and their alternates — without needing the database
 * reachable. A guard that depends on Supabase is a guard that passes when
 * Supabase is down.
 * ============================================================
 */

import {
  BOOKING_CHANGEFREQ,
  BOOKING_PRIORITY,
  STATIC_ROUTES,
  bookingRouteText,
  type BookingMetaSource,
  type RouteText,
} from "../../src/config/pageMetadata";
import type { SitemapRoute } from "./render";

export interface GeneratedRoute extends SitemapRoute {
  text: RouteText;
  /** Present for booking routes: the row their Service node is built from. */
  session?: SessionRow;
}

/**
 * The pricing columns come along because the page's Service node carries the
 * offer derived from them. They are read, never interpreted, here —
 * `sessionPricing` decides what a row publishes, so `show_price: false` keeps
 * a withheld price out of the markup by construction.
 */
export type SessionRow = BookingMetaSource & {
  slug: string | null;
  show_price?: boolean | null;
  pricing_type?: string | null;
  price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  currency?: string | null;
  duration_minutes?: number | null;
};

/**
 * The full route list: the static ones, plus one per active session row.
 *
 * Exported for `staticSite.test.ts`, which needs to assert that the six
 * `/book/:slug` routes reach the sitemap at their priority **without** a
 * database — a guard that depends on Supabase being reachable is a guard that
 * passes when it is not.
 */
export const collectRoutes = (sessions: SessionRow[]): GeneratedRoute[] => [
  // `langs` is pulled out with the rest of the route's own fields so it does
  // not end up inside `text`, which is only the head's words.
  ...STATIC_ROUTES.map(({ path: routePath, priority, changefreq, langs, ...text }) => ({
    path: routePath,
    priority,
    changefreq,
    langs,
    text,
  })),
  ...sessions.map((session) => ({
    path: `/book/${session.slug}`,
    priority: BOOKING_PRIORITY,
    changefreq: BOOKING_CHANGEFREQ,
    text: bookingRouteText(session),
    session,
  })),
];

