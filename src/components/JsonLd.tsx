import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { PricedSession } from "@/lib/pricing";
import {
  SERVICE_NODE_ATTR,
  SERVICE_NODE_SELECTOR,
  buildServiceNode,
} from "@/config/serviceNode";

interface ServiceJsonLdProps {
  nameEn: string;
  nameRu: string;
  descriptionEn: string;
  descriptionRu: string;
  /** Path to the bookable page, e.g. "/en/book/gestalt-individual" */
  urlPath: string;
  /** The session_types row, for pricing and duration. */
  session?: PricedSession & { duration_minutes?: number | null };
}

/**
 * Keeps the page's Service node current.
 *
 * The build writes this node into the page already (render.ts), so a crawler
 * that does not execute JavaScript can read it. That copy is a snapshot: it
 * says whatever the database said at the last deploy, and after #67 it can be
 * a day stale. This component replaces it on mount with live data, so a reader
 * and a rendering crawler see the real figure.
 *
 * ⚠️ It **replaces**, never appends, and that is the whole point. Two
 * AggregateOffers for one Service with different prices is a contradiction a
 * search engine cannot resolve — worse than one stale offer. Do not reinstate
 * Helmet here: Helmet appends its own tag and cannot take over the build's.
 *
 * Nor should this component be deleted when build-time emission exists.
 * Removing it would trade crawler freshness for human staleness, freezing the
 * figure at deploy time for everyone.
 */
export const ServiceJsonLd = ({
  nameEn,
  nameRu,
  descriptionEn,
  descriptionRu,
  urlPath,
  session,
}: ServiceJsonLdProps) => {
  const { language } = useLanguage();
  const node = JSON.stringify(
    buildServiceNode(
      { nameEn, nameRu, descriptionEn, descriptionRu, urlPath, session },
      language === "ru" ? "ru" : "en",
    ),
  );

  useEffect(() => {
    // Adopt the build's node if it is there, otherwise create one — a
    // client-side navigation into this page has no build-time node, because
    // only the entry document carried one.
    let script = document.head.querySelector<HTMLScriptElement>(SERVICE_NODE_SELECTOR);
    const created = !script;

    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute(SERVICE_NODE_ATTR, "runtime");
      document.head.appendChild(script);
    } else {
      script.setAttribute(SERVICE_NODE_ATTR, "runtime");
    }

    script.textContent = node;

    return () => {
      // Leaving the page takes the node with it: a Service node describing a
      // session is wrong on the homepage, and worse on a different session.
      // Removing the build's node too is correct — by then the document is no
      // longer the one it was written for.
      script?.remove();
      void created;
    };
  }, [node]);

  return null;
};
