import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

/**
 * The slider draws the database's scale, or nothing.
 *
 * Asserted through the rendered output rather than by reading the source, and
 * both directions are covered: a published scale must appear with the right
 * bounds, and an unpublished one must leave the block out entirely rather than
 * falling back to a figure written in the component.
 */

const mockRows = vi.hoisted(() => ({ current: [] as unknown[] }));

vi.mock("@/hooks/useAvailability", () => ({
  useSessionTypes: () => ({ sessionTypes: mockRows.current, loading: false }),
}));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), langPath: (p: string) => `/en${p}` }),
}));

import Services from "./Services";
import { servicesEN } from "@/content/services";

const solidarity = (min: number, max: number, currency = "EUR") => ({
  show_price: true,
  pricing_type: "solidarity",
  min_price: min,
  max_price: max,
  currency,
});

describe("the solidarity slider", () => {
  it("does not render while the rows publish no scale", () => {
    mockRows.current = [{ show_price: false, pricing_type: "fixed", price: null, currency: "EUR" }];
    render(<Services />);

    expect(screen.queryByRole("slider")).toBeNull();
    // and the block's heading goes with it, rather than leaving an empty card
    expect(screen.queryByText(servicesEN.pricingLabel)).toBeNull();
  });

  it("draws the bounds the rows publish", () => {
    mockRows.current = [solidarity(40, 100)];
    render(<Services />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "40");
    expect(slider).toHaveAttribute("max", "100");
    expect(screen.getByText(servicesEN.pricingLabel)).toBeInTheDocument();
  });

  it("starts at the bottom of the scale, not the middle", () => {
    mockRows.current = [solidarity(40, 100)];
    render(<Services />);

    expect(screen.getByRole("slider")).toHaveValue("40");
    // The first figure a reader sees is the one that asks least of them.
    expect(screen.getAllByText("€40").length).toBeGreaterThan(0);
  });

  it("follows the rows if the scale changes, with no code edit", () => {
    mockRows.current = [solidarity(30, 120)];
    render(<Services />);

    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("min", "30");
    expect(slider).toHaveAttribute("max", "120");
    expect(slider).toHaveValue("30");
  });

  it("shows the currency the rows state, not a hardcoded symbol", () => {
    mockRows.current = [solidarity(40, 100, "USD")];
    render(<Services />);

    expect(screen.queryByText("€40")).toBeNull();
    expect(screen.getAllByText(/\$40/).length).toBeGreaterThan(0);
  });
});
