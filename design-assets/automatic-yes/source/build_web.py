# -*- coding: utf-8 -*-
"""Build the web prototype of "The automatic yes" from content.py.

One self-contained HTML file: the page *body* for humanheart.life/en/take/automatic-yes,
styled with the site's own tokens (cream, sage, terracotta, Lora) plus the
thumbnail's peach + Fraunces for the hero. The site header/footer wrap it.
"""
import os, sys, base64
from html import escape as esc
HERE = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, HERE)
import content as C

FONTS = os.path.join(HERE, "fonts")
OUT = os.path.join(HERE, "out", "web-prototype.html")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
PORTRAIT = os.path.join(HERE, "assets", "portrait-640.jpg")
W = C.WEB


def b64(path):
    return base64.b64encode(open(path, "rb").read()).decode()


def face(family, file, weight, style):
    return (f"@font-face{{font-family:'{family}';src:url(data:font/woff2;base64,{b64(os.path.join(FONTS, file))}) "
            f"format('woff2');font-weight:{weight};font-style:{style};font-display:swap}}")


FACES = "\n".join([
    face("Fraunces", "fraunces-latin-full-normal.woff2", "100 900", "normal"),
    face("Fraunces", "fraunces-latin-full-italic.woff2", "100 900", "italic"),
    face("Lora", "lora-latin-wght-normal.woff2", "400 700", "normal"),
    face("Lora", "lora-latin-wght-italic.woff2", "400 700", "italic"),
    face("Cormorant Garamond", "cormorant-garamond-latin-500-italic.woff2", "500", "italic"),
])

FIGURE_PATH = ('M75 8c-14 0-24 12-24 29 0 14 7 25 16 29v12c-2 5-12 8-26 12-18 5-28 16-29 34l-2 106h130'
               'l-2-106c-1-18-11-29-29-34-14-4-24-7-26-12V66c9-4 16-15 16-29 0-17-10-29-24-29z')

