/**
 * The Service node is emitted twice and must exist once.
 *
 * The build writes it into the page so a crawler that does not execute
 * JavaScript can read the offer; <ServiceJsonLd> replaces that node on mount
 * so a reader gets live data rather than a snapshot. The failure this guards
 * against is both being present: two AggregateOffers for one Service with
 * different prices is a contradiction a search engine cannot resolve.
 */

import { render, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SERVICE_NODE_ATTR,
  SERVICE_NODE_SELECTOR,
  buildServiceNode,
  renderServiceNodeTag,
} from "@/config/serviceNode";
import { ServiceJsonLd } from "@/components/JsonLd";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), langPath: (p: string) => `/en${p}` }),
}));

const priced = {
  show_price: true,
  pricing_type: "solidarity",
  min_price: 40,
  max_price: 100,
  currency: "EUR",
  duration_minutes: 50,
};
const withheld = { show_price: false, pricing_type: "fixed", price: null, currency: "EUR" };

const input = (session: Record<string, unknown> | null) => ({
  nameEn: "Individual Therapy",
  nameRu: "Индивидуальная терапия",
  descriptionEn: "EN copy",
  descriptionRu: "RU copy",
  urlPath: "/en/book/individual-therapy",
  session: session as never,
});

afterEach(() => {
  cleanup();
  document.head.querySelectorAll(SERVICE_NODE_SELECTOR).forEach((n) => n.remove());
});

describe("buildServiceNode", () => {
  it("carries the offer derived from the row", () => {
    const node = buildServiceNode(input(priced), "en");
    expect(node.offers).toMatchObject({
      "@type": "AggregateOffer",
      lowPrice: "40",
      highPrice: "100",
      priceCurrency: "EUR",
    });
  });

  it("publishes no offer when the row withholds the price", () => {
    // show_price is honoured by construction: the same derivation the visible
    // price uses decides this, so markup cannot contradict the page.
    expect(buildServiceNode(input(withheld), "en")).not.toHaveProperty("offers");
  });

  it("uses the language's own name and description", () => {
    expect(buildServiceNode(input(priced), "ru")).toMatchObject({
      name: "Индивидуальная терапия",
      description: "RU copy",
      areaServed: "Весь мир (онлайн)",
    });
  });
});

describe("the build-time tag", () => {
  it("carries the marker the runtime emitter looks for", () => {
    const tag = renderServiceNodeTag(buildServiceNode(input(priced), "en"));
    expect(tag).toContain(`${SERVICE_NODE_ATTR}="build"`);

    // The selector must actually match the tag the build writes — they are
    // two halves of one contract and drift silently otherwise.
    document.head.innerHTML = tag;
    expect(document.head.querySelector(SERVICE_NODE_SELECTOR)).not.toBeNull();
  });
});

describe("ServiceJsonLd", () => {
  it("replaces the build's node instead of appending a second one", () => {
    document.head.innerHTML = renderServiceNodeTag(buildServiceNode(input(withheld), "en"));
    expect(document.head.querySelectorAll(SERVICE_NODE_SELECTOR)).toHaveLength(1);

    render(<ServiceJsonLd {...input(priced)} />);

    const nodes = document.head.querySelectorAll(SERVICE_NODE_SELECTOR);
    expect(nodes, "a second Service node would contradict the first").toHaveLength(1);
    // And it is the live one: the build's copy said nothing about price.
    expect(JSON.parse(nodes[0].textContent ?? "{}").offers).toMatchObject({ highPrice: "100" });
    expect(nodes[0].getAttribute(SERVICE_NODE_ATTR)).toBe("runtime");
  });

  it("creates the node when there is none, as after a client-side navigation", () => {
    expect(document.head.querySelectorAll(SERVICE_NODE_SELECTOR)).toHaveLength(0);
    render(<ServiceJsonLd {...input(priced)} />);
    expect(document.head.querySelectorAll(SERVICE_NODE_SELECTOR)).toHaveLength(1);
  });

  it("takes the node with it when the page is left", () => {
    // A Service node describing a session is wrong on the homepage.
    const { unmount } = render(<ServiceJsonLd {...input(priced)} />);
    expect(document.head.querySelectorAll(SERVICE_NODE_SELECTOR)).toHaveLength(1);
    unmount();
    expect(document.head.querySelectorAll(SERVICE_NODE_SELECTOR)).toHaveLength(0);
  });

  it("renders nothing into the page body", () => {
    const { container } = render(<ServiceJsonLd {...input(priced)} />);
    expect(container.innerHTML).toBe("");
  });
});
