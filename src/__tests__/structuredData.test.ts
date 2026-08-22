import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { staticPersonNode, staticServiceNode } from "@/config/identity";
import { sessionPricing, pricingToOffer } from "@/lib/pricing";

const repoFile = (p: string) => readFileSync(resolve(__dirname, "../..", p), "utf8");

describe("no hardcoded prices in structured data", () => {
  // A price literal committed next to the markup is a price nothing keeps in
  // step with the database. Both files must stay free of them.
  it("index.html carries no price figure or currency code", () => {
    const html = repoFile("index.html");
    expect(html).not.toMatch(/lowPrice|highPrice|"price"/);
    expect(html).not.toMatch(/\b(EUR|USD|GBP)\b/);
  });

  it("JsonLd.tsx hardcodes no price or currency", () => {
    const src = repoFile("src/components/JsonLd.tsx");
    expect(src).not.toMatch(/priceCurrency:\s*["']/);
    expect(src).not.toMatch(/\b(EUR|USD|GBP)\b/);
  });

  it("the site-wide service node publishes no offer at all", () => {
    expect(staticServiceNode()).not.toHaveProperty("offers");
  });
});

describe("credentials are only claimed when formally awarded", () => {
  const person = staticPersonNode();
  const credentialNames = person.hasCredential.map((c) => c.name);
  const alumniNames = person.alumniOf.map((a) => a.name);

  it("encodes the three awarded qualifications", () => {
    expect(credentialNames).toEqual([
      "Diploma in Psychological Counselling",
      "MSc in Bioethics",
      "MA in Philosophy",
    ]);
  });

  it("does not encode EAGT — voluntary alignment, not membership", () => {
    const json = JSON.stringify(person);
    expect(json).not.toMatch(/EAGT|European Association for Gestalt/i);
    expect(person).not.toHaveProperty("memberOf");
  });

  it("does not encode in-progress training as completed study", () => {
    // alumniOf asserts completion just as hasCredential does.
    const json = JSON.stringify(person);
    expect(json).not.toMatch(/International Institute of Gestalt|mig\.institute/i);
    expect(alumniNames).toEqual(["KU Leuven", "University of Tartu"]);
  });

  it("keeps jobTitle exactly as chosen", () => {
    expect(person.jobTitle).toBe("Gestalt Counsellor");
  });
});

describe("only properties that are in the type's domain", () => {
  // Checked against schema.org's own definitions, not from memory.
  it("keeps provider and serviceType off ProfessionalService", () => {
    const svc = staticServiceNode();
    expect(svc).not.toHaveProperty("provider");
    expect(svc).not.toHaveProperty("serviceType");
  });

  it("joins the graph from the Person side instead", () => {
    expect(staticPersonNode().worksFor).toEqual({ "@id": "https://humanheart.life/#service" });
  });

  it("keeps inLanguage off the Service node", () => {
    // Property syntax only — the file explains in prose why it is absent.
    expect(repoFile("src/components/JsonLd.tsx")).not.toMatch(/^\s*inLanguage\s*:/m);
  });

  it("puts session duration on the offer, where additionalProperty is valid", () => {
    const offer = pricingToOffer(sessionPricing({ show_price: true, pricing_type: "fixed", price: 60 }), 50);
    expect(offer?.additionalProperty).toMatchObject({ "@type": "PropertyValue", value: 50, unitCode: "MIN" });
  });
});

describe("offers follow the price the page shows", () => {
  const base = { pricing_type: "fixed", price: 60, currency: "EUR", show_price: true };

  it("emits nothing when show_price is false", () => {
    expect(pricingToOffer(sessionPricing({ ...base, show_price: false }))).toBeUndefined();
  });

  it("emits a priced Offer for a fixed session", () => {
    expect(pricingToOffer(sessionPricing(base))).toMatchObject({
      "@type": "Offer",
      price: "60",
      priceCurrency: "EUR",
    });
  });

  it("emits a bounded AggregateOffer for a solidarity session", () => {
    const offer = pricingToOffer(
      sessionPricing({ show_price: true, pricing_type: "solidarity", min_price: 40, max_price: 80, currency: "EUR" }),
    );
    expect(offer).toMatchObject({ "@type": "AggregateOffer", lowPrice: "40", highPrice: "80" });
  });

  it("emits nothing for a solidarity session missing a bound", () => {
    expect(
      pricingToOffer(sessionPricing({ show_price: true, pricing_type: "solidarity", min_price: 40, max_price: null })),
    ).toBeUndefined();
  });

  it("never emits a priceless Offer", () => {
    expect(pricingToOffer(sessionPricing({ show_price: true, pricing_type: "fixed", price: null }))).toBeUndefined();
  });
});