CSS = """
:root{
  --bg:#FAF8F5; --panel:#F3EFE8; --panel-2:#F6F2EC; --border:#E7E1DA; --border-soft:#EFEAE3;
  --head:#464039; --ink:#5c554e; --mute:#8A8075; --kicker:#C2603A; --accent:#D17147;
  --sage:#437059; --sage-dark:#3c5c4c; --sage-pale:#E0EBE6; --sage-panel:#E9F0EC; --sage-line:#D7E3DC;
  --peach:#D8A98B; --peach-deep:#C69A7F; --peach-ink:#211811; --olive:#232A21; --olive-cream:#EFEBE1; --tan:#C4A78C;
  --radius:16px;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.75 Lora,Georgia,serif;font-kerning:normal}
a{color:var(--sage);font-weight:600;text-decoration:none}
a:hover{text-decoration:underline;text-underline-offset:3px}
.ay{max-width:980px;margin:0 auto;padding:clamp(26px,4vw,60px) clamp(18px,4vw,40px) 90px}
.col{max-width:720px}
.kicker{font:600 11px/1.3 Lora,serif;letter-spacing:.13em;text-transform:uppercase;color:var(--kicker)}
.crumb{font-size:14.5px;margin:0 0 18px}
.crumb a{font-weight:600}
.crumb span{color:var(--mute)}

/* hero: the thumbnail, carried onto the page */
.hero{position:relative;overflow:hidden;background:var(--peach);color:var(--peach-ink);border-radius:20px;
      padding:clamp(26px,5vw,54px);display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);
      gap:clamp(24px,4vw,44px);align-items:end}
.hero-text{position:relative;z-index:1}
@media(max-width:760px){.hero{grid-template-columns:1fr;align-items:start}}
.hero .kicker{color:var(--peach-ink);opacity:.8}
.hero h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-variation-settings:'opsz' 144,'SOFT' 0,'WONK' 0;
         font-size:clamp(50px,8.6vw,92px);line-height:.9;letter-spacing:-.015em;margin:14px 0 0}
.hero h1 em{display:block;font-style:italic;font-weight:560}
.hero-sub{font-size:clamp(17px,2.1vw,19px);line-height:1.5;margin:22px 0 0;max-width:30ch}
.hero-meta{font-size:14px;margin:12px 0 0;opacity:.85;max-width:36ch}
.signup{position:relative;z-index:1;background:var(--bg);color:var(--ink);border-radius:var(--radius);padding:22px 22px 18px;
        box-shadow:0 18px 40px -18px rgba(33,24,17,.45)}
.signup h2,.letter h2{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:520;
        font-size:21px;line-height:1.2;margin:0;color:var(--head)}
.signup p{margin:6px 0 0;font-size:14.5px;line-height:1.6}
.fld{margin-top:14px}
.fld label.lbl{display:block;font-size:12.5px;font-weight:600;color:var(--head);margin-bottom:6px}
.fld input[type=email]{width:100%;border:1px solid var(--border);border-radius:999px;padding:12px 18px;font:15px Lora,Georgia,serif;
        background:#fff;color:var(--head);outline:none;transition:border-color .3s,box-shadow .3s}
.fld input[type=email]:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(67,112,89,.15)}
.consent{display:flex;gap:10px;align-items:flex-start;margin-top:12px;font-size:13.5px;line-height:1.55;cursor:pointer}
.consent input{margin-top:3px;accent-color:var(--sage);width:16px;height:16px;flex:none}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:999px;padding:13px 26px;
     font:600 15px Lora,Georgia,serif;color:#FAF8F5;background:linear-gradient(135deg,hsl(150 25% 35%) 0%,hsl(150 30% 45%) 100%);
     box-shadow:0 4px 20px -4px rgba(70,64,57,.18);cursor:pointer;transition:transform .3s,box-shadow .3s;text-decoration:none}
.btn:hover{transform:translateY(-2px);box-shadow:0 20px 50px -15px rgba(70,64,57,.25);text-decoration:none}
.btn:focus-visible{outline:2px solid var(--sage);outline-offset:3px}
.btn.full{width:100%;margin-top:14px}
.btn.ghost{background:transparent;color:var(--sage);border:1px solid var(--border);box-shadow:none}
.btn.ghost:hover{background:var(--sage-pale);border-color:var(--sage)}
.small{font-size:12.5px;line-height:1.55;color:var(--mute);margin-top:10px}
.small a{font-weight:600}
.msg{display:none;margin-top:12px;padding:12px 14px;border-radius:12px;font-size:14px;line-height:1.55}
.msg.ok{display:block;background:var(--sage-pale);color:var(--sage-dark)}
.msg.err{display:block;background:#F7E7DF;color:#8A3F22}

.onpage p{margin:0}
.keep{display:flex;gap:12px;align-items:flex-start;margin-top:14px;cursor:pointer}
.keep input{appearance:none;-webkit-appearance:none;flex:none;width:38px;height:22px;border-radius:999px;background:#C9D8CF;position:relative;margin:2px 0 0;cursor:pointer;transition:background .3s}
.keep input::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .3s}
.keep input:checked{background:var(--sage)}
.keep input:checked::after{transform:translateX(16px)}
.keep input:focus-visible{outline:2px solid var(--sage);outline-offset:2px}
.keep b{display:block;font-weight:600;color:var(--sage-dark);font-size:14.5px;line-height:1.4}
.keep small{display:block;font-size:13px;line-height:1.5;color:var(--sage-dark);opacity:.85}
.confirmed{margin:0 0 18px;padding:14px 18px;border-radius:14px;background:var(--sage-pale);color:var(--sage-dark);font-size:15px}
.onpage{margin:26px 0 0;padding:16px 20px;border-radius:14px;background:var(--sage-panel);border:1px solid var(--sage-line);
        color:var(--sage-dark);font-size:15px;line-height:1.65}

/* sections */
section.sec{margin-top:clamp(56px,8vw,88px)}
h2.title{font-family:Fraunces,Georgia,serif;font-weight:420;font-variation-settings:'opsz' 72,'SOFT' 0,'WONK' 0;
         font-size:clamp(30px,4.6vw,42px);line-height:1.08;letter-spacing:-.005em;color:var(--head);margin:10px 0 0}
.lead p{margin:16px 0 0}
.quote{margin:22px 0 0;padding:2px 0 2px 20px;border-left:2px solid var(--kicker)}
.quote q{quotes:none;display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;
         font-size:clamp(21px,2.6vw,25px);line-height:1.3;color:var(--head)}
.quote .attr{margin-top:8px;font:600 10.5px/1.4 Lora,serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mute)}

.howto{display:grid;grid-template-columns:110px 1fr;gap:10px 18px;margin:26px 0 0}
.howto dt{font:600 11px/2.1 Lora,serif;letter-spacing:.13em;text-transform:uppercase;color:var(--sage-dark)}
.howto dd{margin:0;font-size:15.5px;line-height:1.7}
@media(max-width:560px){.howto{grid-template-columns:1fr;gap:2px}.howto dd{margin-bottom:10px}}
h3.sub{font-family:Fraunces,Georgia,serif;font-weight:440;font-variation-settings:'opsz' 48,'SOFT' 0,'WONK' 0;font-size:24px;line-height:1.2;
       color:var(--head);margin:44px 0 0}
.lenses{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
@media(max-width:760px){.lenses{grid-template-columns:1fr}}
.lens{background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:22px 22px 20px}
.lens .yr{font:600 11px/1 Lora,serif;letter-spacing:.13em;color:var(--kicker)}
.lens .who{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:480;font-size:19px;line-height:1.15;color:var(--head);margin-top:10px}
.lens .what{font-style:italic;color:var(--sage-dark);font-size:14.5px;margin-top:10px}
.lens .gloss{font-size:14.5px;line-height:1.65;margin-top:4px}
.lens a{display:inline-block;margin-top:12px;font-size:14px}

/* prompts */
.blocks{margin-top:34px}
.qb{display:grid;grid-template-columns:34px minmax(0,1fr);column-gap:8px;margin:0 0 30px;border:0;padding:0;min-width:0}
.qb > .num{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 48,'SOFT' 0,'WONK' 0;font-weight:500;font-size:21px;line-height:1.35;color:var(--kicker)}
.q{display:block;font-weight:500;color:var(--head);font-size:16.5px;line-height:1.55;padding:0}
legend.q{float:left;width:100%}
.hint{font-style:italic;color:var(--mute);font-size:14.5px;margin-top:2px}
.qb textarea,.qb input[type=text]{width:100%;margin-top:10px;border:1px solid var(--border);border-radius:12px;background:#fff;
        padding:11px 14px;font:15.5px/1.6 Lora,Georgia,serif;color:var(--head);resize:none;outline:none;transition:border-color .3s,box-shadow .3s}
.qb textarea{min-height:56px;overflow:hidden}
.qb textarea:focus,.qb input[type=text]:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(67,112,89,.13)}
.pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;clear:both}
.pill{position:relative;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--border);border-radius:999px;
      padding:8px 15px;background:rgba(250,248,245,.75);font-size:14.5px;line-height:1.3;color:var(--ink);cursor:pointer;
      transition:all .35s cubic-bezier(.4,0,.2,1);user-select:none}
.pill:hover{border-color:var(--accent)}
.pill input{position:absolute;opacity:0;width:1px;height:1px}
.pill:has(input:checked){background:var(--accent);border-color:var(--accent);color:#FAF8F5}
.pill:has(input:focus-visible){outline:2px solid var(--sage);outline-offset:2px}
.pill.other{padding:4px 6px 4px 15px}
.pill.other input[type=text]{position:static;opacity:1;width:170px;height:auto;margin:0;border:0;border-bottom:1px solid var(--border);border-radius:0;
      padding:4px 6px;font:14.5px Lora,Georgia,serif;background:transparent;color:var(--head)}
.pill.other:has(input[type=checkbox]:checked) input[type=text]{color:#FAF8F5;border-color:rgba(250,248,245,.6)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.two .clabel{font-style:italic;color:var(--sage-dark);font-size:14.5px;margin-top:12px}
@media(max-width:560px){.two{grid-template-columns:1fr;gap:0}}
.figwrap{display:grid;grid-template-columns:minmax(0,1fr) 170px;gap:24px;align-items:start}
@media(max-width:560px){.figwrap{grid-template-columns:1fr}.figwrap .map{max-width:200px;margin:0 auto}}
.map svg{width:100%;height:auto;display:block;cursor:crosshair;touch-action:manipulation}
.map .cap{font-size:12.5px;color:var(--mute);text-align:center;margin-top:6px;line-height:1.4}
.frow{display:grid;grid-template-columns:190px minmax(0,1fr);gap:4px 18px;padding:14px 0;border-top:1px solid var(--border-soft)}
.frow:last-child{border-bottom:1px solid var(--border-soft)}
.frow .fl{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 24,'SOFT' 0,'WONK' 0;font-weight:500;color:var(--head);font-size:17px;line-height:1.25}
.frow .fh{font-style:italic;color:var(--mute);font-size:14px;line-height:1.45;margin-top:2px}
.frow textarea{margin-top:0}
@media(max-width:560px){.frow{grid-template-columns:1fr}}
.grow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px 16px;align-items:center;padding:12px 0;border-top:1px solid var(--border-soft)}
.grow:last-child{border-bottom:1px solid var(--border-soft)}
.grow input[type=text]{margin-top:0}
.grow .pills{margin-top:0;flex-wrap:nowrap}
@media(max-width:640px){.grow{grid-template-columns:1fr}.grow .pills{flex-wrap:wrap}}
.sublist .sq{font-style:italic;color:var(--ink);font-size:15px;margin-top:16px}
.sublist textarea{margin-top:6px}
.example{margin:0 0 30px 42px;padding-left:16px;border-left:2px solid var(--sage);font-style:italic;color:var(--sage-dark);font-size:15px;line-height:1.65}

/* the turn */
.turn{margin-top:clamp(56px,8vw,88px);background:var(--olive);color:var(--olive-cream);border-radius:20px;text-align:center;
      padding:clamp(48px,8vw,96px) clamp(22px,6vw,80px)}
.turn .mark{font-style:italic;color:var(--tan);font-size:15px}
.turn q{quotes:none;display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;
        font-size:clamp(28px,4.4vw,42px);line-height:1.2;max-width:26ch;margin:18px auto 0}
.turn .attr{margin-top:18px;font:600 11px/1.4 Lora,serif;letter-spacing:.13em;text-transform:uppercase;color:var(--tan)}
.turn .rule{width:52px;height:1px;background:var(--tan);margin:36px auto 0;opacity:.8}
.turn p{max-width:44ch;margin:30px auto 0;font-size:17px;line-height:1.7}
.turn p + p{margin-top:12px;font-family:Fraunces,Georgia,serif;font-style:italic;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-size:21px}

/* pause */
.move{display:grid;grid-template-columns:48px minmax(0,1fr);gap:4px 10px;padding:22px 0;border-top:1px solid var(--border)}
.move:last-of-type{border-bottom:1px solid var(--border)}
.move .mn{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 144,'SOFT' 0,'WONK' 0;font-weight:380;font-size:44px;line-height:.9;color:var(--kicker)}
.move .mt{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:520;font-size:21px;color:var(--head);line-height:1.2}
.move .mx{margin-top:4px;font-size:15.5px}
.mfld{margin-top:12px}
.mfld label{display:block;font-style:italic;color:var(--sage-dark);font-size:14.5px}
.mfld input[type=text]{width:100%;margin-top:6px;border:1px solid var(--border);border-radius:12px;background:#fff;padding:10px 14px;
      font:15.5px Lora,Georgia,serif;color:var(--head);outline:none}
.mfld input[type=text]:focus{border-color:var(--sage);box-shadow:0 0 0 3px rgba(67,112,89,.13)}
.box-exp{margin-top:30px;background:var(--sage-panel);border:1px solid var(--sage-line);border-radius:var(--radius);padding:24px}
.box-exp h3,.stays h3{font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 36,'SOFT' 0,'WONK' 0;font-weight:520;font-size:22px;margin:0;color:var(--sage-dark)}
.box-exp p{margin:8px 0 0;color:#4a5b51;font-size:15.5px;line-height:1.7}
.box-exp .pill{background:rgba(250,248,245,.8)}
.note{margin-top:18px;font-style:italic;color:var(--mute);font-size:14.5px;line-height:1.65}
.stays{margin-top:34px;background:var(--panel);border:1px solid var(--border);border-radius:var(--radius);padding:24px}
.stays h3{color:var(--head)}

/* done */
.done{margin-top:clamp(48px,7vw,72px);padding-top:26px;border-top:1px solid var(--border);display:flex;flex-wrap:wrap;gap:12px;align-items:center}
.done .saved{font-size:13.5px;color:var(--mute);margin-left:auto}

/* letter + closing */
.letter{margin-top:clamp(48px,7vw,72px);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:end;
        background:var(--panel);border:1px solid var(--border);border-radius:20px;padding:clamp(22px,4vw,36px)}
.letter p{margin:8px 0 0;font-size:15.5px;line-height:1.7}
.letter form{display:flex;flex-wrap:wrap;gap:10px}
.letter form .fld{margin:0;flex:1 1 220px}
.letter form .btn{flex:0 0 auto}
@media(max-width:760px){.letter{grid-template-columns:1fr}}
.closing{margin-top:clamp(56px,8vw,88px);background:var(--peach);color:var(--peach-ink);border-radius:20px;padding:clamp(26px,5vw,54px)}
.closing q{quotes:none;display:block;font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-weight:500;
           font-size:clamp(24px,3.2vw,32px);line-height:1.25;max-width:30ch}
.closing .attr{margin-top:12px;font:600 11px/1.4 Lora,serif;letter-spacing:.13em;text-transform:uppercase}
.who{display:grid;grid-template-columns:150px minmax(0,1fr);gap:26px;align-items:center;margin-top:40px}
.who img{width:150px;height:150px;object-fit:cover;border-radius:16px;display:block}
.who .name{display:flex;align-items:flex-end;gap:10px;font-family:Fraunces,Georgia,serif;font-variation-settings:'opsz' 48,'SOFT' 0,'WONK' 0;font-weight:520;font-size:28px;line-height:1}
.who .role{font-style:italic;margin-top:6px}
.who p{margin:10px 0 0;font-size:15.5px;line-height:1.65}
.who .ctas{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.closing .btn.ghost{color:var(--peach-ink);border-color:rgba(33,24,17,.35)}
.closing .btn.ghost:hover{background:rgba(250,248,245,.35)}
@media(max-width:560px){.who{grid-template-columns:1fr}.who img{width:120px;height:120px}}
details.src{margin-top:26px;font-size:13.5px;line-height:1.6;color:var(--ink)}
details.src summary{cursor:pointer;font-weight:600;color:var(--sage)}
details.src ol{margin:12px 0 0;padding-left:18px}
details.src li{margin-bottom:6px}
.fine{margin-top:18px;font-size:13px;font-style:italic;color:var(--mute)}

@media (prefers-reduced-motion: reduce){*{transition:none!important}}

/* print: the answers, not the page chrome */
@media print{
  @page{size:A4;margin:16mm 16mm 18mm}
  body{background:#fff;font-size:11pt}
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
"""


