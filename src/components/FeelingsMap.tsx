import {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  feelingsEN,
  feelingsRU,
  feelingDefs,
  bodyZones,
  bodyZoneForWord,
  famColor,
  famTint,
  famTintHover,
  type FeelingsContent,
  type FeelingFamily,
} from "@/content/feelings";

/* The map keeps the design reference's own earth palette rather than the site
   tokens: the six family colours have to stay distinguishable from each other
   and from the sage/terracotta UI around them. */
const CREAM = "#FAF8F5";
const SAGE = "#437059";
const SAGE_PALE = "#E0EBE6";
const INK = "#5c554e";
const MUTE = "#8A8075";
const IDLE = "#F0ECE6";
const IDLE_HOVER = "#E8E2DA";

/** Container-relative font size, floored so it stays legible on narrow screens. */
const cq = (px: number) =>
  `clamp(${(px * 0.7).toFixed(1)}px,${(px / 4.7).toFixed(2)}cqw,${px}px)`;

/**
 * A size that grows linearly with the viewport from `minPx` at `minVw` to
 * `maxPx` at `maxVw`, then holds.
 *
 * The blocks outside the two container-query columns (intro, cards, footer)
 * can't use `cqw`, and the design's own `vw` clamps floor out well above phone
 * size — so they'd sit frozen at their desktop size all the way down to 320px.
 */
const fluid = (minPx: number, maxPx: number, minVw = 320, maxVw = 800) => {
  const slope = ((maxPx - minPx) / (maxVw - minVw)) * 100;
  const intercept = minPx - (slope * minVw) / 100;
  const sign = intercept < 0 ? "-" : "+";
  return `clamp(${minPx}px, ${slope.toFixed(3)}vw ${sign} ${Math.abs(intercept).toFixed(2)}px, ${maxPx}px)`;
};

const FS_H1 = fluid(26, 56, 320, 1120);
const FS_INTRO = fluid(14, 16);
const FS_NOTE = fluid(12.5, 13.5);
const FS_KICKER = fluid(10, 11);
const FS_CARD_BODY = fluid(13, 14);
const FS_SMALL = fluid(11.5, 12.5);
const FS_TINY = fluid(11.5, 12);
const FS_MONO = fluid(11, 12.5);

const ETH_ADDRESS = "0xd22b6972217d57570653954C70e8e4730ab9088E";
const TRON_ADDRESS = "TXPZLdfq3BwjhAd2X4MXekdAJDouagtuiD";

/** Override with VITE_FEELINGS_FORM_URL if the form ever moves. */
const FEEDBACK_URL =
  (import.meta.env.VITE_FEELINGS_FORM_URL as string | undefined)?.trim() ||
  "https://forms.gle/VKEcgvPcjYWW2tGi8";

const RING_IDS = [1, 2, 3, 4, 5, 6] as const;
const WORD_LIMIT = 8;

/* Static hovers and the two keyframes the design uses. Scoped to .fm-root and
   prefixed so neither leaks into the rest of the site. */
const STYLES = `
.fm-root { max-width: 1320px; margin: 0 auto; padding: clamp(26px,4vw,60px) clamp(18px,4vw,56px) 72px; }
@keyframes fm-bloom { 0%,100% { transform: scale(.94) } 50% { transform: scale(1.07) } }
@keyframes fm-riseIn { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
.fm-rise { animation: fm-riseIn .5s cubic-bezier(.22,1,.36,1) both; }
.fm-rise-fast { animation: fm-riseIn .4s cubic-bezier(.22,1,.36,1) both; }

/* Single column by default; the wheel only sticks once there is a second
   column beside it to scroll past. */
.fm-main { display: grid; grid-template-columns: minmax(0,1fr); gap: clamp(20px,3vw,52px); align-items: start; margin: clamp(26px,4vw,44px) 0 0; }
.fm-wheel-col { min-width: 0; width: 100%; max-width: min(100%,480px); margin: 0 auto; }
@media (min-width: 900px) {
  .fm-main { grid-template-columns: repeat(2, minmax(0,1fr)); }
  .fm-wheel-col { position: sticky; top: 96px; }
}
/* From 1200px up the wheel column is the wider of the two: the wheel is the
   thing being read, the panel is the caption beside it. */
@media (min-width: 1200px) {
  .fm-main { grid-template-columns: minmax(0,1.32fr) minmax(0,1fr); }
  .fm-wheel-col { max-width: min(100%,620px); }
}

/* Below md the panel is a bottom sheet, so the wheel gets the viewport to
   itself and is sized off its HEIGHT — width alone left it running past the
   fold on a 375x667 screen. svh, not vh, so the mobile URL bar cannot push it
   under the fold either. --fm-chrome is the header + ring nav + breathing
   room that has to share the screen with it. */
@media (max-width: 767.98px) {
  .fm-root { display: flex; flex-direction: column; }
  .fm-h1 { order: 1; }
  .fm-main { order: 2; margin-top: 14px; }
  .fm-intro { order: 3; margin-top: clamp(22px,5vw,34px); }
  .fm-tail { order: 4; }
  .fm-wheel-col { --fm-chrome: 250px; max-width: min(100%, calc(100svh - var(--fm-chrome))); }
}

/* 66ch is the reading measure; the container query the panel's own type is
   sized from comes with it. */
.fm-panel { min-width: 0; max-width: 66ch; container-type: inline-size; }

/* A footnote to the page, not a second hero: narrower than the map above it,
   and each card only as tall as its own content. Stretching the short card to
   match the tall one is what put a void in the feedback card, and the support
   card is supposed to grow when the addresses open. Not auto-fit: two is the
   layout, and auto-fit would let a third card silently reflow it. */
.fm-cards { display: grid; grid-template-columns: minmax(0,1fr); gap: 20px; align-items: start; max-width: 900px; margin: clamp(40px,5vw,64px) auto 0; }
@media (min-width: 700px) { .fm-cards { grid-template-columns: repeat(2, minmax(0,1fr)); } }
.fm-card { display: flex; flex-direction: column; padding: 24px; }
.fm-card h3 { font-size: 20px; }
.fm-card p { font-size: 14px; }

/* ---- mobile bottom sheet ---- */
.fm-scrim { position: fixed; inset: 0; z-index: 60; background: rgba(70,64,57,.34); animation: fm-fade .28s ease both; }
.fm-sheet {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 61;
  height: 85svh; max-height: 85svh;
  display: flex; flex-direction: column;
  background: #FAF8F5; border-top: 1px solid #E7E1DA;
  border-radius: 20px 20px 0 0; box-shadow: 0 -18px 44px rgba(70,64,57,.18);
  animation: fm-sheetIn .32s cubic-bezier(.22,1,.36,1) both;
}
.fm-sheet-grip { flex: none; padding: 9px 0 3px; display: flex; justify-content: center; cursor: grab; touch-action: none; }
.fm-sheet-grip span { width: 42px; height: 4px; border-radius: 999px; background: #DCD4CA; }
.fm-sheet-head { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 2px 18px 10px; }
/* contain, or iOS Safari hands the overscroll to the page underneath. */
.fm-sheet-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 0 18px 20px; }
.fm-sheet-nav { flex: none; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); border-top: 1px solid #E7E1DA; background: #F6F2EC; }
@keyframes fm-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes fm-sheetIn { from { transform: translateY(100%) } to { transform: translateY(0) } }
@media (prefers-reduced-motion: reduce) {
  .fm-sheet, .fm-scrim { animation: none !important; }
}

.fm-chip:hover { border-color: #D17147 !important; transform: translateY(-1px); }
.fm-more:hover { background: #E0EBE6; border-color: #437059 !important; }
.fm-pill:hover { border-color: #437059 !important; }
.fm-clear:hover { background: #F0ECE6; }
.fm-deeper:hover { background: #437059; color: #FAF8F5; }
.fm-open:hover { background: #365c48; transform: translateY(-1px); }
.fm-copy:hover { background: #365c48; transform: translateY(-1px); }
.fm-copy:active { background: #2d4d3c; }

@media (prefers-reduced-motion: reduce) {
  .fm-root *, .fm-root *::before, .fm-root *::after {
    animation-duration: .01ms !important; animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
`;

