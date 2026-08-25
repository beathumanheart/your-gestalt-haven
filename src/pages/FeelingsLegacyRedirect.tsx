import { Navigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { SITE_URL } from "@/components/PageMeta";

/**
 * /:lang/feeling moved to /:lang/take/feelings-map.
 *
 * GitHub Pages cannot issue a 301, so this is a client-side replace plus a
 * canonical pointing at the new path — which is all a JS-executing crawler
 * needs. A crawler that does not run JS sees only index.html's site-level tags;
 * that gap closes when the /take/* pages are prerendered.
 *
 * The old URL keeps working: it may already be linked from elsewhere.
 */
const FeelingsLegacyRedirect = () => {
  const { lang } = useParams();
  const l = lang === "ru" ? "ru" : "en";
  const to = `/${l}/take/feelings-map`;

  return (
    <>
      <Helmet>
        <link rel="canonical" href={`${SITE_URL}${to}`} />
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <Navigate to={to} replace />
    </>
  );
};

export default FeelingsLegacyRedirect;
