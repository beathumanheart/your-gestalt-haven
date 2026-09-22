import { Fragment, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { automaticYesEN } from "@/content/automaticYes";
import { SIGNUP_ENABLED } from "@/config/signup";
import { SOCIAL_URLS } from "@/config/social";
import portraitWebp from "@/assets/portrait-640.webp";
import portraitJpg from "@/assets/portrait-640.jpg";
import WorksheetBlock from "./WorksheetBlock";
import { useWorksheetAnswers } from "./useWorksheetAnswers";
import SignupCard from "./SignupCard";
import LetterForm from "./LetterForm";

/**
 * "The automatic yes" — the worksheet page.
 *
 * English only: the content file has no Russian, and the route is generated
 * for `en` alone (see `langs` in src/config/pageMetadata.ts).
 *
 * The whole worksheet carries the no-capture markers, the same belt and braces
 * as the booking enquiry: `data-ph-no-capture` stops autocapture sending a
 * value, `ph-no-capture` stops session replay recording one. Neither is a
 * substitute for the other, and what people write here is at least as personal
 * as a booking note. No PostHog call is added anywhere on this page — /take/*
 * counts page opens and nothing else.
 */

const STYLES = `.ay{
  --bg:#FAF8F5; --panel:#F3EFE8; --panel-2:#F6F2EC; --border:#E7E1DA; --border-soft:#EFEAE3;
  --head:#464039; --ink:#5c554e; --mute:#8A8075; --kicker:#C2603A; --accent:#D17147;
  --sage:#437059; --sage-dark:#3c5c4c; --sage-pale:#E0EBE6; --sage-panel:#E9F0EC; --sage-line:#D7E3DC;
  --peach:#D8A98B; --peach-deep:#C69A7F; --peach-ink:#211811; --olive:#232A21; --olive-cream:#EFEBE1; --tan:#C4A78C;
  --radius:16px;
}
.ay a{color:var(--sage);font-weight:600;text-decoration:none}
.ay a:hover{text-decoration:underline;text-underline-offset:3px}
.ay{max-width:980px;margin:0 auto;padding:clamp(26px,4vw,60px) clamp(18px,4vw,40px) 90px}
.ay .col{max-width:720px}
.ay .kicker{font:600 11px/1.3 Lora,serif;letter-spacing:.13em;text-transform:uppercase;color:var(--kicker)}
.ay .crumb{font-size:14.5px;margin:0 0 18px}
.ay .crumb a{font-weight:600}
.ay .crumb span{color:var(--mute)}
.ay /* hero: the thumbnail, .ay carried onto the page */
.hero{position:relative;overflow:hidden;background:var(--peach);color:var(--peach-ink);border-radius:20px;
      padding:clamp(26px,5vw,54px);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);
      gap:clamp(24px,4vw,44px);align-items:end}
.ay .hero-text{position:relative;z-index:1}
@media(max-width:760px){.ay .hero{grid-template-columns:1fr;align-items:start}}
.ay .hero .kicker{color:var(--peach-ink);opacity:.8}
.ay .hero h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144,'SOFT' 0,'WONK' 0;
         font-size:clamp(50px,8.6vw,92px);line-height:.9;letter-spacing:-.015em;margin:14px 0 0}
.ay .hero h1 em{display:block;font-style:italic;font-weight:560}
.ay .hero-sub{font-size:clamp(17px,2.1vw,19px);line-height:1.5;margin:22px 0 0;max-width:30ch}
.ay .hero-meta{font-size:14px;margin:12px 0 0;opacity:.85;max-width:36ch}
.ay .signup{position:relative;z-index:1;background:var(--bg);color:var(--ink);border-radius:var(--radius);padding:22px 22px 18px;
        box-shadow:0 18px 40px -18px rgba(33,24,17,.45)}
.ay .signup h2, .ay .letter h2{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:520;
        font-size:21px;line-height:1.2;margin:0;color:var(--head)}
.ay .signup p{margin:6px 0 0;font-size:14.5px;line-height:1.6}
.ay .fld{margin-top:14px}
.ay .fld label.lbl{display:block;font-size:12.5px;font-weight:600;color:var(--head);margin-bottom:6px}
.ay .fld input[type=email]{width:100%;border:1px solid var(--border);border-radius:999px;padding:12px 18px;font:15px Lora,Georgia,serif;
        background:#fff;color:var(--head);outline:none;transition:border-color .3s,box-shadow .3s}
.ay .fld input[type=email]:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(67,112,89,.15)}
.ay .consent{display:flex;gap:10px;align-items:flex-start;margin-top:12px;font-size:13.5px;line-height:1.55;cursor:pointer}
.ay .consent input{margin-top:3px;accent-color:var(--sage);width:16px;height:16px;flex:none}
.ay .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;padding:13px 26px;
     font:600 15px Lora,Georgia,serif;color:#FAF8F5;background:linear-gradient(135deg,hsl(150 25% 35%) 0%,hsl(150 30% 45%) 100%);
     box-shadow:0 4px 20px -4px rgba(70,64,57,.18);cursor:pointer;transition:transform .3s,box-shadow .3s;text-decoration:none}
.ay .btn:hover{transform:translateY(-2px);box-shadow:0 20px 50px -15px rgba(70,64,57,.25);text-decoration:none}
.ay .btn:focus-visible{outline:2px solid var(--sage);outline-offset:3px}
.ay .btn.full{width:100%;margin-top:14px}
.ay .btn.ghost{background:transparent;color:var(--sage);border:1px solid var(--border);box-shadow:none}
.ay .btn.ghost:hover{background:var(--sage-pale);border-color:var(--sage)}
.ay .small{font-size:12.5px;line-height:1.55;color:var(--mute);margin-top:10px}
.ay .small a{font-weight:600}
.ay .msg{display:none;margin-top:12px;padding:12px 14px;border-radius:12px;font-size:14px;line-height:1.55}
.ay .msg.ok{display:block;background:var(--sage-pale);color:var(--sage-dark)}
.ay .msg.err{display:block;background:#F7E7DF;color:#8A3F22}
.ay .onpage p{margin:0}
.ay .keep{display:flex;gap:12px;align-items:flex-start;margin-top:14px;cursor:pointer}
.ay .keep input{appearance:none;-webkit-appearance:none;flex:none;width:38px;height:22px;border-radius:999px;background:#C9D8CF;position:relative;margin:2px 0 0;cursor:pointer;transition:background .3s}
.ay .keep input::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .3s}
.ay .keep input:checked{background:var(--sage)}
.ay .keep input:checked::after{transform:translateX(16px)}
.ay .keep input:focus-visible{outline:2px solid var(--sage);outline-offset:2px}
.ay .keep b{display:block;font-weight:600;color:var(--sage-dark);font-size:14.5px;line-height:1.4}
.ay .keep small{display:block;font-size:13px;line-height:1.5;color:var(--sage-dark);opacity:.85}
.ay .confirmed{margin:0 0 18px;padding:14px 18px;border-radius:14px;background:var(--sage-pale);color:var(--sage-dark);font-size:15px}
.ay .onpage{margin:26px 0 0;padding:16px 20px;border-radius:14px;background:var(--sage-panel);border:1px solid var(--sage-line);
        color:var(--sage-dark);font-size:15px;line-height:1.65}
.ay /* sections */
section.sec{margin-top:clamp(56px,8vw,88px)}
.ay h2.title{font-family:Fraunces,Georgia,serif;font-weight:420;font-variation-settings:'opsz' 72,'SOFT' 0,'WONK' 0;
         font-size:clamp(30px,4.6vw,42px);line-height:1.08;letter-spacing:-.005em;color:var(--head);margin:10px 0 0}
.ay .lead p{margin:16px 0 0}
.ay .quote{margin:22px 0 0;padding:2px 0 2px 20px;border-left:2px solid var(--kicker)}
.ay .quote q{quotes:none;display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;
         font-size:clamp(21px,2.6vw,25px);line-height:1.3;color:var(--head)}
.ay .quote .attr{margin-top:8px;font:600 10.5px/1.4 Lora,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}
.ay .howto{display:grid;grid-template-columns:110px 1fr;gap:10px 18px;margin:26px 0 0}
.ay .howto dt{font:600 11px/2.1 Lora,serif;letter-spacing:.13em;text-transform:uppercase;color:var(--sage-dark)}
.ay .howto dd{margin:0;font-size:15.5px;line-height:1.7}
@media(max-width:560px){.ay .howto{grid-template-columns:1fr;gap:2px}
.ay .howto dd{margin-bottom:10px}}
.ay h3.sub{font-family:Fraunces,Georgia,serif;font-weight:440;font-variation-settings:'opsz' 48,'SOFT' 0,'WONK' 0;font-size:24px;line-height:1.2;
       color:var(--head);margin:44px 0 0}
.ay .lenses{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
@media(max-width:760px){.ay .lenses{grid-template-columns:1fr}}
.ay .lens{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:22px 22px 20px}
.ay .lens .yr{font:600 11px/1 Lora,serif;letter-spacing:.13em;color:var(--kicker)}
.ay .lens .who{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:480;font-size:19px;line-height:1.15;color:var(--head);margin-top:10px}
.ay .lens .what{font-style:italic;color:var(--sage-dark);font-size:14.5px;margin-top:10px}
.ay .lens .gloss{font-size:14.5px;line-height:1.65;margin-top:4px}
.ay .lens a{display:inline-block;margin-top:12px;font-size:14px}
.ay /* prompts */
.blocks{margin-top:34px}
.ay .qb{display:grid;grid-template-columns:34px minmax(0,1fr);column-gap:8px;margin:0 0 30px;border:0;padding:0;min-width:0}
.ay .qb > .num{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 48,'SOFT' 0,'WONK' 0;font-weight:500;font-size:21px;line-height:1.35;color:var(--kicker)}
.ay .q{display:block;font-weight:500;color:var(--head);font-size:16.5px;line-height:1.55;padding:0}
.ay legend.q{float:left;width:100%}
.ay .hint{font-style:italic;color:var(--mute);font-size:14.5px;margin-top:2px}
.ay .qb textarea, .ay .qb input[type=text]{width:100%;margin-top:10px;border:1px solid var(--border);border-radius:12px;background:#fff;
        padding:11px 14px;font:15.5px/1.6 Lora,Georgia,serif;color:var(--head);resize:none;outline:none;transition:border-color .3s,box-shadow .3s}
.ay .qb textarea{min-height:56px;overflow:hidden}
.ay .qb textarea:focus, .ay .qb input[type=text]:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(67,112,89,.13)}
.ay .pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;clear:both}
.ay .pill{position:relative;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:999px;
      padding:8px 15px;background:rgba(250,248,245,.75);font-size:14.5px;line-height:1.3;color:var(--ink);cursor:pointer;
      transition:all .35s cubic-bezier(.4,0,.2,1);user-select:none}
.ay .pill:hover{border-color:var(--accent)}
.ay .pill input{position:absolute;opacity:0;width:1px;height:1px}
.ay .pill:has(input:checked){background:var(--accent);border-color:var(--accent);color:#FAF8F5}
.ay .pill:has(input:focus-visible){outline:2px solid var(--sage);outline-offset:2px}
.ay .pill.other{padding:4px 6px 4px 15px}
.ay .pill.other input[type=text]{position:static;opacity:1;width:170px;height:auto;margin:0;border:0;border-bottom:1px solid var(--border);border-radius:0;
      padding:4px 6px;font:14.5px Lora,Georgia,serif;background:transparent;color:var(--head)}
.ay .pill.other:has(input[type=checkbox]:checked) input[type=text]{color:#FAF8F5;border-color:rgba(250,248,245,.6)}
.ay .two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ay .two .clabel{font-style:italic;color:var(--sage-dark);font-size:14.5px;margin-top:12px}
@media(max-width:560px){.ay .two{grid-template-columns:1fr;gap:0}}
.ay .figwrap{display:grid;grid-template-columns:minmax(0,1fr) 170px;gap:24px;align-items:start}
@media(max-width:560px){.ay .figwrap{grid-template-columns:1fr}
.ay .figwrap .map{max-width:200px;margin:0 auto}}
.ay .map svg{width:100%;height:auto;display:block;cursor:crosshair;touch-action:manipulation}
.ay .map .cap{font-size:12.5px;color:var(--mute);text-align:center;margin-top:6px;line-height:1.4}
.ay .frow{display:grid;grid-template-columns:190px minmax(0,1fr);gap:4px 18px;padding:14px 0;border-top:1px solid var(--border-soft)}
.ay .frow:last-child{border-bottom:1px solid var(--border-soft)}
.ay .frow .fl{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 24,'SOFT' 0,'WONK' 0;font-weight:500;color:var(--head);font-size:17px;line-height:1.25}
.ay .frow .fh{font-style:italic;color:var(--mute);font-size:14px;line-height:1.45;margin-top:2px}
.ay .frow textarea{margin-top:0}
@media(max-width:560px){.ay .frow{grid-template-columns:1fr}}
.ay .grow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 16px;align-items:center;padding:12px 0;border-top:1px solid var(--border-soft)}
.ay .grow:last-child{border-bottom:1px solid var(--border-soft)}
.ay .grow input[type=text]{margin-top:0}
.ay .grow .pills{margin-top:0;flex-wrap:nowrap}
@media(max-width:640px){.ay .grow{grid-template-columns:1fr}
.ay .grow .pills{flex-wrap:wrap}}
.ay .sublist .sq{font-style:italic;color:var(--ink);font-size:15px;margin-top:16px}
.ay .sublist textarea{margin-top:6px}
.ay .example{margin:0 0 30px 42px;padding-left:16px;border-left:2px solid var(--sage);font-style:italic;color:var(--sage-dark);font-size:15px;line-height:1.65}
.ay /* the turn */
.turn{margin-top:clamp(56px,8vw,88px);background:var(--olive);color:var(--olive-cream);border-radius:20px;text-align:center;
      padding:clamp(48px,8vw,96px) clamp(22px,6vw,80px)}
.ay .turn .mark{font-style:italic;color:var(--tan);font-size:15px}
.ay .turn q{quotes:none;display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;
        font-size:clamp(28px,4.4vw,42px);line-height:1.2;max-width:26ch;margin:18px auto 0}
.ay .turn .attr{margin-top:18px;font:600 11px/1.4 Lora,serif;letter-spacing:.13em;text-transform:uppercase;color:var(--tan)}
.ay .turn .rule{width:52px;height:1px;background:var(--tan);margin:36px auto 0;opacity:.8}
.ay .turn p{max-width:44ch;margin:30px auto 0;font-size:17px;line-height:1.7}
.ay .turn p + p{margin-top:12px;font-family:Fraunces,Georgia,serif;font-style:italic;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-size:21px}
.ay /* pause */
.move{display:grid;grid-template-columns:48px minmax(0,1fr);gap:4px 10px;padding:22px 0;border-top:1px solid var(--border)}
.ay .move:last-of-type{border-bottom:1px solid var(--border)}
.ay .move .mn{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 144,'SOFT' 0,'WONK' 0;font-weight:380;font-size:44px;line-height:.9;color:var(--kicker)}
.ay .move .mt{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:520;font-size:21px;color:var(--head);line-height:1.2}
.ay .move .mx{margin-top:4px;font-size:15.5px}
.ay .mfld{margin-top:12px}
.ay .mfld label{display:block;font-style:italic;color:var(--sage-dark);font-size:14.5px}
.ay .mfld input[type=text]{width:100%;margin-top:6px;border:1px solid var(--border);border-radius:12px;background:#fff;padding:10px 14px;
      font:15.5px Lora,Georgia,serif;color:var(--head);outline:none}
.ay .mfld input[type=text]:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(67,112,89,.13)}
.ay .box-exp{margin-top:30px;background:var(--sage-panel);border:1px solid var(--sage-line);border-radius:var(--radius);padding:24px}
.ay .box-exp h3, .ay .stays h3{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:520;font-size:22px;margin:0;color:var(--sage-dark)}
.ay .box-exp p{margin:8px 0 0;color:#4a5b51;font-size:15.5px;line-height:1.7}
.ay .box-exp .pill{background:rgba(250,248,245,.8)}
.ay .note{margin-top:18px;font-style:italic;color:var(--mute);font-size:14.5px;line-height:1.65}
.ay .stays{margin-top:34px;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:24px}
.ay .stays h3{color:var(--head)}
.ay /* done */
.done{margin-top:clamp(48px,7vw,72px);padding-top:26px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.ay .done .saved{font-size:13.5px;color:var(--mute);margin-left:auto}
.ay /* letter + closing */
.letter{margin-top:clamp(48px,7vw,72px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:end;
        background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:clamp(22px,4vw,36px)}
.ay .letter p{margin:8px 0 0;font-size:15.5px;line-height:1.7}
.ay .letter form{display:flex;flex-wrap:wrap;gap:10px}
.ay .letter form .fld{margin:0;flex:1 1 220px}
.ay .letter form .btn{flex:0 0 auto}
@media(max-width:760px){.ay .letter{grid-template-columns:1fr}}
.ay .closing{margin-top:clamp(56px,8vw,88px);background:var(--peach);color:var(--peach-ink);border-radius:20px;padding:clamp(26px,5vw,54px)}
.ay .closing q{quotes:none;display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;
           font-size:clamp(24px,3.2vw,32px);line-height:1.25;max-width:30ch}
.ay .closing .attr{margin-top:12px;font:600 11px/1.4 Lora,serif;letter-spacing:.13em;text-transform:uppercase}
.ay .who{display:grid;grid-template-columns:150px minmax(0,1fr);gap:26px;align-items:center;margin-top:40px}
.ay .who img{width:150px;height:150px;object-fit:cover;border-radius:16px;display:block}
.ay .who .name{display:flex;align-items:flex-end;gap:10px;font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 48,'SOFT' 0,'WONK' 0;font-weight:520;font-size:28px;line-height:1}
.ay .who .role{font-style:italic;margin-top:6px}
.ay .who p{margin:10px 0 0;font-size:15.5px;line-height:1.65}
.ay .who .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.ay .closing .btn.ghost{color:var(--peach-ink);border-color:rgba(33,24,17,.35)}
.ay .closing .btn.ghost:hover{background:rgba(250,248,245,.35)}
@media(max-width:560px){.ay .who{grid-template-columns:1fr}
.ay .who img{width:120px;height:120px}}
.ay details.src{margin-top:26px;font-size:13.5px;line-height:1.6;color:var(--ink)}
.ay details.src summary{cursor:pointer;font-weight:600;color:var(--sage)}
.ay details.src ol{margin:12px 0 0;padding-left:18px}
.ay details.src li{margin-bottom:6px}
.ay .fine{margin-top:18px;font-size:13px;font-style:italic;color:var(--mute)}
@media (prefers-reduced-motion: reduce){.ay *{transition:none!important}}
.ay /* print: the answers, .ay not the page chrome */
@media print{
  @page{size:A4;margin:16mm 16mm 18mm}
.crumb,.signup,.onpage,.done,.letter,.who .ctas,details.src,.map .cap{display:none!important}
  .ay{padding:0;max-width:none}
  .hero{background:none;padding:0;display:block;border-radius:0}
  .hero h1{font-size:44pt}
  section.sec{break-before:page;margin-top:0}
  .turn{break-before:page;background:none;color:#211811;border:1px solid #ddd}
  .turn .attr,.turn .mark{color:#8A8075}
  .closing{background:none;padding:0;break-before:page}
  .qb,.frow,.grow,.move{break-inside:avoid}
  .qb textarea,.qb input[type=text],.mfld input[type=text],.grow input[type=text]{border:0;border-bottom:1px solid #bbb;border-radius:0;background:none;padding:4px 0;box-shadow:none}
  #begin{break-before:auto;margin-top:28px}
  .lens a{display:none}
  .lenses,.lens,.box-exp,.stays{break-inside:avoid}
  .pill{border-color:#bbb;background:none}
  .pill:has(input:checked){background:#e9e2da;color:#211811;border-color:#8A8075}
}
/* Print: the worksheet and the reader's answers, nothing else. */
@media print {
  header, footer, .ay .signup, .ay .onpage, .ay .done, .ay .letter,
  .ay .closing .btnrow, .ay .sources, .ay .crumb { display: none !important; }
  .ay { max-width: none; padding: 0; }
  .ay section.part { break-before: page; }
  .ay textarea, .ay input[type="text"] {
    border: 0; border-bottom: 1px solid #C9C1B8; border-radius: 0;
    resize: none; background: transparent; padding: 0 0 2px;
  }
  .ay .hero { background: none; color: inherit; box-shadow: none; padding: 0 0 12px; }
  .ay .turn, .ay .closing { background: none; color: inherit; }
}

/* A dot placed by tapping is a pointer affordance; the textarea is the route
   that always works. */
@media (prefers-reduced-motion: reduce) {
  .ay * { animation: none !important; transition: none !important; }
}

.ay .sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}
`;

const AutomaticYes = () => {
  const { langPath } = useLanguage();
  const c = automaticYesEN;
  const { answers, setAnswer, keep, toggleKeep, clear } = useWorksheetAnswers();
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<number | null>(null);

  // Brevo returns readers here after they confirm the letter.
  const confirmed =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("letter") === "confirmed";

  useEffect(() => () => {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
  }, []);

  const onClear = () => {
    if (!confirming) {
      // One tap arms it, a second within four seconds does it: clearing a
      // worksheet someone has just filled in should not be one slip away.
      setConfirming(true);
      confirmTimer.current = window.setTimeout(() => setConfirming(false), 4000);
      return;
    }
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    setConfirming(false);
    clear();
  };

  const ui = c.worksheetUi;

  return (
    <div
      className="ay ph-no-capture"
      data-ph-no-capture
    >
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      <nav className="crumb" aria-label="Breadcrumb">
        <a href={langPath("/take")}>{c.crumb}</a> <span>· {c.crumbHere}</span>
      </nav>

      {confirmed && (
        <div className="confirmed" role="status">
          {c.confirmed}
        </div>
      )}

      <section className={`hero${SIGNUP_ENABLED ? "" : " hero-solo"}`} aria-labelledby="ay-h1">
        <div className="hero-text">
          <div className="kicker">{c.hero.kicker}</div>
          <h1 id="ay-h1">
            {c.hero.title[0]} <em>{c.hero.title[1]}</em> {c.hero.title[2]}
          </h1>
          <p className="hero-sub">{c.hero.subtitle}</p>
          <p className="hero-meta">{c.hero.meta}</p>
        </div>
        {SIGNUP_ENABLED && <SignupCard c={c} />}
      </section>

      <div className="onpage col">
        <p>{c.onPage}</p>
        <label className="keep">
          <input
            type="checkbox"
            role="switch"
            checked={keep}
            aria-checked={keep}
            onChange={(event) => toggleKeep(event.target.checked)}
          />
          <span>
            <b>{c.keepLabel}</b>
            <small>{c.keepHelp}</small>
          </span>
        </label>
      </div>

      <section className="sec col" aria-labelledby="ay-intro">
        <div className="kicker">{c.intro.kicker}</div>
        <h2 className="title" id="ay-intro">
          {c.intro.title}
        </h2>
        <div className="lead">
          {c.intro.paras.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
        <dl className="howto">
          {c.intro.howto.map((row) => (
            <Fragment key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.text}</dd>
            </Fragment>
          ))}
        </dl>

        <h3 className="title">{c.intro.lensesTitle}</h3>
        <div className="lenses">
          {c.intro.lenses.map((lens) => (
            <div className="lens" key={lens.who}>
              <div className="yr">{lens.years}</div>
              <div className="who">{lens.who}</div>
              <div className="what">{lens.role}</div>
              <div className="gloss">{lens.gloss}</div>
              <a href={`#${lens.partId}`}>{lens.linkLabel}</a>
            </div>
          ))}
        </div>
      </section>

      {c.parts.map((part) => (
        <section className="sec col part" id={part.id} key={part.id} aria-labelledby={`${part.id}-t`}>
          <div className="kicker">{part.kicker}</div>
          <h2 className="title" id={`${part.id}-t`}>
            {part.title}
          </h2>
          {part.quote && (
            <div className="quote">
              <q>{part.quote.text}</q>
              <div className="attr">{part.quote.attribution}</div>
            </div>
          )}
          <div className="lead">
            {part.lead.map((para) => (
              <p key={para}>{para}</p>
            ))}
          </div>
          <div className="blocks">
            {part.blocks.map((block, index) => (
              <WorksheetBlock
                key={block.kind === "example" ? `example-${index}` : block.id}
                block={block}
                answers={answers}
                setAnswer={setAnswer}
                ui={ui}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="turn" aria-label={c.turn.attribution}>
        <div className="mark">{c.turn.mark}</div>
        <q>{c.turn.quote}</q>
        <div className="attr">{c.turn.attribution}</div>
        <hr />
        {c.turn.paras.map((para, index) => (
          <p className={index === 1 ? "wonk" : undefined} key={para}>
            {para}
          </p>
        ))}
      </section>

      <section className="sec col part" id={c.pause.id} aria-labelledby="ay-pause-t">
        <div className="kicker">{c.pause.kicker}</div>
        <h2 className="title" id="ay-pause-t">
          {c.pause.title}
        </h2>
        <div className="lead">
          {c.pause.lead.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>

        {c.pause.moves.map((move, index) => (
          <div className="move" key={move.id}>
            <span className="mn">{index + 1}</span>
            <div className="mx">
              <h3 className="mt">{move.title}</h3>
              <p>{move.text}</p>
              {move.options && (
                <fieldset>
                  <legend className="sr-only">{move.title}</legend>
                  <div className="pills">
                    {move.options.map((option) => {
                      const chosen = ((answers[move.id] as string[] | undefined) ?? []).includes(option);
                      return (
                        <label className={`pill${chosen ? " on" : ""}`} key={option}>
                          <input
                            type={move.single ? "radio" : "checkbox"}
                            name={move.id}
                            value={option}
                            checked={chosen}
                            onChange={(event) => {
                              const current = (answers[move.id] as string[] | undefined) ?? [];
                              if (move.single) {
                                setAnswer(move.id, event.target.checked ? [option] : []);
                                return;
                              }
                              setAnswer(
                                move.id,
                                event.target.checked
                                  ? [...current, option]
                                  : current.filter((one) => one !== option),
                              );
                            }}
                          />
                          <span>{option}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}
              {move.fields.map((field, fieldIndex) => {
                const id = `${move.id}-f${fieldIndex}`;
                return (
                  <div className="mfld" key={field}>
                    <label className="clabel" htmlFor={id}>
                      {field}
                    </label>
                    <textarea
                      id={id}
                      rows={2}
                      value={String(answers[id] ?? "")}
                      onChange={(event) => setAnswer(id, event.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="box-exp" id={c.pause.experiment.id}>
          <h3>{c.pause.experiment.title}</h3>
          <p>{c.pause.experiment.text}</p>
          <div>
            <label className="clabel" htmlFor="experiment-where">
              {c.pause.experiment.whereLabel}
            </label>
            <textarea
              id="experiment-where"
              rows={2}
              value={String(answers["experiment-where"] ?? "")}
              onChange={(event) => setAnswer("experiment-where", event.target.value)}
            />
          </div>
          <fieldset>
            <legend className="clabel">{c.pause.experiment.tryLabel}</legend>
            <div className="pills">
              {c.pause.experiment.tryOptions.map((option) => {
                const chosen = ((answers["experiment-try"] as string[] | undefined) ?? []).includes(option);
                return (
                  <label className={`pill${chosen ? " on" : ""}`} key={option}>
                    <input
                      type="checkbox"
                      name="experiment-try"
                      value={option}
                      checked={chosen}
                      onChange={(event) => {
                        const current = (answers["experiment-try"] as string[] | undefined) ?? [];
                        setAnswer(
                          "experiment-try",
                          event.target.checked
                            ? [...current, option]
                            : current.filter((one) => one !== option),
                        );
                      }}
                    />
                    <span>{option}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <p className="note">{c.pause.note}</p>
      </section>

      <section className="sec col part" id={c.after.id} aria-labelledby="ay-after-t">
        <div className="kicker">{c.after.kicker}</div>
        <h2 className="title" id="ay-after-t">
          {c.after.title}
        </h2>
        <div className="lead">
          {c.after.lead.map((para) => (
            <p key={para}>{para}</p>
          ))}
        </div>
        <div className="blocks">
          {c.after.blocks.map((block, index) => (
            <WorksheetBlock
              key={block.kind === "example" ? `after-example-${index}` : block.id}
              block={block}
              answers={answers}
              setAnswer={setAnswer}
              ui={ui}
            />
          ))}
        </div>

        <div className="stays">
          <h3>{c.after.staysTitle}</h3>
          <ul>
            {c.after.stays.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="done col">
        <button type="button" className="btn" onClick={() => window.print()}>
          {ui.print}
        </button>
        <button type="button" className="btn ghost" onClick={onClear}>
          {confirming ? ui.clearConfirm : ui.clear}
        </button>
        <span className="saved" role="status" aria-live="polite">
          {keep ? ui.savedOn : ui.savedOff}
        </span>
      </div>

      {SIGNUP_ENABLED && <LetterForm c={c} />}

      <section className="closing" aria-label={c.closing.name}>
        <q>{c.closing.quote}</q>
        <div className="attr">{c.closing.attribution}</div>
        <div className="who">
          <picture>
            <source srcSet={portraitWebp} type="image/webp" />
            <img src={portraitJpg} width={640} height={640} loading="lazy" decoding="async" alt={c.closing.name} />
          </picture>
          <div>
            <strong>{c.closing.name}</strong>
            <span>{c.closing.role}</span>
          </div>
        </div>
        <p className="note">{c.closing.sessions}</p>
        <div className="btnrow">
          {/* Same target as the header's button, without its analytics call:
              /take/* counts page opens and nothing else. */}
          <a className="btn" href={langPath("/#contact")}>
            {c.closing.book}
          </a>
          <a className="btn ghost" href={SOCIAL_URLS.youtube} target="_blank" rel="noopener noreferrer">
            {c.closing.watch}
          </a>
        </div>
      </section>

      <details className="sources">
        <summary>{c.sourcesTitle}</summary>
        <ul>
          {c.sources.map((source) => (
            <li key={source}>{source}</li>
          ))}
        </ul>
      </details>

      <p className="fine col">{c.closing.fine}</p>
    </div>
  );
};

export default AutomaticYes;
