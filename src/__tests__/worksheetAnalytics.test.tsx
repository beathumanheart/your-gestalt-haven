/**
 * Counting worksheet PDF requests — and counting nothing else.
 *
 * Two events, because the gap between them is the number worth having: a
 * request that never became a delivery is Brevo failing, and a count of
 * deliveries alone would show that as a worksheet nobody wanted.
 *
 * The load-bearing assertion is the negative one. These fire from /take/*,
 * where PostHog runs with memory persistence and no person profiles, and the
 * privacy notice says the address is not part of the count. So every property
 * of every event is checked against an allow-list rather than spot-checked for
 * the address: a property added later is caught even if nobody thinks to
 * assert on it.
 */

import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SignupCard from "@/components/automatic-yes/SignupCard";
import LetterForm from "@/components/automatic-yes/LetterForm";
import { automaticYesEN as c } from "@/content/automaticYes";
import { WORKSHEET_EVENTS } from "@/hooks/useWorksheetAnalytics";

const invoke = vi.hoisted(() => vi.fn());
const capture = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));
vi.mock("posthog-js", () => ({ default: { capture } }));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), langPath: (p: string) => `/en${p}` }),
}));

const EMAIL = "reader@example.com";
const ok = (body: Record<string, string>) => ({ data: { ok: true, ...body }, error: null });

/** Everything these events are allowed to carry. Nothing identifies a person. */
const ALLOWED = ["source", "with_letter", "outcome"];

const fillAndSend = (email = EMAIL) => {
  fireEvent.change(screen.getByLabelText(new RegExp(c.signup.label, "i")), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button"));
};

const eventsNamed = (name: string) => capture.mock.calls.filter(([n]) => n === name);

beforeEach(() => {
  invoke.mockReset();
  capture.mockReset();
});
afterEach(cleanup);

describe("a PDF request is counted", () => {
  it("counts the ask before the answer, so a broken worksheet still shows demand", async () => {
    // Counting only successes would make an outage look like disinterest.
    invoke.mockImplementation(() => {
      expect(
        eventsNamed(WORKSHEET_EVENTS.PDF_REQUESTED),
        "the request was not counted until the call came back",
      ).toHaveLength(1);
      return Promise.resolve(ok({ pdf: "sent", letter: "skipped" }));
    });

    render(<SignupCard c={c} />);
    fillAndSend();
    await waitFor(() => expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)).toHaveLength(1));
  });

  it("records what became of it", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "skipped" }));
    render(<SignupCard c={c} />);
    fillAndSend();

    await waitFor(() => expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)).toHaveLength(1));
    expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)[0][1]).toMatchObject({
      source: "automatic-yes",
      outcome: "sent",
      with_letter: false,
    });
  });

  it("calls a delivery that did not happen a failure, not a send", async () => {
    invoke.mockResolvedValue(ok({ pdf: "failed", letter: "skipped" }));
    render(<SignupCard c={c} />);
    fillAndSend();

    await waitFor(() => expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)).toHaveLength(1));
    expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)[0][1]).toMatchObject({ outcome: "failed" });
  });

  it("counts a request that never came back as a failure too", async () => {
    invoke.mockResolvedValue({ data: null, error: { context: { status: 500 } } });
    render(<SignupCard c={c} />);
    fillAndSend();

    await waitFor(() => expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)).toHaveLength(1));
    expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)[0][1]).toMatchObject({ outcome: "failed" });
  });

  it("notes whether the letter was taken at the same time", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "pending" }));
    render(<SignupCard c={c} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fillAndSend();

    await waitFor(() => expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)).toHaveLength(1));
    for (const name of [WORKSHEET_EVENTS.PDF_REQUESTED, WORKSHEET_EVENTS.PDF_RESULT]) {
      expect(eventsNamed(name)[0][1]).toMatchObject({ with_letter: true });
    }
  });
});

describe("what is never counted", () => {
  it("sends no event when only the letter was asked for", async () => {
    // Brevo is the record of who is on the list. A second count of the same
    // thing in a second system is one more place for it to disagree.
    invoke.mockResolvedValue(ok({ pdf: "skipped", letter: "pending" }));
    render(<LetterForm c={c} source="automatic-yes" />);
    fillAndSend();

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(capture, "the letter-only form sent an event").not.toHaveBeenCalled();
  });

  it("puts nothing about the person in either event", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "pending" }));
    render(<SignupCard c={c} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fillAndSend();

    await waitFor(() => expect(eventsNamed(WORKSHEET_EVENTS.PDF_RESULT)).toHaveLength(1));

    expect(capture.mock.calls.length, "no events to check, so this proves nothing")
      .toBeGreaterThan(1);

    for (const [name, props] of capture.mock.calls) {
      const serialised = JSON.stringify(props ?? {});
      expect(serialised, `${name} carries the address`).not.toContain(EMAIL);
      expect(serialised, `${name} carries an address-shaped string`).not.toMatch(/@/);

      // An allow-list, not a spot check: a property added later fails here
      // even if nobody remembers to assert on it. src/content/privacy.ts
      // describes what is counted, and has to change with this list.
      for (const key of Object.keys(props ?? {})) {
        expect(ALLOWED, `${name} added an unreviewed property "${key}"`).toContain(key);
      }
    }
  });
});
