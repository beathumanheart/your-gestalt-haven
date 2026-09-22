# -*- coding: utf-8 -*-
"""Build the print PDF of "The automatic yes" from content.py.

Fonts: static instances cut from the variable fonts (fonts/static), so the PDF
embeds real TrueType subsets instead of Type 3 outlines.
"""
import os, sys, json, base64
from html import escape as esc
HERE = os.path.abspath(os.path.dirname(__file__))
sys.path.insert(0, HERE)
import content as C

FONTS = os.path.join(HERE, "fonts")
STATIC = os.path.join(FONTS, "static")
OUT_HTML = os.path.join(HERE, "out", "print.html")
OUT_PDF = os.path.join(HERE, "out", "the-automatic-yes-human-heart.pdf")
PORTRAIT = os.path.join(HERE, "assets", "portrait-640.jpg")

# Upper-body outline, echoing the thumbnail silhouette and the site's feelings-map figure.
FIGURE = ('<svg class="figure" viewBox="0 0 150 230" aria-hidden="true">'
          '<path d="M75 8c-14 0-24 12-24 29 0 14 7 25 16 29v12c-2 5-12 8-26 12-18 5-28 16-29 34l-2 106h130'
          'l-2-106c-1-18-11-29-29-34-14-4-24-7-26-12V66c9-4 16-15 16-29 0-17-10-29-24-29z" '
          'fill="#EFE7DC" stroke="#CDBFAE" stroke-width="1.2" stroke-linejoin="round"/></svg>')


def u(path):
    return "file://" + path


def face(family, file, weight, style="normal", fmt="truetype", base=STATIC):
    return (f"@font-face {{ font-family: '{family}'; src: url('{u(os.path.join(base, file))}') format('{fmt}'); "
            f"font-weight: {weight}; font-style: {style}; }}")


FACES = "\n".join([
    face("FrDisplay", "FrDisplay-600.ttf", 600),
    face("FrDisplay", "FrDisplay-560i.ttf", 600, "italic"),
    face("FrTitle", "FrTitle-450.ttf", 400),
    face("FrNum", "FrNum-380.ttf", 400),
    face("FrText", "FrText-510.ttf", 500),
    face("FrText", "FrText-420i.ttf", 400, "italic"),
    face("Lora", "Lora-400.ttf", 400),
    face("Lora", "Lora-500.ttf", 500),
    face("Lora", "Lora-600.ttf", 600),
    face("Lora", "Lora-400i.ttf", 400, "italic"),
    face("Lora", "Lora-500i.ttf", 500, "italic"),
    face("Cormorant Garamond", "cormorant-garamond-latin-500-italic.woff2", 500, "italic", "woff2", FONTS),
])