def field_id(*parts):
    return "ay-" + "-".join(str(p) for p in parts)


def pills(key, options, other=False, single=False):
    t = "radio" if single else "checkbox"
    out = ['<div class="pills">']
    for i, o in enumerate(options):
        if o is None:
            continue
        if single:
            out.append(f'<label class="pill"><input type="radio" name="{key}" value="{i}" data-key="{key}"><span>{esc(o)}</span></label>')
        else:
            out.append(f'<label class="pill"><input type="checkbox" data-key="{key}-{i}"><span>{esc(o)}</span></label>')
    if other or (None in options):
        out.append(f'<label class="pill other"><input type="checkbox" data-key="{key}-other" aria-label="Other">'
                   f'<input type="text" data-key="{key}-other-text" placeholder="{esc(W["other_placeholder"])}" aria-label="{esc(W["other_placeholder"])}"></label>')
    out.append("</div>")
    return "".join(out)


def textarea(key, rows, label_id=None):
    lab = f' aria-labelledby="{label_id}"' if label_id else ""
    return f'<textarea id="{key}" data-key="{key}" rows="{rows}"{lab}></textarea>'


def qhead(b, key, as_legend=False):
    tag = "legend" if as_legend else "label"
    attr = "" if as_legend else f' for="{key}" id="{key}-q"'
    h = f'<{tag} class="q"{attr}>{esc(b["q"])}</{tag}>'
    if b.get("hint"):
        h += f'<div class="hint">{esc(b["hint"])}</div>'
    return h


