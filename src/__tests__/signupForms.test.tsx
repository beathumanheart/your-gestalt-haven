/**
 * What each outcome tells the reader.
 *
 * The function answers with a per-part result, so "sent the PDF but the letter
 * failed" is a real state and must not read as success. One row per line of
 * the table in docs/briefs/automatic-yes.md.
 */

import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SignupCard from "@/components/automatic-yes/SignupCard";
import LetterForm from "@/components/automatic-yes/LetterForm";
import { automaticYesEN as c } from "@/content/automaticYes";

const invoke = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke } },
}));
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "en", setLanguage: vi.fn(), langPath: (p: string) => `/en${p}` }),
}));

const ok = (body: Record<string, string>) => ({ data: { ok: true, ...body }, error: null });
const failed = (status: number) => ({ data: null, error: { context: { status } } });

beforeEach(() => invoke.mockReset());
afterEach(cleanup);

const fillAndSend = (email = "reader@example.com") => {
  fireEvent.change(screen.getByLabelText(new RegExp(c.signup.label, "i")), {
    target: { value: email },
  });
  fireEvent.click(screen.getByRole("button"));
};

describe("the PDF form", () => {
  it("confirms when only the PDF was asked for", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "skipped" }));
    render(<SignupCard c={c} />);
    fillAndSend();

    expect(await screen.findByText(c.signup.done)).toBeTruthy();
  });

  it("says the letter is pending when it was ticked", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "pending" }));
    render(<SignupCard c={c} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fillAndSend();

    expect(await screen.findByText(c.signup.done_with_letter)).toBeTruthy();
  });

  it("does not claim success when a requested part failed", async () => {
    // The PDF arrived, the letter did not. Saying "done" would be a lie the
    // reader only discovers by waiting for an email that never comes.
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "failed" }));
    render(<SignupCard c={c} />);
    fireEvent.click(screen.getByRole("checkbox"));
    fillAndSend();

    expect(await screen.findByText(c.signup.error)).toBeTruthy();
  });

  it("passes the letter box through as sent, unticked by default", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "skipped" }));
    render(<SignupCard c={c} />);
    fillAndSend();

    await waitFor(() => expect(invoke).toHaveBeenCalled());
    const body = invoke.mock.calls[0][1].body;
    expect(body).toMatchObject({ pdf: true, letter: false, source: "automatic-yes" });
  });

  it("shows the rate-limit sentence on 429", async () => {
    invoke.mockResolvedValue(failed(429));
    render(<SignupCard c={c} />);
    fillAndSend();

    expect(await screen.findByText(c.signup.rate_limited)).toBeTruthy();
  });

  it("shows the invalid-address sentence on 400", async () => {
    invoke.mockResolvedValue(failed(400));
    render(<SignupCard c={c} />);
    fillAndSend();

    expect(await screen.findByText(c.signup.invalid)).toBeTruthy();
  });

  it("shows the general error when the network fails", async () => {
    invoke.mockResolvedValue({ data: null, error: {} });
    render(<SignupCard c={c} />);
    fillAndSend();

    expect(await screen.findByText(c.signup.error)).toBeTruthy();
  });

  it("stops a second submission once it has succeeded", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "skipped" }));
    render(<SignupCard c={c} />);
    fillAndSend();
    await screen.findByText(c.signup.done);

    fireEvent.click(screen.getByRole("button"));
    expect(invoke).toHaveBeenCalledTimes(1);
  });
});

describe("the letter-only form", () => {
  it("asks for the letter and not the PDF", async () => {
    invoke.mockResolvedValue(ok({ pdf: "skipped", letter: "pending" }));
    render(<LetterForm c={c} />);
    fillAndSend();

    expect(await screen.findByText(c.letter.done)).toBeTruthy();
    expect(invoke.mock.calls[0][1].body).toMatchObject({ pdf: false, letter: true });
  });
});

describe("the honeypot", () => {
  it("is present, hidden from people, and sent along", async () => {
    invoke.mockResolvedValue(ok({ pdf: "sent", letter: "skipped" }));
    const { container } = render(<SignupCard c={c} />);
    const pot = container.querySelector('input[name="company"]') as HTMLInputElement;

    expect(pot, "no honeypot field").toBeTruthy();
    expect(pot.getAttribute("aria-hidden")).toBe("true");
    expect(pot.tabIndex).toBe(-1);

    fillAndSend();
    await waitFor(() => expect(invoke).toHaveBeenCalled());
    expect(invoke.mock.calls[0][1].body).toHaveProperty("company", "");
  });
});