CSS = FACES + """
:root {
  --peach: #D8A98B; --peach-deep: #C69A7F; --ink: #211811;
  --cream: #FAF7F2; --panel: #F3EEE6; --panel-line: #E3DACE;
  --head: #3B342D; --body: #5A534C; --mute: #8A8075;
  --line: #CDC3B6; --terracotta: #C2603A; --sage: #437059; --sage-dark: #3C5C4C;
  --sage-pale: #E6EEE9; --sage-line: #D2E0D8; --olive: #232A21; --olive-cream: #EFEBE1; --tan: #C4A78C;
}
@page { size: A4; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body { font-family: 'Lora', Georgia, serif; color: var(--body); -webkit-print-color-adjust: exact; print-color-adjust: exact;
       font-size: 9.4pt; line-height: 1.55; font-variant-numeric: oldstyle-nums; font-kerning: normal; }
.page { width: 210mm; height: 297mm; position: relative; overflow: hidden; background: var(--cream);
        padding: 16mm 18mm 20mm; break-after: page; }
.page:last-child { break-after: auto; }
p { margin: 0; }
a { color: inherit; text-decoration: none; }
.closing .who ul a { border-bottom: .6pt solid rgba(33,24,17,.45); }

/* ---------- shared pieces ---------- */
.kicker { font: 600 7pt/1 'Lora', serif; letter-spacing: .16em; text-transform: uppercase; color: var(--terracotta); }
.ptitle { font-family: 'FrTitle', serif; font-weight: 400; font-size: 29pt; line-height: 1.04; letter-spacing: -.004em;
          word-spacing: .05em; color: var(--head); margin: 3.2mm 0 0; }
.lead { margin-top: 4mm; max-width: 158mm; font-size: 9.3pt; line-height: 1.62; }
.lead p + p { margin-top: 2.2mm; }
.quote { margin: 5mm 0 0; padding: .6mm 0 .6mm 5mm; border-left: 1.4pt solid var(--terracotta); max-width: 160mm; }
.quote q { quotes: none; display: block; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 500;
           font-size: 15.5pt; line-height: 1.28; color: var(--head); }
.quote .attr { margin-top: 1.8mm; font: 600 6.4pt/1.3 'Lora', serif; letter-spacing: .12em; text-transform: uppercase; color: var(--mute); }
.foot { position: absolute; left: 18mm; right: 18mm; bottom: 9mm; display: flex; align-items: center; justify-content: space-between;
        font-size: 6.8pt; color: var(--mute); letter-spacing: .02em; }
.foot .brand { display: flex; align-items: center; gap: 2mm; }
.foot .t { font-family: 'FrText', serif; font-style: italic; font-size: 7.6pt; letter-spacing: 0; }

/* ---------- blocks ---------- */
.blocks { margin-top: 6mm; }
.b { display: grid; grid-template-columns: 8mm 1fr; column-gap: 1mm; margin-top: 4.6mm; break-inside: avoid; }
.b:first-child { margin-top: 0; }
.n { font-family: 'FrText', serif; font-weight: 500; font-size: 13pt; line-height: 1; color: var(--terracotta);
     padding-top: .4mm; font-variant-numeric: lining-nums; }
.q { font-size: 9.9pt; line-height: 1.45; font-weight: 500; color: var(--head); }
.hint { font-style: italic; font-size: 8.7pt; color: var(--mute); margin-top: .5mm; }
.lines { margin-top: .6mm; }
.lines .l { height: 7.3mm; border-bottom: .55pt solid var(--line); }
.checks { display: flex; flex-wrap: wrap; column-gap: 6mm; row-gap: 2.4mm; margin-top: 2.6mm; }
.checks.cols2 { display: grid; grid-template-columns: 1fr 1fr; column-gap: 6mm; row-gap: 2.6mm; }
.opt { display: flex; align-items: center; gap: 2.1mm; font-size: 9.1pt; color: var(--body); line-height: 1.2; }
.box { flex: none; width: 3.3mm; height: 3.3mm; border: .7pt solid #B3A796; border-radius: .7mm; background: #fff; }
.blank { display: inline-block; width: 36mm; border-bottom: .55pt solid var(--line); height: 3.6mm; }

.figwrap { display: grid; grid-template-columns: 1fr 40mm; column-gap: 7mm; align-items: start; }
.figure { width: 40mm; height: auto; display: block; margin-top: -1mm; }

.twocol { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8mm; margin-top: 2mm; }
.clabel { font-style: italic; font-size: 8.9pt; color: var(--sage-dark); }

.form { margin-top: 2.2mm; border-top: .55pt solid var(--panel-line); }
.frow { display: grid; grid-template-columns: 50mm 1fr; column-gap: 5mm; padding: 2.2mm 0 1.6mm; border-bottom: .55pt solid var(--panel-line); }
.frow .fl { font-family: 'FrText', serif; font-weight: 500; font-size: 10pt; color: var(--head); line-height: 1.2; }
.frow .fh { font-style: italic; font-size: 8.3pt; color: var(--mute); line-height: 1.35; margin-top: .6mm; }
.frow .lines .l { height: 7mm; }
.frow .lines .l:last-child { border-bottom: none; }

.gtable { margin-top: 2.4mm; width: 100%; border-collapse: collapse; }
.gtable th { text-align: left; font: 600 6.4pt/1 'Lora', serif; letter-spacing: .12em; text-transform: uppercase; color: var(--mute); padding: 0 0 1.6mm; }
.gtable td { border-top: .55pt solid var(--panel-line); padding: 0; height: 11.5mm; vertical-align: middle; }
.gtable tr:last-child td { border-bottom: .55pt solid var(--panel-line); }
.gtable td.m { width: 58%; }
.gtable td.c { padding-left: 4mm; }
.gtable .checks { margin: 0; column-gap: 4mm; }
.gtable .opt { font-size: 8.5pt; }

.subs { margin-top: 1mm; }
.sub { margin-top: 2.6mm; }
.sub .sq { font-size: 9.1pt; color: var(--body); line-height: 1.3; font-style: italic; }
.sub .lines { margin-top: 0; }
.sub .lines .l { height: 7mm; }

.example { margin: 4mm 0 0 9mm; padding-left: 4mm; border-left: 1.2pt solid var(--sage); font-style: italic; font-size: 8.9pt;
           color: var(--sage-dark); max-width: 150mm; }

/* ---------- cover ---------- */
.cover { background: var(--peach); color: var(--ink); padding: 18mm 20mm; }
.cover .mark { font-style: italic; font-size: 10.5pt; }
.cover .mark b { font-style: normal; font-weight: 600; font-size: 7.4pt; letter-spacing: .18em; text-transform: uppercase; margin-right: 2.4mm; }
.cover h1 { position: absolute; left: 20mm; top: 58mm; margin: 0; font-family: 'FrDisplay', serif; font-weight: 600;
            font-size: 100pt; line-height: .9; letter-spacing: -.015em; }
.cover h1 span { display: block; }
.cover h1 em { font-style: italic; letter-spacing: -.01em; }
.cover .subt { position: absolute; left: 20mm; top: 178mm; max-width: 108mm; font-size: 13pt; line-height: 1.45; margin: 0; }
.cover .sign { position: absolute; left: 20mm; bottom: 18mm; display: flex; align-items: flex-end; gap: 5mm; }
.cover .sign .who { font-size: 9pt; line-height: 1.45; padding-bottom: .4mm; }
.cover .sign .who b { font-weight: 600; }

/* ---------- intro ---------- */
.howto { margin-top: 6mm; display: grid; grid-template-columns: 22mm 1fr; row-gap: 2.6mm; column-gap: 4mm; max-width: 160mm; }
.howto dt { font: 600 6.8pt/1.9 'Lora', serif; letter-spacing: .14em; text-transform: uppercase; color: var(--sage-dark); }
.howto dd { margin: 0; font-size: 9.3pt; }
.h3 { font-family: 'FrTitle', serif; font-weight: 400; font-size: 17pt; line-height: 1.1; color: var(--head); word-spacing: .04em; }
.lenses-title { margin-top: 10mm; }
.lenses { margin-top: 4mm; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4mm; }
.lens { background: var(--panel); border: .6pt solid var(--panel-line); border-radius: 3.2mm; padding: 5mm 4.6mm 5.2mm; }
.lens .yr { font: 600 6.6pt/1 'Lora', serif; letter-spacing: .14em; color: var(--terracotta); }
.lens .who { margin-top: 2.2mm; font-family: 'FrText', serif; font-weight: 500; font-size: 12.2pt; line-height: 1.12; color: var(--head); }
.lens .what { margin-top: 3mm; font-style: italic; font-size: 8.8pt; color: var(--sage-dark); }
.lens .gloss { margin-top: 1mm; font-size: 8.8pt; line-height: 1.5; }
.lens .chapter { margin-top: 3.2mm; font-size: 7.4pt; color: var(--mute); }
.inside-title { margin-top: 10mm; }
.inside { margin-top: 3mm; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: repeat(4, auto); grid-auto-flow: column; column-gap: 10mm; }
.inside .row { display: grid; grid-template-columns: 7mm 1fr auto; align-items: baseline; column-gap: 2mm;
               padding: 2.1mm 0; border-bottom: .55pt solid var(--panel-line); }
.inside .pg { font-family: 'FrText', serif; font-weight: 500; font-size: 10pt; color: var(--terracotta); font-variant-numeric: lining-nums; }
.inside .nm { font-size: 9.4pt; color: var(--head); }
.inside .ch { font-style: italic; font-size: 8.2pt; color: var(--mute); }

/* ---------- turn ---------- */
.turn { background: var(--olive); color: var(--olive-cream); display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; padding: 30mm 26mm; }
.turn .mark { font-style: italic; font-size: 10pt; color: var(--tan); }
.turn q { quotes: none; display: block; margin-top: 9mm; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 500;
          font-size: 27pt; line-height: 1.22; max-width: 150mm; }
.turn .attr { margin-top: 6mm; font: 600 6.8pt/1.3 'Lora', serif; letter-spacing: .14em; text-transform: uppercase; color: var(--tan); }
.turn .rule { width: 14mm; height: .7pt; background: var(--tan); margin: 13mm auto 0; opacity: .8; }
.turn .after { margin-top: 11mm; font-size: 11.5pt; line-height: 1.6; max-width: 120mm; }
.turn .after p + p { margin-top: 3.4mm; font-family: 'FrText', serif; font-style: italic; font-size: 14.5pt; }

/* ---------- pause ---------- */
.moves { margin-top: 6mm; }
.move { display: grid; grid-template-columns: 12mm 1fr; column-gap: 2mm; padding: 3.6mm 0 4mm; border-top: .55pt solid var(--panel-line); }
.move:last-child { border-bottom: .55pt solid var(--panel-line); }
.move .mn { font-family: 'FrNum', serif; font-weight: 400; font-size: 26pt; line-height: .9; color: var(--terracotta); font-variant-numeric: lining-nums; }
.move .mt { font-family: 'FrText', serif; font-weight: 500; font-size: 12.5pt; color: var(--head); line-height: 1.15; }
.move .mx { margin-top: 1.2mm; font-size: 9.2pt; }
.mfld { margin-top: 2.6mm; display: grid; grid-template-columns: 46mm 1fr; column-gap: 3mm; align-items: end; }
.mfld .fl { font-style: italic; font-size: 8.9pt; color: var(--sage-dark); padding-bottom: 1mm; }
.mfld .ln { border-bottom: .55pt solid var(--line); height: 7.5mm; }
.box-exp { margin-top: 6mm; background: var(--sage-pale); border: .6pt solid var(--sage-line); border-radius: 3.4mm; padding: 5.4mm 6mm 5.8mm; }
.box-exp .bt { font-family: 'FrText', serif; font-weight: 500; font-size: 13pt; color: var(--sage-dark); }
.box-exp .bx { margin-top: 1.6mm; font-size: 9.1pt; color: #4A5B51; max-width: 150mm; }
.box-exp .fld { margin-top: 3.6mm; display: grid; grid-template-columns: 40mm 1fr; column-gap: 3mm; align-items: end; }
.box-exp .fld .fl { font-size: 9pt; font-weight: 500; color: var(--sage-dark); padding-bottom: 1mm; }
.box-exp .fld .ln { border-bottom: .55pt solid #AFC4B8; height: 7mm; }
.box-exp .box { border-color: #93AC9E; }
.note { margin-top: 4.4mm; font-style: italic; font-size: 8.3pt; color: var(--mute); max-width: 160mm; }

/* ---------- after ---------- */
.stays { margin-top: 7mm; background: var(--panel); border: .6pt solid var(--panel-line); border-radius: 3.4mm; padding: 5.4mm 6mm 4mm; }
.stays .bt { font-family: 'FrText', serif; font-weight: 500; font-size: 13pt; color: var(--head); }
.stays .fld { margin-top: 2.4mm; display: grid; grid-template-columns: 44mm 1fr; column-gap: 3mm; align-items: end; }
.stays .fld .fl { font-style: italic; font-size: 9pt; color: var(--sage-dark); padding-bottom: 1mm; }
.stays .fld .ln { border-bottom: .55pt solid var(--line); height: 8mm; }

/* ---------- closing ---------- */
.closing { background: var(--peach); color: var(--ink); padding: 24mm 20mm 16mm; }
.closing q { quotes: none; display: block; font-family: 'Cormorant Garamond', Georgia, serif; font-style: italic; font-weight: 500;
             font-size: 23pt; line-height: 1.24; max-width: 158mm; }
.closing .attr { margin-top: 4.4mm; font: 600 6.8pt/1.3 'Lora', serif; letter-spacing: .14em; text-transform: uppercase; }
.closing .who { position: absolute; left: 20mm; right: 20mm; top: 117mm; display: grid; grid-template-columns: 46mm 1fr; column-gap: 9mm; align-items: start; }
.closing .who img { width: 46mm; height: 46mm; object-fit: cover; border-radius: 3.4mm; display: block; }
.closing .who .name { display: flex; align-items: flex-end; gap: 3.4mm; font-family: 'FrText', serif; font-weight: 500; font-size: 21pt; line-height: 1; }
.closing .who .role { font-style: italic; font-size: 10.5pt; margin-top: 2mm; }
.closing .who ul { list-style: none; margin: 5mm 0 0; padding: 0; font-size: 9.6pt; line-height: 1.55; }
.closing .who li + li { margin-top: 1.6mm; }
.closing .src { position: absolute; left: 20mm; right: 20mm; bottom: 26mm; }
.closing .src h3 { margin: 0 0 2.4mm; font: 600 6.6pt/1 'Lora', serif; letter-spacing: .16em; text-transform: uppercase; }
.closing .src ol { margin: 0; padding: 0; list-style: none; columns: 2; column-gap: 8mm; font-size: 6.9pt; line-height: 1.42; }
.closing .src li { break-inside: avoid; margin-bottom: 1.6mm; padding-left: 3mm; text-indent: -3mm; }
.closing .fine { position: absolute; left: 20mm; right: 20mm; bottom: 14mm; font-size: 7pt; font-style: italic; display: flex;
                 justify-content: space-between; border-top: .6pt solid rgba(33,24,17,.35); padding-top: 2.6mm; }
"""


