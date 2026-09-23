# Source for "The automatic yes"

The worksheet's wording lives in one place, `content.py`. Three small scripts
turn it into everything else, so the PDF, the site and the prototype cannot
drift apart. Nothing in this folder ships.

| Script | Writes (into `out/`) | Goes to |
|---|---|---|
| `build_pdf.py` | `the-automatic-yes-human-heart.pdf` | `public/downloads/` |
| `gen_ts.py` | `automaticYes.ts` | `src/content/` |
| `build_web.py` | `web-prototype.html` | `design-assets/automatic-yes/` |

To change a word: edit `content.py`, run all three, copy the outputs to where
the table says, and review the diff. Needs Python 3 with `playwright` (and its
Chromium) for the PDF; the fonts are here already (Fraunces, Lora and Cormorant
Garamond, all under the SIL Open Font License; `fonts/static/` holds the fixed
instances the PDF embeds).

The web page's own copy (hero, forms, keep switch) is the `WEB` block at the
end of `content.py`; the email wording is the `EMAILS` block.
