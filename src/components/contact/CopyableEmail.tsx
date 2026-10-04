import { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";

/**
 * An email address offered three ways at once, because each one fails on its
 * own.
 *
 * The address is **selectable text** — someone who wants to read it, or drag
 * over it, or have a screen reader spell it, can. It is also a **mailto:
 * link**, which is what most people will use. And it has a **copy button**,
 * because a bare mailto: fails silently on a device with no mail client
 * configured: nothing opens, nothing says why, and the reader concludes the
 * site is broken rather than that their machine has no mail app.
 *
 * ## Why this is a component
 *
 * The brief asked to reuse "the component already on the booking page footer".
 * There wasn't one. The same inline block — local `copied` state, a 2s
 * timeout, an icon swap, a `title` attribute — was written out three times, in
 * `Contact.tsx`, `BookingConfirmation.tsx` and `FeelingsMap.tsx`, and all
 * three shared two defects:
 *
 *   1. **No accessible name.** The button's only content was the address text
 *      and an icon, so a screen reader announced the address and gave no hint
 *      that activating it copies anything.
 *   2. **Confirmation by colour and icon alone.** Success was a tick that
 *      changed colour. Nothing was announced, and nothing was readable to
 *      someone who cannot distinguish the two states.
 *
 * So this is the extraction rather than a fourth copy. The older three are
 * left where they are: two of them live inside the booking wizard, which is
 * behind `BOOKING_ENABLED` and is not what this change is for.
 *
 * ## The confirmation
 *
 * `role="status"` on a region that is always in the DOM, carrying words rather
 * than only an icon. Both halves matter: a live region inserted at the moment
 * it gains content is frequently not announced at all, and a tick that only
 * changes colour is invisible to the readers most likely to need the button.
 *
 * A refused clipboard — Safari outside a user gesture, a permissions policy,
 * an insecure origin — says so instead of staying silent, because a button
 * that appears to do nothing is worse than one that admits it did nothing.
 */
const CopyableEmail = ({
  address,
  copyLabel,
  copiedLabel,
  copyFailedLabel,
}: {
  address: string;
  copyLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
}) => {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // A click on the way out would otherwise set state on an unmounted
  // component, and in a test it leaks a timer into the next case.
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(address);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2500);
  };

  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      {/* Selectable, and a mailto: for the people for whom that works. */}
      <a
        href={`mailto:${address}`}
        className="font-body text-[17px] text-foreground underline underline-offset-[5px] decoration-border hover:decoration-primary transition-colors break-all"
      >
        {address}
      </a>

      <button
        type="button"
        onClick={copy}
        aria-label={copyLabel}
        className="inline-flex items-center justify-center shrink-0 w-11 h-11 -m-2.5 text-primary hover:text-primary/70 transition-colors"
      >
        {state === "copied" ? (
          <Check className="w-[18px] h-[18px]" aria-hidden="true" />
        ) : (
          <Copy className="w-[18px] h-[18px]" aria-hidden="true" />
        )}
      </button>

      {/* Always mounted, so the announcement actually fires; empty while idle. */}
      <span role="status" className="font-body text-[13px] text-muted-foreground">
        {state === "copied" ? copiedLabel : state === "failed" ? copyFailedLabel : ""}
      </span>
    </div>
  );
};

export default CopyableEmail;
