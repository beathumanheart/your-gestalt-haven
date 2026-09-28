/**
 * ScrollToTop's branches, unit-tested because a browser cannot fail them.
 *
 * Two of its three rules are invisible to e2e in Chromium: the browser
 * restores scroll on POP *after* this effect would run, so removing the POP
 * exemption changes nothing observable there, and the homepage's own hash
 * handler makes the anchor land correctly whether or not this component helps.
 * A test that cannot fail is not a guard (docs/writing-guards.md), so the
 * rules are asserted here against what the component actually calls, and
 * e2e/scroll-restoration.spec.ts covers only what a browser can really show.
 *
 * Each assertion below was made to fail by deleting the branch it names.
 */

import { render, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ScrollToTop from "@/components/ScrollToTop";

const location = vi.hoisted(() => ({ current: { pathname: "/en", hash: "" } }));
const navType = vi.hoisted(() => ({ current: "PUSH" }));

vi.mock("react-router-dom", () => ({
  useLocation: () => location.current,
  useNavigationType: () => navType.current,
}));

const scrollTo = vi.fn();
const scrollIntoView = vi.fn();

beforeEach(() => {
  scrollTo.mockReset();
  scrollIntoView.mockReset();
  window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView = scrollIntoView;
  location.current = { pathname: "/en", hash: "" };
  navType.current = "PUSH";
  document.body.innerHTML = "";
});
afterEach(cleanup);

/** Renders once at `from`, then re-renders at `to` — one navigation. */
const navigate = (
  from: { pathname: string; hash?: string },
  to: { pathname: string; hash?: string },
  type = "PUSH",
) => {
  location.current = { pathname: from.pathname, hash: from.hash ?? "" };
  const view = render(<ScrollToTop />);
  scrollTo.mockClear();
  scrollIntoView.mockClear();

  location.current = { pathname: to.pathname, hash: to.hash ?? "" };
  navType.current = type;
  view.rerender(<ScrollToTop />);
};

describe("a route change", () => {
  it("goes to the top", () => {
    navigate({ pathname: "/en" }, { pathname: "/en/letter" });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("goes there instantly, not smoothly", () => {
    // An animated jump on every navigation is noise, and it fights
    // prefers-reduced-motion.
    navigate({ pathname: "/en" }, { pathname: "/en/letter" });
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    expect(scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ behavior: "smooth" }));
  });
});

describe("back and forward", () => {
  it("is left to the browser, which restores the reader's position", () => {
    navigate({ pathname: "/en/letter" }, { pathname: "/en" }, "POP");

    expect(scrollTo, "scrolled on POP, overriding the browser's restore").not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("is left alone even when the popped entry carries a hash", () => {
    navigate({ pathname: "/en/letter" }, { pathname: "/en", hash: "#contact" }, "POP");
    expect(scrollTo).not.toHaveBeenCalled();
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});

describe("a hash", () => {
  it("carried across a route change scrolls to the element, not the top", () => {
    // The header's booking button is langPath("/#contact") from every
    // sub-page. Sending it to the top would break it.
    const el = document.createElement("div");
    el.id = "contact";
    document.body.appendChild(el);

    navigate({ pathname: "/en/letter" }, { pathname: "/en", hash: "#contact" });

    expect(scrollIntoView).toHaveBeenCalled();
    expect(scrollTo, "went to the top instead of the anchor").not.toHaveBeenCalled();
  });

  it("on the page the reader is already on is left to that page's own handler", () => {
    // Index.tsx has scrolled the homepage's anchors smoothly since long before
    // this component. Taking the job over would make every one of them jump.
    const el = document.createElement("div");
    el.id = "contact";
    document.body.appendChild(el);

    navigate({ pathname: "/en" }, { pathname: "/en", hash: "#contact" });

    expect(scrollIntoView, "took over an in-page anchor").not.toHaveBeenCalled();
    expect(scrollTo, "sent an in-page anchor to the top").not.toHaveBeenCalled();
  });

  it("whose element has not rendered yet is retried once on the next frame", async () => {
    // Routes are lazy: on a first visit the target does not exist when the
    // effect runs.
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});

    navigate({ pathname: "/en/letter" }, { pathname: "/en", hash: "#contact" });
    expect(scrollIntoView, "the element does not exist yet").not.toHaveBeenCalled();
    expect(frames, "no retry scheduled, so a first visit never reaches the anchor").toHaveLength(1);

    const late = document.createElement("div");
    late.id = "contact";
    document.body.appendChild(late);
    frames[0](0);

    expect(scrollIntoView).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