def linkify(html_text):
    """Turn the channel name and the site name into live links inside the PDF."""
    out = html_text.replace(esc(C.YOUTUBE_NAME), f'<a href="{C.YOUTUBE_URL}">{esc(C.YOUTUBE_NAME)}</a>')
    return out.replace(C.SITE, f'<a href="{C.SITE_URL}">{C.SITE}</a>')


def lines(n, cls="lines"):
    return f'<div class="{cls}">' + '<div class="l"></div>' * n + "</div>"


def checks(options, other=False, cols=None):
    cls = "checks cols2" if cols == 2 else "checks"
    out = [f'<div class="{cls}">']
    for o in list(options) + ([None] if other else []):
        if o is None:
            out.append('<div class="opt"><span class="box"></span><span class="blank"></span></div>')
        else:
            out.append(f'<div class="opt"><span class="box"></span><span>{esc(o)}</span></div>')
    out.append("</div>")
    return "".join(out)


def qhead(b):
    h = f'<div class="q">{esc(b["q"])}</div>'
    if b.get("hint"):
        h += f'<div class="hint">{esc(b["hint"])}</div>'
    return h


def block(b):
    k = b["k"]
    num = f'<div class="n">{b["n"]}</div>' if b.get("n") else "<div></div>"
    if k == "prompt":
        body = qhead(b) + lines(b["lines"])
    elif k == "checks":
        body = qhead(b) + checks(b["options"], b.get("other"), b.get("cols"))
    elif k == "figure":
        body = f'<div class="figwrap"><div>{qhead(b)}{lines(b["lines"])}</div>{FIGURE}</div>'
    elif k == "twocol":
        cols = "".join(f'<div><div class="clabel">{esc(lbl)}</div>{lines(n)}</div>' for lbl, n in b["cols"])
        body = qhead(b) + f'<div class="twocol">{cols}</div>'
    elif k == "form":
        rows = "".join(
            f'<div class="frow"><div><div class="fl">{esc(lbl)}</div><div class="fh">{esc(h)}</div></div>{lines(2)}</div>'
            for lbl, h in b["rows"])
        body = qhead(b) + f'<div class="form">{rows}</div>'
    elif k == "table":
        c1, c2 = b["cols"]
        trs = "".join(f'<tr><td class="m"></td><td class="c">{checks(b["choices"])}</td></tr>' for _ in range(b["rows"]))
        body = qhead(b) + (f'<table class="gtable"><thead><tr><th>{esc(c1)}</th><th style="padding-left:4mm">{esc(c2)}</th></tr></thead>'
                           f'<tbody>{trs}</tbody></table>')
    elif k == "chew":
        subs = "".join(f'<div class="sub"><div class="sq">{esc(q)}</div>{lines(n)}</div>' for q, n in b["subs"])
        body = qhead(b) + f'<div class="subs">{subs}</div>'
    elif k == "example":
        return f'<div class="example">{esc(b["t"])}</div>'
    else:
        raise ValueError(k)
    return f'<div class="b">{num}<div>{body}</div></div>'


