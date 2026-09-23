import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AutomaticYesContent } from "@/content/automaticYes";

/**
 * Submitting one of the two sign-up forms.
 *
 * Both ask the same function for the same two things; only the defaults
 * differ, so the states and the messages live here once.
 *
 * No PostHog call: /take/* counts page opens and nothing else, and that stays
 * true even though this form now talks to a server.
 */

export type SignupState = "idle" | "sending" | "done" | "error";

interface SubmitArgs {
  email: string;
  pdf: boolean;
  letter: boolean;
  /** Honeypot. Anything in it means a bot filled the form. */
  company: string;
}

export const useSignup = (c: AutomaticYesContent, source: string) => {
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
        status === 429 ? c.signup.rate_limited : status === 400 ? c.signup.invalid : c.signup.error,
      );
      return;
    }

    const result = data as { pdf?: string; letter?: string } | null;
    const pdfFailed = pdf && result?.pdf !== "sent";
    const letterFailed = letter && result?.letter !== "pending";

    if (pdfFailed || letterFailed) {
      setState("error");
      setMessage(c.signup.error);
      return;
    }

    setState("done");
    setMessage(
      pdf && letter ? c.signup.done_with_letter : pdf ? c.signup.done : c.letter.done,
    );
  };

  return { state, message, submit };
};
