import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The worksheet's answers, and whether they are kept.
 *
 * Nothing is written to the device unless the reader asks. /take/* is built on
 * that footing — PostHog there counts page opens and writes nothing (see
 * src/config/analytics.ts) — and what someone writes here can be as personal
 * as a booking enquiry. So answers live in React state, and only the keep
 * switch moves them to localStorage.
 *
 * Every localStorage access is wrapped: a private window throws on access, and
 * a worksheet that crashes because someone opened it privately would be a poor
 * trade for a convenience.
 */

export const STORAGE_KEY = "hh-automatic-yes-v1";

export type Answers = Record<string, unknown>;

const read = (): Answers | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Answers) : null;
  } catch {
    return null;
  }
};

const write = (answers: Answers) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    /* private window, or full — the worksheet still works in memory */
  }
};

const forget = () => {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do: the goal was for it not to be there */
  }
};

export const useWorksheetAnswers = () => {
  const [answers, setAnswers] = useState<Answers>({});
  const [keep, setKeep] = useState(false);
  // Restoring counts as a change; without this the first render would write
  // the empty object back over what it just restored.
  const restored = useRef(false);

  useEffect(() => {
    const stored = read();
    if (stored) {
      setAnswers(stored);
      setKeep(true);
    }
    restored.current = true;
  }, []);

  useEffect(() => {
    if (!restored.current) return;
    if (keep) write(answers);
  }, [answers, keep]);

  const setAnswer = useCallback((id: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const toggleKeep = useCallback(
    (next: boolean) => {
      setKeep(next);
      if (next) write(answers);
      else forget();
    },
    [answers],
  );

  const clear = useCallback(() => {
    setAnswers({});
    // The key goes too when it exists: "clear my answers" that leaves them on
    // the device would be a lie.
    forget();
  }, []);

  return { answers, setAnswer, keep, toggleKeep, clear };
};