def block(pid, b):
    k = b["k"]
    key = field_id(pid, b.get("n", "x"))
    num = f'<div class="num" aria-hidden="true">{b["n"]}</div>' if b.get("n") else "<div></div>"
    if k == "prompt":
        body = qhead(b, key) + textarea(key, max(2, b["lines"]))
        return f'<div class="qb">{num}<div>{body}</div></div>'
    if k == "checks":
        body = qhead(b, key, as_legend=True) + pills(key, b["options"], b.get("other"), b.get("single"))
        return f'<fieldset class="qb">{num}<div>{body}</div></fieldset>'
    if k == "figure":
        body = (f'<div class="figwrap"><div>{qhead(b, key)}{textarea(key, b["lines"])}</div>'
                f'<div class="map"><svg id="body-map" viewBox="0 0 150 230" role="img" aria-label="{esc(W["figure_label"])}">'
                f'<path d="{FIGURE_PATH}" fill="#EFE7DC" stroke="#CDBFAE" stroke-width="1.2" stroke-linejoin="round"/>'
                f'<g id="body-dots"></g></svg><div class="cap">{esc(W["figure_hint"])}</div></div></div>')
        return f'<div class="qb">{num}<div>{body}</div></div>'
    if k == "twocol":
        cols = "".join(
            f'<div><div class="clabel" id="{key}-{i}-l">{esc(lbl)}</div>{textarea(f"{key}-{i}", n, f"{key}-{i}-l")}</div>'
            for i, (lbl, n) in enumerate(b["cols"]))
        return f'<div class="qb">{num}<div><div class="q">{esc(b["q"])}</div><div class="two">{cols}</div></div></div>'
    if k == "form":
        rows = "".join(
            f'<div class="frow"><div><div class="fl" id="{key}-{i}-l">{esc(lbl)}</div><div class="fh">{esc(h)}</div></div>'
            f'{textarea(f"{key}-{i}", 2, f"{key}-{i}-l")}</div>' for i, (lbl, h) in enumerate(b["rows"]))
        return f'<div class="qb">{num}<div><div class="q">{esc(b["q"])}</div><div style="margin-top:12px">{rows}</div></div></div>'
    if k == "table":
        c1, _ = b["cols"]
        rows = "".join(
            f'<div class="grow"><input type="text" data-key="{key}-{r}" placeholder="{esc(c1)}" aria-label="{esc(c1)} {r + 1}">'
            f'{pills(f"{key}-{r}-c", b["choices"], single=True)}</div>' for r in range(b["rows"]))
        return (f'<div class="qb">{num}<div><div class="q">{esc(b["q"])}</div><div class="hint">{esc(b["hint"])}</div>'
                f'<div style="margin-top:12px">{rows}</div></div></div>')
    if k == "chew":
        subs = "".join(f'<div class="sq" id="{key}-{i}-l">{esc(q)}</div>{textarea(f"{key}-{i}", max(1, n), f"{key}-{i}-l")}'
                       for i, (q, n) in enumerate(b["subs"]))
        return f'<div class="qb">{num}<div><div class="q">{esc(b["q"])}</div><div class="sublist">{subs}</div></div></div>'
    if k == "example":
        return f'<div class="example">{esc(b["t"])}</div>'
    raise ValueError(k)


