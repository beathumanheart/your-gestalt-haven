import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AutomaticYesContent } from "@/content/automaticYes";
import type { SignupOutcomeMessages } from "@/content/signupMessages";
import type { SignupSource } from "@/config/signup";

/**
 * Submitting one of the two sign-up forms.
 *
 * All three forms ask the same function for the same two things; only the
 * defaults differ, so the states and the outcome logic live here once.
 *
 * It takes the six sentences it can say rather than a page's whole content
 * object: the footer's form is in the entry chunk, and importing the
 * worksheet's content there put 23 KB of its prose into every page load. See
 * src/content/signupMessages.ts.
 *
 * No PostHog call: /take/* counts page opens and nothing else, and that stays
 * true even though this form now talks to a server.
 */

/**
 * The worksheet page's two forms say the same six things, worded for a reader
 * who asked for a PDF. Pulled out so the hook does not have to know the shape
 * of a whole page's content.
 */
export const outcomeMessages = (c: AutomaticYesContent): SignupOutcomeMessages => ({
  done: c.signup.done,
  done_with_letter: c.signup.done_with_letter,
  letter_done: c.letter.done,
  invalid: c.signup.invalid,
  error: c.signup.error,
  rate_limited: c.signup.rate_limited,
});

export type SignupState = "idle" | "sending" | "done" | "error";

interface SubmitArgs {
  email: string;
  pdf: boolean;
  letter: boolean;
  /** Honeypot. Anything in it means a bot filled the form. */
  company: string;
}

export const useSignup = (m: SignupOutcomeMessages, source: SignupSource) => {
  const [state, setState] = useState<SignupState>("idle");
  const [message, setMessage] = useState("");

  const submit = async ({ email, pdf, letter, company }: SubmitArgs) => {
    setState("sending");
    setMessage("");

    const { data, error } = await supabase.functions.invoke("take-signup", {
      body: { email, pdf, letter, company, source, lang: "en" },
    });

    if (error) {
      // The function answers 429 and 400 with a body; supabase-js surfaces
      // both as an error, so the status decides which sentence to show.
      const status = (error as { context?: { status?: number } }).context?.status;
      setState("error");
      setMessage(
        status === 429 ? m.rate_limited : status === 400 ? m.invalid : m.error,
      );
      return;
    }

    const result = data as { pdf?: string; letter?: string } | null;
    const pdfFailed = pdf && result?.pdf !== "sent";
    const letterFailed = letter && result?.letter !== "pending";

    if (pdfFailed || letterFailed) {
      setState("error");
      setMessage(m.error);
      return;
    }

    setState("done");
    setMessage(
      pdf && letter ? m.done_with_letter : pdf ? m.done : m.letter_done,
    );
  };

  return { state, message, submit };
};