def foot(n):
    return (f'<div class="foot"><div class="brand"><span>Human Heart · <a href="{C.SITE_URL}">{C.SITE}</a></span></div>'
            f'<div><span class="t">{esc(C.TITLE)}</span>  ·  {n}</div></div>')


def head(kicker, title, quote=None, attr=None, lead=None):
    h = f'<div class="kicker">{esc(kicker)}</div><h2 class="ptitle">{esc(title)}</h2>'
    if quote:
        h += f'<div class="quote"><q>{esc(quote)}</q><div class="attr">{esc(attr)}</div></div>'
    if lead:
        h += '<div class="lead">' + "".join(f"<p>{esc(p)}</p>" for p in lead) + "</div>"
    return h


def page_cover():
    a, b, c = C.TITLE_PARTS
    return (f'<section class="page cover">'
            f'<div class="mark"><b>Human Heart</b> a worksheet</div>'
            f'<h1><span>{a}</span><span><em>{b}</em></span><span>{c}</span></h1>'
            f'<p class="subt">{esc(C.SUBTITLE)}</p>'
            f'<div class="sign"><div class="who"><b>{C.AUTHOR}</b> · {C.ROLE}<br><a href="{C.SITE_URL}">{C.SITE}</a></div></div>'
            f'</section>')