/* The sheet is a mobile-only branch, so the breakpoint has to be readable from
   JS as well as CSS — focus trapping and history are not CSS-expressible. */
const MOBILE_MQ = "(max-width: 767.98px)";

const useIsMobile = () => {
  const [is, setIs] = useState(
    () => typeof window !== "undefined" && window.matchMedia(MOBILE_MQ).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const on = () => setIs(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return is;
};

const FOCUSABLE =
  'a[href],button,[role="button"],input,select,textarea,[tabindex]:not([tabindex="-1"])';

const onEnterOrSpace = (fn: () => void) => (e: KeyboardEvent) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fn();
  }
};

interface Coin {
  name: string;
  net: string;
  addr: string;
}

const COINS: Coin[] = [
  { name: "Ethereum", net: "ERC-20", addr: ETH_ADDRESS },
  { name: "TRON", net: "TRC-20", addr: TRON_ADDRESS },
];

const FeelingsMap = () => {
  const { language } = useLanguage();
  const t: FeelingsContent = language === "ru" ? feelingsRU : feelingsEN;

  const [active, setActive] = useState(3);
  const [marked, setMarked] = useState<Record<string, true>>({});
  const [famIdx, setFamIdx] = useState(0);
  const [behindOpen, setBehindOpen] = useState(false);
  const [wordsOpen, setWordsOpen] = useState(false);
  const [defIdx, setDefIdx] = useState<number | null>(null);
  const [pinIdx, setPinIdx] = useState<number | null>(null);
  const [payStatus, setPayStatus] = useState("");
  const [hoverFam, setHoverFam] = useState<number | null>(null);
  const [hoverRing, setHoverRing] = useState<number | null>(null);
  const [addrOpen, setAddrOpen] = useState(false);

  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  /* The element that opened the sheet, so focus can go back to it on close. */
  const openerRef = useRef<HTMLElement | SVGElement | null>(null);
  /* True while our own history entry is on the stack. */
  const pushedRef = useRef(false);

  const families = t.s3.families as FeelingFamily[];
  const fam = families[famIdx];

  const toggleMark = (key: string) =>
    setMarked((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });

  const countFor = (prefix: string) => {
    const p = `${language}|${prefix}|`;
    return Object.keys(marked).filter((k) => k.startsWith(p)).length;
  };

  /* Opening pushes a history entry so Android's hardware Back closes the sheet
     instead of leaving the page. The URL is unchanged: map state must never
     reach the address bar, because $current_url is what analytics transmits. */
  const openSheet = (opener?: HTMLElement | SVGElement | null) => {
    if (opener) openerRef.current = opener;
    if (sheetOpen) return; // already open — a ring switch, not a new opening
    setSheetOpen(true);
    if (!pushedRef.current) {
      window.history.pushState({ fmSheet: true }, "", window.location.href);
      pushedRef.current = true;
    }
  };

  /* Always leave through history.back() so the entry we pushed is consumed;
     the popstate handler is the single place that flips the state to closed. */
  const closeSheet = useCallback(() => {
    if (pushedRef.current) window.history.back();
    else setSheetOpen(false);
  }, []);

  useEffect(() => {
    const onPop = () => {
      pushedRef.current = false;
      setSheetOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  /* Focus trap: move focus in on open, keep Tab inside, Escape closes, and the
     ring that was tapped gets focus back on the way out. */
  useEffect(() => {
    if (!sheetOpen) {
      const opener = openerRef.current;
      openerRef.current = null;
      opener?.focus?.();
      return;
    }
    const node = sheetRef.current;
    node?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSheet();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null || el === node,
      );
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const at = document.activeElement;
      if (e.shiftKey && (at === first || at === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && at === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [sheetOpen, closeSheet]);

  /* Crossing the breakpoint with the sheet open would strand the state. */
  useEffect(() => {
    if (!isMobile && sheetOpen) closeSheet();
  }, [isMobile, sheetOpen, closeSheet]);

  const goToRing = (i: number, opener?: HTMLElement | SVGElement | null) => {
    setActive(i);
    setWordsOpen(false);
    setDefIdx(null);
    setPinIdx(null);
    if (isMobile) openSheet(opener);
  };

  const copyAddr = async (c: Coin) => {
    try {
      await navigator.clipboard.writeText(c.addr);
      setPayStatus(t.addrCopied.replace("{c}", c.name));
    } catch {
      setPayStatus(t.copyFail);
    }
  };

  /* ---- ring 3 words are graded hottest-first, so the eye reads intensity ---- */
  const isTable = active === 3;
  const ring = t[`s${active}` as "s1"];
  const allWords = (isTable ? fam.words : ring.words) ?? [];
  const collapsible = allWords.length - WORD_LIMIT >= 3;
  const shownWords = wordsOpen || !collapsible ? allWords : allWords.slice(0, WORD_LIMIT);
  const wordScope = isTable ? `s3|${fam.id}` : `s${active}`;

  const defList = isTable ? feelingDefs[language === "ru" ? "ru" : "en"][fam.id] ?? [] : [];
  const shownDefIdx = defIdx === null ? pinIdx : defIdx;
  const def = shownDefIdx === null ? null : defList[shownDefIdx] ?? null;

  /* ---- the six wheel rings. Only ring 5 shows a tally, in the centre disc ---- */
  const ringVals = (i: number) => {
    const on = active === i;
    const hovered = hoverRing === i;
    return {
      name: t[`s${i}` as "s1"].short,
      up: t[`s${i}` as "s1"].short.toUpperCase(),
      bg: on ? SAGE : hovered ? IDLE_HOVER : IDLE,
      fg: on ? CREAM : "#6e655b",
    };
  };

  const r5 = (() => {
    const on = active === 5;
    const count = countFor("s5");
    const hovered = hoverRing === 5;
    return {
      label: t.s5.centre ?? t.s5.short,
      tally: count ? t.tally.replace("{n}", String(count)) : "",
      bg: on ? SAGE : hovered ? "#D3E2DB" : SAGE_PALE,
      fg: on ? CREAM : "#3c5c4c",
      sub: on ? "rgba(250,248,245,.75)" : "#456B57",
    };
  })();

  const famVals = (k: number) => {
    const sel = active === 3 && k === famIdx;
    const count = countFor(`s3|${families[k].id}`);
    const hovered = hoverFam === k;
    const base = families[k].wheel ?? families[k].t;
    return {
      label: count ? `${base} ·` : base,
      stroke: sel ? famColor[k] : hovered ? famTintHover[k] : famTint[k],
      fg: sel ? CREAM : "#5c554e",
    };
  };

  const pickFam = (k: number, opener?: HTMLElement | SVGElement | null) => {
    setActive(3);
    setFamIdx(k);
    setBehindOpen(false);
    setWordsOpen(false);
    setDefIdx(null);
    setPinIdx(null);
    if (isMobile) openSheet(opener);
  };

  /* ---- ring order: 1→2→3→4→5, then 5 loops out to 6 and 6 back to 1 ---- */
  const order = [1, 2, 3, 4, 5];
  const inward = active === 5 ? 6 : active === 6 ? 1 : order[order.indexOf(active) + 1];
  const nextArrow = active === 5 || active === 6 ? "↗" : "↘";

  /* ---- body silhouette glow (ring 2 only) ---- */
  const litZone =
    active === 2 && shownDefIdx !== null ? bodyZoneForWord[shownDefIdx] ?? null : null;

  /* The centre label is one word in Russian ("Потребность") and two in English,
     so a single cqw size either overflows the disc or wastes it. Size it to the
     longest unbreakable word instead: it must fit the box width below. */
  const centreLabel = t.s5.centre ?? t.s5.short;
  const CENTRE_BOX = 21; // % of the wheel container; the disc itself is ~25.6%
  const longestWord = Math.max(...centreLabel.split(/\s+/).map((w) => w.length));
  const centreFs = `max(9px, min(4.4cqw, ${(CENTRE_BOX / (longestWord * 0.55)).toFixed(2)}cqw))`;

  const behindPrompt = t.behindAsk.includes("{fam}")
    ? t.behindAsk.replace("{fam}", fam.t)
    : t.behindAsk;

  const clickable: CSSProperties = { cursor: "pointer", userSelect: "none" };
  const arcTransition = { cursor: "pointer", transition: "stroke .5s cubic-bezier(.22,1,.36,1)" } as CSSProperties;

  /* The six family arcs, each a 60° slice of the ring-3 band. */
  const ARCS = [
    "M363.14 180.03 A180 180 0 0 1 514.29 267.29",
    "M517.43 272.73 A180 180 0 0 1 517.43 447.27",
    "M514.29 452.71 A180 180 0 0 1 363.14 539.97",
    "M356.86 539.97 A180 180 0 0 1 205.71 452.71",
    "M202.57 447.27 A180 180 0 0 1 202.57 272.73",
    "M205.71 267.29 A180 180 0 0 1 356.86 180.03",
  ];
  const ARC_LABEL_POS = [
    { left: "62.5%", top: "28.33%", size: "max(11px,4cqw)" },
    { left: "75%", top: "50%", size: "max(11px,4cqw)" },
    { left: "62.5%", top: "71.67%", size: "max(11px,3.8cqw)" },
    { left: "37.5%", top: "71.67%", size: "max(11px,4cqw)" },
    { left: "25%", top: "50%", size: "max(11px,3.8cqw)" },
    { left: "37.5%", top: "28.33%", size: "max(10.5px,2.95cqw)", width: "13%" },
  ];
  /* Concentric rings, outermost first: 6 (the pull), 1 (here and now), 2 (body).
     `top` is where each ring's name sits — at the 12 o'clock point of its own
     band, so the label is on the ring it names. */
  const OUTER_RINGS = [
    { id: 6, r: 333, w: 30, top: "3.75%", fs: "max(9px,2.05cqw)" },
    { id: 1, r: 289, w: 42, top: "9.86%", fs: "max(9.5px,2.3cqw)" },
    { id: 2, r: 243, w: 42, top: "16.25%", fs: "max(9.5px,2.3cqw)" },
  ];

  /* The nav lives under the wheel and, on mobile, pinned to the foot of the
     sheet — switching rings there must not close and reopen it. */
  const ringNav = (where: "wheel" | "sheet"): ReactNode => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
        margin: where === "wheel" ? "16px 0 0" : 0,
        justifyContent: "center",
      }}
    >
      {RING_IDS.map((i) => {
        const on = active === i;
        const count = countFor(`s${i}`);
        return (
          <div
            key={i}
            className="fm-pill"
            onClick={(e) => goToRing(i, e.currentTarget)}
            role="button"
            tabIndex={0}
            aria-current={on ? "true" : undefined}
            onKeyDown={onEnterOrSpace(() => goToRing(i))}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 13px 6px 9px",
              borderRadius: 999,
              ...clickable,
              transition: "all .35s cubic-bezier(.4,0,.2,1)",
              background: on ? SAGE : "rgba(250,248,245,.6)",
              border: `1px solid ${on ? SAGE : "#DCD4CA"}`,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: ".04em", minWidth: 12, textAlign: "center", transition: "color .35s ease", color: on ? "rgba(250,248,245,.65)" : "#A39889" }}>
              {i}
            </span>
            <span style={{ fontSize: FS_SMALL, fontWeight: 600, whiteSpace: "nowrap", transition: "color .35s ease", color: on ? CREAM : "#5c554e" }}>
              {t[`s${i}` as "s1"].short}
            </span>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: on ? "#F0B49A" : "#D17147", transition: "opacity .35s ease", opacity: count ? 1 : 0 }} />
          </div>
        );
      })}
    </div>
  );

  /* Drag the handle down far enough and the sheet goes. Pointer events, so a
     mouse works too; no rubber-banding, the sheet either stays or closes. */
  const onGripDown = (e: React.PointerEvent) => {
    const startY = e.clientY;
    const node = sheetRef.current;
    const move = (ev: PointerEvent) => {
      const dy = Math.max(0, ev.clientY - startY);
      if (node) node.style.transform = `translateY(${dy}px)`;
      if (dy > 96) {
        end(ev);
        closeSheet();
      }
    };
    const end = (ev: PointerEvent) => {
      if (node) node.style.transform = "";
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      void ev;
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  /* The open ring. Rendered in the second grid column on desktop and
     inside the bottom sheet below md — one definition, two homes. */
  const panel: ReactNode = (
    <>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div id="fm-sheet-title" style={{ fontSize: "clamp(9.5px,2.15cqw,11px)", fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "#C2603A" }}>
            {ring.ring}
          </div>
          <div style={{ fontSize: "clamp(9.5px,2.15cqw,11px)", letterSpacing: ".12em", color: MUTE, whiteSpace: "nowrap" }}>
            {t.step.replace("{n}", String(active))}
          </div>
        </div>

        <div style={{ margin: "10px 0 0", fontSize: "clamp(10.5px,2.4cqw,12.5px)", lineHeight: 1.5, color: MUTE, fontStyle: "italic" }}>
          {ring.theory}
        </div>

        <h2 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 400, fontSize: "clamp(17px,5.25cqw,27px)", lineHeight: 1.18, margin: "8px 0 0", color: "#464039" }}>
          {ring.q}
        </h2>
        <p style={{ margin: "14px 0 0", fontSize: "clamp(12.5px,3cqw,15.5px)", lineHeight: 1.72, color: INK }}>
          {ring.body}
        </p>

        {ring.pairs && (
          <div style={{ margin: "18px 0 0", padding: "14px 18px", borderRadius: 12, background: SAGE_PALE, fontSize: "clamp(11.5px,2.6cqw,13.5px)", lineHeight: 1.66, color: "#3c5c4c" }}>
            {ring.pairs}
          </div>
        )}

        <div style={{ margin: "22px 0 0", fontSize: "clamp(10.5px,2.4cqw,12.5px)", lineHeight: 1.6, color: MUTE, fontStyle: "italic" }}>
          {t.suggestive}
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "clamp(12px,3cqw,22px)", margin: "10px 0 0" }}>
          {active === 2 && (
            <div style={{ flex: "none", width: "clamp(64px,17cqw,96px)", position: "relative", aspectRatio: "1/2.3", margin: "6px 0 0" }} aria-hidden="true">
              <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: "35%", aspectRatio: "1", borderRadius: 999, background: "#EDE5D9" }} />
              <div style={{ position: "absolute", left: "50%", top: "15.5%", transform: "translateX(-50%)", width: "15%", height: "7%", background: "#EDE5D9" }} />
              <div style={{ position: "absolute", left: "50%", top: "21%", transform: "translateX(-50%)", width: "82%", height: "31%", borderRadius: "44% 44% 30% 30%/44% 44% 30% 30%", background: "#EDE5D9" }} />
              <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translateX(-50%)", width: "62%", height: "19%", borderRadius: "26% 26% 34% 34%/30% 30% 40% 40%", background: "#EDE5D9" }} />
              <div style={{ position: "absolute", left: "50%", top: "68%", transform: "translateX(-50%)", width: "50%", height: "32%", borderRadius: "24% 24% 42% 42%/12% 12% 50% 50%", background: "#EDE5D9" }} />
              {bodyZones.map((z) => {
                const op =
                  litZone === null
                    ? z.k === "whole"
                      ? 0
                      : 0.5
                    : z.k === litZone
                      ? 1
                      : z.k === "whole"
                        ? 0
                        : 0.12;
                return (
                  <div
                    key={z.k + z.y}
                    style={{
                      position: "absolute",
                      left: z.x,
                      top: z.y,
                      transform: "translate(-50%,-50%)",
                      width: z.w,
                      aspectRatio: "1",
                      pointerEvents: "none",
                      opacity: op,
                      transition: "opacity 1.4s cubic-bezier(.4,0,.2,1)",
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 999,
                        background: `radial-gradient(circle,${z.c},rgba(0,0,0,0) 70%)`,
                        animation: `fm-bloom ${z.dur} ease-in-out infinite ${z.delay}`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexWrap: "wrap", gap: "clamp(5px,1.3cqw,8px)", alignItems: "baseline" }}>
            {shownWords.map((w, i) => {
              const key = `${language}|${wordScope}|${w}`;
              const on = !!marked[key];
              const f = isTable ? i / Math.max(1, allWords.length - 1) : 0.45;
              const cool = isTable && f < 0.34;
              return (
                <div
                  key={key}
                  className="fm-chip"
                  role="button"
                  tabIndex={0}
                  aria-pressed={on}
                  onClick={() => {
                    toggleMark(key);
                    setPinIdx(i);
                  }}
                  onKeyDown={onEnterOrSpace(() => {
                    toggleMark(key);
                    setPinIdx(i);
                  })}
                  onMouseEnter={() => setDefIdx(i)}
                  onMouseLeave={() => setDefIdx((d) => (d === i ? null : d))}
                  onFocus={() => setDefIdx(i)}
                  onBlur={() => setDefIdx((d) => (d === i ? null : d))}
                  style={{
                    padding: "0.44em 0.92em",
                    borderRadius: 999,
                    ...clickable,
                    lineHeight: 1.25,
                    transition: "all .35s cubic-bezier(.4,0,.2,1)",
                    fontSize: isTable ? cq(18.5 - f * 4.5) : cq(15),
                    color: on ? CREAM : cool ? "#464039" : INK,
                    background: on ? "#D17147" : cool ? IDLE : "rgba(250,248,245,.75)",
                    border: `1px solid ${on ? "#D17147" : "#E7E1DA"}`,
                  }}
                >
                  {w}
                </div>
              );
            })}

            {collapsible && (
              <div
                className="fm-more"
                role="button"
                tabIndex={0}
                onClick={() => setWordsOpen((v) => !v)}
                onKeyDown={onEnterOrSpace(() => setWordsOpen((v) => !v))}
                style={{
                  padding: "0.44em 0.92em",
                  borderRadius: 999,
                  ...clickable,
                  lineHeight: 1.25,
                  fontSize: "clamp(11px,2.5cqw,13px)",
                  fontWeight: 600,
                  color: SAGE,
                  background: "transparent",
                  border: "1px dashed #C7D8CD",
                  transition: "all .35s cubic-bezier(.4,0,.2,1)",
                }}
              >
                {wordsOpen ? t.wordsLess : t.wordsMore.replace("{n}", String(allWords.length - WORD_LIMIT))}
              </div>
            )}
          </div>
        </div>

        {/* ---- the detail card for the word in hand ---- */}
        {def && shownDefIdx !== null && (
          <div className="fm-rise-fast" style={{ margin: "18px 0 0", padding: "16px 18px 17px", borderRadius: 14, background: CREAM, border: "1px solid #E7E1DA" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(18px,4.6cqw,24px)", lineHeight: 1.1, color: "#464039" }}>
              {allWords[shownDefIdx]}
            </div>
            <p style={{ margin: "7px 0 0", fontSize: "clamp(12px,2.85cqw,14.5px)", lineHeight: 1.7, color: INK }}>{def[0]}</p>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,84px) 1fr", gap: "7px clamp(10px,2.4cqw,16px)", margin: "14px 0 0", paddingTop: 13, borderTop: "1px solid #EFEAE3" }}>
              {([
                [t.defBody, def[1], "#C2603A", INK],
                [t.defOut, def[2], "#C2603A", INK],
                [t.defUnder, def[3], SAGE, "#3c5c4c"],
              ] as const).map(([label, value, labelColor, valueColor]) => (
                <Fragment key={label}>
                  <div style={{ fontSize: "clamp(9px,2.05cqw,10.5px)", fontWeight: 600, letterSpacing: ".11em", textTransform: "uppercase", color: labelColor, lineHeight: 1.5, paddingTop: 1 }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "clamp(11.5px,2.7cqw,13.5px)", lineHeight: 1.62, color: valueColor }}>
                    {value}
                  </div>
                </Fragment>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, margin: "13px 0 0", fontSize: "clamp(10.5px,2.4cqw,12.5px)", lineHeight: 1.6, color: MUTE, fontStyle: "italic" }}>
              <span style={{ flex: "none", fontStyle: "normal" }}>{t.defNot}:</span>
              <span>{def[4]}</span>
            </div>
          </div>
        )}

        {/* ---- what usually sits behind this family ---- */}
        {isTable && (
          <div style={{ margin: "22px 0 0", borderRadius: 12, border: "1px solid #E7E1DA", background: "rgba(250,248,245,.7)", overflow: "hidden" }}>
            <div
              role="button"
              tabIndex={0}
              aria-expanded={behindOpen}
              onClick={() => setBehindOpen((v) => !v)}
              onKeyDown={onEnterOrSpace(() => setBehindOpen((v) => !v))}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "15px 18px", ...clickable }}
            >
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: "clamp(15px,3.9cqw,20px)", lineHeight: 1.2, color: SAGE }}>
                {behindPrompt}
              </div>
              <div style={{ flex: "none", width: 24, height: 24, borderRadius: 999, border: `1px solid ${SAGE_PALE}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: SAGE, transition: "transform .5s cubic-bezier(.22,1,.36,1)", transform: behindOpen ? "rotate(135deg)" : "rotate(0deg)" }}>
                +
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateRows: behindOpen ? "1fr" : "0fr", transition: "grid-template-rows .5s cubic-bezier(.22,1,.36,1)" }}>
              <div style={{ overflow: "hidden", minHeight: 0 }}>
                <div style={{ padding: "0 18px 18px" }}>
                  <p style={{ margin: 0, fontSize: "clamp(12px,2.85cqw,14.5px)", lineHeight: 1.74, color: INK }}>{fam.behind}</p>
                  {fam.list && behindOpen && (
                    <div style={{ margin: "14px 0 0", padding: "14px 16px", borderRadius: 12, background: SAGE_PALE }}>
                      <div style={{ fontSize: "clamp(9.5px,2.15cqw,11px)", fontWeight: 600, letterSpacing: ".13em", textTransform: "uppercase", color: "#3c5c4c" }}>
                        {fam.listLabel}
                      </div>
                      <div style={{ margin: "8px 0 0", fontSize: "clamp(11.5px,2.6cqw,13.5px)", lineHeight: 1.8, color: "#3c5c4c" }}>{fam.list}</div>
                    </div>
                  )}
                  <p style={{ margin: "13px 0 0", fontSize: "clamp(10.5px,2.4cqw,12.5px)", lineHeight: 1.66, color: MUTE, fontStyle: "italic" }}>
                    {t.behindCaveat}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "24px 0 0", paddingTop: 18, borderTop: "1px solid #E7E1DA" }}>
          <div
            className="fm-deeper"
            role="button"
            tabIndex={0}
            onClick={() => setActive(inward)}
            onKeyDown={onEnterOrSpace(() => setActive(inward))}
            style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 16px 8px 13px", borderRadius: 999, background: SAGE_PALE, ...clickable, transition: "all .4s cubic-bezier(.4,0,.2,1)" }}
          >
            <span style={{ fontSize: "clamp(11.5px,2.5cqw,13px)", color: "inherit" }}>{nextArrow}</span>
            <span style={{ fontSize: "clamp(11.5px,2.5cqw,13px)", fontWeight: 600, color: "inherit" }}>
              {t[`s${inward}` as "s1"].short}
            </span>
          </div>
          <div
            className="fm-clear"
            role="button"
            tabIndex={0}
            onClick={() => setMarked({})}
            onKeyDown={onEnterOrSpace(() => setMarked({}))}
            style={{ padding: "7px 15px", borderRadius: 999, border: "1px solid #E7E1DA", fontSize: "clamp(11px,2.35cqw,12px)", fontWeight: 600, color: SAGE, ...clickable, whiteSpace: "nowrap", transition: "all .4s cubic-bezier(.4,0,.2,1)" }}
          >
            {t.clear}
          </div>
        </div>

    </>
  );

  return (
    /* `ph-no-capture` belts the braces on the /take/* PostHog config: even if
       autocapture were ever switched back on, the chips — whose text is the
       feeling someone just marked — must never be sent as $el_text. One
       $pageview when the page opens is the whole of what leaves here. */
    <div className="fm-root ph-no-capture">
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <h1
        className="fm-h1"
        style={{
          fontFamily: "'Cormorant Garamond',Georgia,serif",
          fontWeight: 300,
          fontSize: FS_H1,
          lineHeight: 1.06,
          letterSpacing: "-.01em",
          margin: 0,
          color: "#464039",
          maxWidth: "22ch",
        }}
      >
        {t.title}
      </h1>

      <div className="fm-intro" style={{ display: "flex", flexWrap: "wrap", gap: 30, margin: "20px 0 0" }}>
        <p style={{ margin: 0, flex: "1 1 400px", maxWidth: "58ch", fontSize: FS_INTRO, lineHeight: 1.75, color: INK }}>
          {t.intro}
        </p>
        <p style={{ margin: 0, flex: "0 1 240px", maxWidth: "32ch", fontSize: FS_NOTE, lineHeight: 1.7, color: MUTE, fontStyle: "italic" }}>
          {t.intro2}
        </p>
      </div>

      <div className="fm-main">
        {/* ------------------------------ the wheel ------------------------------ */}
        <div className="fm-wheel-col">
          <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", containerType: "inline-size" }}>
            <svg
              viewBox="0 0 720 720"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
            >
              {OUTER_RINGS.map((o) => (
                <circle
                  key={o.id}
                  cx="360"
                  cy="360"
                  r={o.r}
                  fill="none"
                  strokeWidth={o.w}
                  stroke={ringVals(o.id).bg}
                  role="button"
                  tabIndex={0}
                  aria-label={ringVals(o.id).name}
                  onClick={(e) => goToRing(o.id, e.currentTarget)}
                  onKeyDown={onEnterOrSpace(() => goToRing(o.id))}
                  onMouseEnter={() => setHoverRing(o.id)}
                  onMouseLeave={() => setHoverRing((h) => (h === o.id ? null : h))}
                  style={arcTransition}
                />
              ))}

              {/* The six segments carry no visible ring name any more, so the
                  group is what tells a screen reader what is being chosen. */}
              <g role="group" aria-label={t.chooseLabel}>
                {ARCS.map((d, k) => (
                  <path
                    key={k}
                    d={d}
                    fill="none"
                    strokeWidth={76}
                    stroke={famVals(k).stroke}
                    role="button"
                    tabIndex={0}
                    aria-label={families[k].t}
                    onClick={(e) => pickFam(k, e.currentTarget)}
                    onKeyDown={onEnterOrSpace(() => pickFam(k))}
                    onMouseEnter={() => setHoverFam(k)}
                    onMouseLeave={() => setHoverFam((h) => (h === k ? null : h))}
                    style={arcTransition}
                  />
                ))}
              </g>

              <circle
                cx="360"
                cy="360"
                r={117}
                fill="none"
                strokeWidth={42}
                stroke={ringVals(4).bg}
                role="button"
                tabIndex={0}
                aria-label={ringVals(4).name}
                onClick={(e) => goToRing(4, e.currentTarget)}
                onKeyDown={onEnterOrSpace(() => goToRing(4))}
                onMouseEnter={() => setHoverRing(4)}
                onMouseLeave={() => setHoverRing((h) => (h === 4 ? null : h))}
                style={arcTransition}
              />
              <circle
                cx="360"
                cy="360"
                r={92}
                fill={r5.bg}
                role="button"
                tabIndex={0}
                aria-label={ringVals(5).name}
                onClick={(e) => goToRing(5, e.currentTarget)}
                onKeyDown={onEnterOrSpace(() => goToRing(5))}
                onMouseEnter={() => setHoverRing(5)}
                onMouseLeave={() => setHoverRing((h) => (h === 5 ? null : h))}
                style={{ cursor: "pointer", transition: "fill .5s cubic-bezier(.22,1,.36,1)" }}
              />
            </svg>

            {/* Family labels sit above the SVG so they can wrap and use cq units. */}
            {ARC_LABEL_POS.map((p, k) => (
              <div
                key={k}
                onClick={(e) => pickFam(k, e.currentTarget)}
                onMouseEnter={() => setHoverFam(k)}
                onMouseLeave={() => setHoverFam((h) => (h === k ? null : h))}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: p.left,
                  top: p.top,
                  width: p.width,
                  transform: "translate(-50%,-50%)",
                  textAlign: "center",
                  lineHeight: 1.06,
                  ...clickable,
                  fontFamily: "'Cormorant Garamond',Georgia,serif",
                  fontSize: p.size,
                  transition: "color .5s ease",
                  color: famVals(k).fg,
                }}
              >
                {famVals(k).label}
              </div>
            ))}

            {/* Ring names. The circle underneath already carries the same name
                as its accessible label, so these are decorative to a reader. */}
            {[...OUTER_RINGS, { id: 4, top: "33.75%", fs: "max(9.5px,2.3cqw)" }].map((o) => (
              <div
                key={o.id}
                onClick={(e) => goToRing(o.id, e.currentTarget)}
                onMouseEnter={() => setHoverRing(o.id)}
                onMouseLeave={() => setHoverRing((h) => (h === o.id ? null : h))}
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: o.top,
                  transform: "translate(-50%,-50%)",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  ...clickable,
                  fontFamily: "Lora,Georgia,serif",
                  fontWeight: 600,
                  fontSize: o.fs,
                  letterSpacing: ".11em",
                  lineHeight: 1,
                  transition: "color .5s ease",
                  color: ringVals(o.id).fg,
                }}
              >
                {ringVals(o.id).up}
              </div>
            ))}

            <div
              onClick={(e) => goToRing(5, e.currentTarget)}
              aria-hidden="true"
              onMouseEnter={() => setHoverRing(5)}
              onMouseLeave={() => setHoverRing((h) => (h === 5 ? null : h))}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%,-50%)",
                width: `${CENTRE_BOX}%`,
                textAlign: "center",
                ...clickable,
                display: "flex",
                flexDirection: "column",
                gap: 2,
                alignItems: "center",
              }}
            >
              <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: centreFs, lineHeight: 1.1, transition: "color .5s ease", color: r5.fg }}>
                {r5.label}
              </div>
              <div style={{ fontSize: "max(7.5px, 1.9cqw)", letterSpacing: ".05em", textTransform: "uppercase", lineHeight: 1.35, transition: "color .5s ease", color: r5.sub }}>
                {r5.tally}
              </div>
            </div>
          </div>

          {ringNav("wheel")}
        </div>

        {/* On mobile this same markup is what the bottom sheet shows. */}
        {!isMobile && <div className="fm-rise fm-panel">{panel}</div>}
      </div>

      {isMobile && sheetOpen && (
        <>
          <div className="fm-scrim" onClick={closeSheet} aria-hidden="true" />
          <div
            className="fm-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="fm-sheet-title"
            tabIndex={-1}
            ref={sheetRef}
          >
            <div
              className="fm-sheet-grip"
              onPointerDown={onGripDown}
              role="button"
              tabIndex={0}
              aria-label={t.sheetClose}
              onKeyDown={onEnterOrSpace(closeSheet)}
            >
              <span />
            </div>
            {/* The panel below names the open ring already, and is what
                aria-labelledby points at — no second copy of it here. */}
            <div className="fm-sheet-head" style={{ justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={closeSheet}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid #E7E1DA",
                  background: "transparent",
                  fontFamily: "inherit",
                  fontSize: 12,
                  fontWeight: 600,
                  color: SAGE,
                  cursor: "pointer",
                }}
              >
                {t.sheetClose}
              </button>
            </div>
            <div className="fm-sheet-body" style={{ containerType: "inline-size" }}>
              {panel}
            </div>
            <div className="fm-sheet-nav">{ringNav("sheet")}</div>
          </div>
        </>
      )}

      <div className="fm-tail">
      {/* The closing statement of the page, so it sits above the cards and at
          body size across the full measure — not as a footnote under them. */}
      <div style={{ margin: "clamp(38px,5vw,62px) 0 0", paddingTop: 26, borderTop: "1px solid #E7E1DA" }}>
        <p style={{ margin: 0, fontSize: FS_INTRO, lineHeight: 1.8, color: INK }}>{t.foot1}</p>
        <p style={{ margin: "16px 0 0", fontSize: FS_INTRO, lineHeight: 1.8, color: INK }}>{t.foot2}</p>
      </div>

      {/* ------------------------------- the cards ------------------------------- */}
      <div className="fm-cards">
        <div className="fm-card" style={{ borderRadius: 16, background: "#E9F0EC", border: "1px solid #D7E3DC" }}>
          <div style={{ fontSize: FS_KICKER, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: SAGE }}>{t.missingKicker}</div>
          <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 400, lineHeight: 1.18, margin: "9px 0 0", color: "#464039" }}>
            {t.missingTitle}
          </h3>
          <p style={{ margin: "10px 0 0", lineHeight: 1.72, color: "#4a5b51" }}>
            {FEEDBACK_URL ? t.missingBodyForm : t.missingBody}
          </p>
          <div style={{ display: "flex", margin: "18px 0 0" }}>
            {FEEDBACK_URL ? (
              <a
                className="fm-open"
                href={FEEDBACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "10px 22px", borderRadius: 999, background: SAGE, color: CREAM, fontSize: FS_CARD_BODY, fontWeight: 600, textDecoration: "none", transition: "all .35s cubic-bezier(.4,0,.2,1)" }}
              >
                {t.missingOpen}
                <span style={{ fontSize: 13 }}>↗</span>
              </a>
            ) : (
              <span
                aria-disabled="true"
                style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "10px 22px", borderRadius: 999, background: SAGE, color: CREAM, fontSize: FS_CARD_BODY, fontWeight: 600, opacity: 0.45, cursor: "not-allowed", userSelect: "none" }}
              >
                {t.missingOpen}
                <span style={{ fontSize: 13 }}>↗</span>
              </span>
            )}
          </div>
          {!FEEDBACK_URL && (
            <div style={{ margin: "14px 0 0", fontSize: FS_TINY, lineHeight: 1.6, color: "#7d9a8b" }}>
              {t.missingSoon}
            </div>
          )}
        </div>

        <div className="fm-card" style={{ borderRadius: 16, background: "#F3EFE8", border: "1px solid #E7E1DA" }}>
          <div style={{ fontSize: FS_KICKER, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "#C2603A" }}>{t.supportKicker}</div>
          <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontWeight: 400, lineHeight: 1.18, margin: "9px 0 0", color: "#464039" }}>
            {t.supportTitle}
          </h3>
          <p style={{ margin: "10px 0 0", lineHeight: 1.72, color: INK }}>{t.supportBody}</p>

          {/* Two long hex strings are most of this card's height, and nobody
              reads them until they mean to give — so they start folded and the
              two cards start the same height. */}
          <div style={{ display: "flex", margin: "18px 0 0" }}>
            <button
              type="button"
              className="fm-more"
              aria-expanded={addrOpen}
              aria-controls="fm-addresses"
              onClick={() => setAddrOpen((v) => !v)}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: FS_CARD_BODY,
                fontWeight: 600,
                color: SAGE,
                background: "transparent",
                border: "1px dashed #C7D8CD",
                transition: "all .35s cubic-bezier(.4,0,.2,1)",
              }}
            >
              {addrOpen ? t.hideAddresses : t.showAddresses}
            </button>
          </div>
          <div id="fm-addresses" style={{ display: addrOpen ? "grid" : "none", gap: 10, margin: "14px 0 0" }}>
            {COINS.map((c) => (
              <div key={c.name} style={{ padding: "13px 15px 14px", borderRadius: 14, background: CREAM, border: "1px solid #E7E1DA" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
                    <span style={{ fontSize: FS_CARD_BODY, fontWeight: 600, color: "#464039" }}>{c.name}</span>
                    <span style={{ fontSize: FS_KICKER, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: MUTE }}>{c.net}</span>
                  </div>
                  <div
                    className="fm-copy"
                    role="button"
                    tabIndex={0}
                    aria-label={t.copyAddrAria.replace("{c}", c.name)}
                    onClick={() => copyAddr(c)}
                    onKeyDown={onEnterOrSpace(() => copyAddr(c))}
                    style={{ padding: "7px 15px", borderRadius: 999, background: SAGE, color: CREAM, fontSize: FS_SMALL, fontWeight: 600, ...clickable, whiteSpace: "nowrap", transition: "all .35s cubic-bezier(.4,0,.2,1)" }}
                  >
                    {t.copyAddr}
                  </div>
                </div>
                <div style={{ margin: "9px 0 0", fontFamily: "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace", fontSize: FS_MONO, lineHeight: 1.68, letterSpacing: ".01em", color: INK, wordBreak: "break-all", userSelect: "all" }}>
                  {c.addr}
                </div>
              </div>
            ))}
            <div aria-live="polite" style={{ minHeight: 18, margin: "1px 0 0", fontSize: FS_SMALL, fontWeight: 600, color: SAGE, transition: "opacity .4s ease", opacity: payStatus ? 1 : 0 }}>
              {payStatus}
            </div>
            <div style={{ margin: "-6px 0 0", fontSize: FS_TINY, lineHeight: 1.6, color: MUTE }}>{t.donateNote}</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default FeelingsMap;
