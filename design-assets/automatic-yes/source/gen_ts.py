# -*- coding: utf-8 -*-
"""Generate src/content/automaticYes.ts (site wording) from content.py, so the
PDF, the prototype and the live page share one text."""
import json, re, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import content as C

W = C.WEB
def strip(s): return re.sub(r"<[^>]+>", "", s).replace("&amp;", "&")

def block(pid, b):
    k = b["k"]; n = b.get("n"); bid = f"{pid}-{n}" if n else None
    if k == "prompt":
        d = {"kind": "text", "n": n, "id": bid, "question": b["q"], "rows": max(2, b["lines"])}
        if b.get("hint"): d["hint"] = b["hint"]
        return d
    if k == "checks":
        d = {"kind": "choice", "n": n, "id": bid, "question": b["q"], "options": [o for o in b["options"] if o],
             "other": bool(b.get("other")), "single": bool(b.get("single"))}
        if b.get("hint"): d["hint"] = b["hint"]
        return d
    if k == "figure":
        return {"kind": "body", "n": n, "id": bid, "question": b["q"], "hint": b["hint"], "rows": b["lines"]}
    if k == "twocol":
        return {"kind": "pair", "n": n, "id": bid, "question": b["q"], "columns": [lbl for lbl, _ in b["cols"]]}
    if k == "form":
        return {"kind": "form", "n": n, "id": bid, "question": b["q"], "rows": [{"label": l, "hint": h} for l, h in b["rows"]]}
    if k == "table":
        return {"kind": "moments", "n": n, "id": bid, "question": b["q"], "hint": b["hint"], "placeholder": b["cols"][0],
                "choices": b["choices"], "count": b["rows"]}
    if k == "chew":
        return {"kind": "chew", "n": n, "id": bid, "question": b["q"], "subs": [{"question": q, "rows": max(1, r)} for q, r in b["subs"]]}
    if k == "example":
        return {"kind": "example", "text": b["t"]}
    raise ValueError(k)

def part(p):
    d = {"id": p["id"], "kicker": p["kicker"], "title": p["title"]}
    if p.get("quote"): d["quote"] = {"text": p["quote"], "attribution": p["attr"]}
    d["lead"] = p.get("lead", [])
    d["blocks"] = [block(p["id"], b) for b in p["blocks"]]
    return d

I = C.INTRO
lens_targets = [("ferenczi", "Go to part two"), ("winnicott", "Go to part three"), ("introjection", "Go to part four")]
P = C.PAUSE
moves = []
for i, (t, x, opts, fields) in enumerate(P["moves"], 1):
    m = {"id": f"pause-{i}", "title": t, "text": x.replace("on page 3", "in part one"), "fields": fields}
    if opts:
        m["options"] = [o for o in opts if o]
        m["other"] = None in opts
        m["single"] = (i == 3)
    moves.append(m)
A = C.AFTER
K = C.CLOSING

data = {
    "crumb": W["crumb"], "crumbHere": W["crumb_here"],
    "hero": {"kicker": W["hero_kicker"], "title": list(C.TITLE_PARTS), "subtitle": C.SUBTITLE, "meta": W["hero_meta"]},
    "confirmed": W["confirmed"],
    "signup": {k: W["signup_top"][k] for k in ["title", "text", "label", "placeholder", "consent", "button", "sending",
                                              "small", "privacy", "done", "done_with_letter", "invalid", "error", "rate_limited"]},
    "onPage": W["on_page"], "keepLabel": W["keep_label"], "keepHelp": W["keep_help"],
    "intro": {"kicker": I["kicker"], "title": I["title"], "paras": I["paras"],
              "howto": [{"label": a, "text": (b if a != "You need" else
                          "One recent yes you would like to look at more closely \u2014 and a pen, if you print it.")}
                        for a, b in I["howto"]],
              "lensesTitle": I["lenses_title"],
              "lenses": [{"years": yr, "who": who, "role": what, "gloss": gl, "partId": lens_targets[i][0], "linkLabel": lens_targets[i][1]}
                         for i, (yr, who, what, gl) in enumerate(I["lenses"])]},
    "parts": [part(p) for p in C.PARTS],
    "turn": {"mark": "the turn", "quote": C.TURN["quote"], "attribution": C.TURN["attr"], "paras": C.TURN["paras"]},
    "pause": {"id": "pause", "kicker": P["kicker"], "title": P["title"], "lead": P["lead"], "moves": moves,
              "experiment": {"id": "experiment", "title": P["experiment"]["title"], "text": P["experiment"]["text"],
                             "whereLabel": P["experiment"]["where"], "tryLabel": P["experiment"]["try_label"],
                             "tryOptions": P["experiment"]["try"]},
              "note": P["note"]},
    "after": {"id": "after", "kicker": A["kicker"], "title": A["title"], "lead": A.get("lead", []),
              "blocks": [block("after", b) for b in A["blocks"]], "staysTitle": A["stays_title"], "stays": A["stays"]},
    "worksheetUi": {"figureHint": W["figure_hint"], "figureLabel": W["figure_label"], "otherPlaceholder": W["other_placeholder"],
                    "print": W["print"], "clear": W["clear"], "clearConfirm": W["clear_confirm"],
                    "savedOn": W["saved_on"], "savedOff": W["saved_off"]},
    "letter": W["letter"],
    "closing": {"quote": K["quote"], "attribution": K["attr"], "name": C.AUTHOR, "role": f"{C.ROLE} · Human Heart",
                "sessions": K["lines"][1], "book": W["book"], "watch": W["watch"], "fine": K["fine"]},
    "sourcesTitle": W["sources_title"],
    "sources": [strip(s) for s in C.SOURCES],
}

