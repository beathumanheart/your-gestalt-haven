/**
 * Whether the booking calendar is live.
 *
 * Off. The reason is clinical rather than technical: a calendar lets someone
 * become a client without a conversation, and how a person makes first contact
 * is itself information. The field's own guidance agrees — booking is for a
 * free intro consultation, not for paid clinical work. In its place the three
 * session types are service pages that end with an invitation to write.
 *
 * **Nothing is deleted.** The wizard, `process-booking`, the .ics builder, the
 * JaaS short links and the payment fields all stay, behind this flag. The
 * intro consultation may come back, and when it does this is a config change
 * rather than a rebuild — which is why `bookingFlag.test.tsx` exercises the
 * flag in *both* states. A flag tested in one state only rots.
 *
 * Off means *not rendered*, not "rendered and disabled": a calendar that
 * cannot take a booking is worse than no calendar.
 *
 * ## What this gates
 *
 *   - the three-step wizard in the homepage #contact section
 *   - the date/time picker and submit path on the service pages
 *   - the booking-creation calls to `process-booking` from the front end
 *   - the label on the header, hero and worksheet CTAs
 *
 * ## What it must not touch
 *
 * Each of these has a guard, because each is a thing someone would plausibly
 * tidy away while removing "the booking feature":
 *
 *   - `publishedScale()` and the homepage scale — that is the pricing display,
 *     not a booking feature, and with the calendar gone it is more
 *     load-bearing, not less
 *   - `pricingToOffer()` / the AggregateOffer in the built HTML — earned in
 *     #68; crawlers read it
 *   - the `Service` JSON-LD and the `data-service-node` adoption
 *   - the `/:lang/s/:slug` and `/:lang/c/:slug` short links — dormant, not
 *     dead, and still the only way into an existing session's video room
 *   - the `process-booking` deployment in the workflow — this flag is
 *     front-end only, and the function still serves join and cancel
 *   - `get_booked_slots()` and the `session_types` table — the scale reads
 *     from it
 *
 * The admin dashboard is also unaffected: it manages bookings through the same
 * edge function, and an admin needs that whether or not the public calendar is
 * open.
 */
export const BOOKING_ENABLED = false;
