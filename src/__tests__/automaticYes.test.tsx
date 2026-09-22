/**
 * The worksheet: what it must never do, and what it must always offer.
 *
 * Two properties carry most of the weight here, and both are about a page
 * where people write about not being able to say no:
 *
 *   nothing is written to the device unless the reader asks
 *   nothing is sent to analytics, ever
 *
 * The rest is reachability — every box has a name a screen reader can read.
 */

import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import AutomaticYes from "@/components/automatic-yes/AutomaticYes";
import { STORAGE_KEY } from "@/components/automatic-yes/useWorksheetAnswers";
import TakeAutomaticYes from "@/pages/TakeAutomaticYes";
import { automaticYesEN } from "@/content/automaticYes";

vi.mock("posthog-js", () => ({ default: { capture: vi.fn() } }));

const mockLanguage = vi.hoisted(() => ({ current: "en" }));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    language: mockLanguage.current,
    setLanguage: vi.fn(),
    langPath: (p: string) => `/${mockLanguage.current}${p === "/" ? "" : p}`,
  }),
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  mockLanguage.current = "en";
  window.localStorage.clear();
  vi.restoreAllMocks();
});
afterEach(cleanup);

const renderSheet = () => render(<AutomaticYes />);

describe("every box can be named", () => {
  it("gives each textbox an accessible name", () => {
    renderSheet();
    const boxes = screen.getAllByRole("textbox");

    expect(boxes.length, "no textboxes rendered — this check would be vacuous").toBeGreaterThan(20);
    const unnamed = boxes.filter(
      (box) => !(box.getAttribute("aria-label") || box.getAttribute("aria-labelledby") || box.id),
    );
    expect(unnamed, `${unnamed.length} textboxes have no name`).toHaveLength(0);
  });

  it("labels the body outline for anyone who cannot use it", () => {
    renderSheet();
    // The textarea beside it is the route that always works; the drawing is
    // an extra way in, so it is labelled rather than silent.
    expect(screen.getByRole("img", { name: automaticYesEN.worksheetUi.figureLabel })).toBeTruthy();
  });
});

describe("analytics never sees the answers", () => {
  it("carries both no-capture markers on the worksheet root", () => {
    const { container } = renderSheet();
    const root = container.querySelector(".ay") as HTMLElement;

    expect(root, "no worksheet root found").toBeTruthy();
    // The class stops session replay; the attribute stops autocapture. Neither
    // substitutes for the other — see analyticsPrivacy.test.tsx.
    expect(root.className).toContain("ph-no-capture");
    expect(root.hasAttribute("data-ph-no-capture")).toBe(true);
  });
});

describe("nothing is kept unless the reader asks", () => {
  const firstBox = () => screen.getAllByRole("textbox")[0];
  const keepSwitch = () => screen.getByRole("switch", { name: new RegExp(automaticYesEN.keepLabel, "i") });

  it("writes nothing while the switch is off", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderSheet();

    fireEvent.change(firstBox(), { target: { value: "something private" } });

    // LangLayout legitimately writes `lang`, so the key is what matters.
    expect(setItem.mock.calls.filter(([key]) => key === STORAGE_KEY)).toHaveLength(0);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("writes only once the switch is turned on", () => {
    renderSheet();
    fireEvent.change(firstBox(), { target: { value: "something private" } });
    fireEvent.click(keepSwitch());

    const stored = window.localStorage.getItem(STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(stored).toContain("something private");
  });

  it("deletes what it kept when the switch goes off", () => {
    renderSheet();
    fireEvent.change(firstBox(), { target: { value: "something private" } });
    fireEvent.click(keepSwitch());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    fireEvent.click(keepSwitch());
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("restores a kept worksheet, with the switch already on", () => {
    const boxId = (() => {
      const { container } = renderSheet();
      const id = (container.querySelector("textarea") as HTMLTextAreaElement).id;
      cleanup();
      return id;
    })();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ [boxId]: "from last time" }));
    renderSheet();

    expect(screen.getByDisplayValue("from last time")).toBeTruthy();
    expect(keepSwitch()).toBeChecked();
  });
});

describe("the Russian address", () => {
  it("lands on the English page rather than a placeholder", () => {
    mockLanguage.current = "ru";
    render(
      <MemoryRouter initialEntries={["/ru/take/automatic-yes"]}>
        <Routes>
          <Route path="/ru/take/automatic-yes" element={<TakeAutomaticYes />} />
          <Route path="/en/take/automatic-yes" element={<p>english worksheet</p>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("english worksheet")).toBeTruthy();
  });
});

describe("the sign-up is off in milestone 1", () => {
  it("renders neither the card nor the letter block", () => {
    renderSheet();
    // Off means not rendered: a form that cannot submit is worse than none,
    // and its small print links to a privacy notice that is not published yet.
    expect(screen.queryByText(automaticYesEN.signup.title)).toBeNull();
    expect(screen.queryByText(automaticYesEN.letter.title)).toBeNull();
  });
});