def head(kicker, title, quote=None, attr=None, lead=None, hid=None):
    h = f'<div class="kicker">{esc(kicker)}</div><h2 class="title" id="{hid}">{esc(title)}</h2>'
    if quote:
        h += f'<figure class="quote" style="margin-left:0"><q>{esc(quote)}</q><figcaption class="attr">{esc(attr)}</figcaption></figure>'
    if lead:
        h += '<div class="lead">' + "".join(f"<p>{esc(p)}</p>" for p in lead) + "</div>"
    return h


def signup_top():
    S = W["signup_top"]
    return (f'<form class="signup" id="signup-top" novalidate aria-labelledby="signup-top-t">'
            f'<h2 id="signup-top-t">{esc(S["title"])}</h2><p>{esc(S["text"])}</p>'
            f'<div class="fld"><label class="lbl" for="st-email">{esc(S["label"])}</label>'
            f'<input type="email" id="st-email" name="email" autocomplete="email" placeholder="{esc(S["placeholder"])}" required></div>'
            f'<label class="consent"><input type="checkbox" name="letter" value="yes"><span>{esc(S["consent"])}</span></label>'
            f'<button class="btn full" type="submit">{esc(S["button"])}</button>'
            f'<div class="small">{esc(S["small"])} <a href="/en/privacy">{esc(S["privacy"])}</a></div>'
            f'<div class="msg" role="status" aria-live="polite"></div></form>')