def ts_value(v, ind=0):
    pad = "  " * ind
    if isinstance(v, dict):
        if not v: return "{}"
        items = []
        for k, x in v.items():
            key = k if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", k) else json.dumps(k)
            items.append(f"{pad}  {key}: {ts_value(x, ind + 1)},")
        return "{\n" + "\n".join(items) + f"\n{pad}}}"
    if isinstance(v, list):
        if not v: return "[]"
        if all(isinstance(x, str) for x in v) and sum(len(x) for x in v) < 70:
            return "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in v) + "]"
        return "[\n" + "\n".join(f"{pad}  {ts_value(x, ind + 1)}," for x in v) + f"\n{pad}]"
    if isinstance(v, bool): return "true" if v else "false"
    if v is None: return "null"
    if isinstance(v, (int, float)): return str(v)
    return json.dumps(v, ensure_ascii=False)

header = '''/**
 * ============================================================
 * "THE AUTOMATIC YES" — worksheet on people-pleasing (/take/automatic-yes)
 * ============================================================
 * Every string on the page lives here, except the head (title and
 * description, in src/config/pageMetadata.ts) and the shelf card (in
 * src/content/take.ts), which each have one home already.
 *
 * The same wording is in the downloadable PDF
 * (public/downloads/the-automatic-yes-human-heart.pdf); change one,
 * change the other.
 *
 * English only. There is no Russian version yet: /ru/take/automatic-yes
 * redirects to English, the Russian shelf does not list it, and the route
 * is generated for "en" alone (see STATIC_ROUTES in src/config/pageMetadata.ts).
 *
 * Voice rules for anything added here: no verdicts about the reader, no
 * generalisations about people, history and situation before the inner
 * world, "feeling" rather than "emotion", British spelling. Describe the
 * material; do not promise an outcome (same rule as src/content/take.ts).
 *
 * Field ids (`id`) are the keys answers are held under in memory and, only
 * while the reader has switched "keep" on, in localStorage. Changing an id
 * orphans that answer for anyone who kept theirs — add, don't rename.
 * ============================================================
 */

export interface Quote {
  text: string;
  attribution: string;
}

export type WorksheetBlock =
  | { kind: "text"; n: number; id: string; question: string; hint?: string; rows: number }
  | { kind: "choice"; n: number; id: string; question: string; hint?: string; options: string[]; other: boolean; single: boolean }
  | { kind: "body"; n: number; id: string; question: string; hint: string; rows: number }
  | { kind: "pair"; n: number; id: string; question: string; columns: string[] }
  | { kind: "form"; n: number; id: string; question: string; rows: { label: string; hint: string }[] }
  | { kind: "moments"; n: number; id: string; question: string; hint: string; placeholder: string; choices: string[]; count: number }
  | { kind: "chew"; n: number; id: string; question: string; subs: { question: string; rows: number }[] }
  | { kind: "example"; text: string };

export interface WorksheetPart {
  id: string;
  kicker: string;
  title: string;
  quote?: Quote;
  lead: string[];
  blocks: WorksheetBlock[];
}

export interface PauseMove {
  id: string;
  title: string;
  text: string;
  fields: string[];
  options?: string[];
  other?: boolean;
  single?: boolean;
}

export interface AutomaticYesContent {
  crumb: string;
  crumbHere: string;
  hero: { kicker: string; title: string[]; subtitle: string; meta: string };
  confirmed: string;
  signup: {
    title: string; text: string; label: string; placeholder: string; consent: string; button: string; sending: string;
    small: string; privacy: string; done: string; done_with_letter: string; invalid: string; error: string; rate_limited: string;
  };
  onPage: string;
  keepLabel: string;
  keepHelp: string;
  intro: {
    kicker: string; title: string; paras: string[];
    howto: { label: string; text: string }[];
    lensesTitle: string;
    lenses: { years: string; who: string; role: string; gloss: string; partId: string; linkLabel: string }[];
  };
  parts: WorksheetPart[];
  turn: { mark: string; quote: string; attribution: string; paras: string[] };
  pause: {
    id: string; kicker: string; title: string; lead: string[]; moves: PauseMove[];
    experiment: { id: string; title: string; text: string; whereLabel: string; tryLabel: string; tryOptions: string[] };
    note: string;
  };
  after: { id: string; kicker: string; title: string; lead: string[]; blocks: WorksheetBlock[]; staysTitle: string; stays: string[] };
  worksheetUi: {
    figureHint: string; figureLabel: string; otherPlaceholder: string; print: string; clear: string; clearConfirm: string;
    savedOn: string; savedOff: string;
  };
  letter: { kicker: string; title: string; text: string; button: string; small: string; done: string };
  closing: { quote: string; attribution: string; name: string; role: string; sessions: string; book: string; watch: string; fine: string };
  sourcesTitle: string;
  sources: string[];
}

'''
out = header + "export const automaticYesEN: AutomaticYesContent = " + ts_value(data) + ";\n"
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "automaticYes.ts")
os.makedirs(os.path.dirname(path), exist_ok=True)
open(path, "w", encoding="utf-8").write(out)
print("wrote", path, len(out))