def page_intro(n):
    I = C.INTRO
    howto = "".join(f"<dt>{esc(a)}</dt><dd>{esc(b)}</dd>" for a, b in I["howto"])
    chapters = ["Part two", "Part three", "Parts one, four and five"]
    lenses = "".join(
        f'<div class="lens"><div class="yr">{esc(yr)}</div><div class="who">{esc(who)}</div>'
        f'<div class="what">{esc(what)}</div><div class="gloss">{esc(gl)}</div>'
        f'<div class="chapter">{chapters[i]}</div></div>'
        for i, (yr, who, what, gl) in enumerate(I["lenses"]))
    inside = "".join(f'<div class="row"><span class="pg">{pg}</span><span class="nm">{esc(nm)}</span>'
                     f'<span class="ch">{esc(ch)}</span></div>' for pg, nm, ch in I["inside"])
    return (f'<section class="page">{head(I["kicker"], I["title"], lead=I["paras"])}'
            f'<dl class="howto">{howto}</dl>'
            f'<div class="h3 lenses-title">{esc(I["lenses_title"])}</div><div class="lenses">{lenses}</div>'
            f'<div class="h3 inside-title">{esc(I["inside_title"])}</div><div class="inside">{inside}</div>'
            f'{foot(n)}</section>')


def page_part(p, n):
    blocks = "".join(block(b) for b in p["blocks"])
    return (f'<section class="page" id="{p["id"]}">{head(p["kicker"], p["title"], p.get("quote"), p.get("attr"), p.get("lead"))}'
            f'<div class="blocks">{blocks}</div>{foot(n)}</section>')


