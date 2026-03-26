import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostHogProvider } from "@posthog/react";

// Mock posthog-js so no real network requests happen
vi.mock("posthog-js", () => ({
  default: {
    capture: vi.fn(),
    init: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    has_opted_in_capturing: vi.fn(() => false),
    has_opted_out_capturing: vi.fn(() => false),
    get_distinct_id: vi.fn(() => "test-id"),
    _loaded: true,
    __loaded: true,
    config: {},
    persistence: { props: {} },
  },
}));

import posthog from "posthog-js";

describe("PostHogProvider", () => {
  it("renders children without crashing", () => {
    render(
      <PostHogProvider client={posthog}>
        <div data-testid="child">Hello</div>
      </PostHogProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("renders multiple children without crashing", () => {
    render(
      <PostHogProvider client={posthog}>
        <div data-testid="child-1">First</div>
        <div data-testid="child-2">Second</div>
      </PostHogProvider>
    );
    expect(screen.getByTestId("child-1")).toBeInTheDocument();
    expect(screen.getByTestId("child-2")).toBeInTheDocument();
  });

  it("renders text content correctly", () => {
    render(
      <PostHogProvider client={posthog}>
        <p>Gestalt Therapy</p>
      </PostHogProvider>
    );
    expect(screen.getByText("Gestalt Therapy")).toBeInTheDocument();
  });
});
