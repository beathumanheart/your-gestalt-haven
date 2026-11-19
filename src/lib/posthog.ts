/**
 * The PostHog client. Import it from here, never from "posthog-js".
 *
 * Between 1.374.2 and 1.453.0 the default "posthog-js" entry came to bundle every product — session
 * replay, surveys, error tracking, product tours, conversations — eagerly:
 * 389 KB minified at 1.453.0, against 195 KB at 1.374.2. It all landed in the
 * homepage's entry chunk and pushed it over the budget in
 * e2e/bundle-splitting.spec.ts. The slim build ships the core only; the
 * features this site uses are passed in as `__extensionClasses` from
 * src/config/analytics.ts.
 *
 * A side effect worth keeping: replay and surveys are not in the bundle at
 * all, so switching them on in the PostHog UI cannot start them — the
 * `disable_session_recording` pin in siteConfig is no longer the only thing
 * standing between the booking form's textarea and a recording.
 *
 * The paths are deep imports because posthog-js documents "posthog-js/slim"
 * and "posthog-js/extensions" but does not publish them (no `exports` map, and
 * neither directory is in its `files` list as of 1.453.0).
 */
import posthog from "posthog-js/dist/module.slim";

export default posthog;