def page_turn():
    T = C.TURN
    paras = "".join(f"<p>{esc(x)}</p>" for x in T["paras"])
    return (f'<section class="page turn"><div class="mark">the turn</div><q>{esc(T["quote"])}</q>'
            f'<div class="attr">{esc(T["attr"])}</div><div class="rule"></div><div class="after">{paras}</div>'
            f'</section>')


def page_pause(n):
    P = C.PAUSE
    mv = []
    for i, (t, x, opts, fields) in enumerate(P["moves"], 1):
        o = checks(opts) if opts else ""
        fl = "".join(f'<div class="mfld"><div class="fl">{esc(lbl)}</div><div class="ln"></div></div>' for lbl in fields)
        mv.append(f'<div class="move"><div class="mn">{i}</div><div><div class="mt">{esc(t)}</div>'
                  f'<div class="mx">{esc(x)}</div>{o}{fl}</div></div>')
    E = P["experiment"]
    exp = (f'<div class="box-exp"><div class="bt">{esc(E["title"])}</div><div class="bx">{esc(E["text"])}</div>'
           f'<div class="fld"><div class="fl">{esc(E["where"])}</div><div class="ln"></div></div>'
           f'<div class="fld" style="align-items:center"><div class="fl" style="padding:0">{esc(E["try_label"])}</div>{checks(E["try"])}</div></div>')
    return (f'<section class="page" id="pause">{head(P["kicker"], P["title"], lead=P["lead"])}'
            f'<div class="moves">{"".join(mv)}</div>{exp}<div class="note">{esc(P["note"])}</div>{foot(n)}</section>')