def letter_block():
    L = W["letter"]
    return (f'<section class="letter" aria-labelledby="letter-t"><div><div class="kicker">{esc(L["kicker"])}</div>'
            f'<h2 id="letter-t" style="margin-top:10px">{esc(L["title"])}</h2><p>{esc(L["text"])}</p></div>'
            f'<div><form id="signup-letter" novalidate><div class="fld"><label class="lbl" for="lt-email">{esc(W["signup_top"]["label"])}</label>'
            f'<input type="email" id="lt-email" name="email" autocomplete="email" placeholder="{esc(W["signup_top"]["placeholder"])}" required></div>'
            f'<button class="btn" type="submit" style="align-self:flex-end">{esc(L["button"])}</button></form>'
            f'<div class="small">{esc(L["small"])} <a href="/en/privacy">{esc(W["signup_top"]["privacy"])}</a></div>'
            f'<div class="msg" id="letter-msg" role="status" aria-live="polite"></div></div></section>')


def build():
    I = C.INTRO
    a, b_, c = C.TITLE_PARTS
    parts_html = []
    anchors = {0: "#now", 1: "#winnicott", 2: "#introjection"}
    lens_links = ["#ferenczi", "#winnicott", "#introjection"]
    web_need = "One recent yes you would like to look at more closely \u2014 and a pen, if you print it."
    howto = "".join(f"<dt>{esc(x)}</dt><dd>{esc(web_need if x == 'You need' else y)}</dd>" for x, y in I["howto"])
    lenses = "".join(
        f'<div class="lens"><div class="yr">{esc(yr)}</div><div class="who">{esc(who)}</div><div class="what">{esc(what)}</div>'
        f'<div class="gloss">{esc(gl)}</div><a href="{lens_links[i]}">Go to part {["two", "three", "four"][i]}</a></div>'
        for i, (yr, who, what, gl) in enumerate(I["lenses"]))

    intro = (f'<section class="sec" id="begin" aria-labelledby="begin-t"><div class="col">'
             f'{head(I["kicker"], I["title"], lead=I["paras"], hid="begin-t")}<dl class="howto">{howto}</dl></div>'
             f'<h3 class="sub">{esc(I["lenses_title"])}</h3><div class="lenses">{lenses}</div></section>')

    for p in C.PARTS:
        blocks = "".join(block(p["id"], bl) for bl in p["blocks"])
        parts_html.append(
            f'<section class="sec" id="{p["id"]}" aria-labelledby="{p["id"]}-t"><div class="col">'
            f'{head(p["kicker"], p["title"], p.get("quote"), p.get("attr"), p.get("lead"), hid=p["id"] + "-t")}'
            f'<div class="blocks">{blocks}</div></div></section>')

    T = C.TURN
    turn = (f'<section class="turn" aria-label="The turn"><div class="mark">the turn</div><q>{esc(T["quote"])}</q>'
            f'<div class="attr">{esc(T["attr"])}</div><div class="rule"></div>'
            + "".join(f"<p>{esc(x)}</p>" for x in T["paras"]) + '</section>')

    P = C.PAUSE
    moves = []
    for i, (t, x, opts, fields) in enumerate(P["moves"], 1):
        key = field_id("pause", i)
        o = ""
        if opts:
            o = pills(key, opts, single=(i == 3))
        fl = "".join(f'<div class="mfld"><label for="{key}-f{j}">{esc(lbl)}</label>'
                     f'<input type="text" id="{key}-f{j}" data-key="{key}-f{j}"></div>' for j, lbl in enumerate(fields))
        x = x.replace("on page 3", "in part one")
        moves.append(f'<div class="move"><div class="mn" aria-hidden="true">{i}</div><div><div class="mt">{esc(t)}</div>'
                     f'<div class="mx">{esc(x)}</div>{o}{fl}</div></div>')
    E = P["experiment"]
    exp = (f'<div class="box-exp"><h3>{esc(E["title"])}</h3><p>{esc(E["text"])}</p>'
           f'<div class="mfld"><label for="ay-exp-where">{esc(E["where"])}</label><input type="text" id="ay-exp-where" data-key="ay-exp-where"></div>'
           f'<div class="mfld"><label>{esc(E["try_label"])}</label>{pills("ay-exp-try", E["try"])}</div></div>')
    pause = (f'<section class="sec" id="pause" aria-labelledby="pause-t"><div class="col">'
             f'{head(P["kicker"], P["title"], lead=P["lead"], hid="pause-t")}<div style="margin-top:28px">{"".join(moves)}</div>'
             f'{exp}<p class="note">{esc(P["note"])}</p></div></section>')

    A = C.AFTER
    ablocks = "".join(block("after", bl) for bl in A["blocks"])
    stays = "".join(f'<div class="mfld"><label for="ay-stay-{i}">{esc(s)}</label><input type="text" id="ay-stay-{i}" data-key="ay-stay-{i}"></div>'
                    for i, s in enumerate(A["stays"]))
    after = (f'<section class="sec" id="after" aria-labelledby="after-t"><div class="col">'
             f'{head(A["kicker"], A["title"], lead=A.get("lead"), hid="after-t")}<div class="blocks">{ablocks}</div>'
             f'<div class="stays"><h3>{esc(A["stays_title"])}</h3>{stays}</div></div></section>')

    done = (f'<div class="done col"><button class="btn" type="button" id="ay-print">{esc(W["print"])}</button>'
            f'<button class="btn ghost" type="button" id="ay-clear">{esc(W["clear"])}</button>'
            f'<span class="saved" id="ay-saved" role="status" aria-live="polite">{esc(W["saved_off"])}</span></div>')

    K = C.CLOSING
    img = f'<img src="data:image/jpeg;base64,{b64(PORTRAIT)}" alt="Genia" width="150" height="150">' if os.path.exists(PORTRAIT) else ""
    srcs = "".join(f"<li>{s}</li>" for s in C.SOURCES)
    closing = (f'<section class="closing" aria-label="About"><q>{esc(K["quote"])}</q><div class="attr">{esc(K["attr"])}</div>'
               f'<div class="who">{img}<div><div class="name"><span>{C.AUTHOR}</span></div>'
               f'<div class="role">{C.ROLE} · Human Heart</div>'
               f'<p>{esc(K["lines"][1])}</p>'
               f'<div class="ctas"><a class="btn" href="/en#services">{esc(W["book"])}</a>'
               f'<a class="btn ghost" href="{C.YOUTUBE_URL}" rel="noopener">{esc(W["watch"])}</a></div></div></div></section>'
               f'<details class="src col"><summary>{esc(W["sources_title"])}</summary><ol>{srcs}</ol></details>'
               f'<p class="fine col">{esc(K["fine"])}</p>')

    hero = (f'<section class="hero" aria-labelledby="ay-h1">'
            f'<div class="hero-text"><div class="kicker">{esc(W["hero_kicker"])}</div>'
            f'<h1 id="ay-h1">{a} <em>{b_}</em> {c}</h1><p class="hero-sub">{esc(C.SUBTITLE)}</p>'
            f'<p class="hero-meta">{esc(W["hero_meta"])}</p></div>{signup_top()}</section>'
            f'<div class="onpage col"><p>{esc(W["on_page"])}</p>'
            f'<label class="keep"><input type="checkbox" role="switch" id="ay-keep">'
            f'<span><b>{esc(W["keep_label"])}</b><small>{esc(W["keep_help"])}</small></span></label></div>')

    notes = f"""<!--
  PROTOTYPE — page body for humanheart.life/en/take/{C.SLUG}
  The site's own Header/Footer wrap this; the fonts are inlined here only so the file previews on its own
  (the site already loads Lora and Cormorant globally, and Fraunces on /take pages).

  Meta title:        {W["meta_title"]}
  Meta description:  {W["meta_description"]}
  Take shelf card:   kind "{W["take_card"]["kind"]}" · title "{W["take_card"]["title"]}" · "{W["take_card"]["description"]}"

  Forms are not wired. #signup-top: send the PDF link; add to the letter list only if the box is ticked.
  #signup-letter: letter list, double opt-in. The booking emails already go through Brevo, which also does
  lists, double opt-in and the monthly send. /en/privacy is a placeholder link.
  Answers stay in memory; they are written to localStorage ("hh-automatic-yes-v1") only while the
  "Keep my answers on this device" switch is on, and removed when it is switched off. They are never sent anywhere.
-->"""

    js = """
(function(){
  /* Answers live in memory. They are written to this device only while the
     keep switch is on, and removed the moment it is switched off. */
  var KEY='hh-automatic-yes-v1', state={}, keep=false, stored=null;
  try{ stored = localStorage.getItem(KEY); }catch(e){}
  if(stored){ try{ state = JSON.parse(stored) || {}; keep = true; }catch(e){ state = {}; } }
  var keepEl = document.getElementById('ay-keep'), savedEl = document.getElementById('ay-saved');
  function status(){ if(savedEl) savedEl.textContent = keep ? SAVED_ON : SAVED_OFF; if(keepEl) keepEl.checked = keep; }
  function save(){ if(!keep) return; try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }
  if(keepEl) keepEl.addEventListener('change', function(){
    keep = keepEl.checked;
    if(keep){ save(); } else { try{ localStorage.removeItem(KEY); }catch(e){} }
    status();
  });
  status();
  function grow(el){ if(el.tagName!=='TEXTAREA') return; el.style.height='auto'; el.style.height=(el.scrollHeight+2)+'px'; }
  document.querySelectorAll('[data-key]').forEach(function(el){
    var k = el.getAttribute('data-key');
    if(el.type==='checkbox'){
      el.checked = !!state[k];
      el.addEventListener('change', function(){ state[k] = el.checked; save(); });
    } else if(el.type==='radio'){
      el.checked = state[k] === el.value;
      el.addEventListener('change', function(){ if(el.checked){ state[k] = el.value; save(); } });
      el.addEventListener('click', function(){ if(el.dataset.was==='1'){ el.checked=false; delete state[k]; save(); el.dataset.was='0'; } else { document.querySelectorAll('input[name="'+el.name+'"]').forEach(function(r){ r.dataset.was='0'; }); el.dataset.was='1'; } });
      if(el.checked) el.dataset.was='1';
    } else {
      if(state[k]) el.value = state[k];
      el.addEventListener('input', function(){ state[k] = el.value; save(); grow(el); });
      requestAnimationFrame(function(){ grow(el); });
    }
  });
  /* typing into "your own" ticks its pill */
  document.querySelectorAll('.pill.other input[type=text]').forEach(function(t){
    t.addEventListener('input', function(){ var cb=t.parentNode.querySelector('input[type=checkbox]'); if(t.value && !cb.checked){ cb.checked=true; cb.dispatchEvent(new Event('change')); } });
  });
  /* body map: tap to mark, tap a mark to remove */
  var svg = document.getElementById('body-map'), g = document.getElementById('body-dots');
  var NS='http://www.w3.org/2000/svg';
  function dots(){ return state['ay-body-dots'] || []; }
  function draw(){
    while(g.firstChild) g.removeChild(g.firstChild);
    dots().forEach(function(d, i){
      var c = document.createElementNS(NS,'circle');
      c.setAttribute('cx', d[0]); c.setAttribute('cy', d[1]); c.setAttribute('r', 6);
      c.setAttribute('fill', '#D17147'); c.setAttribute('fill-opacity', '.85'); c.setAttribute('stroke', '#FAF8F5'); c.setAttribute('stroke-width', '1.5');
      c.style.cursor='pointer';
      c.addEventListener('click', function(ev){ ev.stopPropagation(); var a=dots(); a.splice(i,1); state['ay-body-dots']=a; save(); draw(); });
      g.appendChild(c);
    });
  }
  if(svg){
    svg.addEventListener('click', function(ev){
      var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      var p = pt.matrixTransform(svg.getScreenCTM().inverse());
      var a = dots(); a.push([Math.round(p.x), Math.round(p.y)]); state['ay-body-dots'] = a; save(); draw();
    });
    draw();
  }
  /* print and clear */
  var pr = document.getElementById('ay-print'); if(pr) pr.addEventListener('click', function(){ window.print(); });
  var cl = document.getElementById('ay-clear'), armed = false, label = cl ? cl.textContent : '';
  if(cl) cl.addEventListener('click', function(){
    if(!armed){ armed = true; cl.textContent = CLEAR_CONFIRM; setTimeout(function(){ armed=false; cl.textContent=label; }, 4000); return; }
    state = {}; try{ localStorage.removeItem(KEY); }catch(e){} save();
    document.querySelectorAll('[data-key]').forEach(function(el){ if(el.type==='checkbox'||el.type==='radio'){ el.checked=false; el.dataset.was='0'; } else { el.value=''; grow(el); } });
    if(g) draw(); armed=false; cl.textContent=label;
  });
  /* after a double opt-in confirmation, Brevo redirects back with ?letter=confirmed */
  if(/[?&]letter=confirmed(?:&|$)/.test(location.search)){ var cb = document.getElementById('ay-confirmed'); if(cb) cb.hidden = false; }
  /* forms: prototype only — validate, then show what the live page will show */
  function wire(form, msgEl, okText, okTextLetter){
    if(!form) return;
    form.addEventListener('submit', function(ev){
      ev.preventDefault();
      var email = form.querySelector('input[type=email]');
      var ok = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email.value.trim());
      var letter = form.querySelector('input[name=letter]');
      msgEl.className = 'msg ' + (ok ? 'ok' : 'err');
      msgEl.textContent = ok ? ((letter && letter.checked && okTextLetter) ? okTextLetter : okText) : INVALID;
      if(ok){ form.querySelectorAll('input,button').forEach(function(x){ x.disabled = true; }); }
    });
  }
  wire(document.getElementById('signup-top'), document.querySelector('#signup-top .msg'), DONE_TOP, DONE_TOP_LETTER);
  wire(document.getElementById('signup-letter'), document.getElementById('letter-msg'), DONE_LETTER, null);
})();
"""
    import json
    js = (js.replace("CLEAR_CONFIRM", json.dumps(W["clear_confirm"]))
            .replace("INVALID", json.dumps(W["signup_top"]["invalid"]))
            .replace("DONE_TOP_LETTER", json.dumps(W["signup_top"]["done_with_letter"]))
            .replace("DONE_TOP", json.dumps(W["signup_top"]["done"]))
            .replace("DONE_LETTER", json.dumps(W["letter"]["done"]))
            .replace("SAVED_ON", json.dumps(W["saved_on"]))
            .replace("SAVED_OFF", json.dumps(W["saved_off"])))

    html = (f'<!doctype html><html lang="en"><head><meta charset="utf-8">'
            f'<meta name="viewport" content="width=device-width, initial-scale=1">'
            f'<title>{esc(W["meta_title"])}</title><meta name="description" content="{esc(W["meta_description"])}">'
            f'{notes}<style>{FACES}{CSS}</style></head><body><main class="ay">'
            f'<nav class="crumb" aria-label="Breadcrumb"><a href="/en/take">{esc(W["crumb"])}</a> <span>· {esc(W["crumb_here"])}</span></nav>'
            f'<div id="ay-confirmed" class="confirmed" role="status" hidden>{esc(W["confirmed"])}</div>'
            f'{hero}{intro}{"".join(parts_html)}{turn}{pause}{after}{done}{letter_block()}{closing}'
            f'</main><script>{js}</script></body></html>')
    with open(OUT, "w", encoding="utf-8") as fh:
        fh.write(html)
    print("wrote", OUT, os.path.getsize(OUT))


if __name__ == "__main__":
    build()