def page_after(n):
    A = C.AFTER
    blocks = "".join(block(b) for b in A["blocks"])
    stays = "".join(f'<div class="fld"><div class="fl">{esc(s)}</div><div class="ln"></div></div>' for s in A["stays"])
    return (f'<section class="page" id="after">{head(A["kicker"], A["title"], lead=A.get("lead"))}'
            f'<div class="blocks">{blocks}</div>'
            f'<div class="stays"><div class="bt">{esc(A["stays_title"])}</div>{stays}</div>{foot(n)}</section>')


def page_closing():
    K = C.CLOSING
    lis = "".join(f"<li>{linkify(esc(x))}</li>" for x in K["lines"])
    src = "".join(f"<li>{s}</li>" for s in C.SOURCES)
    img = ""
    if os.path.exists(PORTRAIT):
        b64 = base64.b64encode(open(PORTRAIT, "rb").read()).decode()
        img = f'<img src="data:image/jpeg;base64,{b64}" alt="Genia">'
    return (f'<section class="page closing"><q>{esc(K["quote"])}</q><div class="attr">{esc(K["attr"])}</div>'
            f'<div class="who">{img}<div><div class="name"><span>{C.AUTHOR}</span></div>'
            f'<div class="role">{C.ROLE} · Human Heart</div><ul>{lis}</ul></div></div>'
            f'<div class="src"><h3>Sources</h3><ol>{src}</ol></div>'
            f'<div class="fine"><span>{esc(K["fine"])}</span><span>© 2026 Human Heart · {C.SITE}</span></div></section>')


def build_html():
    pages = [page_cover(), page_intro(2)]
    n = 3
    for p in C.PARTS:
        pages.append(page_part(p, n)); n += 1
    pages.append(page_turn()); n += 1
    pages.append(page_pause(n)); n += 1
    pages.append(page_after(n)); n += 1
    pages.append(page_closing())
    return (f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>{esc(C.TITLE)} — Human Heart</title>'
            f'<style>{CSS}</style></head><body>{"".join(pages)}</body></html>')


def render():
    from playwright.sync_api import sync_playwright
    os.makedirs(os.path.dirname(OUT_HTML), exist_ok=True)
    with open(OUT_HTML, "w", encoding="utf-8") as fh:
        fh.write(build_html())
    with sync_playwright() as p:
        br = p.chromium.launch()
        pg = br.new_page()
        pg.goto("file://" + OUT_HTML)
        pg.evaluate("document.fonts.ready")
        pg.wait_for_timeout(400)
        report = pg.evaluate("""() => [...document.querySelectorAll('.page')].map((s, i) => {
            const r = s.getBoundingClientRect();
            let maxBottom = 0;
            s.querySelectorAll('*').forEach(el => {
              if (el.closest('.foot') || el.closest('svg')) return;
              if (getComputedStyle(el).position === 'absolute') return;
              const b = el.getBoundingClientRect(); if (b.height > 0) maxBottom = Math.max(maxBottom, b.bottom);
            });
            const mm = px => +(px * 25.4 / 96).toFixed(1);
            return [i + 1, mm(maxBottom - r.top), s.scrollHeight > s.clientHeight + 1];
        })""")
        fonts = pg.evaluate("[...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.style + ' ' + f.status)")
        print("page, content bottom (mm, footer at ~284), overflow:", report)
        print("fonts:", fonts)
        pg.pdf(path=OUT_PDF, format="A4", print_background=True, prefer_css_page_size=True,
               margin={"top": "0", "right": "0", "bottom": "0", "left": "0"})
        br.close()
    print("wrote", OUT_PDF, os.path.getsize(OUT_PDF))


if __name__ == "__main__":
    render()
